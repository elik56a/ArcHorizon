
import { SketchData, Room, ArchitecturalElement } from '../../../types';
import { isExteriorWall, isElementOnWall, WALL_THICKNESS_EXT, FRAME_THICKNESS, getAbsoluteBounds, checkOverlap } from './utils';

export const ensureNaturalLight = (data: SketchData) => {
    data.rooms.forEach(room => {
        if (['corridor', 'storage', 'utility', 'garden', 'parking', 'pool', 'entry', 'bathroom'].includes(room.type)) return;
        const walls = ['north', 'south', 'west', 'east'];
        for (const wall of walls) {
            if (isExteriorWall(room, wall, data.rooms)) {
                const hasWindowOnWall = data.elements.some(el => el.roomId === room.id && el.type === 'window' && isElementOnWall(el, room, wall));
                if (!hasWindowOnWall) {
                    addWindow(data, room, wall, WALL_THICKNESS_EXT);
                }
            }
        }
    });
};

const addWindow = (data: SketchData, room: Room, wall: string, wallThickness: number) => {
    const winW = 120; 
    const winH = wallThickness - (FRAME_THICKNESS * 2); 
    data.elements.push({
        id: `win-${room.id}-${wall}`, roomId: room.id, type: 'window', floor: room.floor,
        x: room.x + room.width/2, y: room.y, width: winW, height: winH, rotation: 0
    });
};

export const fixWindows = (data: SketchData) => {
    const keptWindows: ArchitecturalElement[] = [];
    const nonWindows = data.elements.filter(e => e.type !== 'window');
    const windows = data.elements.filter(e => e.type === 'window');
    
    windows.forEach(el => {
        const room = data.rooms.find(r => r.id === el.roomId);
        if (!room) return;

        const center = { x: el.x + el.width/2, y: el.y + el.height/2 };
        const distN = Math.abs(center.y - room.y);
        const distS = Math.abs(center.y - (room.y + room.height));
        const distW = Math.abs(center.x - room.x);
        const distE = Math.abs(center.x - (room.x + room.width));
        const minDist = Math.min(distN, distS, distW, distE);
        
        let wall = '';
        if (minDist === distN) wall = 'north';
        else if (minDist === distS) wall = 'south';
        else if (minDist === distW) wall = 'west';
        else if (minDist === distE) wall = 'east';
        
        const wallThick = WALL_THICKNESS_EXT;
        const winThick = wallThick - (FRAME_THICKNESS * 2); 
        const winLength = Math.max(el.width, el.height);

        el.width = winLength;
        el.height = winThick;

        if (wall === 'north') {
            el.rotation = 0;
            el.y = room.y - winThick/2; 
            el.x = Math.max(room.x, Math.min(el.x, room.x + room.width - el.width));
        } else if (wall === 'south') {
            el.rotation = 180;
            el.y = (room.y + room.height) - winThick/2;
            el.x = Math.max(room.x, Math.min(el.x, room.x + room.width - el.width));
        } else if (wall === 'west') {
            el.rotation = 270;
            el.x = room.x - el.width/2; 
            const targetCy = Math.max(room.y + el.width/2, Math.min(center.y, room.y + room.height - el.width/2));
            el.y = targetCy - el.height/2; 
        } else if (wall === 'east') {
            el.rotation = 90; 
            el.x = (room.x + room.width) - el.width/2;
            const targetCy = Math.max(room.y + el.width/2, Math.min(center.y, room.y + room.height - el.width/2));
            el.y = targetCy - el.height/2;
        }

        if (validateWindowLocation(el, room, data.rooms)) {
            keptWindows.push(el);
        }
    });
    data.elements = [...nonWindows, ...keptWindows];
};

const validateWindowLocation = (el: ArchitecturalElement, parentRoom: Room, allRooms: Room[]): boolean => {
    const box = getAbsoluteBounds(el);
    const shrink = 5;
    const testBox = { x: box.x + shrink, y: box.y + shrink, w: box.w - shrink*2, h: box.h - shrink*2 };
    
    for (const other of allRooms) {
        if (other.id === parentRoom.id || other.floor !== parentRoom.floor) continue;
        
        if (checkOverlap(testBox, { x: other.x, y: other.y, w: other.width, h: other.height }, 0)) {
            return false; 
        }
    }
    return true;
};

export const pruneExteriorDoors = (data: SketchData): SketchData => {
    const validExteriorTargets = ['balcony', 'terrace', 'garden', 'parking', 'pool', 'entry'];
    data.elements.forEach(el => {
        if (el.type !== 'door') return; 
        const room = data.rooms.find(r => r.id === el.roomId);
        if (!room) return;

        // CRITICAL FIX: Ensure we don't prune interior doors that might be slightly misaligned.
        // Check if this door overlaps ANY other room (except its own owner).
        const doorBox = getAbsoluteBounds(el);
        // Increase buffer to 20cm to be safe against slight gaps
        const touchesOtherRoom = data.rooms.some(r => r.id !== el.roomId && r.floor === el.floor && checkOverlap(doorBox, {x:r.x, y:r.y, w:r.width, h:r.height}, 20));
        
        if (touchesOtherRoom) return; // It connects to something, so it is Interior.

        const cx = el.x + el.width/2;
        const cy = el.y + el.height/2;
        let wall = '';
        const distN = Math.abs(cy - room.y);
        const distS = Math.abs(cy - (room.y + room.height));
        const distW = Math.abs(cx - room.x);
        const distE = Math.abs(cx - (room.x + room.width));
        const minDist = Math.min(distN, distS, distW, distE);
        
        if (minDist === distN) wall = 'north';
        else if (minDist === distS) wall = 'south';
        else if (minDist === distW) wall = 'west';
        else if (minDist === distE) wall = 'east';

        if (isExteriorWall(room, wall, data.rooms)) {
            let testX = cx, testY = cy;
            const offset = 50; 
            if (wall === 'north') testY -= offset;
            if (wall === 'south') testY += offset;
            if (wall === 'west') testX -= offset;
            if (wall === 'east') testX += offset;
            
            const targetRoom = data.rooms.find(r => r.floor === el.floor && testX >= r.x && testX <= r.x + r.width && testY >= r.y && testY <= r.y + r.height);
            
            // If it leads to nowhere, or to a non-exterior target that isn't connected, convert to window
            if (!targetRoom || !validExteriorTargets.includes(targetRoom.type)) {
                el.type = 'window';
                el.width = 100;
                el.height = 22; 
            }
        }
    });
    return data;
};
