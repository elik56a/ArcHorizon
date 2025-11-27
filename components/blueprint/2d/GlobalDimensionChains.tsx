
import React from 'react';
import { Room } from '../../../types';
import { DimensionLine } from './DimensionLine';

export const GlobalDimensionChains: React.FC<{ rooms: Room[], unitSystem: any }> = ({ rooms, unitSystem }) => {
    if (rooms.length === 0) return null;

    const xLines = new Set<number>();
    const yLines = new Set<number>();
    rooms.forEach(r => {
        xLines.add(r.x);
        xLines.add(r.x + r.width);
        yLines.add(r.y);
        yLines.add(r.y + r.height);
    });

    const sortedX = Array.from(xLines).sort((a,b) => a-b);
    const sortedY = Array.from(yLines).sort((a,b) => a-b);

    const cleanX = sortedX.filter((x, i) => i === 0 || x - sortedX[i-1] > 20);
    const cleanY = sortedY.filter((y, i) => i === 0 || y - sortedY[i-1] > 20);

    const minX = cleanX[0];
    const minY = cleanY[0];

    const TOP_OFFSET = minY - 60;
    const LEFT_OFFSET = minX - 60;

    return (
        <g pointerEvents="none">
            {cleanX.map((x, i) => {
                if (i === cleanX.length - 1) return null;
                const nextX = cleanX[i+1];
                return (
                    <React.Fragment key={`dim-x-${i}`}>
                        <DimensionLine x1={x} y1={TOP_OFFSET} x2={nextX} y2={TOP_OFFSET} value={nextX - x} offset={0} unitSystem={unitSystem} isChain />
                        <line x1={x} y1={TOP_OFFSET} x2={x} y2={minY} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4,4" />
                        {i === cleanX.length - 2 && <line x1={nextX} y1={TOP_OFFSET} x2={nextX} y2={minY} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4,4" />}
                    </React.Fragment>
                );
            })}

            {cleanY.map((y, i) => {
                if (i === cleanY.length - 1) return null;
                const nextY = cleanY[i+1];
                return (
                    <React.Fragment key={`dim-y-${i}`}>
                        <DimensionLine x1={LEFT_OFFSET} y1={y} x2={LEFT_OFFSET} y2={nextY} value={nextY - y} offset={0} unitSystem={unitSystem} isChain />
                        <line x1={LEFT_OFFSET} y1={y} x2={minX} y2={y} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4,4" />
                        {i === cleanY.length - 2 && <line x1={LEFT_OFFSET} y1={nextY} x2={minX} y2={nextY} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4,4" />}
                    </React.Fragment>
                );
            })}
        </g>
    );
};
