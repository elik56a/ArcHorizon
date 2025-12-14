
import { LayerConfig, Discipline } from '../types/layer';
import { ARC_LAYER_CONFIG } from './layers/arc';
import { PLUMBING_LAYER_CONFIG } from './layers/plumbing';
import { ELEC_LAYER_CONFIG } from './layers/elec';

export const LAYER_CONFIGS: Record<Discipline, LayerConfig> = {
  'arc': ARC_LAYER_CONFIG,
  'plumbing': PLUMBING_LAYER_CONFIG,
  'elec': ELEC_LAYER_CONFIG,
  'hvac': ARC_LAYER_CONFIG, // Stub
  'fire': ARC_LAYER_CONFIG, // Stub
};

export const getLayerConfig = (discipline: Discipline): LayerConfig => {
  return LAYER_CONFIGS[discipline] || ARC_LAYER_CONFIG;
};
