
import { create } from 'zustand';
import { ProjectSlice, createProjectSlice } from './slices/projectSlice';
import { LayerSlice, createLayerSlice } from './slices/layerSlice';
import { ElementSlice, createElementSlice } from './slices/elementSlice';
import { AISlice, createAISlice } from './slices/aiSlice';
import { UISlice, createUISlice } from './slices/uiSlice';

// Combined State Interface
export interface ProjectState extends 
  ProjectSlice, 
  LayerSlice, 
  ElementSlice, 
  AISlice, 
  UISlice {}

export const useProjectStore = create<ProjectState>((...a) => ({
  ...createProjectSlice(...a),
  ...createLayerSlice(...a),
  ...createElementSlice(...a),
  ...createAISlice(...a),
  ...createUISlice(...a),
}));
