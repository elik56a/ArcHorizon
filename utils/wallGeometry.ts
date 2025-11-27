
import { ArchitecturalElement, Room } from '../types';
import { WALL_HEIGHT, WALL_THICKNESS_EXT } from '../components/blueprint/constants';

export interface Hole {
  start: number;
  width: number;
  bottom: number;
  height: number;
}

export const getHolesForWall = (wall: 'north' | 'south' | 'west' | 'east', room: Room, elements: ArchitecturalElement[]): Hole[] => {
    const { x, y, width, height } = room;
    const holes: Hole[] = [];
    const TOLERANCE = 20;

    elements.forEach(el => {
        if (!['window', 'door', 'entry_door', 'balcony_door', 'wall_opening'].includes(el.type)) return;
        let isOnWall = false;
        let start = 0;
        let holeWidth = 0;
        const linearSpan = el.width; // Assumes normalized orientation where width is along the wall
        let bottom = 0;
        let holeHeight = 210; 
        
        if (el.type === 'window') { bottom = 110; holeHeight = 110; } 
        else if (el.type === 'entry_door') { holeHeight = 230; } 
        else if (el.type === 'wall_opening') { holeHeight = WALL_HEIGHT - 30; }

        if (wall === 'north') { 
            if (Math.abs(el.y - y) < TOLERANCE) { isOnWall = true; start = el.x - x; holeWidth = linearSpan; }
        } else if (wall === 'south') { 
            if (Math.abs(el.y - (y+height)) < TOLERANCE || Math.abs((el.y + el.height) - (y + height)) < TOLERANCE) { 
                isOnWall = true; start = el.x - x; holeWidth = linearSpan; 
            }
        } else if (wall === 'west') { 
            if (Math.abs(el.x - x) < TOLERANCE) { isOnWall = true; start = el.y - y; holeWidth = linearSpan; }
        } else if (wall === 'east') { 
            if (Math.abs(el.x - (x+width)) < TOLERANCE || Math.abs((el.x + el.width) - (x + width)) < TOLERANCE) { 
                isOnWall = true; start = el.y - y; holeWidth = linearSpan; 
            }
        }

        if (isOnWall) {
            // Adjust limits based on wall length (add thickness to corners)
            const wallLength = (wall === 'north' || wall === 'south') ? width + WALL_THICKNESS_EXT : height + WALL_THICKNESS_EXT;
            // Relax bounds slightly to allow holes near corners
            if (start > -50 && (start + holeWidth) < wallLength + 50) {
                holes.push({ start, width: holeWidth, bottom, height: holeHeight });
            }
        }
    });
    return holes;
};
