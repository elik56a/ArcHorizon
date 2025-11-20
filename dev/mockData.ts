
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

// --- MOCK 3: STUNNING MODERN VILLA (3-STORY) ---
export const MOCK_THREE_STORY: SketchData = {
    id: 'mock-3-villa',
    title: 'The Azure Horizon Villa',
    description: 'A masterpiece of modern architecture featuring cantilevered floors, extensive glass facades, and a seamless indoor-outdoor flow.',
    totalAreaSqm: 680,
    floors: 3,
    rooms: [
        // --- FLOOR 1: SOCIAL & LANDSCAPE ---
        { id: 'f1_landscape', name: 'Estate Grounds', type: 'garden', floor: 1, x: -500, y: -500, width: 3500, height: 3000, floorFinish: 'grass' },
        { id: 'f1_pool', name: 'Infinity Pool', type: 'pool', floor: 1, x: 1400, y: 800, width: 1000, height: 600, floorFinish: 'tiled' },
        { id: 'f1_deck', name: 'Sun Deck', type: 'garden', floor: 1, x: 1400, y: 400, width: 1000, height: 400, floorFinish: 'paved' },
        { id: 'f1_parking', name: 'Luxury Garage', type: 'parking', floor: 1, x: 200, y: 200, width: 700, height: 800, floorFinish: 'paved' },
        
        { id: 'f1_foyer', name: 'Grand Foyer', type: 'entry', floor: 1, x: 900, y: 200, width: 500, height: 400, floorFinish: 'marble', color: '#fdfdfd' },
        { id: 'f1_living', name: 'Formal Living', type: 'living', floor: 1, x: 900, y: 600, width: 800, height: 700, floorFinish: 'wood', color: '#fff' },
        { id: 'f1_dining', name: 'Banquet Hall', type: 'dining', floor: 1, x: 1700, y: 600, width: 600, height: 500, floorFinish: 'marble', color: '#fafafa' },
        { id: 'f1_kitchen', name: 'Chef Kitchen', type: 'kitchen', floor: 1, x: 1700, y: 200, width: 600, height: 400, floorFinish: 'tiled', color: '#f5f5f5' },
        { id: 'f1_cinema', name: 'Home Cinema', type: 'living', floor: 1, x: 200, y: 1000, width: 700, height: 600, floorFinish: 'carpet', color: '#1a1a1a' },

        // --- FLOOR 2: FAMILY & SUITES ---
        { id: 'f2_corridor', name: 'Gallery Bridge', type: 'corridor', floor: 2, x: 900, y: 200, width: 1400, height: 300, floorFinish: 'wood' },
        { id: 'f2_bed1', name: 'Guest Suite', type: 'bedroom', floor: 2, x: 900, y: 500, width: 500, height: 600, floorFinish: 'wood' },
        { id: 'f2_bed2', name: 'Kids Suite', type: 'bedroom', floor: 2, x: 1400, y: 500, width: 500, height: 600, floorFinish: 'wood' },
        { id: 'f2_bath', name: 'Family Bath', type: 'bathroom', floor: 2, x: 1900, y: 500, width: 400, height: 400, floorFinish: 'tiled' },
        { id: 'f2_gym', name: 'Fitness Studio', type: 'bedroom', floor: 2, x: 200, y: 500, width: 700, height: 500, floorFinish: 'wood' },
        { id: 'f2_terrace', name: 'Lounge Terrace', type: 'balcony', floor: 2, x: 900, y: 1100, width: 1400, height: 300, floorFinish: 'tiled' },

        // --- FLOOR 3: MASTER RETREAT ---
        { id: 'f3_master', name: 'Master Bedroom', type: 'bedroom', floor: 3, x: 1200, y: 400, width: 800, height: 600, floorFinish: 'carpet', color: '#f9fafb' },
        { id: 'f3_walkin', name: 'Walk-in Closet', type: 'storage', floor: 3, x: 2000, y: 400, width: 400, height: 600, floorFinish: 'wood' },
        { id: 'f3_ensuite', name: 'Spa Bath', type: 'bathroom', floor: 3, x: 800, y: 400, width: 400, height: 600, floorFinish: 'marble' },
        { id: 'f3_roof', name: 'Roof Terrace', type: 'balcony', floor: 3, x: 800, y: 1000, width: 1600, height: 600, floorFinish: 'tiled' },
    ],
    connections: [],
    elements: [
        // --- FLOOR 1 ELEMENTS ---
        // Grand Entrance
        { id: 'f1_door_main', roomId: 'f1_foyer', type: 'entry_door', floor: 1, x: 1100, y: 200, width: 180, height: 15, rotation: 0 },
        // Living Area
        { id: 'f1_sofa_l', roomId: 'f1_living', type: 'sofa_l_shape', floor: 1, x: 1000, y: 800, width: 400, height: 200, rotation: 180 },
        { id: 'f1_coffee', roomId: 'f1_living', type: 'coffee_table', floor: 1, x: 1150, y: 900, width: 150, height: 80, rotation: 0 },
        { id: 'f1_tv_wall', roomId: 'f1_living', type: 'tv_unit', floor: 1, x: 1000, y: 1280, width: 400, height: 50, rotation: 0 },
        // Glass Walls (Windows)
        { id: 'f1_win_pool', roomId: 'f1_living', type: 'window', floor: 1, x: 1700, y: 800, width: 15, height: 400, rotation: 90 },
        { id: 'f1_win_deck', roomId: 'f1_dining', type: 'window', floor: 1, x: 2000, y: 1100, width: 300, height: 15, rotation: 0 },
        // Kitchen
        { id: 'f1_island', roomId: 'f1_kitchen', type: 'kitchen_island', floor: 1, x: 1900, y: 350, width: 300, height: 120, rotation: 0 },
        { id: 'f1_stove', roomId: 'f1_kitchen', type: 'stove', floor: 1, x: 2100, y: 200, width: 80, height: 60, rotation: 180 },
        { id: 'f1_dining_tab', roomId: 'f1_dining', type: 'dining_table', floor: 1, x: 1900, y: 800, width: 300, height: 120, rotation: 90 },
        
        // Stairs F1
        { id: 'f1_st', roomId: 'f1_foyer', type: 'stairs_up', floor: 1, x: 950, y: 400, width: 150, height: 300, rotation: 270 },

        // --- FLOOR 2 ELEMENTS ---
        // Stairs F2
        { id: 'f2_st', roomId: 'f2_corridor', type: 'stairs_up', floor: 2, x: 950, y: 400, width: 150, height: 300, rotation: 270 },
        // Guest Suite
        { id: 'f2_bed1', roomId: 'f2_bed1', type: 'bed_queen', floor: 2, x: 1100, y: 600, width: 160, height: 200, rotation: 0 },
        { id: 'f2_win_bed1', roomId: 'f2_bed1', type: 'window', floor: 2, x: 1100, y: 1100, width: 200, height: 15, rotation: 0 },
        // Kids Suite
        { id: 'f2_bed2', roomId: 'f2_bed2', type: 'bed_single', floor: 2, x: 1500, y: 600, width: 100, height: 200, rotation: 0 },
        { id: 'f2_bed3', roomId: 'f2_bed2', type: 'bed_single', floor: 2, x: 1700, y: 600, width: 100, height: 200, rotation: 0 },
        // Bathroom
        { id: 'f2_tub', roomId: 'f2_bath', type: 'bathtub', floor: 2, x: 2100, y: 600, width: 80, height: 180, rotation: 0 },
        { id: 'f2_sink', roomId: 'f2_bath', type: 'sink_double', floor: 2, x: 2000, y: 500, width: 150, height: 60, rotation: 180 },

        // --- FLOOR 3 ELEMENTS ---
        // Stairs F3
        { id: 'f3_st', roomId: 'f3_ensuite', type: 'stairs_down', floor: 3, x: 950, y: 400, width: 150, height: 300, rotation: 270 },
        // Master Bed
        { id: 'f3_bed_m', roomId: 'f3_master', type: 'bed_king', floor: 3, x: 1500, y: 500, width: 220, height: 220, rotation: 0 },
        { id: 'f3_sofa_m', roomId: 'f3_master', type: 'sofa', floor: 3, x: 1500, y: 900, width: 200, height: 80, rotation: 180 },
        // Master Windows (Panoramic)
        { id: 'f3_win_m1', roomId: 'f3_master', type: 'window', floor: 3, x: 1200, y: 1000, width: 800, height: 15, rotation: 0 },
        // Master Bath
        { id: 'f3_tub_m', roomId: 'f3_ensuite', type: 'bathtub', floor: 3, x: 850, y: 800, width: 100, height: 180, rotation: 0 },
        
        // Roof Deck
        { id: 'f3_lounge', roomId: 'f3_roof', type: 'sofa_l_shape', floor: 3, x: 1800, y: 1200, width: 300, height: 300, rotation: 0 },
    ]
};
