
export type RoomType = 
  | 'bedroom' | 'living' | 'kitchen' | 'bathroom' | 'corridor' 
  | 'balcony' | 'storage' | 'dining' | 'entry' | 'stairs'
  | 'garden' | 'parking' | 'terrace' | 'pool' | 'utility';

export type FloorFinish = 'tiled' | 'wood' | 'carpet' | 'concrete' | 'grass' | 'paved' | 'marble';

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
  | 'door' | 'window' | 'entry_door' | 'sliding_door' | 'pocket_door'
  | 'bed_king' | 'bed_queen' | 'bed_single' | 'nightstand'
  | 'sofa' | 'sofa_l_shape' | 'armchair' | 'coffee_table' | 'tv_unit'
  | 'dining_table' | 'chair'
  | 'toilet' | 'sink_single' | 'sink_double' | 'shower' | 'bathtub' | 'bathtub_corner'
  | 'stove' | 'fridge' | 'kitchen_island' | 'kitchen_sink'
  | 'washer' | 'dryer'
  | 'desk' | 'wardrobe' | 'bookshelf'
  | 'stairs_up' | 'stairs_down';

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
