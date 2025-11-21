
import { SketchData, Room, ArchitecturalElement, RoomType } from '../types';

// Constants
const MIN_ROOM_DIMENSION = 60; // cm
const WALL_GAP = 15; // cm - Minimum fixed gap between furniture and walls
const WALL_THICKNESS_EXT = 25; // cm
const WALL_THICKNESS_INT = 20; // cm
const FRAME_THICKNESS = 1.5; // cm - Wall reveal/frame thickness

/**
 * MAIN OPTIMIZATION PIPELINE
 * Acts as the "Senior Architect" reviewer to enforce physics, scale, and connectivity.
 */
export const optimizeDesign = (data: SketchData): SketchData => {
    // Deep copy to avoid mutating original immediately
    let newData = JSON.parse(JSON.stringify(data)) as SketchData;
    
    // 1. Scale Sanitization (The "Scale Doctor")
    newData = sanitizeScale(newData);

    // 2. Artifact Pruning
    newData = pruneArtifacts(newData);

    // 2.5 Fix "Entry Room" issue (Merge tiny entries)
    newData = mergeTinyEntryRooms(newData);

    // 3. Building Bounds Analysis
    const floorBounds = getFloorBounds(newData.rooms);

    // 4. Connectivity (Force Doors or Openings)
    ensureConnectivity(newData);

    // 5. Natural Light (Force Windows on exterior walls)
    ensureNaturalLight(newData);

    // 6. Furniture Logic (Smart Snap & Resize)
    optimizeFurniturePlacement(newData);

    return newData;
};

// --- 1. SCALE SANITIZATION ---
const sanitizeScale = (data: SketchData): SketchData => {
    if (data.rooms.length === 0) return data;

    const totalDim = data.rooms.reduce((sum, r) => sum + r.width + r.height, 0);
    const avgDim = totalDim / (data.rooms.length * 2);

    // Case 1: Meters (Small numbers, e.g. 5.0)
    if (avgDim < 50) {
        const SCALE = 100;
        data.rooms.forEach(r => { r.x *= SCALE; r.y *= SCALE; r.width *= SCALE; r.height *= SCALE; });
        data.elements.forEach(e => { e.x *= SCALE; e.y *= SCALE; e.width *= SCALE; e.height *= SCALE; });
    }
    // Case 2: Millimeters (Huge numbers, e.g. 5000) -> Reduce to CM
    else if (avgDim > 2000) {
        const SCALE = 0.1;
        data.rooms.forEach(r => { r.x *= SCALE; r.y *= SCALE; r.width *= SCALE; r.height *= SCALE; });
        data.elements.forEach(e => { e.x *= SCALE; e.y *= SCALE; e.width *= SCALE; e.height *= SCALE; });
    }

    // Normalize Coordinates (Start near 0,0)
    const minX = Math.min(...data.rooms.map(r => r.x));
    const minY = Math.min(...data.rooms.map(r => r.y));
    
    if (minX > 500 || minY > 500) {
         const offsetX = minX - 100;
         const offsetY = minY - 100;
         data.rooms.forEach(r => { r.x -= offsetX; r.y -= offsetY; });
         data.elements.forEach(e => { e.x -= offsetX; e.y -= offsetY; });
    }

    return data;
};

// --- 2. ARTIFACT PRUNING ---
const pruneArtifacts = (data: SketchData): SketchData => {
    const initialCount = data.rooms.length;
    data.rooms = data.rooms.filter(r => r.width >= MIN_ROOM_DIMENSION && r.height >= MIN_ROOM_DIMENSION);
    
    if (data.rooms.length < initialCount) {
        const roomIds = new Set(data.rooms.map(r => r.id));
        data.elements = data.elements.filter(e => roomIds.has(e.roomId));
    }
    return data;
};

// --- 2.5 ENTRY ROOM MERGE ---
const mergeTinyEntryRooms = (data: SketchData): SketchData => {
    const tinyEntries = data.rooms.filter(r => r.type === 'entry' && (r.width * r.height) < 50000); // < 5sqm
    
    tinyEntries.forEach(entry => {
        const neighbors = data.rooms.filter(r => r.id !== entry.id && isAdjacent(entry, r));
        if (neighbors.length > 0) {
            data.elements.forEach(el => {
                if (el.roomId === entry.id && el.type === 'entry_door') {
                     el.roomId = neighbors[0].id;
                     el.x = neighbors[0].x + neighbors[0].width/2 - el.width/2;
                     el.y = neighbors[0].y + neighbors[0].height - 10;
                }
            });
            data.rooms = data.rooms.filter(r => r.id !== entry.id);
        }
    });
    return data;
};

