
export type RoomType = 
  | 'bedroom' | 'living' | 'kitchen' | 'bathroom' | 'corridor' 
  | 'balcony' | 'storage' | 'dining' | 'entry' | 'stairs'
  | 'garden' | 'parking' | 'terrace';

export type FloorFinish = 'tiled' | 'wood' | 'carpet' | 'concrete' | 'grass' | 'paved';

export interface Room {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  type: RoomType;
  floor: number; 
  floorFinish?: FloorFinish;
  color?: string;
  opacity?: number;
  label?: string;
}

export interface Connection {
  from: string; 
  to: string;   
  type: 'door' | 'open' | 'window' | 'stairs';
}

export type ElementType = 
  | 'door' | 'window' | 'entry_door' 
  | 'bed_king' | 'bed_single' | 'sofa' | 'dining_table' 
  | 'toilet' | 'sink' | 'stove' | 'desk' | 'wardrobe'
  | 'stairs_up' | 'stairs_down' | 'bathtub' | 'shower';

export interface ArchitecturalElement {
  id: string;
  roomId: string; 
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; 
  floor: number;
  color?: string;
  opacity?: number;
  label?: string;
}
