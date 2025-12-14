
import { LayerConfig, Discipline, Layer } from '../../types/layer';
import { LAYER_CONFIGS, getLayerConfig } from '../../config/layerRegistry';
import { normalizeSketchData, validateAndReturn } from '../utils';
import { SliceCreator } from './types';

export interface LayerSlice {
  activeLayerId: string;
  setActiveLayer: (layerId: string) => void;
  setDiscipline: (discipline: Discipline) => void;
  addLayer: (discipline: Discipline) => void;
  toggleLayerVisibility: (layerId: string) => void;
  validateActiveLayer: () => void;
  
  getActiveLayerConfig: () => LayerConfig;
  getDiscipline: () => Discipline;
}

export const createLayerSlice: SliceCreator<LayerSlice> = (set, get) => ({
  activeLayerId: 'layer-arc-main',

  setActiveLayer: (layerId) => set({ activeLayerId: layerId, selection: null }),

  setDiscipline: (discipline) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};
      
      const targetLayer = currentOpt.data.layers.find(l => l.discipline === discipline);
      if (targetLayer) {
          // SOLO MODE LOGIC:
          // When switching disciplines, by default, hide all other layers 
          // and show only the selected discipline's layer.
          const newLayers = currentOpt.data.layers.map(l => ({
              ...l,
              isVisible: l.id === targetLayer.id
          }));

          const newData = { ...currentOpt.data, layers: newLayers };
          const newOpts = [...state.sketchOptions];
          newOpts[state.currentOptionIndex] = { status: 'loaded', data: normalizeSketchData(newData) };

          return { 
              sketchOptions: newOpts,
              activeLayerId: targetLayer.id, 
              selection: null 
          };
      }
      return {}; 
  }),

  addLayer: (discipline) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};
      
      const newLayer: Layer = { 
          id: `layer-${discipline}-${Date.now()}`, 
          discipline, 
          name: LAYER_CONFIGS[discipline].label, 
          isVisible: true, 
          isLocked: false, 
          rooms: [], 
          elements: [], 
          drawings: [], 
          validations: [] 
      };
      
      // When adding a new layer, we also apply Solo Mode (hide others)
      const newLayers = currentOpt.data.layers.map(l => ({ ...l, isVisible: false }));
      
      const newData = { ...currentOpt.data, layers: [...newLayers, newLayer] };
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: normalizeSketchData(newData) };
      
      return { sketchOptions: newOpts, activeLayerId: newLayer.id, selection: null };
  }),

  toggleLayerVisibility: (layerId) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};
      
      const newLayers = currentOpt.data.layers.map(l => l.id === layerId ? { ...l, isVisible: !l.isVisible } : l);
      const newData = { ...currentOpt.data, layers: newLayers };
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: normalizeSketchData(newData) };
      
      return { sketchOptions: newOpts };
  }),

  validateActiveLayer: () => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};
      
      const validatedData = validateAndReturn(currentOpt.data, state.activeLayerId);
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: normalizeSketchData(validatedData) };
      
      return { sketchOptions: newOpts };
  }),

  getActiveLayerConfig: () => {
      const sketch = get().getCurrentSketch();
      const activeId = get().activeLayerId;
      if (!sketch) return LAYER_CONFIGS['arc'];
      const layer = sketch.layers.find(l => l.id === activeId);
      return layer ? getLayerConfig(layer.discipline) : LAYER_CONFIGS['arc'];
  },

  getDiscipline: () => {
      const sketch = get().getCurrentSketch();
      const activeId = get().activeLayerId;
      if (!sketch) return 'arc';
      const layer = sketch.layers.find(l => l.id === activeId);
      return layer ? layer.discipline : 'arc';
  }
});