// --- 3. BOUNDS ANALYSIS ---
const getFloorBounds = (rooms: Room[]) => {
    const floors = new Set(rooms.map(r => r.floor));
    const bounds: Record<number, { minX: number, maxX: number, minY: number, maxY: number }> = {};

    floors.forEach(f => {
        const floorRooms = rooms.filter(r => r.floor === f);
        if (floorRooms.length === 0) return;
        bounds[f] = {
            minX: Math.min(...floorRooms.map(r => r.x)),
            maxX: Math.max(...floorRooms.map(r => r.x + r.width)),
            minY: Math.min(...floorRooms.map(r => r.y)),
            maxY: Math.max(...floorRooms.map(r => r.y + r.height))
        };
    });
    return bounds;
};

// --- 4. CONNECTIVITY ---
const ensureConnectivity = (data: SketchData) => {
    const SOCIAL_TYPES = ['living', 'kitchen', 'dining', 'entry', 'corridor'];

    data.rooms.forEach(room => {
        if (['garden', 'parking', 'pool', 'terrace', 'balcony'].includes(room.type)) return;
        
        // Check if any door/opening already exists
        const hasConnection = data.elements.some(el => el.roomId === room.id && (el.type.includes('door') || el.type === 'wall_opening'));
        if (hasConnection) return;

        const neighbors = data.rooms.filter(n => 
            n.id !== room.id && 
            n.floor === room.floor &&
            isAdjacent(room, n)
        );

        const bestNeighbor = neighbors.sort((a, b) => getConnectivityScore(b.type) - getConnectivityScore(a.type))[0];

        if (bestNeighbor) {
            // OPEN PLAN LOGIC: If both rooms are "Social", use an open archway instead of a door
            if (SOCIAL_TYPES.includes(room.type) && SOCIAL_TYPES.includes(bestNeighbor.type)) {
                addOpenConnection(data, room, bestNeighbor);
            } else {
                addDoorBetween(data, room, bestNeighbor);
            }
        } else {
            addDefaultDoor(data, room);
        }
    });
};

const getConnectivityScore = (type: RoomType) => {
    switch(type) {
        case 'corridor': return 10;
        case 'entry': return 9;
        case 'living': return 8;
        case 'dining': return 5;
        case 'kitchen': return 4;
        default: return 1;
    }
};

// --- 5. NATURAL LIGHT ---
const ensureNaturalLight = (data: SketchData) => {
    data.rooms.forEach(room => {
        // Skip non-habitable or outdoor spaces
        if (['corridor', 'storage', 'utility', 'garden', 'parking', 'pool', 'entry'].includes(room.type)) return;
        
        const walls = ['north', 'south', 'west', 'east'];
        
        // Check each wall independently
        for (const wall of walls) {
            // 1. Check if wall is exterior
            if (isExteriorWall(room, wall, data.rooms)) {
                // 2. Check if window already exists on THIS wall
                const hasWindowOnWall = data.elements.some(el => 
                    el.roomId === room.id && 
                    el.type === 'window' && 
                    isElementOnWall(el, room, wall)
                );

                // 3. If not, add window
                if (!hasWindowOnWall) {
                    addWindow(data, room, wall, WALL_THICKNESS_EXT); // 25cm for exterior
                }
            }
        }
    });
};

const isElementOnWall = (el: ArchitecturalElement, room: Room, wall: string) => {
    const TOL = 20;
    if (wall === 'north') return Math.abs(el.y - room.y) < TOL;
    if (wall === 'south') return Math.abs(el.y - (room.y + room.height)) < TOL || Math.abs((el.y + el.height) - (room.y + room.height)) < TOL;
    if (wall === 'west') return Math.abs(el.x - room.x) < TOL;
    if (wall === 'east') return Math.abs(el.x - (room.x + room.width)) < TOL || Math.abs((el.x + el.width) - (room.x + room.width)) < TOL;
    return false;
};

