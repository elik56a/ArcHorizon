
import { SketchData } from '../types';

// --- MOCK 1: THE GLASS PAVILION (1-STORY) ---
export const MOCK_ONE_STORY: SketchData = {
    id: 'mock-1-pavilion',
    title: 'The Glass Pavilion',
    description: 'Modern L-shaped luxury villa centered around a large swimming pool and deck area.',
    totalAreaSqm: 210,
    floors: 1,
    rooms: [
        // EXTERIOR
        { id: 'r_garden_main', name: 'Landscape', type: 'garden', floor: 1, x: -400, y: -400, width: 2500, height: 2000, floorFinish: 'grass' },
        { id: 'r_pool_deck', name: 'Pool Deck', type: 'garden', floor: 1, x: 300, y: 300, width: 1200, height: 1000, floorFinish: 'paved' },
        { id: 'r_pool', name: 'Swimming Pool', type: 'pool', floor: 1, x: 500, y: 500, width: 800, height: 400, floorFinish: 'tiled' },
        { id: 'r_parking', name: 'Driveway', type: 'parking', floor: 1, x: 1600, y: 100, width: 500, height: 600, floorFinish: 'paved' },

        // INTERIOR - MAIN WING
        { id: 'r_living', name: 'Great Room', type: 'living', floor: 1, x: 100, y: 100, width: 600, height: 800, floorFinish: 'wood', color: '#ffffff' },
        { id: 'r_kitchen', name: 'Chef Kitchen', type: 'kitchen', floor: 1, x: 700, y: 100, width: 400, height: 500, floorFinish: 'tiled', color: '#f3f4f6' },
        { id: 'r_entry', name: 'Foyer', type: 'entry', floor: 1, x: 1100, y: 100, width: 300, height: 300, floorFinish: 'tiled' },

        // INTERIOR - SLEEPING WING
        { id: 'r_corridor', name: 'Gallery Hall', type: 'corridor', floor: 1, x: 1100, y: 400, width: 200, height: 600, floorFinish: 'wood' },
        { id: 'r_master', name: 'Master Suite', type: 'bedroom', floor: 1, x: 1300, y: 400, width: 500, height: 600, floorFinish: 'carpet', color: '#fafafa' },
        { id: 'r_ensuite', name: 'Master Bath', type: 'bathroom', floor: 1, x: 1800, y: 400, width: 250, height: 400, floorFinish: 'tiled' },
    ],
    connections: [],
    elements: [
        // DOORS
        { id: 'd_main', roomId: 'r_entry', type: 'entry_door', floor: 1, x: 1200, y: 100, width: 120, height: 15, rotation: 0 },
        { id: 'd_liv_kit', roomId: 'r_living', type: 'door', floor: 1, x: 700, y: 400, width: 150, height: 15, rotation: 90 }, // Open flow
        { id: 'd_mast', roomId: 'r_master', type: 'door', floor: 1, x: 1300, y: 500, width: 90, height: 15, rotation: 90 },

        // WINDOWS (Glass Walls facing Pool)
        { id: 'w_liv_pool', roomId: 'r_living', type: 'window', floor: 1, x: 700, y: 500, width: 15, height: 300, rotation: 90 },
        { id: 'w_kit_pool', roomId: 'r_kitchen', type: 'window', floor: 1, x: 900, y: 600, width: 150, height: 15, rotation: 0 },
        { id: 'w_mas_pool', roomId: 'r_master', type: 'window', floor: 1, x: 1500, y: 1000, width: 200, height: 15, rotation: 0 },

        // FURNITURE
        { id: 'e_sofa', roomId: 'r_living', type: 'sofa', floor: 1, x: 300, y: 400, width: 300, height: 100, rotation: 0 },
        { id: 'e_dining', roomId: 'r_living', type: 'dining_table', floor: 1, x: 300, y: 700, width: 220, height: 100, rotation: 0 },
        { id: 'e_island', roomId: 'r_kitchen', type: 'desk', floor: 1, x: 900, y: 300, width: 150, height: 80, rotation: 0 },
        { id: 'e_bed', roomId: 'r_master', type: 'bed_king', floor: 1, x: 1450, y: 500, width: 200, height: 200, rotation: 0 },
        { id: 'e_tub', roomId: 'r_ensuite', type: 'bathtub', floor: 1, x: 1900, y: 500, width: 80, height: 170, rotation: 0 },
        
        // OUTDOOR FURNITURE
        { id: 'e_lounge_1', roomId: 'r_pool_deck', type: 'sofa', floor: 1, x: 400, y: 500, width: 200, height: 80, rotation: 90 }, // Lounge chair
        { id: 'e_lounge_2', roomId: 'r_pool_deck', type: 'sofa', floor: 1, x: 400, y: 700, width: 200, height: 80, rotation: 90 }, // Lounge chair
    ]
};

