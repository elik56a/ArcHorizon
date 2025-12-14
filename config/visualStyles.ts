
import { RoomType } from '../types';

export interface VisualStyle {
    fill: string;
    stroke: string;
}

interface RoomStyleConfig {
    standard: string;
    vivid: string;
    stroke: string;
}

// Default fallback
const DEFAULT_STYLE: RoomStyleConfig = { standard: '#ffffff', vivid: '#ffffff', stroke: '#334155' };

const STYLES: Record<string, RoomStyleConfig> = {
    garden: { 
        standard: '#f0fdf4', // Green-50 
        vivid: '#bbf7d0',    // Green-200
        stroke: 'transparent' 
    },
    pool: { 
        standard: '#bae6fd', // Sky-200 (Darker for schematic visibility)
        vivid: '#67e8f9',    // Cyan-300
        stroke: 'transparent' 
    },
    parking: { 
        standard: '#e5e7eb', // Gray-200
        vivid: '#e2e8f0',    // Slate-200
        stroke: '#94a3b8' 
    },
    kitchen: { 
        standard: '#ffffff', 
        vivid: '#ffedd5',    // Orange-100
        stroke: '#334155' 
    },
    bathroom: { 
        standard: '#ffffff', 
        vivid: '#e0f2fe',    // Sky-100
        stroke: '#334155' 
    },
    bedroom: { 
        standard: '#ffffff', 
        vivid: '#f1f5f9',    // Slate-100
        stroke: '#334155' 
    },
    living: { 
        standard: '#ffffff', 
        vivid: '#fff7ed',    // Orange-50
        stroke: '#334155' 
    },
    dining: { 
        standard: '#ffffff', 
        vivid: '#fff7ed',    // Orange-50
        stroke: '#334155' 
    },
    corridor: { 
        standard: '#ffffff', 
        vivid: '#f8fafc',    // Slate-50
        stroke: '#334155' 
    },
    entry: { 
        standard: '#ffffff', 
        vivid: '#f8fafc',    // Slate-50
        stroke: '#334155' 
    },
    balcony: { 
        standard: '#fafafa', 
        vivid: '#f1f5f9', 
        stroke: '#cbd5e1' 
    },
    terrace: { 
        standard: '#fafafa', 
        vivid: '#f1f5f9', 
        stroke: '#cbd5e1' 
    }
};

export const getRoomStyle = (type: RoomType | string, mode: 'standard' | 'vivid' = 'standard', customColor?: string): VisualStyle => {
    // If a custom color override exists (and we aren't in vivid mode which enforces realism), use it
    if (customColor && mode === 'standard') {
        return { fill: customColor, stroke: '#334155' };
    }

    const config = STYLES[type] || DEFAULT_STYLE;
    
    return {
        fill: mode === 'vivid' ? config.vivid : config.standard,
        stroke: config.stroke
    };
};
