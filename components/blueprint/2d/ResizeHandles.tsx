
import React from 'react';

interface ResizeHandlesProps {
    width: number;
    height: number;
    onResizeStart: (e: React.MouseEvent, handle: string) => void;
    onTouchStart?: (e: React.TouchEvent, handle: string) => void;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({ width, height, onResizeStart, onTouchStart }) => {
    const handleSize = 15; 
    const strokeW = 2;
    const handles = [
        {x: 0, y: 0, c: 'nw-resize', n: 'nw'}, {x: width/2, y: 0, c: 'n-resize', n: 'n'}, {x: width, y: 0, c: 'ne-resize', n: 'ne'},
        {x: width, y: height/2, c: 'e-resize', n: 'e'}, {x: width, y: height, c: 'se-resize', n: 'se'}, {x: width/2, y: height, c: 's-resize', n: 's'},
        {x: 0, y: height, c: 'sw-resize', n: 'sw'}, {x: 0, y: height/2, c: 'w-resize', n: 'w'}
    ];

    return (
        <g>
            <rect x={0} y={0} width={width} height={height} fill="none" stroke="#2563eb" strokeWidth={strokeW} strokeDasharray="10,10" pointerEvents="none"/>
            {handles.map(h => (
                <rect 
                    key={h.n} 
                    x={h.x - handleSize/2} 
                    y={h.y - handleSize/2} 
                    width={handleSize} 
                    height={handleSize} 
                    fill="white" 
                    stroke="#2563eb" 
                    strokeWidth={strokeW} 
                    style={{ cursor: h.c }} 
                    onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, h.n); }}
                    onTouchStart={(e) => { e.stopPropagation(); if(onTouchStart) onTouchStart(e, h.n); }}
                />
            ))}
        </g>
    );
};