// --- MOCK 2: HILLSIDE FAMILY ESTATE (2-STORY) ---
export const MOCK_TWO_STORY: SketchData = {
    id: 'mock-2-estate',
    title: 'Hillside Family Estate',
    description: 'Traditional 2-story family home with expansive garden views.',
    totalAreaSqm: 280,
    floors: 2,
    rooms: [
        // --- GROUND FLOOR ---
        { id: 'g_garden', name: 'Estate Garden', type: 'garden', floor: 1, x: -200, y: -200, width: 2000, height: 2000, floorFinish: 'grass' },
        { id: 'g_entry', name: 'Foyer', type: 'entry', floor: 1, x: 800, y: 800, width: 300, height: 300, floorFinish: 'tiled' },
        { id: 'g_garage', name: 'Garage', type: 'parking', floor: 1, x: 400, y: 800, width: 400, height: 600, floorFinish: 'paved' },
        { id: 'g_living', name: 'Living Room', type: 'living', floor: 1, x: 1100, y: 800, width: 600, height: 500, floorFinish: 'wood' },
        { id: 'g_kitchen', name: 'Kitchen', type: 'kitchen', floor: 1, x: 1100, y: 500, width: 400, height: 300, floorFinish: 'tiled' },
        { id: 'g_dining', name: 'Dining', type: 'dining', floor: 1, x: 1500, y: 500, width: 300, height: 300, floorFinish: 'wood' },
        { id: 'g_stairs', name: 'Stairwell', type: 'stairs', floor: 1, x: 800, y: 500, width: 300, height: 300, floorFinish: 'wood' },

        // --- FIRST FLOOR ---
        { id: 'f_landing', name: 'Landing', type: 'corridor', floor: 2, x: 800, y: 500, width: 300, height: 300, floorFinish: 'wood' },
        { id: 'f_master', name: 'Master Bed', type: 'bedroom', floor: 2, x: 1100, y: 800, width: 500, height: 500, floorFinish: 'carpet' },
        { id: 'f_ensuite', name: 'Ensuite', type: 'bathroom', floor: 2, x: 1600, y: 800, width: 200, height: 400, floorFinish: 'tiled' },
        { id: 'f_bed2', name: 'Kids Room', type: 'bedroom', floor: 2, x: 1100, y: 500, width: 400, height: 300, floorFinish: 'wood' },
        { id: 'f_balcony', name: 'Grand Balcony', type: 'balcony', floor: 2, x: 1100, y: 1300, width: 600, height: 200, floorFinish: 'tiled', color: '#e5e7eb' },
    ],
    connections: [],
    elements: [
        // GROUND
        { id: 'g_door_main', roomId: 'g_entry', type: 'entry_door', floor: 1, x: 950, y: 1100, width: 120, height: 15, rotation: 0 },
        { id: 'g_win_liv', roomId: 'g_living', type: 'window', floor: 1, x: 1700, y: 900, width: 15, height: 300, rotation: 90 },
        { id: 'g_sofa', roomId: 'g_living', type: 'sofa', floor: 1, x: 1200, y: 900, width: 300, height: 100, rotation: 0 },
        { id: 'g_stairs_up', roomId: 'g_stairs', type: 'stairs_up', floor: 1, x: 850, y: 550, width: 200, height: 200, rotation: 0 },

        // FIRST
        { id: 'f_stairs_down', roomId: 'f_landing', type: 'stairs_down', floor: 2, x: 850, y: 550, width: 200, height: 200, rotation: 0 },
        { id: 'f_bed_m', roomId: 'f_master', type: 'bed_king', floor: 2, x: 1200, y: 900, width: 200, height: 200, rotation: 0 },
        { id: 'f_win_mas', roomId: 'f_master', type: 'window', floor: 2, x: 1300, y: 1300, width: 200, height: 15, rotation: 0 }, // View to balcony
    ]
};

