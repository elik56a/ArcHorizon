
import { SketchData } from '../types';

export const MOCK_ONE_STORY: SketchData = {
    id: 'mock-1-classic',
    title: 'Modern Sanctuary Ranch',
    description: 'A sprawling 180sqm single-story home featuring a dedicated bedroom wing, open-plan living, and landscaped gardens.',
    totalAreaSqm: 180,
    floors: 1,
    rooms: [
        // OUTDOOR
        { id: 'r_garden', name: 'Landscaped Garden', type: 'garden', floor: 1, x: -300, y: -300, width: 2200, height: 1600, floorFinish: 'grass' },
        { id: 'r_parking', name: 'Private Driveway', type: 'parking', floor: 1, x: 1200, y: 800, width: 500, height: 600, floorFinish: 'paved' },

        // PUBLIC ZONE (LEFT WING)
        { id: 'r_living', name: 'Great Room', type: 'living', floor: 1, x: 100, y: 100, width: 600, height: 800, floorFinish: 'wood', color: '#ffffff' },
        { id: 'r_kitchen', name: 'Gourmet Kitchen', type: 'kitchen', floor: 1, x: 700, y: 100, width: 400, height: 500, floorFinish: 'tiled', color: '#f8f9fa' },
        { id: 'r_dining', name: 'Dining Area', type: 'dining', floor: 1, x: 100, y: 900, width: 600, height: 300, floorFinish: 'wood', color: '#f9fafb' },

        // CONNECTION
        { id: 'r_entry', name: 'Foyer', type: 'entry', floor: 1, x: 700, y: 600, width: 300, height: 300, floorFinish: 'tiled', color: '#e5e7eb' },
        { id: 'r_corridor', name: 'Hallway', type: 'corridor', floor: 1, x: 1000, y: 600, width: 500, height: 150, floorFinish: 'wood' },

        // PRIVATE ZONE (RIGHT WING)
        { id: 'r_master', name: 'Master Suite', type: 'bedroom', floor: 1, x: 1100, y: 100, width: 400, height: 500, floorFinish: 'carpet', color: '#fafafa' },
        { id: 'r_ensuite', name: 'Ensuite', type: 'bathroom', floor: 1, x: 1500, y: 100, width: 200, height: 300, floorFinish: 'tiled', color: '#f0f9ff' },
        { id: 'r_bed2', name: 'Guest Room', type: 'bedroom', floor: 1, x: 1100, y: 750, width: 350, height: 400, floorFinish: 'wood', color: '#fff1f2' },
        { id: 'r_bath', name: 'Family Bath', type: 'bathroom', floor: 1, x: 1450, y: 750, width: 250, height: 300, floorFinish: 'tiled', color: '#eff6ff' }
    ],
    connections: [],
    elements: [
        // DOORS
        { id: 'd_main', roomId: 'r_entry', type: 'entry_door', floor: 1, x: 800, y: 900, width: 120, height: 15, rotation: 0 },
        { id: 'd_master', roomId: 'r_master', type: 'door', floor: 1, x: 1100, y: 550, width: 90, height: 15, rotation: 90 },
        { id: 'd_guest', roomId: 'r_bed2', type: 'door', floor: 1, x: 1100, y: 750, width: 90, height: 15, rotation: 90 },
        { id: 'd_bath', roomId: 'r_bath', type: 'door', floor: 1, x: 1450, y: 750, width: 80, height: 15, rotation: 90 },

        // WINDOWS (Exterior)
        // Living
        { id: 'w_liv_1', roomId: 'r_living', type: 'window', floor: 1, x: 100, y: 300, width: 200, height: 15, rotation: 90 },
        { id: 'w_liv_2', roomId: 'r_living', type: 'window', floor: 1, x: 100, y: 600, width: 200, height: 15, rotation: 90 },
        // Dining
        { id: 'w_din_1', roomId: 'r_dining', type: 'window', floor: 1, x: 300, y: 1200, width: 300, height: 15, rotation: 0 },
        // Kitchen
        { id: 'w_kit_1', roomId: 'r_kitchen', type: 'window', floor: 1, x: 900, y: 100, width: 150, height: 15, rotation: 0 },
        // Master
        { id: 'w_mas_1', roomId: 'r_master', type: 'window', floor: 1, x: 1500, y: 200, width: 150, height: 15, rotation: 90 },
        { id: 'w_mas_2', roomId: 'r_master', type: 'window', floor: 1, x: 1200, y: 100, width: 200, height: 15, rotation: 0 },
        // Guest
        { id: 'w_guest_1', roomId: 'r_bed2', type: 'window', floor: 1, x: 1250, y: 1150, width: 150, height: 15, rotation: 0 },

        // FURNITURE
        // Living
        { id: 'e_sofa', roomId: 'r_living', type: 'sofa', floor: 1, x: 250, y: 250, width: 300, height: 100, rotation: 0 },
        { id: 'e_tv', roomId: 'r_living', type: 'wardrobe', floor: 1, x: 250, y: 600, width: 200, height: 40, rotation: 0 }, // TV Unit
        // Dining
        { id: 'e_dining', roomId: 'r_dining', type: 'dining_table', floor: 1, x: 400, y: 1050, width: 220, height: 100, rotation: 0 },
        // Kitchen
        { id: 'e_island', roomId: 'r_kitchen', type: 'desk', floor: 1, x: 850, y: 300, width: 200, height: 90, rotation: 0 }, // Island
        { id: 'e_stove', roomId: 'r_kitchen', type: 'stove', floor: 1, x: 1000, y: 120, width: 60, height: 60, rotation: 0 },
        // Master
        { id: 'e_bed_king', roomId: 'r_master', type: 'bed_king', floor: 1, x: 1200, y: 200, width: 200, height: 200, rotation: 0 },
        { id: 'e_wardrobe_m', roomId: 'r_master', type: 'wardrobe', floor: 1, x: 1110, y: 200, width: 60, height: 250, rotation: 0 },
        // Bathrooms
        { id: 'e_toilet_m', roomId: 'r_ensuite', type: 'toilet', floor: 1, x: 1650, y: 350, width: 50, height: 70, rotation: 180 },
        { id: 'e_shower_m', roomId: 'r_ensuite', type: 'shower', floor: 1, x: 1510, y: 110, width: 90, height: 90, rotation: 0 },
        { id: 'e_tub', roomId: 'r_bath', type: 'bathtub', floor: 1, x: 1600, y: 800, width: 80, height: 170, rotation: 0 },
        { id: 'e_sink', roomId: 'r_bath', type: 'sink', floor: 1, x: 1460, y: 850, width: 60, height: 40, rotation: 90 },
        // Guest
        { id: 'e_bed_guest', roomId: 'r_bed2', type: 'bed_king', floor: 1, x: 1200, y: 900, width: 180, height: 200, rotation: 0 }
    ]
};