// Check if a wall is truly exterior (doesn't touch any other room)
export const isExteriorWall = (room: Room, wall: string, allRooms: Room[]): boolean => {
    const TOL = 5; // Tolerance
    const { x, y, width, height } = room;
    
    // Define the line segment for the wall
    let p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 };
    
    if (wall === 'north') { p1 = {x, y}; p2 = {x: x+width, y}; }
    else if (wall === 'south') { p1 = {x, y: y+height}; p2 = {x: x+width, y: y+height}; }
    else if (wall === 'west') { p1 = {x, y}; p2 = {x, y: y+height}; }
    else if (wall === 'east') { p1 = {x: x+width, y}; p2 = {x: x+width, y: y+height}; }
    
    // Check against all other rooms
    for (const other of allRooms) {
        if (other.id === room.id || other.floor !== room.floor) continue;
        
        // Overlap check
        const touches = !(
            other.x > Math.max(p1.x, p2.x) - TOL || 
            other.x + other.width < Math.min(p1.x, p2.x) + TOL || 
            other.y > Math.max(p1.y, p2.y) - TOL || 
            other.y + other.height < Math.min(p1.y, p2.y) + TOL
        );

        if (touches) return false; // It's blocked by another room
    }
    return true;
};

// --- 6. FURNITURE PLACEMENT & TEXT POSITIONING ---
const optimizeFurniturePlacement = (data: SketchData) => {
    // Track occupied spaces
    const roomOccupancy: Record<string, {x: number, y: number, w: number, h: number}[]> = {};

    data.rooms.forEach(room => {
        if (!roomOccupancy[room.id]) roomOccupancy[room.id] = [];
    });

    // Reserve zones for doors first
    reserveDoorSwingZones(data, roomOccupancy);

    const validElements: ArchitecturalElement[] = [];

    // 1. Place Elements
    data.elements.forEach(el => {
        // Skip holes (windows/doors/openings)
        if (el.type.includes('door') || el.type === 'window' || el.type === 'wall_opening') {
             validElements.push(el);
             return; 
        }

        const room = data.rooms.find(r => r.id === el.roomId);
        if (!room) return; 

        const roomMinDim = Math.min(room.width, room.height);
        const elMaxDim = Math.max(el.width, el.height);
        
        // Shrink if huge
        if (elMaxDim > roomMinDim * 0.6) {
            const scaleFactor = (roomMinDim * 0.6) / elMaxDim;
            el.width = Math.floor(el.width * scaleFactor);
            el.height = Math.floor(el.height * scaleFactor);
        }
        
        if (el.width < 20 || el.height < 20) return;

        // Attempt placement
        const placed = snapToWallSmart(el, room, roomOccupancy[room.id]);
        
        if (placed && isContained(el, room)) {
            roomOccupancy[room.id].push({ x: el.x - 5, y: el.y - 5, w: el.width + 10, h: el.height + 10 });
            validElements.push(el);
        } else {
            // Last ditch shrink for specific items
            if (['toilet', 'bed_king', 'bed_single', 'sofa'].includes(el.type)) {
                 el.width *= 0.8;
                 el.height *= 0.8;
                 const retry = snapToWallSmart(el, room, roomOccupancy[room.id]);
                 if (retry && isContained(el, room)) {
                     roomOccupancy[room.id].push({ x: el.x - 5, y: el.y - 5, w: el.width + 10, h: el.height + 10 });
                     validElements.push(el);
                 }
            }
        }
    });

    data.elements = validElements;

    // 2. Optimize Text Placement
    data.rooms.forEach(room => {
        optimizeRoomLabelPlacement(room, roomOccupancy[room.id] || []);
    });
};

const isContained = (el: ArchitecturalElement, room: Room): boolean => {
    // Accounts for rotation swapping width/height
    const isRotated = Math.abs(el.rotation) === 90 || Math.abs(el.rotation) === 270;
    const w = isRotated ? el.height : el.width;
    const h = isRotated ? el.width : el.height;
    
    // Center coordinates
    const cx = el.x + el.width/2;
    const cy = el.y + el.height/2;
    
    const left = cx - w/2;
    const right = cx + w/2;
    const top = cy - h/2;
    const bottom = cy + h/2;

    return (
        left >= room.x && 
        right <= room.x + room.width && 
        top >= room.y && 
        bottom <= room.y + room.height
    );
};

const reserveDoorSwingZones = (data: SketchData, occupancy: Record<string, any[]>) => {
    data.elements.filter(e => e.type.includes('door')).forEach(door => {
        // Reserve area around the door (1.2m x 1.2m approx safety zone)
        const PADDING = 120;
        const cx = door.x + door.width/2;
        const cy = door.y + door.height/2;
        
        if (occupancy[door.roomId]) {
             occupancy[door.roomId].push({
                 x: cx - PADDING/2,
                 y: cy - PADDING/2,
                 w: PADDING,
                 h: PADDING
             });
        }
    });
};

