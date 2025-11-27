
import { SketchData, Room, ArchitecturalElement } from '../../../types';
import { getAbsoluteBounds, checkOverlap, WALL_GAP } from './utils';

export const optimizeFurniturePlacement = (data: SketchData) => {
    const validElements: ArchitecturalElement[] = [];
    const obstacles: {x: number, y: number, w: number, h: number, type: string}[] = [];

    // 1. Register Fixed Elements (Doors, Windows) as obstacles
    data.elements.forEach(el => {
        if (['door', 'window', 'entry_door', 'wall_opening', 'sliding_door'].includes(el.type)) {
            const box = getAbsoluteBounds(el);
            obstacles.push({ ...box, type: el.type });
            validElements.push(el);
            if (el.type.includes('door')) {
                const cx = box.x + box.w/2;
                const cy = box.y + box.h/2;
                const swingRadius = 100; 
                obstacles.push({ x: cx - swingRadius, y: cy - swingRadius, w: swingRadius*2, h: swingRadius*2, type: 'door_swing' });
            }
        }
    });

    // 2. Process Furniture
    const furniture = data.elements.filter(el => !['door', 'window', 'entry_door', 'wall_opening', 'sliding_door'].includes(el.type));
    furniture.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    furniture.forEach(el => {
        const room = data.rooms.find(r => r.id === el.roomId);
        if (!room) return;

        // 2.1. Scale down if too big for room
        const roomMin = Math.min(room.width, room.height);
        const elMax = Math.max(el.width, el.height);
        if (elMax > roomMin * 0.6) {
            const scale = (roomMin * 0.6) / elMax;
            el.width *= scale;
            el.height *= scale;
        }

        // 2.2. Add Room Label Zone to obstacles for this room
        const labelObstacle = {
            x: room.x + room.width/2 - 40,
            y: room.y + room.height/2 - 20,
            w: 80,
            h: 40,
            type: 'label'
        };
        const currentObstacles = [...obstacles, labelObstacle];

        let placed = snapToWallSmart(el, room, currentObstacles);
        if (!placed) placed = findValidPositionInRoom(el, room, currentObstacles);
        
        if (placed) {
            const box = getAbsoluteBounds(el);
            // Add to global obstacles immediately so next furniture avoids it
            obstacles.push({ ...box, type: 'furniture' });
            validElements.push(el);
        }
    });

    data.elements = validElements;
    data.rooms.forEach(room => optimizeRoomLabelPlacement(room, obstacles));
};

const validatePlacement = (el: ArchitecturalElement, room: Room, obstacles: {x:number, y:number, w:number, h:number}[]) => {
    const box = getAbsoluteBounds(el);
    
    // Check Room Bounds (Strict)
    if (box.x < room.x + WALL_GAP || 
        box.y < room.y + WALL_GAP || 
        box.x + box.w > room.x + room.width - WALL_GAP || 
        box.y + box.h > room.y + room.height - WALL_GAP) {
        return false;
    }

    // Check Obstacles with Buffer
    for (const obs of obstacles) {
        if (checkOverlap(box, obs, 15)) return false; // 15cm buffer
    }
    return true;
};

const snapToWallSmart = (el: ArchitecturalElement, room: Room, obstacles: {x:number, y:number, w:number, h:number}[]): boolean => {
    const G = WALL_GAP + 10;
    const anchors = [
        { x: room.x + room.width/2 - el.width/2, y: room.y + G, rot: 0 }, // North
        { x: room.x + room.width - el.width - G, y: room.y + room.height/2 - el.height/2, rot: 90 }, // East
        { x: room.x + room.width/2 - el.width/2, y: room.y + room.height - el.height - G, rot: 180 }, // South
        { x: room.x + G, y: room.y + room.height/2 - el.height/2, rot: 270 }, // West
    ];

    if (el.type.includes('bed') || el.type.includes('sofa')) {
        anchors[0].rot = 180; anchors[1].rot = 270; anchors[2].rot = 0; anchors[3].rot = 90;
    }

    for (const anchor of anchors) {
        const shifts = [0, -0.25, 0.25];
        for (const shift of shifts) {
            const testEl = { ...el, ...anchor };
            if (anchor.rot === 0 || anchor.rot === 180) testEl.x += room.width * shift;
            else testEl.y += room.height * shift;

            if (validatePlacement(testEl, room, obstacles)) {
                el.x = testEl.x; el.y = testEl.y; el.rotation = testEl.rot;
                return true;
            }
        }
    }
    return false;
};

const findValidPositionInRoom = (el: ArchitecturalElement, room: Room, obstacles: {x:number, y:number, w:number, h:number}[]): boolean => {
    const STEP = 30;
    const G = WALL_GAP + 5;
    const rotations = [0, 90];
    
    for (const rot of rotations) {
        el.rotation = rot;
        const tempBox = getAbsoluteBounds({ ...el, x: 0, y: 0 });
        const vW = tempBox.w;
        const vH = tempBox.h;
        const minX = room.x + G;
        const maxX = room.x + room.width - G - vW;
        const minY = room.y + G;
        const maxY = room.y + room.height - G - vH;
        
        if (minX >= maxX || minY >= maxY) continue;
        
        for (let y = minY; y <= maxY; y += STEP) {
            for (let x = minX; x <= maxX; x += STEP) {
                const testEl = { ...el, x, y, rotation: rot };
                if (validatePlacement(testEl, room, obstacles)) {
                    el.x = x; el.y = y; el.rotation = rot;
                    return true;
                }
            }
        }
    }
    return false;
};

const optimizeRoomLabelPlacement = (room: Room, obstacles: {x:number, y:number, w:number, h:number, type: string}[]) => {
    const cx = room.x + room.width / 2;
    const cy = room.y + room.height / 2;
    const lblW = 80, lblH = 30;
    const centerBox = { x: cx - lblW/2, y: cy - lblH/2, w: lblW, h: lblH };
    
    // Check if center is taken by furniture (excluding the reserved label obstacle itself)
    if (!obstacles.some(obs => obs.type !== 'label' && checkOverlap(centerBox, obs, 0))) { 
        delete room.labelX; delete room.labelY; 
        return; 
    }
    
    const quadrants = [
        { x: room.x + room.width*0.5, y: room.y + room.height*0.25 },
        { x: room.x + room.width*0.5, y: room.y + room.height*0.75 },
        { x: room.x + room.width*0.25, y: room.y + room.height*0.5 },
        { x: room.x + room.width*0.75, y: room.y + room.height*0.5 },
    ];
    for (const q of quadrants) {
        const qBox = { x: q.x - lblW/2, y: q.y - lblH/2, w: lblW, h: lblH };
        if (!obstacles.some(obs => checkOverlap(qBox, obs, 0))) { room.labelX = q.x; room.labelY = q.y; return; }
    }
};
