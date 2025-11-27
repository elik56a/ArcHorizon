
import { SketchData, Room, ArchitecturalElement, RoomType } from '../../../types';
import { isAdjacent, isExteriorWall, WALL_THICKNESS_EXT, WALL_THICKNESS_INT, getAbsoluteBounds, checkOverlap, FRAME_THICKNESS } from './utils';

export const ensureConnectivity = (data: SketchData) => {
    // Canonical pair tracking to avoid double processing
    const processedPairs = new Set<string>();

    data.rooms.forEach(room => {
        if (['garden', 'parking', 'pool', 'terrace', 'balcony'].includes(room.type)) return;
        
        // FIND NEIGHBORS (ADJACENT OR VERY CLOSE)
        const neighbors = data.rooms.filter(n => n.id !== room.id && n.floor === room.floor && isAdjacent(room, n));
        
        let connectedCount = 0;

        neighbors.forEach(neighbor => {
             const pairId = [room.id, neighbor.id].sort().join('-');
             if (processedPairs.has(pairId)) return;
             processedPairs.add(pairId);

             const typeA = room.type;
             const typeB = neighbor.type;
             
             // Open Plan Logic: Kitchen/Living/Dining/Entry connect with large openings
             // If these types are touching, we assume open plan intent unless explicitly walled
             const isSocialA = ['living','dining','kitchen','entry'].includes(typeA);
             const isSocialB = ['living','dining','kitchen','entry'].includes(typeB);
             const isOpenPlan = isSocialA && isSocialB && typeA !== 'bathroom' && typeB !== 'bathroom';

             // CHECK FOR EXISTING CONNECTION
             const existingConnectionIndex = data.elements.findIndex(el => {
                 if (!['door', 'entry_door', 'sliding_door', 'wall_opening'].includes(el.type)) return false;
                 // Check overlap
                 const elBox = getAbsoluteBounds(el);
                 const touchesNeighbor = el.roomId === room.id && checkOverlap(elBox, {x: neighbor.x, y: neighbor.y, w: neighbor.width, h: neighbor.height}, 20);
                 const touchesRoom = el.roomId === neighbor.id && checkOverlap(elBox, {x: room.x, y: room.y, w: room.width, h: room.height}, 20);
                 return touchesNeighbor || touchesRoom;
             });

             const shouldConnect = 
                isOpenPlan ||
                (typeA === 'bedroom' && (typeB === 'corridor' || typeB === 'living' || typeB === 'entry')) ||
                (typeB === 'bedroom' && (typeA === 'corridor' || typeA === 'living' || typeA === 'entry')) ||
                (typeA === 'bathroom' && (typeB === 'corridor' || typeB === 'bedroom' || typeB === 'living')) ||
                (typeB === 'bathroom' && (typeA === 'corridor' || typeA === 'bedroom' || typeA === 'living')) ||
                (typeA === 'study' && (typeB === 'corridor' || typeB === 'living'));

             if (existingConnectionIndex !== -1) {
                 // Connection exists.
                 // CRITICAL: If Open Plan, remove standard doors and FORCE a large opening to erase the wall.
                 // Aggressive mode: Force full overlap clearing
                 if (isOpenPlan) {
                     const el = data.elements[existingConnectionIndex];
                     // If it's a door or a small opening, replace it. 
                     // Even if it's a wall_opening, if it's too small, blow it up.
                     if (el.type !== 'wall_opening' || el.width < 150) {
                         data.elements.splice(existingConnectionIndex, 1);
                         addOpenConnection(data, room, neighbor, true); 
                     }
                 }
                 connectedCount++;
             } else if (shouldConnect) {
                 // No connection exists, add one
                 if (isOpenPlan) {
                     addOpenConnection(data, room, neighbor, true);
                 } else {
                     addDoorBetween(data, room, neighbor);
                 }
                 connectedCount++;
             }
        });
    });

    // PASS 2: Ensure isolated rooms have at least one door
    data.rooms.forEach(room => {
        if (['garden', 'parking', 'pool', 'terrace', 'balcony'].includes(room.type)) return;
        
        const hasDoor = data.elements.some(el => el.roomId === room.id && ['door', 'entry_door', 'sliding_door', 'wall_opening'].includes(el.type));
        
        if (!hasDoor) {
             const neighbors = data.rooms.filter(n => n.id !== room.id && n.floor === room.floor && isAdjacent(room, n));
             
             if (neighbors.length > 0) {
                 const score = (r: Room) => (r.type === 'living' || r.type === 'corridor' ? 10 : 1);
                 const bestNeighbor = neighbors.sort((a,b) => score(b) - score(a))[0];
                 addDoorBetween(data, room, bestNeighbor);
             } else {
                 // Isolated (island) - connect to "center of house" direction
                 if (room.type !== 'bathroom') {
                     let bestTarget: Room | null = null;
                     let minDist = Infinity;
                     const center = { x: room.x + room.width/2, y: room.y + room.height/2 };
                     
                     data.rooms.forEach(other => {
                        if (other.id === room.id || other.floor !== room.floor || ['garden','parking','pool'].includes(other.type)) return;
                        const c2 = { x: other.x + other.width/2, y: other.y + other.height/2 };
                        const dist = Math.hypot(center.x - c2.x, center.y - c2.y);
                        if (dist < minDist) { minDist = dist; bestTarget = other; }
                     });

                     if (bestTarget) {
                         addOrientedDoor(data, room, bestTarget);
                     } else {
                         addDefaultDoor(data, room);
                     }
                 }
             }
        }
    });
};

