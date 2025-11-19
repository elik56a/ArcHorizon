
export interface Point {
  x: number;
  y: number;
}

export type RoomType = 'bedroom' | 'living' | 'kitchen' | 'bathroom' | 'corridor' | 'balcony' | 'storage' | 'dining' | 'entry' | 'other' | 'stairs';

export interface Room {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  type: RoomType;
  floor: number; // 1-based index (1 = Ground, 2 = 1st floor, etc.)
  floorFinish?: 'tiled' | 'wood' | 'carpet' | 'concrete';
}

export interface Connection {
  from: string; // Room ID
  to: string;   // Room ID
  type: 'door' | 'open' | 'window' | 'stairs';
}

export type ElementType = 
  | 'door' 
  | 'window' 
  | 'entry_door' 
  | 'bed_king' 
  | 'bed_single' 
  | 'sofa' 
  | 'dining_table' 
  | 'toilet' 
  | 'sink' 
  | 'stove' 
  | 'desk' 
  | 'wardrobe'
  | 'stairs_up'
  | 'stairs_down'
  | 'bathtub'
  | 'shower';

export interface ArchitecturalElement {
  id: string;
  roomId: string; // Critical for clipping/containment
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  floor: number;
}

export interface SketchData {
  id: string;
  title: string;
  description: string;
  totalAreaSqm: number;
  floors: number; // Total number of floors
  rooms: Room[];
  connections: Connection[];
  elements: ArchitecturalElement[];
}

// UI Helper type for the option selector
export type SketchOption = 
  | { status: 'loaded', data: SketchData }
  | { status: 'loading', id: string }
  | { status: 'pending', id: string }
  | { status: 'idle', id: string }; // Added idle state for manual trigger

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
