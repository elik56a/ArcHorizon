

export type RoomType = 
  | 'bedroom' | 'living' | 'kitchen' | 'bathroom' | 'corridor' 
  | 'balcony' | 'storage' | 'dining' | 'entry' | 'stairs'
  | 'garden' | 'parking' | 'terrace' | 'pool' | 'utility'
  | 'study';

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
  // Dynamic Label Position (Relative to Room Origin or Absolute - implementation dependent, usually Absolute in geometry engine)
  labelX?: number;
  labelY?: number;
  // Layer Reference
  layerId?: string;
}

export interface Connection {
  from: string; 
  to: string;   
  type: 'door' | 'open' | 'window' | 'stairs';
}

export type ElementType = 
  | 'door' | 'window' | 'entry_door' | 'sliding_door' | 'pocket_door' | 'wall_opening'
  | 'bed_king' | 'bed_queen' | 'bed_single' | 'nightstand'
  | 'sofa' | 'sofa_l_shape' | 'armchair' | 'coffee_table' | 'tv_unit'
  | 'dining_table' | 'chair' | 'table'
  | 'toilet' | 'sink_single' | 'sink_double' | 'shower' | 'bathtub' | 'bathtub_corner'
  | 'stove' | 'fridge' | 'kitchen_island' | 'kitchen_sink'
  | 'washer' | 'dryer'
  | 'desk' | 'wardrobe' | 'bookshelf'
  | 'stairs_up' | 'stairs_down' | 'stairs'
  | 'tree' | 'car' | 'garden' | 'parking' | 'pool'
  | 'water_supply_line' | 'waste_line' | 'vent_stack' | 'shaft' | 'slope_arrow' | 'floor_drain' | 'switch' | 'socket' | 'light_ceiling' | 'panel' | 'data_point' | 'indoor_unit' | 'supply_vent' | 'return_vent' | 'duct_main' | 'duct_branch' | 'smoke_detector' | 'sprinkler' | 'fire_extinguisher' | 'egress_path' | 'fire_door';

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
  layerId?: string;
}

export interface DrawingPath {
  id: string;
  points: {x: number, y: number}[];
  strokeWidth: number;
  color: string;
  floor: number;
  layerId?: string;
}
