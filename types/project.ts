
import { Room, Connection, ArchitecturalElement } from './blueprint';

export interface SketchData {
  id: string;
  title: string;
  description: string;
  totalAreaSqm: number;
  floors: number; 
  rooms: Room[];
  connections: Connection[];
  elements: ArchitecturalElement[];
}

export type SketchOption = 
  | { status: 'loaded', data: SketchData }
  | { status: 'loading', id: string }
  | { status: 'pending', id: string }
  | { status: 'idle', id: string };