export const MOCK_TWO_STORY: SketchData = {
    id: 'mock-2-luxury',
    title: 'Executive Glass Villa',
    description: 'A contemporary 350sqm masterpiece featuring a double-height entrance, expansive glass walls, and a rooftop entertainment terrace.',
    totalAreaSqm: 350,
    floors: 2,
    rooms: [
        // --- GROUND FLOOR ---
        { id: 'g_garden', name: 'Estate Grounds', type: 'garden', floor: 1, x: -400, y: -400, width: 2400, height: 2000, floorFinish: 'grass' },
        { id: 'g_garage', name: 'Double Garage', type: 'parking', floor: 1, x: 1200, y: 100, width: 600, height: 600, floorFinish: 'paved' },
        
        { id: 'g_entry', name: 'Grand Foyer', type: 'entry', floor: 1, x: 700, y: 100, width: 500, height: 400, floorFinish: 'tiled', color: '#f3f4f6' },
        { id: 'g_stairs', name: 'Stairwell', type: 'stairs', floor: 1, x: 700, y: 500, width: 500, height: 200, floorFinish: 'wood' },
        
        { id: 'g_living', name: 'Living Pavilion', type: 'living', floor: 1, x: 100, y: 700, width: 800, height: 700, floorFinish: 'wood', color: '#ffffff' },
        { id: 'g_kitchen', name: 'Chef Kitchen', type: 'kitchen', floor: 1, x: 900, y: 700, width: 600, height: 700, floorFinish: 'tiled', color: '#f8f9fa' },
        { id: 'g_powder', name: 'Powder Room', type: 'bathroom', floor: 1, x: 200, y: 200, width: 200, height: 200, floorFinish: 'tiled' },
        { id: 'g_office', name: 'Home Office', type: 'bedroom', floor: 1, x: 400, y: 200, width: 300, height: 400, floorFinish: 'wood' },

        // --- FIRST FLOOR ---
        { id: 'f_landing', name: 'Gallery Landing', type: 'corridor', floor: 2, x: 700, y: 500, width: 500, height: 200, floorFinish: 'wood' },
        
        { id: 'f_master', name: 'Master Sanctuary', type: 'bedroom', floor: 2, x: 100, y: 700, width: 600, height: 700, floorFinish: 'carpet', color: '#fafafa' },
        { id: 'f_ensuite', name: 'Master Bath', type: 'bathroom', floor: 2, x: 100, y: 400, width: 400, height: 300, floorFinish: 'tiled', color: '#fff' },
        
        { id: 'f_bed2', name: 'Bedroom 2', type: 'bedroom', floor: 2, x: 1200, y: 100, width: 400, height: 500, floorFinish: 'wood' },
        { id: 'f_bed3', name: 'Bedroom 3', type: 'bedroom', floor: 2, x: 800, y: 100, width: 400, height: 500, floorFinish: 'wood' },
        { id: 'f_bath', name: 'Shared Bath', type: 'bathroom', floor: 2, x: 500, y: 100, width: 300, height: 300, floorFinish: 'tiled' },
        
        { id: 'f_terrace', name: 'Sky Lounge', type: 'terrace', floor: 2, x: 700, y: 700, width: 800, height: 700, floorFinish: 'tiled', color: '#e5e7eb' }
    ],
    connections: [],
    elements: [
        // GROUND ELEMENTS
        { id: 'gd_main', roomId: 'g_entry', type: 'entry_door', floor: 1, x: 900, y: 100, width: 140, height: 15, rotation: 0 },
        { id: 'gw_liv_1', roomId: 'g_living', type: 'window', floor: 1, x: 100, y: 900, width: 15, height: 300, rotation: 90 }, // Vertical glass
        { id: 'gw_liv_2', roomId: 'g_living', type: 'window', floor: 1, x: 300, y: 1400, width: 400, height: 15, rotation: 0 },
        
        { id: 'ge_stairs', roomId: 'g_stairs', type: 'stairs_up', floor: 1, x: 750, y: 550, width: 400, height: 100, rotation: 0 },
        { id: 'ge_sofa', roomId: 'g_living', type: 'sofa', floor: 1, x: 300, y: 900, width: 350, height: 120, rotation: 0 },
        { id: 'ge_island', roomId: 'g_kitchen', type: 'desk', floor: 1, x: 1100, y: 900, width: 250, height: 100, rotation: 0 },
        { id: 'ge_dining', roomId: 'g_kitchen', type: 'dining_table', floor: 1, x: 1100, y: 1150, width: 220, height: 100, rotation: 0 },
        
        // FIRST FLOOR ELEMENTS
        { id: 'fe_stairs', roomId: 'f_landing', type: 'stairs_down', floor: 2, x: 750, y: 550, width: 400, height: 100, rotation: 0 },
        
        { id: 'fw_master', roomId: 'f_master', type: 'window', floor: 2, x: 100, y: 900, width: 15, height: 300, rotation: 90 },
        { id: 'fe_bed_m', roomId: 'f_master', type: 'bed_king', floor: 2, x: 300, y: 900, width: 200, height: 200, rotation: 0 },
        { id: 'fe_bath_tub', roomId: 'f_ensuite', type: 'bathtub', floor: 2, x: 150, y: 450, width: 80, height: 180, rotation: 0 },
        
        { id: 'fe_patio_set', roomId: 'f_terrace', type: 'dining_table', floor: 2, x: 1000, y: 1000, width: 180, height: 180, rotation: 0 }, // Outdoor set
        
        { id: 'fd_terrace', roomId: 'f_terrace', type: 'window', floor: 2, x: 700, y: 800, width: 15, height: 200, rotation: 90 } // Sliding door to terrace
    ]
};
