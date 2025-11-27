
import React from 'react';

interface DimensionLineProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    value: number;
    offset?: number;
    unitSystem: 'metric' | 'imperial';
    isChain?: boolean;
}

export const DimensionLine: React.FC<DimensionLineProps> = ({ x1, y1, x2, y2, value, offset = 20, unitSystem, isChain }) => {
    if (value < 10) return null;
    const isVertical = Math.abs(x1 - x2) < 1;
    const angle = isVertical ? -90 : 0;
    const tickSize = isChain ? 6 : 8; 
    const strokeWidth = isChain ? 1 : 1.5; 
    const fontSize = isChain ? 10 : 14;
    const dx = x2 - x1; const dy = y2 - y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    const nx = -dy / len; const ny = dx / len;
    const offX = nx * offset; const offY = ny * offset;
    const sx1 = x1 + offX; const sy1 = y1 + offY;
    const sx2 = x2 + offX; const sy2 = y2 + offY;
    const mx = (sx1 + sx2) / 2; const my = (sy1 + sy2) / 2;

    const formatDimension = (cm: number) => {
        if (unitSystem === 'imperial') {
            const totalFeet = cm * 0.0328084;
            const feet = Math.floor(totalFeet);
            const inches = Math.round((totalFeet - feet) * 12);
            return `${feet}'${inches}"`;
        }
        return (cm / 100).toFixed(2);
    };

    return (
        <g className="pointer-events-none select-none">
            {!isChain && <line x1={x1} y1={y1} x2={sx1 + nx * 5} y2={sy1 + ny * 5} stroke="#e5e7eb" strokeWidth={1} />}
            {!isChain && <line x1={x2} y1={y2} x2={sx2 + nx * 5} y2={sy2 + ny * 5} stroke="#e5e7eb" strokeWidth={1} />}
            
            <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke="#4b5563" strokeWidth={strokeWidth} />
            <line x1={sx1 - nx*tickSize} y1={sy1 - ny*tickSize} x2={sx1 + nx*tickSize} y2={sy1 + ny*tickSize} stroke="#4b5563" strokeWidth={strokeWidth} transform={`rotate(45 ${sx1} ${sy1})`} />
            <line x1={sx2 - nx*tickSize} y1={sy2 - ny*tickSize} x2={sx2 + nx*tickSize} y2={sy2 + ny*tickSize} stroke="#4b5563" strokeWidth={strokeWidth} transform={`rotate(45 ${sx2} ${sy2})`} />
            
            <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle" fill="#4b5563" fontSize={fontSize} fontFamily="JetBrains Mono, monospace" fontWeight="500" transform={`rotate(${angle} ${mx} ${my}) translate(0, -${isChain ? 6 : 8})`}>
                {formatDimension(value)}
            </text>
        </g>
    );
};
