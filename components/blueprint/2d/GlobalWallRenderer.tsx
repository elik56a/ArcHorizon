
import React, { useMemo } from 'react';
import { Room, ArchitecturalElement } from '../../../types';
import { WALL_THICKNESS_EXT, WALL_THICKNESS_INT } from '../constants';
import { getAbsoluteBounds } from '../../../services/geometry/engine/utils';

interface WallSegment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    thickness: number;
    isVertical: boolean;
}

export const GlobalWallRenderer: React.FC<{ rooms: Room[], elements?: ArchitecturalElement[], isVivid: boolean }> = ({ rooms, elements = [], isVivid }) => {
    const segments = useMemo(() => {
        const verticalLines: { x: number, y1: number, y2: number }[] = [];
        const horizontalLines: { y: number, x1: number, x2: number }[] = [];

        // 1. Collect all raw edges
        rooms.forEach(r => {
            // West & East
            verticalLines.push({ x: r.x, y1: r.y, y2: r.y + r.height });
            verticalLines.push({ x: r.x + r.width, y1: r.y, y2: r.y + r.height });
            // North & South
            horizontalLines.push({ y: r.y, x1: r.x, x2: r.x + r.width });
            horizontalLines.push({ y: r.y + r.height, x1: r.x, x2: r.x + r.width });
        });

        const finalSegments: WallSegment[] = [];
        const TOLERANCE = 2;

        // Filter elements that cut walls (Openings AND Doors)
        // This ensures the black wall line doesn't run through a door.
        const wallCutters = elements.filter(el => 
            ['wall_opening', 'door', 'entry_door', 'sliding_door'].includes(el.type)
        );

        // Helper to process lines (Scanline Algorithm)
        const processLines = (lines: { pos: number, start: number, end: number }[], isVertical: boolean) => {
            const groups: Record<number, number[]> = {};
            lines.forEach(l => {
                const key = Math.round(l.pos); 
                if (!groups[key]) groups[key] = [];
                groups[key].push(l.start);
                groups[key].push(l.end);
            });

            Object.entries(groups).forEach(([posKey, points]) => {
                const pos = Number(posKey);
                const uniquePoints = Array.from(new Set(points)).sort((a, b) => a - b);
                
                for (let i = 0; i < uniquePoints.length - 1; i++) {
                    const start = uniquePoints[i];
                    const end = uniquePoints[i+1];
                    const mid = (start + end) / 2;
                    
                    if (end - start < 1) continue; 

                    let count = 0;
                    rooms.forEach(r => {
                        const buffer = 5;
                        if (isVertical) {
                            const onLeft = Math.abs(r.x - pos) < TOLERANCE;
                            const onRight = Math.abs((r.x + r.width) - pos) < TOLERANCE;
                            const inY = mid > r.y - buffer && mid < r.y + r.height + buffer;
                            if ((onLeft || onRight) && inY) count++;
                        } else {
                            const onTop = Math.abs(r.y - pos) < TOLERANCE;
                            const onBottom = Math.abs((r.y + r.height) - pos) < TOLERANCE;
                            const inX = mid > r.x - buffer && mid < r.x + r.width + buffer;
                            if ((onTop || onBottom) && inX) count++;
                        }
                    });

                    if (count > 0) {
                        // This is a candidate wall segment [start, end]
                        // NOW: Subtract openings
                        let currentStart = start;
                        
                        // Find holes that align with this wall
                        const thickness = count >= 2 ? WALL_THICKNESS_INT : WALL_THICKNESS_EXT;

                        const holes = wallCutters.filter(el => {
                            const bounds = getAbsoluteBounds(el);
                            // INCREASED TOLERANCE here to catch misaligned openings
                            const boundsTol = 15; 
                            if (isVertical) {
                                // Check if hole X overlaps with wall X (pos)
                                const overlapsX = pos >= bounds.x - boundsTol && pos <= bounds.x + bounds.w + boundsTol;
                                return overlapsX;
                            } else {
                                // Check if hole Y overlaps with wall Y (pos)
                                const overlapsY = pos >= bounds.y - boundsTol && pos <= bounds.y + bounds.h + boundsTol;
                                return overlapsY;
                            }
                        }).map(el => {
                            const bounds = getAbsoluteBounds(el);
                            return isVertical 
                                ? { start: bounds.y, end: bounds.y + bounds.h }
                                : { start: bounds.x, end: bounds.x + bounds.w };
                        }).sort((a, b) => a.start - b.start);

                        // Subtract intervals
                        for (const hole of holes) {
                            if (hole.start > end || hole.end < currentStart) continue; // Out of range
                            
                            // Clip hole to segment
                            const hStart = Math.max(currentStart, hole.start);
                            const hEnd = Math.min(end, hole.end);

                            if (hStart > currentStart + 1) {
                                // Draw segment before hole
                                finalSegments.push({
                                    x1: isVertical ? pos : currentStart,
                                    y1: isVertical ? currentStart : pos,
                                    x2: isVertical ? pos : hStart,
                                    y2: isVertical ? hStart : pos,
                                    thickness,
                                    isVertical
                                });
                            }
                            // Move cursor past hole
                            currentStart = Math.max(currentStart, hEnd);
                        }

                        // Draw remaining segment
                        if (end > currentStart + 1) {
                            finalSegments.push({
                                x1: isVertical ? pos : currentStart,
                                y1: isVertical ? currentStart : pos,
                                x2: isVertical ? pos : end,
                                y2: isVertical ? end : pos,
                                thickness,
                                isVertical
                            });
                        }
                    }
                }
            });
        };

        processLines(verticalLines.map(l => ({ pos: l.x, start: l.y1, end: l.y2 })), true);
        processLines(horizontalLines.map(l => ({ pos: l.y, start: l.x1, end: l.x2 })), false);

        return finalSegments;
    }, [rooms, elements]);

    return (
        <g pointerEvents="none">
            {/* Pass 1: Black Base */}
            {segments.map((seg, i) => (
                <line 
                    key={`base-${i}`}
                    x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                    stroke={isVivid ? "#334155" : "black"}
                    strokeWidth={seg.thickness}
                    strokeLinecap="round"
                />
            ))}
            {/* Pass 2: White Inset */}
            {segments.map((seg, i) => (
                <line 
                    key={`inset-${i}`}
                    x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                    stroke={isVivid ? "#f8fafc" : "white"}
                    strokeWidth={Math.max(0, seg.thickness - 3)} 
                    strokeLinecap="round"
                />
            ))}
        </g>
    );
};