const addDoorBetween = (data: SketchData, r1: Room, r2: Room) => {
    const doorW = 80; const h = WALL_THICKNESS_INT;
    const CORNER_OFFSET = 60; // Keep away from corners
    let x=0, y=0, rot=0;
    
    const xOverlapStart = Math.max(r1.x, r2.x);
    const xOverlapEnd = Math.min(r1.x + r1.width, r2.x + r2.width);
    const xOverlap = xOverlapEnd - xOverlapStart;

    const yOverlapStart = Math.max(r1.y, r2.y);
    const yOverlapEnd = Math.min(r1.y + r1.height, r2.y + r2.height);
    const yOverlap = yOverlapEnd - yOverlapStart;

    if (xOverlap > (doorW + CORNER_OFFSET * 2)) { 
        rot = 0;
        // Center in available overlap
        x = xOverlapStart + xOverlap/2 - doorW/2;
        y = (r1.y < r2.y) ? r1.y + r1.height - h/2 : r1.y - h/2;
    } else if (yOverlap > (doorW + CORNER_OFFSET * 2)) {
        rot = 90;
        // Center in available overlap
        y = yOverlapStart + yOverlap/2 - doorW/2;
        x = (r1.x < r2.x) ? r1.x + r1.width - h/2 : r1.x - h/2;
    } else {
        // Not enough space for a door
        return; 
    }

    data.elements.push({ 
        id: `d-auto-${Date.now()}-${Math.random().toString(36).substr(2,9)}`, 
        roomId: r1.id, type: 'door', floor: r1.floor, x, y, width: doorW, height: h, rotation: rot 
    });
};

const addOrientedDoor = (data: SketchData, room: Room, target: Room) => {
    const rc = { x: room.x + room.width/2, y: room.y + room.height/2 };
    const tc = { x: target.x + target.width/2, y: target.y + target.height/2 };
    const dx = tc.x - rc.x;
    const dy = tc.y - rc.y;
    
    let wall = '';
    if (Math.abs(dx) > Math.abs(dy)) {
        wall = dx > 0 ? 'east' : 'west';
    } else {
        wall = dy > 0 ? 'south' : 'north';
    }
    
    const width = 80;
    const thick = WALL_THICKNESS_EXT; 
    let x = 0, y = 0, rot = 0;
    
    // Initial Positioning
    if (wall === 'north') { x = rc.x - width/2; y = room.y - thick/2; rot = 0; }
    if (wall === 'south') { x = rc.x - width/2; y = room.y + room.height - thick/2; rot = 180; }
    if (wall === 'west') { x = room.x - thick/2; y = rc.y - width/2; rot = 270; }
    if (wall === 'east') { x = room.x + room.width - thick/2; y = rc.y - width/2; rot = 90; }

    // Re-center on wall axis
    if (wall === 'north' || wall === 'south') x = room.x + room.width/2 - width/2;
    if (wall === 'east' || wall === 'west') y = room.y + room.height/2 - width/2;

    data.elements.push({
        id: `auto-d-oriented-${room.id}`, roomId: room.id, type: 'door', floor: room.floor,
        x, y, width, height: thick, rotation: rot
    });
};

