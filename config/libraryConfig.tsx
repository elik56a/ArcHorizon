
import React from 'react';
import { 
  Armchair, Utensils, BedDouble, Bath, Trees, Car, Waves, 
  DoorOpen, Maximize2, Move, Bed, Box, Sofa, Tv, Monitor, 
  Archive, ShowerHead, Flame, Refrigerator, Lamp, WashingMachine
} from 'lucide-react';
import { ElementType, RoomType } from '../types';

export type LibraryCategory = 'Zones' | 'Openings' | 'Furniture' | 'Wet Areas' | 'Appliances';

export interface LibraryItem {
  type: ElementType | RoomType;
  label: string;
  category: LibraryCategory;
  defaultWidth: number; // in cm
  defaultHeight: number; // in cm
  icon: React.ComponentType<any>;
  isRoom: boolean;
}

export const LIBRARY_CONFIG: LibraryItem[] = [
  // --- ZONES (ROOMS) ---
  { type: 'living', label: 'Living Room', category: 'Zones', defaultWidth: 500, defaultHeight: 400, icon: Armchair, isRoom: true },
  { type: 'kitchen', label: 'Kitchen', category: 'Zones', defaultWidth: 400, defaultHeight: 300, icon: Utensils, isRoom: true },
  { type: 'dining', label: 'Dining Room', category: 'Zones', defaultWidth: 400, defaultHeight: 350, icon: Utensils, isRoom: true },
  { type: 'bedroom', label: 'Bedroom', category: 'Zones', defaultWidth: 400, defaultHeight: 350, icon: BedDouble, isRoom: true },
  { type: 'bathroom', label: 'Bathroom', category: 'Zones', defaultWidth: 250, defaultHeight: 200, icon: Bath, isRoom: true },
  { type: 'study', label: 'Study / Office', category: 'Zones', defaultWidth: 300, defaultHeight: 300, icon: Monitor, isRoom: true },
  { type: 'garden', label: 'Garden / Landscape', category: 'Zones', defaultWidth: 800, defaultHeight: 600, icon: Trees, isRoom: true },
  { type: 'parking', label: 'Garage / Parking', category: 'Zones', defaultWidth: 300, defaultHeight: 500, icon: Car, isRoom: true },
  { type: 'pool', label: 'Swimming Pool', category: 'Zones', defaultWidth: 600, defaultHeight: 400, icon: Waves, isRoom: true },
  { type: 'utility', label: 'Utility Room', category: 'Zones', defaultWidth: 200, defaultHeight: 200, icon: WashingMachine, isRoom: true },

  // --- OPENINGS ---
  { type: 'entry_door', label: 'Entrance Door', category: 'Openings', defaultWidth: 100, defaultHeight: 15, icon: DoorOpen, isRoom: false },
  { type: 'door', label: 'Interior Door', category: 'Openings', defaultWidth: 90, defaultHeight: 15, icon: DoorOpen, isRoom: false },
  { type: 'sliding_door', label: 'Sliding Door', category: 'Openings', defaultWidth: 180, defaultHeight: 15, icon: DoorOpen, isRoom: false },
  { type: 'window', label: 'Window (Std)', category: 'Openings', defaultWidth: 120, defaultHeight: 15, icon: Maximize2, isRoom: false },
  { type: 'stairs_up', label: 'Stairs (Up)', category: 'Openings', defaultWidth: 100, defaultHeight: 300, icon: Move, isRoom: false },
  
  // --- FURNITURE ---
  { type: 'bed_king', label: 'King Bed', category: 'Furniture', defaultWidth: 190, defaultHeight: 210, icon: BedDouble, isRoom: false },
  { type: 'bed_single', label: 'Single Bed', category: 'Furniture', defaultWidth: 90, defaultHeight: 200, icon: Bed, isRoom: false },
  { type: 'nightstand', label: 'Nightstand', category: 'Furniture', defaultWidth: 50, defaultHeight: 40, icon: Box, isRoom: false },
  { type: 'sofa', label: 'Sofa (3-Seater)', category: 'Furniture', defaultWidth: 220, defaultHeight: 90, icon: Sofa, isRoom: false },
  { type: 'sofa_l_shape', label: 'L-Shape Sofa', category: 'Furniture', defaultWidth: 280, defaultHeight: 180, icon: Sofa, isRoom: false },
  { type: 'armchair', label: 'Armchair', category: 'Furniture', defaultWidth: 90, defaultHeight: 90, icon: Armchair, isRoom: false },
  { type: 'tv_unit', label: 'TV Unit', category: 'Furniture', defaultWidth: 180, defaultHeight: 45, icon: Tv, isRoom: false },
  { type: 'dining_table', label: 'Dining Table (6)', category: 'Furniture', defaultWidth: 180, defaultHeight: 90, icon: Utensils, isRoom: false },
  { type: 'desk', label: 'Work Desk', category: 'Furniture', defaultWidth: 140, defaultHeight: 70, icon: Monitor, isRoom: false },
  { type: 'wardrobe', label: 'Wardrobe', category: 'Furniture', defaultWidth: 180, defaultHeight: 60, icon: Archive, isRoom: false },

  // --- WET AREAS & APPLIANCES ---
  { type: 'toilet', label: 'Toilet', category: 'Wet Areas', defaultWidth: 50, defaultHeight: 70, icon: Bath, isRoom: false },
  { type: 'sink_single', label: 'Sink (Single)', category: 'Wet Areas', defaultWidth: 60, defaultHeight: 50, icon: Waves, isRoom: false },
  { type: 'sink_double', label: 'Sink (Double)', category: 'Wet Areas', defaultWidth: 140, defaultHeight: 50, icon: Waves, isRoom: false },
  { type: 'shower', label: 'Shower Cubicle', category: 'Wet Areas', defaultWidth: 90, defaultHeight: 90, icon: ShowerHead, isRoom: false },
  { type: 'bathtub', label: 'Bathtub', category: 'Wet Areas', defaultWidth: 80, defaultHeight: 170, icon: Bath, isRoom: false },
  { type: 'stove', label: 'Stove / Range', category: 'Appliances', defaultWidth: 60, defaultHeight: 60, icon: Flame, isRoom: false },
  { type: 'fridge', label: 'Refrigerator', category: 'Appliances', defaultWidth: 90, defaultHeight: 70, icon: Refrigerator, isRoom: false },
  { type: 'kitchen_island', label: 'Kitchen Island', category: 'Furniture', defaultWidth: 180, defaultHeight: 90, icon: Box, isRoom: false },
];

export const getLibraryItem = (type: string): LibraryItem | undefined => {
  return LIBRARY_CONFIG.find(item => item.type === type);
};

export const getGroupedLibraryItems = () => {
  const groups: Record<string, LibraryItem[]> = {
    'Zones': [],
    'Openings': [],
    'Furniture': [],
    'Wet Areas': [],
    'Appliances': []
  };

  LIBRARY_CONFIG.forEach(item => {
    if (groups[item.category]) {
      groups[item.category].push(item);
    }
  });

  return groups;
};