const checkOverlap = (r1: {x:number, y:number, w:number, h:number}, r2: {x:number, y:number, w:number, h:number}) => {
    return !(r1.x + r1.w <= r2.x || r1.x >= r2.x + r2.w || r1.y + r1.h <= r2.y || r1.y >= r2.y + r2.h);
}

const optimizeRoomLabelPlacement = (room: Room, obstacles: {x:number, y:number, w:number, h:number}[]) => {
    const cx = room.x + room.width / 2;
    const cy = room.y + room.height / 2;
    const lblW = 100;
    const lblH = 40;
    const centerBox = { x: cx - lblW/2, y: cy - lblH/2, w: lblW, h: lblH };

    // Avoid corners (where wall labels go)
    const wallLabelBuffers = [
        { x: room.x, y: room.y, w: 50, h: 50 }, // Top Left
        { x: room.x + room.width - 50, y: room.y, w: 50, h: 50 }, // Top Right
        { x: room.x, y: room.y + room.height - 50, w: 50, h: 50 }, // Bottom Left
        { x: room.x + room.width - 50, y: room.y + room.height - 50, w: 50, h: 50 }, // Bottom Right
    ];

    const centerBlocked = obstacles.some(obs => checkOverlap(centerBox, obs));

    if (!centerBlocked) {
        delete room.labelX;
        delete room.labelY;
        return;
    }

    const quadrants = [
        { x: room.x + room.width * 0.5, y: room.y + room.height * 0.25 },
        { x: room.x + room.width * 0.5, y: room.y + room.height * 0.75 },
        { x: room.x + room.width * 0.25, y: room.y + room.height * 0.5 },
        { x: room.x + room.width * 0.75, y: room.y + room.height * 0.5 },
        { x: room.x + room.width * 0.25, y: room.y + room.height * 0.25 },
    ];

    for (const q of quadrants) {
         const qBox = { x: q.x - lblW/2, y: q.y - lblH/2, w: lblW, h: lblH };
         const blocked = obstacles.some(obs => checkOverlap(qBox, obs));
         const cornerBlocked = wallLabelBuffers.some(buff => checkOverlap(qBox, buff));
         const inside = qBox.x >= room.x && (qBox.x + qBox.w) <= (room.x + room.width) &&
                        qBox.y >= room.y && (qBox.y + qBox.h) <= (room.y + room.height);

         if (!blocked && !cornerBlocked && inside) {
             room.labelX = q.x;
             room.labelY = q.y;
             return;
         }
    }
    delete room.labelX;
    delete room.labelY;
};

const snapToWallSmart = (el: ArchitecturalElement, room: Room, occupied: {x:number, y:number, w:number, h:number}[]): boolean => {
    const G = WALL_GAP; 
    const positions = [];
    
    // Generate possible positions (North, East, South, West)
    positions.push({ x: room.x + room.width/2 - el.width/2, y: room.y + G, rot: 0 }); // North
    positions.push({ x: room.x + room.width - el.width - G, y: room.y + room.height/2 - el.height/2, rot: 90 }); // East
    positions.push({ x: room.x + G, y: room.y + room.height/2 - el.height/2, rot: 270 }); // West
    positions.push({ x: room.x + room.width/2 - el.width/2, y: room.y + room.height - el.height - G, rot: 180 }); // South

    // Special logic for Beds (Headboard against wall)
    if (el.type.includes('bed')) {
         positions[0].rot = 180; // Head North
         positions[1].rot = 270; // Head East
         positions[2].rot = 90;  // Head West
         positions[3].rot = 0;   // Head South
    }

    // Center objects first
    if (['dining_table', 'coffee_table', 'kitchen_island'].includes(el.type)) {
        positions.unshift({ x: room.x + room.width/2 - el.width/2, y: room.y + room.height/2 - el.height/2, rot: 0 });
    }

    for (const pos of positions) {
        // 1. CONTAINMENT CHECK
        // Determine actual bounding box based on rotation
        const isRotated = Math.abs(pos.rot) === 90 || Math.abs(pos.rot) === 270;
        const actualW = isRotated ? el.height : el.width;
        const actualH = isRotated ? el.width : el.height;

        // Center point adjustment for rotation around center
        const cx = pos.x + el.width/2;
        const cy = pos.y + el.height/2;
        const minX = cx - actualW/2;
        const maxX = cx + actualW/2;
        const minY = cy - actualH/2;
        const maxY = cy + actualH/2;

        // STRICT BOUNDS CHECK
        if (minX < room.x || maxX > room.x + room.width || minY < room.y || maxY > room.y + room.height) {
            continue; // Out of bounds
        }

        // 2. COLLISION CHECK
        const collision = occupied.some(occ => checkOverlap({x: minX, y: minY, w: actualW, h: actualH}, occ));
        if (!collision) {
            el.x = pos.x;
            el.y = pos.y;
            el.rotation = pos.rot;
            return true; 
        }
    }
    return false;
};