// --- MOCK 3: URBAN VERTICAL GARDEN (3-STORY) ---
export const MOCK_THREE_STORY: SketchData = {
    id: 'mock-3-urban',
    title: 'Urban Vertical Garden',
    description: 'Luxury 3-story townhouse optimized for vertical living with ground floor pool oasis.',
    totalAreaSqm: 450,
    floors: 3,
    rooms: [
        // FLOOR 1 (Ground) - OASIS
        { id: 'f1_drive', name: 'Parking', type: 'parking', floor: 1, x: 600, y: 1000, width: 600, height: 600, floorFinish: 'paved' },
        { id: 'f1_garden', name: 'Oasis Garden', type: 'garden', floor: 1, x: 1000, y: 800, width: 800, height: 800, floorFinish: 'grass' },
        { id: 'f1_pool', name: 'Plunge Pool', type: 'pool', floor: 1, x: 1200, y: 1000, width: 400, height: 300, floorFinish: 'tiled' },

        { id: 'f1_entry', name: 'Lobby', type: 'entry', floor: 1, x: 600, y: 600, width: 400, height: 400, floorFinish: 'tiled' },
        { id: 'f1_gym', name: 'Home Gym', type: 'bedroom', floor: 1, x: 1000, y: 600, width: 400, height: 400, floorFinish: 'wood' },
        { id: 'f1_stairs', name: 'Core', type: 'stairs', floor: 1, x: 600, y: 400, width: 400, height: 200, floorFinish: 'concrete' },

        // FLOOR 2 (Living)
        { id: 'f2_stairs', name: 'Core', type: 'stairs', floor: 2, x: 600, y: 400, width: 400, height: 200, floorFinish: 'concrete' },
        { id: 'f2_living', name: 'Main Living', type: 'living', floor: 2, x: 600, y: 600, width: 800, height: 600, floorFinish: 'wood' },
        { id: 'f2_kitchen', name: 'Galley Kitchen', type: 'kitchen', floor: 2, x: 1000, y: 400, width: 400, height: 200, floorFinish: 'tiled' },
        { id: 'f2_balcony', name: 'Terrace', type: 'balcony', floor: 2, x: 600, y: 1200, width: 800, height: 200, floorFinish: 'tiled' },

        // FLOOR 3 (Private)
        { id: 'f3_stairs', name: 'Core', type: 'stairs', floor: 3, x: 600, y: 400, width: 400, height: 200, floorFinish: 'concrete' },
        { id: 'f3_master', name: 'Master Bed', type: 'bedroom', floor: 3, x: 600, y: 600, width: 500, height: 500, floorFinish: 'carpet' },
        { id: 'f3_bath', name: 'Master Bath', type: 'bathroom', floor: 3, x: 1100, y: 600, width: 300, height: 500, floorFinish: 'tiled' },
        { id: 'f3_roof', name: 'Roof Garden', type: 'garden', floor: 3, x: 600, y: 1100, width: 800, height: 400, floorFinish: 'grass' },
    ],
    connections: [],
    elements: [
        // F1
        { id: 'f1_door', roomId: 'f1_entry', type: 'entry_door', floor: 1, x: 800, y: 1000, width: 120, height: 15, rotation: 0 },
        { id: 'f1_st_up', roomId: 'f1_stairs', type: 'stairs_up', floor: 1, x: 700, y: 450, width: 200, height: 100, rotation: 0 },
        { id: 'f1_gym_door', roomId: 'f1_gym', type: 'door', floor: 1, x: 1200, y: 1000, width: 90, height: 15, rotation: 0 }, // Door to pool
        
        // F2
        { id: 'f2_st_up', roomId: 'f2_stairs', type: 'stairs_up', floor: 2, x: 700, y: 450, width: 200, height: 100, rotation: 0 },
        { id: 'f2_sofa', roomId: 'f2_living', type: 'sofa', floor: 2, x: 800, y: 800, width: 300, height: 100, rotation: 0 },
        { id: 'f2_win', roomId: 'f2_living', type: 'window', floor: 2, x: 600, y: 800, width: 15, height: 300, rotation: 90 },
        
        // F3
        { id: 'f3_bed', roomId: 'f3_master', type: 'bed_king', floor: 3, x: 700, y: 700, width: 200, height: 200, rotation: 0 },
        { id: 'f3_tub', roomId: 'f3_bath', type: 'bathtub', floor: 3, x: 1200, y: 700, width: 80, height: 170, rotation: 0 },
    ]
};
