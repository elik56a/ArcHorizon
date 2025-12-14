
import React, { useMemo } from 'react';
import { SketchData } from '../../types';
import { Layout } from 'lucide-react';
import { getRoomBounds } from '../../services/geometry/engine/utils';
import { getRoomStyle } from '../../config/visualStyles';

interface ProjectThumbnailProps {
    data: SketchData;
    className?: string;
}

export const ProjectThumbnail: React.FC<ProjectThumbnailProps> = ({ data, className = "" }) => {
    // 1. Memoize calculation to avoid re-computing on every render
    const { viewBox, rooms } = useMemo(() => {
        if (!data || !data.rooms || data.rooms.length === 0) {
            return { viewBox: "0 0 100 100", rooms: [] };
        }

        // Filter for Ground Floor (Floor 1 or lowest available)
        const floors = Array.from(new Set(data.rooms.map(r => r.floor))).sort((a: number, b: number) => a - b);
        const targetFloor = floors[0] || 1;
        const visibleRooms = data.rooms.filter(r => r.floor === targetFloor);

        if (visibleRooms.length === 0) return { viewBox: "0 0 100 100", rooms: [] };

        // Use centralized geometry utility
        const bounds = getRoomBounds(visibleRooms);

        // Add padding
        const padding = 150;
        
        // Ensure square aspect ratio logic or just fit using ViewBox based on bounds
        return {
            viewBox: `${bounds.x - padding} ${bounds.y - padding} ${bounds.w + padding * 2} ${bounds.h + padding * 2}`,
            rooms: visibleRooms
        };
    }, [data]);

    if (rooms.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-gray-50 text-gray-300 ${className}`}>
                <Layout size={32} />
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden bg-[#f0f2f5] ${className}`}>
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
            </div>
            
            <svg 
                viewBox={viewBox} 
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {rooms.map(room => {
                    const style = getRoomStyle(room.type, 'standard', room.color);
                    
                    return (
                        <g key={room.id}>
                            {/* Floor */}
                            <rect 
                                x={room.x} 
                                y={room.y} 
                                width={room.width} 
                                height={room.height} 
                                fill={style.fill}
                                stroke="none"
                            />
                            {/* Walls (Simplified) */}
                            {style.stroke !== 'transparent' && (
                                <rect 
                                    x={room.x} 
                                    y={room.y} 
                                    width={room.width} 
                                    height={room.height} 
                                    fill="none"
                                    stroke={style.stroke}
                                    strokeWidth={15} // Thicker lines for small thumbnail visibility
                                />
                            )}
                            {/* Pool Water Details */}
                            {room.type === 'pool' && (
                                <rect 
                                    x={room.x + 20} 
                                    y={room.y + 20} 
                                    width={room.width - 40} 
                                    height={room.height - 40} 
                                    fill="#06b6d4" 
                                    opacity={0.3}
                                />
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
