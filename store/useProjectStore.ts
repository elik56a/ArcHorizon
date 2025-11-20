import { create } from 'zustand';
import { SketchOption, SketchData, Selection, RoomType, ElementType, ArchitecturalElement, Room } from '../types';
import { generateSingleSketch, generateSketchFromImage, generateSketchFromDXF, DesignStyle } from '../services/geminiService';
import { MOCK_ONE_STORY, MOCK_TWO_STORY } from '../dev/mockData';

interface ProjectState {
  // Data State
  sketchOptions: SketchOption[];
  currentOptionIndex: number;
  history: SketchData[];
  future: SketchData[];
  
  // Selection
  selection: Selection | null;

  // Async Status
  isGenerating: boolean;
  error: string | null;
  lastPrompt: string;

  // Actions
  setSelection: (selection: Selection | null) => void;
  setCurrentOptionIndex: (index: number) => void;
  failGeneration: (error: string) => void;
  updateOptionStatus: (index: number, option: SketchOption) => void;

  // Async Actions (Business Logic)
  generateByPrompt: (prompt: string) => Promise<void>;
  generateByFile: (file: File) => Promise<void>;
  generateVariation: (index: number) => Promise<void>;
  loadMock: (type: '1-story' | '2-story') => void;

  // CRUD Actions (With History)
  updateItem: (id: string, type: 'room' | 'element', field: string, value: any) => void;
  deleteItem: (id: string, type: 'room' | 'element') => void;
  addItem: (type: ElementType | RoomType, category: 'room' | 'element') => void;
  
  // History Actions
  undo: () => void;
  redo: () => void;
  
  // Helpers
  getCurrentSketch: () => SketchData | null;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  sketchOptions: [],
  currentOptionIndex: 0,
  history: [],
  future: [],
  selection: null,
  isGenerating: false,
  error: null,
  lastPrompt: '',

  getCurrentSketch: () => {
    const { sketchOptions, currentOptionIndex } = get();
    const option = sketchOptions[currentOptionIndex];
    return option?.status === 'loaded' ? option.data : null;
  },

  setSelection: (selection) => set({ selection }),
  
  setCurrentOptionIndex: (index) => set((state) => {
      // When switching variations, clear history to avoid mixing timelines
      return { currentOptionIndex: index, history: [], future: [], selection: null };
  }),

  failGeneration: (error) => set({ isGenerating: false, error }),

  updateOptionStatus: (index, option) => set((state) => {
    const newOpts = [...state.sketchOptions];
    const prevOpt = newOpts[index];
    newOpts[index] = option;

    // Handle History if this is a data commit (Loaded -> Loaded)
    if (prevOpt?.status === 'loaded' && option.status === 'loaded') {
        return { 
            sketchOptions: newOpts, 
            history: [...state.history, prevOpt.data],
            future: [] 
        };
    }
    return { sketchOptions: newOpts };
  }),

  // --- ASYNC BUSINESS LOGIC ---

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
             return { isGenerating: false, sketchOptions: newOpts, history: [], future: [] };
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
      // Add new slot
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
            return { isGenerating: false, sketchOptions: updatedOpts, history: [], future: [] };
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

      // Update specific option to loading
      const loadingOpts = [...sketchOptions];
      loadingOpts[index] = { status: 'loading', id: `opt-${index+1}` };
      set({ sketchOptions: loadingOpts });

      try {
         const styles: DesignStyle[] = ['Modern', 'Rustic', 'Creative'];
         const finalData = await generateSingleSketch(lastPrompt, styles[index]);
         
         set((state) => {
             const updatedOpts = [...state.sketchOptions];
             updatedOpts[index] = { status: 'loaded', data: finalData };
             return { isGenerating: false, sketchOptions: updatedOpts };
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

  loadMock: (type: '1-story' | '2-story') => {
      set({ isGenerating: true, error: null, selection: null });
      const mock = type === '1-story' ? MOCK_ONE_STORY : MOCK_TWO_STORY;
      
      // Simulate delay for UX
      setTimeout(() => {
          set({
              isGenerating: false,
              sketchOptions: [{ status: 'loaded', data: JSON.parse(JSON.stringify(mock)) }],
              currentOptionIndex: 0,
              history: [],
              future: []
          });
      }, 400);
  },

  // --- CRUD OPERATIONS ---

  updateItem: (id, type, field, value) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};

      const currentData = currentOpt.data;
      
      // Push to history
      const newHistory = [...state.history, currentData];

      // Create new data
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

      return { sketchOptions: newOpts, history: newHistory, future: [] };
  }),

  deleteItem: (id, type) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};

      const currentData = currentOpt.data;
      const newHistory = [...state.history, currentData];

      const newData = { ...currentData };
      if (type === 'room') {
         newData.rooms = newData.rooms.filter(r => r.id !== id);
         newData.elements = newData.elements.filter(e => e.roomId !== id); // Cascade delete
      } else {
         newData.elements = newData.elements.filter(e => e.id !== id);
      }

      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: newData };

      return { sketchOptions: newOpts, history: newHistory, future: [], selection: null };
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

      const center = { x: 500, y: 500 }; 
      let newSelection: Selection | null = null;

      if (category === 'room') {
          const newRoom: Room = {
              id: `room-${Date.now()}`,
              name: 'New Room',
              type: type as RoomType,
              floor: 1,
              x: center.x,
              y: center.y,
              width: 300,
              height: 300,
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
              width: 100,
              height: 100,
              rotation: 0
          };
          // Defaults
          if (type.toString().includes('door')) { newEl.width = 90; newEl.height = 15; }
          if (type === 'bed_king') { newEl.width = 180; newEl.height = 200; }
          if (type === 'toilet') { newEl.width = 50; newEl.height = 70; }
          
          newData.elements.push(newEl);
          newSelection = { id: newEl.id, type: 'element' };
      }

      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: newData };

      return { sketchOptions: newOpts, history: newHistory, future: [], selection: newSelection };
  }),

  // --- UNDO / REDO ---

  undo: () => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded' || state.history.length === 0) return {};

      const previous = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      const newFuture = [currentOpt.data, ...state.future];

      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: previous };

      return { sketchOptions: newOpts, history: newHistory, future: newFuture, selection: null };
  }),

  redo: () => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded' || state.future.length === 0) return {};

      const next = state.future[0];
      const newFuture = state.future.slice(1);
      const newHistory = [...state.history, currentOpt.data];

      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: next };

      return { sketchOptions: newOpts, history: newHistory, future: newFuture, selection: null };
  })
}));