
import { SketchData, SketchOption } from '../../types';
import { normalizeSketchData, autoSave } from '../utils';
import { MOCK_ONE_STORY, MOCK_TWO_STORY, MOCK_THREE_STORY } from '../../dev/mockData';
import { SliceCreator } from './types';

export interface ProjectSlice {
  sketchOptions: SketchOption[];
  currentOptionIndex: number;
  history: SketchData[];
  future: SketchData[];
  savedSketches: SketchData[];
  
  setCurrentOptionIndex: (index: number) => void;
  updateOptionStatus: (index: number, option: SketchOption) => void;
  updateSketchMetadata: (field: keyof SketchData, value: any) => void;
  
  undo: () => void;
  redo: () => void;
  
  saveCurrentSketch: () => void;
  deleteSketch: (id: string) => void;
  loadSketch: (id: string) => void;
  createNewSketch: () => void;
  loadMock: (type: '1-story' | '2-story' | '3-story') => void;
  startProjectFromLanding: (prompt: string, preGeneratedData?: SketchData) => void;
  
  getCurrentSketch: () => SketchData | null;
}

export const createProjectSlice: SliceCreator<ProjectSlice> = (set, get) => ({
  sketchOptions: [],
  currentOptionIndex: 0,
  history: [],
  future: [],
  savedSketches: [normalizeSketchData(MOCK_ONE_STORY), normalizeSketchData(MOCK_TWO_STORY), normalizeSketchData(MOCK_THREE_STORY)],

  getCurrentSketch: () => {
    const { sketchOptions, currentOptionIndex } = get();
    const option = sketchOptions[currentOptionIndex];
    return option?.status === 'loaded' ? normalizeSketchData(option.data) : null;
  },

  setCurrentOptionIndex: (index) => set((state) => {
      const opt = state.sketchOptions[index];
      let activeLayer = state.activeLayerId;
      if (opt?.status === 'loaded' && opt.data.layers.length > 0) {
          // If current active layer doesn't exist in new option, reset to first layer
          if (!opt.data.layers.find(l => l.id === activeLayer)) {
              activeLayer = opt.data.layers[0].id;
          }
      }
      return { 
          currentOptionIndex: index, 
          activeLayerId: activeLayer, 
          history: [], 
          future: [], 
          selection: null, 
          currentRenderUrl: null 
      };
  }),

  updateOptionStatus: (index, option) => set((state) => {
    const newOpts = [...state.sketchOptions];
    const prevOpt = newOpts[index];
    
    if (option.status === 'loaded') {
        option.data = normalizeSketchData(option.data);
    }
    newOpts[index] = option;
    
    // History Tracking
    if (prevOpt?.status === 'loaded' && option.status === 'loaded') {
        return { sketchOptions: newOpts, history: [...state.history, prevOpt.data], future: [] };
    }
    return { sketchOptions: newOpts };
  }),

  updateSketchMetadata: (field, value) => set((state) => {
      const current = get().getCurrentSketch();
      if (!current) return {};
      const newData = { ...current, [field]: value };
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: newData };
      
      const newSaved = autoSave(newData, state.savedSketches);
      return { sketchOptions: newOpts, savedSketches: newSaved };
  }),

  undo: () => set((state) => {
      const { history, future, currentOptionIndex, sketchOptions } = state;
      if (history.length === 0) return {};
      const previous = history[history.length - 1];
      const current = sketchOptions[currentOptionIndex];
      
      if (current.status !== 'loaded') return {};
      
      const newOpts = [...sketchOptions];
      newOpts[currentOptionIndex] = { status: 'loaded', data: previous };
      
      return {
          history: history.slice(0, -1),
          future: [current.data, ...future],
          sketchOptions: newOpts
      };
  }),

  redo: () => set((state) => {
      const { history, future, currentOptionIndex, sketchOptions } = state;
      if (future.length === 0) return {};
      const next = future[0];
      const current = sketchOptions[currentOptionIndex];
      
      if (current.status !== 'loaded') return {};

      const newOpts = [...sketchOptions];
      newOpts[currentOptionIndex] = { status: 'loaded', data: next };

      return {
          history: [...history, current.data],
          future: future.slice(1),
          sketchOptions: newOpts
      };
  }),

  saveCurrentSketch: () => set((state) => {
      const current = get().getCurrentSketch();
      if (!current) return {};
      return { savedSketches: autoSave(current, state.savedSketches) };
  }),

  deleteSketch: (id) => set((state) => ({ 
      savedSketches: state.savedSketches.filter(s => s.id !== id) 
  })),

  loadSketch: (id) => {
      const sketch = get().savedSketches.find(s => s.id === id);
      if (sketch) {
          set({ 
              sketchOptions: [{ status: 'loaded', data: normalizeSketchData(sketch) }],
              currentOptionIndex: 0,
              history: [],
              future: [],
              activeLayerId: sketch.layers[0]?.id || 'layer-arc-main',
              selection: null
          });
      }
  },

  createNewSketch: () => {
      set({
          sketchOptions: [{ status: 'idle', id: 'new' }],
          currentOptionIndex: 0,
          history: [],
          future: [],
          activeLayerId: 'layer-arc-main',
          selection: null,
          lastPrompt: ''
      });
  },

  loadMock: (type) => {
      let data = MOCK_THREE_STORY;
      if (type === '1-story') data = MOCK_ONE_STORY;
      if (type === '2-story') data = MOCK_TWO_STORY;
      
      set({ 
          sketchOptions: [{ status: 'loaded', data: normalizeSketchData(data) }],
          currentOptionIndex: 0,
          history: [],
          future: [],
          activeLayerId: data.layers[0]?.id || 'layer-arc-main'
      });
  },

  startProjectFromLanding: (prompt, preGeneratedData) => {
      let data = preGeneratedData ? normalizeSketchData(preGeneratedData) : undefined;
      set({ 
          lastPrompt: prompt, 
          currentOptionIndex: 0, 
          sketchOptions: data ? [{ status: 'loaded', data: data }] : [], 
          history: [], 
          future: [], 
          activeLayerId: data ? data.layers[0].id : 'layer-arc-main' 
      });
      if (data) { 
          get().validateActiveLayer(); 
          set(state => ({ savedSketches: autoSave(data!, state.savedSketches) })); 
      } else { 
          get().generateByPrompt(prompt); 
      }
  }
});
