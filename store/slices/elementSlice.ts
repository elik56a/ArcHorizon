
import { Selection, ElementType, RoomType, DrawingPath, ArchitecturalElement, Room } from '../../types';
import { normalizeSketchData } from '../utils';
import { SliceCreator } from './types';

export interface PendingCreation {
  type: ElementType | RoomType;
  category: 'room' | 'element';
  width: number;
  height: number;
  rotation: number;
  name?: string;
  label?: string;
  color?: string;
  opacity?: number;
}

export interface ElementSlice {
  selection: Selection | null;
  pendingCreation: PendingCreation | null;
  setSelection: (selection: Selection | null) => void;
  
  startCreation: (type: ElementType | RoomType, category: 'room' | 'element') => void;
  updatePendingCreation: (field: string, value: any) => void;
  commitCreation: () => void;
  cancelCreation: () => void;

  updateItem: (id: string, type: 'room' | 'element', field: string, value: any) => void;
  deleteItem: (id: string, type: 'room' | 'element') => void;
  addItem: (type: ElementType | RoomType, category: 'room' | 'element', overrides?: any) => void;
  
  addDrawing: (drawing: DrawingPath) => void;
  deleteDrawing: (id: string) => void;
}

export const createElementSlice: SliceCreator<ElementSlice> = (set, get) => ({
  selection: null,
  pendingCreation: null,
  
  setSelection: (selection) => set({ selection, pendingCreation: null }),

  startCreation: (type, category) => set((state) => {
      const config = get().getActiveLayerConfig();
      const paletteItem = config.palette.find(p => p.type === type);
      const w = paletteItem?.defaultWidth || 100;
      const h = paletteItem?.defaultHeight || 100;
      
      return {
          pendingCreation: {
              type,
              category,
              width: w,
              height: h,
              rotation: 0,
              name: paletteItem?.label || 'New Room',
              label: '',
              color: '#ffffff',
              opacity: 1
          },
          selection: null // Deselect current item
      };
  }),

  updatePendingCreation: (field, value) => set((state) => {
      if (!state.pendingCreation) return {};
      return { pendingCreation: { ...state.pendingCreation, [field]: value } };
  }),

  commitCreation: () => {
      const { pendingCreation, addItem } = get();
      if (!pendingCreation) return;
      addItem(pendingCreation.type, pendingCreation.category, pendingCreation);
      set({ pendingCreation: null });
  },

  cancelCreation: () => set({ pendingCreation: null }),

  updateItem: (id, type, field, value) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};

      // We operate on the layers directly to maintain ID references
      // Note: normalizeSketchData flattens them for view, but we edit the source layers
      const newLayers = currentOpt.data.layers.map(layer => {
          if (type === 'room') {
              const updatedRooms = layer.rooms.map(r => r.id === id ? { ...r, [field]: value } : r);
              return { ...layer, rooms: updatedRooms };
          } else {
              const updatedElements = layer.elements.map(e => e.id === id ? { ...e, [field]: value } : e);
              return { ...layer, elements: updatedElements };
          }
      });

      const newData = { ...currentOpt.data, layers: newLayers };
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: normalizeSketchData(newData) };
      
      return { sketchOptions: newOpts };
  }),

  deleteItem: (id, type) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};

      const newLayers = currentOpt.data.layers.map(layer => {
          if (type === 'room') {
              return { ...layer, rooms: layer.rooms.filter(r => r.id !== id) };
          } else {
              return { ...layer, elements: layer.elements.filter(e => e.id !== id) };
          }
      });

      const newData = { ...currentOpt.data, layers: newLayers };
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: normalizeSketchData(newData) };
      
      return { sketchOptions: newOpts, selection: null };
  }),

  addItem: (type, category, overrides: any = {}) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};
      
      const { activeLayerId } = state;
      const config = get().getActiveLayerConfig();
      const paletteItem = config.palette.find(p => p.type === type);
      
      // Defaults
      const w = overrides.width || paletteItem?.defaultWidth || 100;
      const h = overrides.height || paletteItem?.defaultHeight || 100;
      const rotation = overrides.rotation || 0;
      const color = overrides.color;
      const opacity = overrides.opacity;
      const label = overrides.label;

      // Center position
      const x = 500 - w/2; 
      const y = 500 - h/2;

      let newId = '';

      const newLayers = currentOpt.data.layers.map(layer => {
          if (layer.id === activeLayerId) {
              if (category === 'room') {
                  const name = overrides.name || paletteItem?.label || 'New Room';
                  newId = `r-${Date.now()}`;
                  const newRoom: Room = {
                      id: newId,
                      name,
                      type: type as RoomType,
                      x, y, width: w, height: h,
                      floor: 1, // Default to floor 1
                      floorFinish: 'tiled',
                      layerId: activeLayerId,
                      color, opacity, label
                  };
                  return { ...layer, rooms: [...layer.rooms, newRoom] };
              } else {
                  newId = `el-${Date.now()}`;
                  const newEl: ArchitecturalElement = {
                      id: newId,
                      type: type as ElementType,
                      roomId: 'unassigned',
                      x, y, width: w, height: h,
                      floor: 1,
                      rotation,
                      layerId: activeLayerId,
                      color, opacity, label
                  };
                  return { ...layer, elements: [...layer.elements, newEl] };
              }
          }
          return layer;
      });

      const newData = { ...currentOpt.data, layers: newLayers };
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: normalizeSketchData(newData) };
      
      return { 
          sketchOptions: newOpts,
          // Auto-select the newly added item
          selection: { id: newId, type: category }
      };
  }),

  addDrawing: (drawing) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};

      const newLayers = currentOpt.data.layers.map(layer => {
          if (layer.id === state.activeLayerId) {
              return { ...layer, drawings: [...(layer.drawings || []), drawing] };
          }
          return layer;
      });

      const newData = { ...currentOpt.data, layers: newLayers };
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: normalizeSketchData(newData) };
      
      return { sketchOptions: newOpts };
  }),

  deleteDrawing: (id) => set((state) => {
      const currentOpt = state.sketchOptions[state.currentOptionIndex];
      if (currentOpt?.status !== 'loaded') return {};

      const newLayers = currentOpt.data.layers.map(layer => {
          // Check if drawing is in this layer
          if (layer.drawings?.some(d => d.id === id)) {
              return { ...layer, drawings: layer.drawings.filter(d => d.id !== id) };
          }
          return layer;
      });

      const newData = { ...currentOpt.data, layers: newLayers };
      const newOpts = [...state.sketchOptions];
      newOpts[state.currentOptionIndex] = { status: 'loaded', data: normalizeSketchData(newData) };
      
      return { sketchOptions: newOpts };
  })
});
