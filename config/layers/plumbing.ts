
import { LayerConfig } from '../../types/layer';
import { Droplets, ArrowDown, Cylinder, CircleDot, Bath, Waves, WashingMachine, ArrowRight } from 'lucide-react';

export const PLUMBING_LAYER_CONFIG: LayerConfig = {
  discipline: 'plumbing',
  label: 'Plumbing & Sewage',
  palette: [
    // PIPES
    { type: 'water_supply_line', label: 'Supply Line (PEX)', category: 'Pipes', defaultWidth: 100, defaultHeight: 5, icon: Droplets, isRoom: false },
    { type: 'waste_line', label: 'Waste Line (PVC)', category: 'Pipes', defaultWidth: 100, defaultHeight: 10, icon: ArrowRight, isRoom: false },
    { type: 'vent_stack', label: 'Vent Stack', category: 'Pipes', defaultWidth: 15, defaultHeight: 15, icon: ArrowDown, isRoom: false },
    { type: 'shaft', label: 'Vertical Chase', category: 'Pipes', defaultWidth: 40, defaultHeight: 40, icon: Cylinder, isRoom: false },
    { type: 'floor_drain', label: 'Floor Drain', category: 'Pipes', defaultWidth: 20, defaultHeight: 20, icon: CircleDot, isRoom: false },
    { type: 'slope_arrow', label: 'Slope Direction', category: 'Pipes', defaultWidth: 50, defaultHeight: 20, icon: ArrowDown, isRoom: false },
    
    // FIXTURES
    { type: 'toilet', label: 'Toilet', category: 'Wet Areas', defaultWidth: 45, defaultHeight: 60, icon: Bath, isRoom: false },
    { type: 'sink_single', label: 'Sink', category: 'Wet Areas', defaultWidth: 50, defaultHeight: 40, icon: Waves, isRoom: false },
    { type: 'sink_double', label: 'Double Sink', category: 'Wet Areas', defaultWidth: 100, defaultHeight: 40, icon: Waves, isRoom: false },
    { type: 'shower', label: 'Shower', category: 'Wet Areas', defaultWidth: 80, defaultHeight: 80, icon: Bath, isRoom: false },
    { type: 'bathtub', label: 'Bathtub', category: 'Wet Areas', defaultWidth: 70, defaultHeight: 150, icon: Bath, isRoom: false },
    { type: 'kitchen_sink', label: 'Kitchen Sink', category: 'Wet Areas', defaultWidth: 70, defaultHeight: 40, icon: Waves, isRoom: false },
    { type: 'washer', label: 'Washer', category: 'Wet Areas', defaultWidth: 60, defaultHeight: 60, icon: WashingMachine, isRoom: false },
  ],
  editableScopes: {
    rooms: false,
    openings: false,
    elements: true,
    drawings: true
  },
  validators: [],
};