// --- UTILS ---
const isAdjacent = (r1: Room, r2: Room) => {
    const tol = 5;
    const r1R = r1.x + r1.width, r1B = r1.y + r1.height;
    const r2R = r2.x + r2.width, r2B = r2.y + r2.height;
    return ((Math.abs(r1R - r2.x) < tol || Math.abs(r1.x - r2R) < tol) && !(r1B <= r2.y || r1.y >= r2B)) ||
           ((Math.abs(r1B - r2.y) < tol || Math.abs(r1.y - r2B) < tol) && !(r1R <= r2.x || r1.x >= r2R));
};

const addDoorBetween = (data: SketchData, r1: Room, r2: Room) => {
    const doorW = 80;
    let x = 0, y = 0, rot = 0;
    const h = WALL_THICKNESS_INT; // Internal door

    if (Math.abs((r1.x + r1.width) - r2.x) < 10) { 
        x = r2.x - h/2; y = Math.max(r1.y, r2.y) + 20; rot = 90;
    } else if (Math.abs(r1.x - (r2.x + r2.width)) < 10) {
        x = r1.x - h/2; y = Math.max(r1.y, r2.y) + 20; rot = 90;
    } else if (Math.abs((r1.y + r1.height) - r2.y) < 10) {
        y = r2.y - h/2; x = Math.max(r1.x, r2.x) + 20; rot = 0;
    } else {
        y = r1.y - h/2; x = Math.max(r1.x, r2.x) + 20; rot = 0;
    }

    const exists = data.elements.some(e => e.type.includes('door') && Math.abs(e.x - x) < 50 && Math.abs(e.y - y) < 50);
    if (!exists) {
        data.elements.push({
            id: `auto-door-${Date.now()}-${Math.random()}`,
            roomId: r1.id, type: 'door', floor: r1.floor,
            x, y, width: doorW, height: h, rotation: rot
        });
    }
};

// NEW: OPEN PLAN CONNECTION (Wall Opening instead of Door)
const addOpenConnection = (data: SketchData, r1: Room, r2: Room) => {
    const h = WALL_THICKNESS_INT;
    let x = 0, y = 0, rot = 0;
    let openingW = 200; // Default large opening

    // Calculate overlap to center the opening and size it appropriately
    let overlapStart = 0;
    let overlapEnd = 0;

    if (Math.abs((r1.x + r1.width) - r2.x) < 10 || Math.abs(r1.x - (r2.x + r2.width)) < 10) {
        // Vertical Wall Connection
        overlapStart = Math.max(r1.y, r2.y);
        overlapEnd = Math.min(r1.y + r1.height, r2.y + r2.height);
        const overlapLen = overlapEnd - overlapStart;
        if (overlapLen < 100) return; // Too small for opening
        
        openingW = Math.min(overlapLen - 40, 400); // Leave 20cm shoulders, max 4m
        y = overlapStart + (overlapLen - openingW) / 2; // Center
        rot = 90; 
        
        // Standardized: Vertical Opening on West/East wall.
        const cx = (Math.abs((r1.x + r1.width) - r2.x) < 10) ? r2.x : r1.x;
        x = cx - h/2; // Center on wall line (thickness h)
        
    } else {
        // Horizontal Wall Connection
        overlapStart = Math.max(r1.x, r2.x);
        overlapEnd = Math.min(r1.x + r1.width, r2.x + r2.width);
        const overlapLen = overlapEnd - overlapStart;
        if (overlapLen < 100) return;
        
        openingW = Math.min(overlapLen - 40, 400);
        x = overlapStart + (overlapLen - openingW) / 2;
        rot = 0;
        
        if (Math.abs((r1.y + r1.height) - r2.y) < 10) {
            y = r2.y - h/2;
        } else {
            y = r1.y - h/2;
        }
    }

    data.elements.push({
        id: `auto-open-${Date.now()}-${Math.random()}`,
        roomId: r1.id, type: 'wall_opening', floor: r1.floor,
        x, y, width: openingW, height: h, rotation: rot
    });
};

