
import { SketchData, Room, ArchitecturalElement, RoomType } from '../../../types';
import { isAdjacent, isExteriorWall, WALL_THICKNESS_EXT, WALL_THICKNESS_INT, getAbsoluteBounds, FRAME_THICKNESS, checkOverlap } from './utils';

export const ensureConnectivity = (data: SketchData) => {
    // We iterate through all rooms and explicitly check their connectivity to neighbors
    data.rooms.forEach(room => {
        if (['garden', 'parking', 'pool', 'terrace', 'balcony'].includes(room.type)) return;
        
        // FIND NEIGHBORS (ADJACENT OR VERY CLOSE)
        const neighbors = data.rooms.filter(n => n.id !== room.id && n.floor === room.floor && isAdjacent(room, n));
        
        neighbors.forEach(neighbor => {
             // 1. Check if these two SPECIFIC rooms are already connected
             const isConnected = data.elements.some(el => {
                 if (!['door', 'entry_door', 'sliding_door', 'wall_opening'].includes(el.type)) return false;
                 
                 // If the door belongs to one room, check if it touches the other
                 if (el.roomId === room.id) {
                     return checkOverlap(getAbsoluteBounds(el), {x: neighbor.x, y: neighbor.y, w: neighbor.width, h: neighbor.height}, 15);
                 }
                 if (el.roomId === neighbor.id) {
                     return checkOverlap(getAbsoluteBounds(el), {x: room.x, y: room.y, w: room.width, h: room.height}, 15);
                 }
                 return false;
             });

             if (!isConnected) {
                 // 2. Determine if we SHOULD connect them based on type logic
                 const typeA = room.type;
                 const typeB = neighbor.type;
                 
                 const isSocialA = ['living','dining','kitchen','corridor','entry'].includes(typeA);
                 const isSocialB = ['living','dining','kitchen','corridor','entry'].includes(typeB);
                 
                 // High priority connections
                 const shouldConnect = 
                    (isSocialA && isSocialB) || // Open flow between social zones
                    (typeA === 'bedroom' && (typeB === 'corridor' || typeB === 'living' || typeB === 'entry')) ||
                    (typeB === 'bedroom' && (typeA === 'corridor' || typeA === 'living' || typeA === 'entry')) ||
                    (typeA === 'bathroom' && (typeB === 'corridor' || typeB === 'bedroom')) ||
                    (typeB === 'bathroom' && (typeA === 'corridor' || typeA === 'bedroom'));

                 if (shouldConnect) {
                     if (isSocialA && isSocialB) addOpenConnection(data, room, neighbor);
                     else addDoorBetween(data, room, neighbor);
                 }
             }
        });

        // 3. Fallback: If a room still has ZERO doors after checking all neighbors, force one to the nearest valid neighbor
        const hasAnyDoor = data.elements.some(el => el.roomId === room.id && ['door', 'entry_door', 'wall_opening'].includes(el.type));
        if (!hasAnyDoor && neighbors.length > 0) {
            const bestNeighbor = neighbors[0]; // Simplistic fallback
            addDoorBetween(data, room, bestNeighbor);
        } else if (!hasAnyDoor && neighbors.length === 0) {
            // Absolute fallback for isolated rooms (should be rare with condensed topology)
            addDefaultDoor(data, room);
        }
    });
};

const addDoorBetween = (data: SketchData, r1: Room, r2: Room) => {
    const doorW = 80; const h = WALL_THICKNESS_INT;
    let x=0, y=0, rot=0;
    
    // Calc overlaps
    const xOverlapStart = Math.max(r1.x, r2.x);
    const xOverlapEnd = Math.min(r1.x + r1.width, r2.x + r2.width);
    const xOverlap = xOverlapEnd - xOverlapStart;

    const yOverlapStart = Math.max(r1.y, r2.y);
    const yOverlapEnd = Math.min(r1.y + r1.height, r2.y + r2.height);
    const yOverlap = yOverlapEnd - yOverlapStart;

    if (xOverlap > 10) { 
        rot = 0;
        x = xOverlapStart + xOverlap/2 - doorW/2;
        y = (r1.y < r2.y) ? r1.y + r1.height - h/2 : r1.y - h/2;
    } else if (yOverlap > 10) {
        rot = 90;
        y = yOverlapStart + yOverlap/2 - doorW/2;
        x = (r1.x < r2.x) ? r1.x + r1.width - h/2 : r1.x - h/2;
    } else {
        // Corner/Tight fit - force placement if close enough
        if (Math.abs((r1.x + r1.width) - r2.x) < 20) { rot = 90; x = r1.x + r1.width - h/2; y = Math.max(r1.y, r2.y) + 10; } 
        else if (Math.abs(r1.x - (r2.x + r2.width)) < 20) { rot = 90; x = r1.x - h/2; y = Math.max(r1.y, r2.y) + 10; } 
        else if (Math.abs((r1.y + r1.height) - r2.y) < 20) { rot = 0; y = r1.y + r1.height - h/2; x = Math.max(r1.x, r2.x) + 10; } 
        else { rot = 0; y = r1.y - h/2; x = Math.max(r1.x, r2.x) + 10; }
    }

    data.elements.push({ 
        id: `d-auto-${Date.now()}-${Math.random().toString(36).substr(2,9)}`, 
        roomId: r1.id, type: 'door', floor: r1.floor, x, y, width: doorW, height: h, rotation: rot 
    });
};

const addOpenConnection = (data: SketchData, r1: Room, r2: Room) => {
    const h = WALL_THICKNESS_INT;
    let x=0, y=0, rot=0, w=160;
    
    const xOverlapStart = Math.max(r1.x, r2.x);
    const xOverlapEnd = Math.min(r1.x + r1.width, r2.x + r2.width);
    const xOverlap = xOverlapEnd - xOverlapStart;

    const yOverlapStart = Math.max(r1.y, r2.y);
    const yOverlapEnd = Math.min(r1.y + r1.height, r2.y + r2.height);
    const yOverlap = yOverlapEnd - yOverlapStart;

    if (xOverlap > 50) {
        rot = 0;
        w = Math.min(xOverlap - 20, 300);
        x = xOverlapStart + xOverlap/2 - w/2;
        y = (r2.y > r1.y) ? r1.y + r1.height - h/2 : r1.y - h/2;
    } else if (yOverlap > 50) {
        rot = 90;
        w = Math.min(yOverlap - 20, 300);
        y = yOverlapStart + yOverlap/2 - w/2;
        x = (r2.x > r1.x) ? r1.x + r1.width - h/2 : r1.x - h/2;
    } else {
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
        
        const currentLong = Math.max(el.width, el.height);
        el.width = currentLong;
        el.height = wallThick; 

        if (wall === 'north') {
            el.rotation = 0;
            el.y = room.y - wallThick/2;
            el.x = Math.max(room.x, Math.min(el.x, room.x + room.width - el.width));
        } else if (wall === 'south') {
            el.rotation = 180;
            el.y = room.y + room.height - wallThick/2;
            el.x = Math.max(room.x, Math.min(el.x, room.x + room.width - el.width));
        } else if (wall === 'west') {
            el.rotation = 270; 
            el.x = room.x - wallThick/2;
            const originalCenterY = cy;
            el.y = Math.max(room.y + el.width/2, Math.min(originalCenterY, room.y + room.height - el.width/2)) - el.width/2;
        } else if (wall === 'east') {
            el.rotation = 90; 
            el.x = room.x + room.width - wallThick/2;
            const originalCenterY = cy;
            el.y = Math.max(room.y + el.width/2, Math.min(originalCenterY, room.y + room.height - el.width/2)) - el.width/2;
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
