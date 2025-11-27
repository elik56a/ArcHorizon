
import { SketchData, Room } from '../../../types';
import { isAdjacent, getRoomBounds } from './utils';

// Helper to move a room and its contents
export const shiftRoom = (data: SketchData, room: Room, dx: number, dy: number) => {
    room.x += dx;
    room.y += dy;
    data.elements.forEach(el => {
        if (el.roomId === room.id) {
            el.x += dx;
            el.y += dy;
        }
    });
};

export const condenseLayout = (data: SketchData): SketchData => {
    if (data.rooms.length < 2) return data;

    // 1. Group rooms by floor
    const floors = new Set(data.rooms.map(r => r.floor));
    
    floors.forEach(floor => {
        const floorRooms = data.rooms.filter(r => r.floor === floor);
        if (floorRooms.length < 2) return;

        // 2. Identify Anchor (Largest Room, usually Living/Dining)
        const sorted = [...floorRooms].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        const anchor = sorted[0];
        const cluster = new Set<string>([anchor.id]);
        
        // 3. Iteratively attach rooms to the cluster
        let iterations = 0;
        // Safety break at 50 iterations
        while (cluster.size < floorRooms.length && iterations < 50) {
            iterations++;
            
            let bestRoom: Room | null = null;
            let targetRoom: Room | null = null;
            let minScore = Infinity; // Lower is better (distance)

            // Find the best unclustered room to attach
            for (const room of floorRooms) {
                if (cluster.has(room.id)) continue;
                
                // Ignore landscape/exterior rooms for tight packing, handle them last or loosely
                // (Optional: keep them included to ensure they attach to house)

                // If it's already adjacent to something in cluster, add it and continue
                const touching = floorRooms.find(c => cluster.has(c.id) && isAdjacent(room, c));
                if (touching) {
                    cluster.add(room.id);
                    bestRoom = null; // Mark as handled
                    break; 
                }

                // Otherwise, calculate distance to cluster
                const rC = { x: room.x + room.width/2, y: room.y + room.height/2 };
                for (const cId of cluster) {
                    const cRoom = floorRooms.find(r => r.id === cId)!;
                    const cC = { x: cRoom.x + cRoom.width/2, y: cRoom.y + cRoom.height/2 };
                    const dist = Math.hypot(rC.x - cC.x, rC.y - cC.y);
                    
                    if (dist < minScore) {
                        minScore = dist;
                        bestRoom = room;
                        targetRoom = cRoom;
                    }
                }
            }

            // If we found a room adjacent, the loop `break` triggered, and we just continue to next iteration
            if (!bestRoom && cluster.size !== floorRooms.length) {
                // If we didn't find a 'bestRoom' but we aren't done, it means we handled an adjacent one
                continue;
            }

            // If we found a candidate that isn't touching, move it
            if (bestRoom && targetRoom) {
                snapToRoom(data, bestRoom, targetRoom);
                cluster.add(bestRoom.id);
            } else if (!bestRoom) {
                // Should not happen if loop condition is met, but safety break
                break;
            }
        }
    });

    return data;
};

const snapToRoom = (data: SketchData, source: Room, target: Room) => {
    const sC = { x: source.x + source.width/2, y: source.y + source.height/2 };
    const tC = { x: target.x + target.width/2, y: target.y + target.height/2 };
    
    const dx = sC.x - tC.x;
    const dy = sC.y - tC.y;
    
    let moveX = 0;
    let moveY = 0;
    
    // Prefer snapping to the closest axis
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal Snap
        if (dx > 0) moveX = (target.x + target.width) - source.x; // Right side
        else moveX = target.x - (source.x + source.width);        // Left side
        
        // Align Centers Y
        moveY = tC.y - sC.y;
    } else {
        // Vertical Snap
        if (dy > 0) moveY = (target.y + target.height) - source.y; // Bottom side
        else moveY = target.y - (source.y + source.height);        // Top side
        
        // Align Centers X
        moveX = tC.x - sC.x;
    }
    
    shiftRoom(data, source, moveX, moveY);
};