const addDefaultDoor = (data: SketchData, room: Room) => {
    const doorW = 80;
    const h = WALL_THICKNESS_INT;
    data.elements.push({
        id: `auto-door-def-${room.id}`,
        roomId: room.id, type: 'door', floor: room.floor,
        x: room.x + room.width/2 - doorW/2,
        y: room.y + room.height - h,
        width: doorW, height: h, rotation: 0
    });
};

// STRICT WINDOW ADDITION
const addWindow = (data: SketchData, room: Room, wall: string, wallThickness = WALL_THICKNESS_EXT) => {
    const winLength = Math.min(120, room.width - 40);
    
    // Center calculation
    const cx = room.x + room.width/2;
    const cy = room.y + room.height/2;

    // Dimensions: Width is ALWAYS the Length along the wall. Height is ALWAYS thickness.
    const w = winLength; 
    
    // DYNAMIC WINDOW THICKNESS: Wall Thickness minus 2x Frame Thickness (1.5cm each side)
    // Example: 25cm wall -> 25 - 3 = 22cm window.
    // Example: 20cm wall -> 20 - 3 = 17cm window.
    const h = wallThickness - (FRAME_THICKNESS * 2); 
    
    let x = 0, y = 0, rot = 0;

    // When placing, we align the center of the window thickness to the center of the wall thickness.
    // Wall Center Offset = WallThickness / 2
    // Window Center Offset = WindowHeight / 2
    // So we place at WallEdge + (WallThickness - WindowHeight) / 2 -> No, simplified:
    // Placement Y = room.y - (WindowHeight - WallThickness)/2 ... wait.
    // SVG Origin is Top-Left.
    // North Wall Top edge is room.y. Wall thickness extends -T or +T?
    // In 2D render, wall is drawn from 0,0.
    // Actually, SmartWall draws wall inwards from room bounds?
    // No, SmartWall draws M 0 0 H w V h ... that's the ROOM bounds.
    // The wall thickness labels suggest Walls are "inside" or "centered"?
    // In standard architectural CAD, room dimensions are usually internal.
    // If room x,y,w,h defines INTERNAL dimensions:
    //   North wall is above room.y.
    //   However, our rendering (SmartWall) draws wall INSIDE the box (Outer Path = room bounds).
    //   So Walls encroach on the room area.
    //   Therefore, North Wall is from y to y+Thickness.
    //   So Center of wall is y + Thickness/2.
    //   Window Center should be y + Thickness/2.
    //   Window Top-Left Y = (y + Thickness/2) - (WindowHeight/2).
    
    const wallCenterOffset = wallThickness / 2;
    const winThicknessOffset = h / 2;

    if (wall === 'north') {
        x = cx - w/2;
        // Centered in the North wall band
        y = room.y + wallCenterOffset - winThicknessOffset; 
        rot = 0;
    }
    else if (wall === 'south') {
        x = cx - w/2;
        // Centered in the South wall band
        y = (room.y + room.height) - wallCenterOffset - winThicknessOffset;
        rot = 0; 
    }
    else if (wall === 'west') {
        // Centered in West wall band
        x = room.x + wallCenterOffset - winThicknessOffset;
        y = cy - h/2; // Here h is length due to rotation? No, w is length.
        // For rotated element:
        // width becomes height visual, height becomes width visual.
        // If rot=90. Visual Width = h (thickness), Visual Height = w (length).
        // We want Visual X to be centered in wall.
        // x is the top-left of the unrotated box.
        // Rotation happens around center.
        // So we just place center at wall center.
        // Center X = room.x + wallCenterOffset.
        // Center Y = cy.
        // Unrotated Top-Left X = Center X - w/2.
        // Unrotated Top-Left Y = Center Y - h/2.
        x = (room.x + wallCenterOffset) - w/2;
        y = cy - h/2;
        rot = 90;
    }
    else if (wall === 'east') {
        // Center X = room.x + room.width - wallCenterOffset
        x = (room.x + room.width - wallCenterOffset) - w/2;
        y = cy - h/2;
        rot = 90; 
    }

    data.elements.push({
        id: `auto-win-${room.id}-${wall}-${Date.now()}`,
        roomId: room.id, type: 'window', floor: room.floor,
        x, y, width: w, height: h, rotation: rot
    });
};
