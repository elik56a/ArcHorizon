
import { Room, Connection, ArchitecturalElement, DrawingPath } from './blueprint';
import { Layer } from './layer';

export interface SketchData {
  id: string;
  title: string;
  description: string;
  totalAreaSqm: number;
  floors: number; 
  
  // New Layer System
  layers: Layer[];

  // Legacy/Computed Fields (kept for backward compatibility during migration)
  rooms: Room[];
  connections: Connection[];
  elements: ArchitecturalElement[];
  drawings: DrawingPath[];
}

export interface RenderImage {
  id: string;
  sketchId: string;
  url: string;
  timestamp: number;
  prompt: string;
}

export type SketchOption = 
  | { status: 'loaded', data: SketchData }
  | { status: 'loading', id: string }
  | { status: 'pending', id: string }
  | { status: 'idle', id: string };

export type ViewStyle = 'blueprint' | 'vivid';
