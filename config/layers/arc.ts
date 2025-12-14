
import { LayerConfig } from '../../types/layer';
import { 
  Armchair, Utensils, BedDouble, Bath, Trees, Car, Waves, 
  DoorOpen, Maximize2, Move, Bed, Box, Sofa, Tv, Monitor, 
  Archive, ShowerHead, Flame, Refrigerator, WashingMachine,
  Minimize
} from 'lucide-react';

export const ARC_LAYER_CONFIG: LayerConfig = {
  discipline: 'arc',
  label: 'Architecture',
  palette: [
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
    { type: 'door', label: 'Interior Door', category: 'Openings', defaultWidth: 80, defaultHeight: 15, icon: DoorOpen, isRoom: false },
    { type: 'wall_opening', label: 'Open Archway', category: 'Openings', defaultWidth: 200, defaultHeight: 15, icon: Minimize, isRoom: false },
    { type: 'sliding_door', label: 'Sliding Door', category: 'Openings', defaultWidth: 160, defaultHeight: 15, icon: DoorOpen, isRoom: false },
    { type: 'window', label: 'Window (Std)', category: 'Openings', defaultWidth: 120, defaultHeight: 22, icon: Maximize2, isRoom: false },
    { type: 'stairs_up', label: 'Stairs (Up)', category: 'Openings', defaultWidth: 90, defaultHeight: 260, icon: Move, isRoom: false },
    
    // --- FURNITURE ---
    { type: 'bed_king', label: 'King Bed', category: 'Furniture', defaultWidth: 160, defaultHeight: 180, icon: BedDouble, isRoom: false },
    { type: 'bed_queen', label: 'Queen Bed', category: 'Furniture', defaultWidth: 140, defaultHeight: 180, icon: BedDouble, isRoom: false },
    { type: 'bed_single', label: 'Single Bed', category: 'Furniture', defaultWidth: 80, defaultHeight: 170, icon: Bed, isRoom: false },
    { type: 'nightstand', label: 'Nightstand', category: 'Furniture', defaultWidth: 35, defaultHeight: 35, icon: Box, isRoom: false },
    { type: 'sofa', label: 'Sofa (3-Seater)', category: 'Furniture', defaultWidth: 170, defaultHeight: 75, icon: Sofa, isRoom: false },
    { type: 'sofa_l_shape', label: 'L-Shape Sofa', category: 'Furniture', defaultWidth: 220, defaultHeight: 140, icon: Sofa, isRoom: false },
    { type: 'armchair', label: 'Armchair', category: 'Furniture', defaultWidth: 70, defaultHeight: 70, icon: Armchair, isRoom: false },
    { type: 'tv_unit', label: 'TV Unit', category: 'Furniture', defaultWidth: 140, defaultHeight: 35, icon: Tv, isRoom: false },
    { type: 'dining_table', label: 'Dining Table (6)', category: 'Furniture', defaultWidth: 140, defaultHeight: 80, icon: Utensils, isRoom: false },
    { type: 'chair', label: 'Chair', category: 'Furniture', defaultWidth: 40, defaultHeight: 40, icon: Utensils, isRoom: false },
    { type: 'desk', label: 'Work Desk', category: 'Furniture', defaultWidth: 100, defaultHeight: 50, icon: Monitor, isRoom: false },
    { type: 'wardrobe', label: 'Wardrobe', category: 'Furniture', defaultWidth: 120, defaultHeight: 50, icon: Archive, isRoom: false },
    { type: 'bookshelf', label: 'Bookshelf', category: 'Furniture', defaultWidth: 80, defaultHeight: 30, icon: Archive, isRoom: false },
    { type: 'car', label: 'Car (Sedan)', category: 'Furniture', defaultWidth: 180, defaultHeight: 450, icon: Car, isRoom: false },

    // --- WET AREAS (Placement Only) ---
    { type: 'toilet', label: 'Toilet', category: 'Wet Areas', defaultWidth: 45, defaultHeight: 60, icon: Bath, isRoom: false },
    { type: 'sink_single', label: 'Sink (Single)', category: 'Wet Areas', defaultWidth: 50, defaultHeight: 40, icon: Waves, isRoom: false },
    { type: 'sink_double', label: 'Sink (Double)', category: 'Wet Areas', defaultWidth: 100, defaultHeight: 40, icon: Waves, isRoom: false },
    { type: 'shower', label: 'Shower Cubicle', category: 'Wet Areas', defaultWidth: 80, defaultHeight: 80, icon: ShowerHead, isRoom: false },
    { type: 'bathtub', label: 'Bathtub', category: 'Wet Areas', defaultWidth: 70, defaultHeight: 150, icon: Bath, isRoom: false },
    { type: 'stove', label: 'Stove / Range', category: 'Appliances', defaultWidth: 55, defaultHeight: 55, icon: Flame, isRoom: false },
    { type: 'fridge', label: 'Refrigerator', category: 'Appliances', defaultWidth: 80, defaultHeight: 60, icon: Refrigerator, isRoom: false },
    { type: 'washer', label: 'Washer', category: 'Appliances', defaultWidth: 60, defaultHeight: 60, icon: WashingMachine, isRoom: false },
    { type: 'dryer', label: 'Dryer', category: 'Appliances', defaultWidth: 60, defaultHeight: 60, icon: WashingMachine, isRoom: false },
    { type: 'kitchen_island', label: 'Kitchen Island', category: 'Furniture', defaultWidth: 130, defaultHeight: 70, icon: Box, isRoom: false },
    { type: 'kitchen_sink', label: 'Kitchen Sink', category: 'Wet Areas', defaultWidth: 70, defaultHeight: 40, icon: Waves, isRoom: false },
  ],
  editableScopes: {
    rooms: true,
    openings: true,
    elements: true,
    drawings: true
  },
  validators: ['arc-missing-doors', 'arc-floating-elements'],
  promptSystemInstruction: `
ROLE: Senior Architectural CAD Technician + Space-Planning Expert.
TASK: Generate a detailed, construction-grade, fully furnished floor plan.
  `
};
