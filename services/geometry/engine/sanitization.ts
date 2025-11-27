
import { SketchData } from '../../../types';
import { MIN_ROOM_DIMENSION } from './utils';

export const sanitizeScale = (data: SketchData): SketchData => {
    if (data.rooms.length === 0) return data;
    const totalDim = data.rooms.reduce((sum, r) => sum + r.width + r.height, 0);
    const avgDim = totalDim / (data.rooms.length * 2);
    if (avgDim < 50) {
        const SCALE = 100;
        data.rooms.forEach(r => { r.x *= SCALE; r.y *= SCALE; r.width *= SCALE; r.height *= SCALE; });
        data.elements.forEach(e => { e.x *= SCALE; e.y *= SCALE; e.width *= SCALE; e.height *= SCALE; });
    }
    return data;
};

export const pruneArtifacts = (data: SketchData): SketchData => {
    const initialCount = data.rooms.length;
    data.rooms = data.rooms.filter(r => r.width >= MIN_ROOM_DIMENSION && r.height >= MIN_ROOM_DIMENSION);
    if (data.rooms.length < initialCount) {
        const roomIds = new Set(data.rooms.map(r => r.id));
        data.elements = data.elements.filter(e => roomIds.has(e.roomId));
    }
    return data;
};
