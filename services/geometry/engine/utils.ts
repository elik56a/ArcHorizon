
import { Room, ArchitecturalElement } from '../../../types';

// Constants
export const MIN_ROOM_DIMENSION = 60; // cm
export const WALL_GAP = 30; // cm
export const WALL_THICKNESS_EXT = 25; // cm
export const WALL_THICKNESS_INT = 20; // cm
export const FRAME_THICKNESS = 1.5; // cm

export const getAbsoluteBounds = (el: {x: number, y: number, width: number, height: number, rotation: number}) => {
    const rad = el.rotation * (Math.PI / 180);
    const w = el.width;
    const h = el.height;
    const cx = el.x + w/2;
    const cy = el.y + h/2;
    const corners = [{ x: -w/2, y: -h/2 }, { x: w/2, y: -h/2 }, { x: w/2, y: h/2 }, { x: -w/2, y: h/2 }];
    const rotated = corners.map(p => ({ x: p.x * Math.cos(rad) - p.y * Math.sin(rad), y: p.x * Math.sin(rad) + p.y * Math.cos(rad) }));
    const xs = rotated.map(p => p.x + cx);
    const ys = rotated.map(p => p.y + cy);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};

export const getRoomBounds = (rooms: Room[]) => {
    if (rooms.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    const minX = Math.min(...rooms.map(r => r.x));
    const maxX = Math.max(...rooms.map(r => r.x + r.width));
    const minY = Math.min(...rooms.map(r => r.y));
    const maxY = Math.max(...rooms.map(r => r.y + r.height));
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};

export const checkOverlap = (r1: {x:number, y:number, w:number, h:number}, r2: {x:number, y:number, w:number, h:number}, buffer: number = 5) => {
    return !(r1.x + r1.w + buffer <= r2.x || r1.x >= r2.x + r2.w + buffer || r1.y + r1.h + buffer <= r2.y || r1.y >= r2.y + r2.h + buffer);
};

export const isExteriorWall = (room: Room, wall: string, allRooms: Room[]): boolean => {
    const TOL = 5;
    const { x, y, width, height } = room;
    let p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 };
    if (wall === 'north') { p1 = {x, y}; p2 = {x: x+width, y}; }
    else if (wall === 'south') { p1 = {x, y: y+height}; p2 = {x: x+width, y: y+height}; }
    else if (wall === 'west') { p1 = {x, y}; p2 = {x, y: y+height}; }
    else if (wall === 'east') { p1 = {x: x+width, y}; p2 = {x: x+width, y: y+height}; }
    
    for (const other of allRooms) {
        if (other.id === room.id || other.floor !== room.floor) continue;
        const touches = !(
            other.x > Math.max(p1.x, p2.x) - TOL || 
            other.x + other.width < Math.min(p1.x, p2.x) + TOL || 
            other.y > Math.max(p1.y, p2.y) - TOL || 
            other.y + other.height < Math.min(p1.y, p2.y) + TOL
        );
        if (touches) return false;
    }
    return true;
};

export const isElementOnWall = (el: ArchitecturalElement, room: Room, wall: string) => {
    const TOL = 40;
    if (wall === 'north') return Math.abs(el.y - room.y) < TOL;
    if (wall === 'south') return Math.abs(el.y - (room.y + room.height)) < TOL;
    if (wall === 'west') return Math.abs(el.x - room.x) < TOL;
    if (wall === 'east') return Math.abs(el.x - (room.x + room.width)) < TOL;
    return false;
};

export const isAdjacent = (r1: Room, r2: Room) => {
    const tol = 50; // Increased to 50cm to catch rooms separated by gaps
    const r1R = r1.x + r1.width, r1B = r1.y + r1.height;
    const r2R = r2.x + r2.width, r2B = r2.y + r2.height;
    return ((Math.abs(r1R - r2.x) < tol || Math.abs(r1.x - r2R) < tol) && !(r1B <= r2.y || r1.y >= r2B)) ||
           ((Math.abs(r1B - r2.y) < tol || Math.abs(r1.y - r2B) < tol) && !(r1R <= r2.x || r1.x >= r2R));
};