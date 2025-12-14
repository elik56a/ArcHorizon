
import { Discipline } from '../../types/layer';
import { LayerAgent } from './types';
import { ArcAgent } from './agents/arcAgent';
import { PlumbingAgent } from './agents/plumbingAgent';

const agents: Partial<Record<Discipline, LayerAgent>> = {
    'arc': new ArcAgent(),
    'plumbing': new PlumbingAgent(),
    // 'elec', 'hvac', 'fire' will be added here later
};

export const getAgent = (discipline: Discipline): LayerAgent => {
    return agents[discipline] || agents['arc']!;
};