export const separateRooms = (data: SketchData): SketchData => {
    const floors = new Set(data.rooms.map(r => r.floor));
    floors.forEach(floor => {
        const rooms = data.rooms.filter(r => r.floor === floor);
        
        for (let i = 0; i < 50; i++) { 
            let hasOverlap = false;
            for (let j = 0; j < rooms.length; j++) {
                for (let k = j + 1; k < rooms.length; k++) {
                    const r1 = rooms[j];
                    const r2 = rooms[k];
                    
                    const overlapX = Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x);
                    const overlapY = Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y);
                    
                    if (overlapX > 0.5 && overlapY > 0.5) {
                        hasOverlap = true;
                        
                        const jitter = (Math.random() - 0.5) * 2; 
                        const center1X = r1.x + r1.width/2;
                        const center2X = r2.x + r2.width/2;
                        const center1Y = r1.y + r1.height/2;
                        const center2Y = r2.y + r2.height/2;

                        if (overlapX < overlapY) {
                            const shift = (overlapX / 2) + 0.1 + Math.abs(jitter); 
                            const dir = center1X < center2X ? -1 : 1;
                            shiftRoom(data, r1, dir * shift, 0);
                            shiftRoom(data, r2, -dir * shift, 0);
                        } else {
                            const shift = (overlapY / 2) + 0.1 + Math.abs(jitter);
                            const dir = center1Y < center2Y ? -1 : 1;
                            shiftRoom(data, r1, 0, dir * shift);
                            shiftRoom(data, r2, 0, -dir * shift);
                        }
                    }
                }
            }
            if (!hasOverlap) break;
        }
    });
    return data;
};

export const snapRooms = (data: SketchData): SketchData => {
    const floors = new Set(data.rooms.map(r => r.floor));
    const SNAP_TOLERANCE = 100; 
    floors.forEach(floor => {
        const rooms = data.rooms.filter(r => r.floor === floor);
        for (let pass = 0; pass < 5; pass++) {
            let snapped = false;
            for (const r1 of rooms) {
                for (const r2 of rooms) {
                    if (r1.id === r2.id) continue;

                    // SNAP X
                    if (r2.x >= r1.x + r1.width && r2.x - (r1.x + r1.width) < SNAP_TOLERANCE) {
                        const overlapY = Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y);
                        if (overlapY > 50) { 
                            const gap = r2.x - (r1.x + r1.width);
                            if (gap > 0.1) {
                                shiftRoom(data, r2, -gap, 0);
                                snapped = true;
                            }
                        }
                    }
                    // SNAP Y
                    if (r2.y >= r1.y + r1.height && r2.y - (r1.y + r1.height) < SNAP_TOLERANCE) {
                        const overlapX = Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x);
                        if (overlapX > 50) {
                            const gap = r2.y - (r1.y + r1.height);
                            if (gap > 0.1) {
                                shiftRoom(data, r2, 0, -gap);
                                snapped = true;
                            }
                        }
                    }
                }
            }
            if (!snapped) break;
        }
    });
    return data;
};

export const stackFloors = (data: SketchData): SketchData => {
    const floors = Array.from(new Set(data.rooms.map(r => r.floor))).sort((a,b) => a - b);
    if (floors.length < 2) return data;
    
    // Anchor to the first floor (usually Ground)
    const baseFloor = floors[0];
    const baseRooms = data.rooms.filter(r => r.floor === baseFloor);
    const baseBounds = getRoomBounds(baseRooms);
    const baseCenter = { x: baseBounds.x + baseBounds.w/2, y: baseBounds.y + baseBounds.h/2 };

    for (let i = 1; i < floors.length; i++) {
        const f = floors[i];
        const fRooms = data.rooms.filter(r => r.floor === f);
        if (fRooms.length === 0) continue;

        const fBounds = getRoomBounds(fRooms);
        const fCenter = { x: fBounds.x + fBounds.w/2, y: fBounds.y + fBounds.h/2 };
        
        const dx = baseCenter.x - fCenter.x;
        const dy = baseCenter.y - fCenter.y;
        
        fRooms.forEach(r => shiftRoom(data, r, dx, dy));
    }
    return data;
};