import { create } from 'zustand';
import { SketchOption, SketchData, Selection, RoomType, ElementType, ArchitecturalElement, Room, UnitSystem } from '../types';
import { generateSingleSketch, generateSketchFromImage, generateSketchFromDXF, DesignStyle } from '../services/geminiService';
import { MOCK_ONE_STORY, MOCK_TWO_STORY, MOCK_THREE_STORY } from '../dev/mockData';
import { getLibraryItem } from '../config/libraryConfig';

interface ProjectState {
  // Data State
  sketchOptions: SketchOption[];
  currentOptionIndex: number;
  history: SketchData[];
  future: SketchData[];
  
  // Saved Projects (Database Mock)
  savedSketches: SketchData[];
  
  // Selection
  selection: Selection | null;

  // Global Settings
  unitSystem: UnitSystem;

  // Async Status
  isGenerating: boolean;
  error: string | null;
  lastPrompt: string;

  // Actions
  setSelection: (selection: Selection | null) => void;
  setCurrentOptionIndex: (index: number) => void;
  setUnitSystem: (system: UnitSystem) => void;
  failGeneration: (error: string) => void;
  updateOptionStatus: (index: number, option: SketchOption) => void;

  // Async Actions (Business Logic)
  generateByPrompt: (prompt: string) => Promise<void>;
  generateByFile: (file: File) => Promise<void>;
  generateVariation: (index: number) => Promise<void>;
  loadMock: (type: '1-story' | '2-story' | '3-story') => void;

  // CRUD Actions (With History)
  updateItem: (id: string, type: 'room' | 'element', field: string, value: any) => void;
  deleteItem: (id: string, type: 'room' | 'element') => void;
  addItem: (type: ElementType | RoomType, category: 'room' | 'element') => void;
  
  // History Actions
  undo: () => void;
  redo: () => void;
  
  // Persistence
  saveCurrentSketch: () => void;
  deleteSketch: (id: string) => void;
  loadSketch: (id: string) => void;
  createNewSketch: () => void;
  
  // Landing Page Flow
  startProjectFromLanding: (prompt: string, preGeneratedData?: SketchData) => void;
  
  // Helpers
  getCurrentSketch: () => SketchData | null;
}