const addOpenConnection = (data: SketchData, r1: Room, r2: Room, aggressive: boolean = false) => {
    const h = WALL_THICKNESS_INT;
    let x=0, y=0, rot=0, w=220; // Default wide opening
    
    const xOverlapStart = Math.max(r1.x, r2.x);
    const xOverlapEnd = Math.min(r1.x + r1.width, r2.x + r2.width);
    const xOverlap = xOverlapEnd - xOverlapStart;

    const yOverlapStart = Math.max(r1.y, r2.y);
    const yOverlapEnd = Math.min(r1.y + r1.height, r2.y + r2.height);
    const yOverlap = yOverlapEnd - yOverlapStart;

    // IMPORTANT: To avoid cutting perpendicular exterior walls at the T-junctions,
    // we use a buffer.
    const MARGIN = aggressive ? 10 : 20;

    // Maximize opening size but keep structure on sides IF not aggressive
    const maxW_X = Math.max(100, xOverlap - MARGIN*2);
    const maxW_Y = Math.max(100, yOverlap - MARGIN*2);

    if (xOverlap > 50) {
        rot = 0;
        // Aggressive: Span almost the entire shared edge
        w = aggressive ? Math.max(100, xOverlap - 10) : Math.min(xOverlap - 20, maxW_X); 
        // Center the opening on the overlap
        x = xOverlapStart + xOverlap/2 - w/2;
        // Exact Y on boundary
        y = (r2.y > r1.y) ? r1.y + r1.height - h/2 : r1.y - h/2;
    } else if (yOverlap > 50) {
        rot = 90;
        w = aggressive ? Math.max(100, yOverlap - 10) : Math.min(yOverlap - 20, maxW_Y);
        // Center the opening on the overlap
        y = yOverlapStart + yOverlap/2 - w/2;
        // Exact X on boundary
        x = (r2.x > r1.x) ? r1.x + r1.width - h/2 : r1.x - h/2;
    } else {
        // Fallback for corner-only touches
        addDoorBetween(data, r1, r2);
        return;
    }

    data.elements.push({ 
        id: `open-auto-${Date.now()}-${Math.random().toString(36).substr(2,9)}`, 
        roomId: r1.id, type: 'wall_opening', floor: r1.floor, x, y, width: w, height: h, rotation: rot 
    });
};

const addDefaultDoor = (data: SketchData, room: Room) => {
    const type = (room.type === 'entry' || room.type === 'living') ? 'entry_door' : 'door';
    const width = type === 'entry_door' ? 100 : 80;
    const thick = WALL_THICKNESS_EXT;
    
    data.elements.push({
        id: `def-d-${room.id}`, roomId: room.id, type: type, floor: room.floor,
        x: room.x + room.width/2 - width/2, 
        y: room.y + room.height - thick/2, 
        width: width, height: thick, rotation: 180
    });
};

