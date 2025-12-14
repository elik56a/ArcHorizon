
import { LayerConfig } from '../../types/layer';
import { Zap, Power, Lightbulb, Box, Wifi, Server } from 'lucide-react';

export const ELEC_LAYER_CONFIG: LayerConfig = {
  discipline: 'elec',
  label: 'Electrical',
  palette: [
    { type: 'switch', label: 'Switch (1-Way)', category: 'Electrical', defaultWidth: 10, defaultHeight: 10, icon: Power, isRoom: false },
    { type: 'socket', label: 'Power Socket', category: 'Electrical', defaultWidth: 10, defaultHeight: 10, icon: Zap, isRoom: false },
    { type: 'light_ceiling', label: 'Ceiling Light', category: 'Electrical', defaultWidth: 20, defaultHeight: 20, icon: Lightbulb, isRoom: false },
    { type: 'panel', label: 'Breaker Panel', category: 'Electrical', defaultWidth: 40, defaultHeight: 15, icon: Box, isRoom: false },
    { type: 'data_point', label: 'Data / RJ45', category: 'Electrical', defaultWidth: 10, defaultHeight: 10, icon: Wifi, isRoom: false },
    // Appliances (Reference)
    { type: 'tv_unit', label: 'TV Point', category: 'Electrical', defaultWidth: 140, defaultHeight: 35, icon: Server, isRoom: false },
  ], 
  editableScopes: {
    rooms: false,
    openings: false,
    elements: true,
    drawings: true
  },
  validators: [],
  promptSystemInstruction: `
ROLE: Electrical Engineer.
TASK: Layout electrical devices and lighting points.
  `
};