// INTERNAL HELPER: Saves the current sketch to the savedSketches array automatically
const autoSave = (state: ProjectState): Partial<ProjectState> => {
    const currentOpt = state.sketchOptions[state.currentOptionIndex];
    if (currentOpt?.status !== 'loaded') return {};
    
    const currentData = currentOpt.data;
    const existingIndex = state.savedSketches.findIndex(s => s.id === currentData.id);
    const newSaved = [...state.savedSketches];
    
    if (existingIndex >= 0) {
        newSaved[existingIndex] = currentData;
    } else {
        newSaved.push(currentData);
    }
    
    return { savedSketches: newSaved };
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  sketchOptions: [],
  currentOptionIndex: 0,
  history: [],
  future: [],
  savedSketches: [MOCK_ONE_STORY, MOCK_TWO_STORY, MOCK_THREE_STORY], // Initial Mock DB
  selection: null,
  unitSystem: 'metric',
  isGenerating: false,
  error: null,
  lastPrompt: '',

  getCurrentSketch: () => {
    const { sketchOptions, currentOptionIndex } = get();
    const option = sketchOptions[currentOptionIndex];
    return option?.status === 'loaded' ? option.data : null;
  },

  setSelection: (selection) => set({ selection }),
  setUnitSystem: (unitSystem) => set({ unitSystem }),
  
  setCurrentOptionIndex: (index) => set((state) => {
      return { currentOptionIndex: index, history: [], future: [], selection: null };
  }),

  failGeneration: (error) => set({ isGenerating: false, error }),

  updateOptionStatus: (index, option) => set((state) => {
    const newOpts = [...state.sketchOptions];
    const prevOpt = newOpts[index];
    newOpts[index] = option;

    if (prevOpt?.status === 'loaded' && option.status === 'loaded') {
        return { 
            sketchOptions: newOpts, 
            history: [...state.history, prevOpt.data],
            future: [] 
        };
    }
    return { sketchOptions: newOpts };
  }),

  generateByPrompt: async (prompt: string) => {
    set({ 
        isGenerating: true, 
        error: null, 
        lastPrompt: prompt,
        selection: null,
        currentOptionIndex: 0,
        sketchOptions: [
            { status: 'loading', id: 'opt-1' },
            { status: 'idle', id: 'opt-2' },
            { status: 'idle', id: 'opt-3' }
        ]
    });

    try {
        const styles: DesignStyle[] = ['Modern', 'Rustic', 'Creative'];
        const finalData = await generateSingleSketch(prompt, styles[0]);
        
        set((state) => {
             const newOpts = [...state.sketchOptions];
             newOpts[0] = { status: 'loaded', data: finalData };
             // Trigger Auto Save after generation
             const autoSavedState = autoSave({ ...state, sketchOptions: newOpts } as ProjectState);
             return { isGenerating: false, sketchOptions: newOpts, history: [], future: [], ...autoSavedState };
        });
    } catch (err) {
        console.error(err);
        set({ isGenerating: false, error: "Failed to generate design." });
    }
  },

  generateByFile: async (file: File) => {
      set({ isGenerating: true, error: null, selection: null });
      const currentOpts = get().sketchOptions;
      const newIdx = currentOpts.length;
      const newOpts = [...currentOpts, { status: 'loading', id: `upload-${Date.now()}` } as const];
      set({ sketchOptions: newOpts as any, currentOptionIndex: newIdx });

      try {
        let sketch: SketchData;
        if (file.name.toLowerCase().endsWith('.dxf')) {
           const text = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsText(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
           });
           sketch = await generateSketchFromDXF(text);
        } else {
           const base64 = await new Promise<string>((resolve, reject) => {
               const reader = new FileReader();
               reader.readAsDataURL(file);
               reader.onload = () => resolve((reader.result as string).split(',')[1]);
               reader.onerror = reject;
           });
           sketch = await generateSketchFromImage(base64, file.type);
        }
        
        set((state) => {
            const updatedOpts = [...state.sketchOptions];
            updatedOpts[newIdx] = { status: 'loaded', data: sketch };
            const autoSavedState = autoSave({ ...state, sketchOptions: updatedOpts, currentOptionIndex: newIdx } as ProjectState);
            return { isGenerating: false, sketchOptions: updatedOpts, history: [], future: [], ...autoSavedState };
        });

    } catch (err) {
        console.error(err);
        set((state) => {
             const fallbackOpts = state.sketchOptions.filter((_, i) => i !== newIdx);
             return { isGenerating: false, error: `Failed to analyze ${file.name}`, sketchOptions: fallbackOpts, currentOptionIndex: Math.max(0, newIdx - 1) };
        });
    }
  },

  generateVariation: async (index: number) => {
      const { lastPrompt, sketchOptions } = get();
      if (!lastPrompt) return;
      set({ isGenerating: true, error: null, selection: null, currentOptionIndex: index });
      const loadingOpts = [...sketchOptions];
      loadingOpts[index] = { status: 'loading', id: `opt-${index+1}` };
      set({ sketchOptions: loadingOpts });
      try {
         const styles: DesignStyle[] = ['Modern', 'Rustic', 'Creative'];
         const finalData = await generateSingleSketch(lastPrompt, styles[index]);
         set((state) => {
             const updatedOpts = [...state.sketchOptions];
             updatedOpts[index] = { status: 'loaded', data: finalData };
             const autoSavedState = autoSave({ ...state, sketchOptions: updatedOpts } as ProjectState);
             return { isGenerating: false, sketchOptions: updatedOpts, ...autoSavedState };
         });
      } catch (err) {
         console.error(err);
         set((state) => {
             const updatedOpts = [...state.sketchOptions];
             updatedOpts[index] = { status: 'idle', id: `opt-${index+1}` };
             return { isGenerating: false, error: `Failed to generate variation ${index+1}`, sketchOptions: updatedOpts };
         });
      }
  },

  loadMock: (type: '1-story' | '2-story' | '3-story') => {
      set({ isGenerating: true, error: null, selection: null });
      let mock;
      if (type === '1-story') mock = MOCK_ONE_STORY;
      else if (type === '2-story') mock = MOCK_TWO_STORY;
      else mock = MOCK_THREE_STORY;
      setTimeout(() => {
          set((state) => {
              const newOpts = [{ status: 'loaded', data: JSON.parse(JSON.stringify(mock)) }];
              // Auto Save Mock Load
              const tempState = { ...state, sketchOptions: newOpts as any[], currentOptionIndex: 0 };
              const autoSavedState = autoSave(tempState);
              
              return {
                  isGenerating: false,
                  sketchOptions: newOpts as any[],
                  currentOptionIndex: 0,
                  history: [],
                  future: [],
                  ...autoSavedState
              };
          });
      }, 400);
  },

  updateItem: (id, type, field, value) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};
      const currentData = currentOpt.data;
      const newHistory = [...state.history, currentData];
      const newData = { 
          ...currentData,
          rooms: [...currentData.rooms],
          elements: [...currentData.elements]
      };
      if (type === 'room') {
         newData.rooms = newData.rooms.map(r => r.id === id ? { ...r, [field]: value } : r);
      } else {
         newData.elements = newData.elements.map(e => e.id === id ? { ...e, [field]: value } : e);
      }
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: newData };
      
      // AUTO SAVE
      const autoSavedState = autoSave({ ...state, sketchOptions: newOpts } as ProjectState);
      
      return { sketchOptions: newOpts, history: newHistory, future: [], ...autoSavedState };
  }),

  deleteItem: (id, type) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};
      const currentData = currentOpt.data;
      const newHistory = [...state.history, currentData];
      const newData = { ...currentData };
      if (type === 'room') {
         newData.rooms = newData.rooms.filter(r => r.id !== id);
         newData.elements = newData.elements.filter(e => e.roomId !== id);
      } else {
         newData.elements = newData.elements.filter(e => e.id !== id);
      }
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: newData };
      
      // AUTO SAVE
      const autoSavedState = autoSave({ ...state, sketchOptions: newOpts } as ProjectState);

      return { sketchOptions: newOpts, history: newHistory, future: [], selection: null, ...autoSavedState };
  }),

  addItem: (type, category) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};
      const currentData = currentOpt.data;
      const newHistory = [...state.history, currentData];
      const newData = { 
          ...currentData,
          rooms: [...currentData.rooms],
          elements: [...currentData.elements]
      };
      
      const config = getLibraryItem(type);
      const width = config ? config.defaultWidth : 100;
      const height = config ? config.defaultHeight : 100;
      const label = config ? config.label : 'New Item';

      const center = { x: 500, y: 500 }; 
      let newSelection: Selection | null = null;
      
      if (category === 'room') {
          const newRoom: Room = {
              id: `room-${Date.now()}`,
              name: label,
              type: type as RoomType,
              floor: 1,
              x: center.x,
              y: center.y,
              width: width,
              height: height,
              floorFinish: 'wood'
          };
          newData.rooms.push(newRoom);
          newSelection = { id: newRoom.id, type: 'room' };
      } else {
          const newEl: ArchitecturalElement = {
              id: `el-${Date.now()}`,
              roomId: 'none', 
              type: type as ElementType,
              floor: 1,
              x: center.x + 50,
              y: center.y + 50,
              width: width,
              height: height,
              rotation: 0,
              label: label
          };
          newData.elements.push(newEl);
          newSelection = { id: newEl.id, type: 'element' };
      }
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: newData };
      
      // AUTO SAVE
      const autoSavedState = autoSave({ ...state, sketchOptions: newOpts } as ProjectState);

      return { sketchOptions: newOpts, history: newHistory, future: [], selection: newSelection, ...autoSavedState };
  }),

  undo: () => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded' || state.history.length === 0) return {};
      const previous = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      const newFuture = [currentOpt.data, ...state.future];
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: previous };
      
      // AUTO SAVE
      const autoSavedState = autoSave({ ...state, sketchOptions: newOpts } as ProjectState);
      
      return { sketchOptions: newOpts, history: newHistory, future: newFuture, selection: null, ...autoSavedState };
  }),

  redo: () => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded' || state.future.length === 0) return {};
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      const newHistory = [...state.history, currentOpt.data];
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: next };
      
      // AUTO SAVE
      const autoSavedState = autoSave({ ...state, sketchOptions: newOpts } as ProjectState);

      return { sketchOptions: newOpts, history: newHistory, future: newFuture, selection: null, ...autoSavedState };
  }),

  // DB ACTIONS (Manual Save trigger, effectively redundant now but kept for explicit UI actions if needed)
  saveCurrentSketch: () => set((state) => {
      return autoSave(state);
  }),

  deleteSketch: (id) => set((state) => ({
      savedSketches: state.savedSketches.filter(s => s.id !== id)
  })),

  loadSketch: (id) => {
      const sketch = get().savedSketches.find(s => s.id === id);
      if (sketch) {
          set({
              sketchOptions: [{ status: 'loaded', data: JSON.parse(JSON.stringify(sketch)) }],
              currentOptionIndex: 0,
              history: [],
              future: []
          });
      }
  },

  createNewSketch: () => {
      set({
          sketchOptions: [],
          currentOptionIndex: 0,
          history: [],
          future: [],
          selection: null,
          isGenerating: false,
          error: null
      });
  },

  // LANDING PAGE INIT ACTION
  startProjectFromLanding: (prompt, preGeneratedData) => {
      set({
          lastPrompt: prompt,
          currentOptionIndex: 0,
          sketchOptions: preGeneratedData 
            ? [{ status: 'loaded', data: preGeneratedData }]
            : [],
          history: [],
          future: []
      });
      
      if (preGeneratedData) {
           // Ensure the preview is saved so it appears in dashboard
           set(state => autoSave(state));
      } else {
           // If only prompt, trigger generation immediately
           get().generateByPrompt(prompt);
      }
  }
}));