export const fixDoors = (data: SketchData) => {
    data.elements.forEach(el => {
        if (!['door', 'entry_door', 'sliding_door', 'wall_opening', 'door_internal'].includes(el.type)) return;
        const room = data.rooms.find(r => r.id === el.roomId);
        if (!room) return;

        const cx = el.x + el.width/2;
        const cy = el.y + el.height/2;
        const distN = Math.abs(cy - room.y);
        const distS = Math.abs(cy - (room.y + room.height));
        const distW = Math.abs(cx - room.x);
        const distE = Math.abs(cx - (room.x + room.width));
        const minDist = Math.min(distN, distS, distW, distE);

        let wall = '';
        if (minDist === distN) wall = 'north';
        else if (minDist === distS) wall = 'south';
        else if (minDist === distW) wall = 'west';
        else if (minDist === distE) wall = 'east';

        const isExt = isExteriorWall(room, wall, data.rooms);
        const wallThick = isExt ? WALL_THICKNESS_EXT : WALL_THICKNESS_INT;
        
        // Set dimensions to match wall exactly
        const currentLong = Math.max(el.width, el.height);
        el.width = currentLong;
        el.height = wallThick; 

        // CRITICAL: Limit Door Widths (Do not allow doors to stretch to fill walls like windows)
        if (['door', 'entry_door', 'door_internal'].includes(el.type)) {
            const maxW = el.type === 'entry_door' ? 120 : 100;
            if (el.width > maxW) el.width = maxW;
        }

        if (wall === 'north') {
            el.rotation = 0;
            // Snap CENTER Y exactly to wall centerline (room.y)
            el.y = room.y - wallThick/2;
            el.x = Math.max(room.x + 10, Math.min(el.x, room.x + room.width - el.width - 10));
        } else if (wall === 'south') {
            el.rotation = 180;
            el.y = (room.y + room.height) - wallThick/2;
            el.x = Math.max(room.x + 10, Math.min(el.x, room.x + room.width - el.width - 10));
        } else if (wall === 'west') {
            el.rotation = 270; 
            el.x = room.x - wallThick/2;
            const originalCenterY = cy;
            el.y = Math.max(room.y + el.width/2 + 10, Math.min(originalCenterY, room.y + room.height - el.width/2 - 10)) - el.width/2;
        } else if (wall === 'east') {
            el.rotation = 90; 
            el.x = (room.x + room.width) - wallThick/2;
            const originalCenterY = cy;
            el.y = Math.max(room.y + el.width/2 + 10, Math.min(originalCenterY, room.y + room.height - el.width/2 - 10)) - el.width/2;
        }
    });
};

export const limitEntryDoors = (data: SketchData): SketchData => {
    const entries = data.elements.filter(el => el.type === 'entry_door');
    if (entries.length <= 1) return data;
    const getScore = (el: ArchitecturalElement) => {
        const room = data.rooms.find(r => r.id === el.roomId);
        if (!room) return 0;
        if (room.type === 'entry') return 10;
        if (room.type === 'living') return 8;
        return 1;
    };
    const sorted = entries.sort((a, b) => getScore(b) - getScore(a));
    const toRemove = sorted.slice(1);
    toRemove.forEach(el => {
        el.type = 'window';
        el.width = 100; 
        el.height = WALL_THICKNESS_EXT - (FRAME_THICKNESS * 2); 
    });
    return data;
};

export const removeDuplicates = (data: SketchData): SketchData => {
    const typePriority: Record<string, number> = { 'entry_door': 10, 'door': 5, 'sliding_door': 5, 'wall_opening': 4, 'window': 1 };
    const openings = data.elements.filter(el => ['window', 'door', 'entry_door', 'wall_opening', 'sliding_door'].includes(el.type));
    const furniture = data.elements.filter(el => !['window', 'door', 'entry_door', 'wall_opening', 'sliding_door'].includes(el.type));
    openings.sort((a, b) => (typePriority[b.type] || 0) - (typePriority[a.type] || 0));
    const kept: ArchitecturalElement[] = [];
    for (const el of openings) {
        const box1 = getAbsoluteBounds(el);
        const c1 = { x: box1.x + box1.w/2, y: box1.y + box1.h/2 };
        let isDup = false;
        for (const k of kept) {
            const box2 = getAbsoluteBounds(k);
            const c2 = { x: box2.x + box2.w/2, y: box2.y + box2.h/2 };
            const dist = Math.hypot(c1.x - c2.x, c1.y - c2.y);
            if (dist < 40) { 
                isDup = true;
                break;
            }
        }
        if (!isDup) kept.push(el);
    }
    data.elements = [...furniture, ...kept];
    return data;
};
