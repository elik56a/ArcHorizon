
import React, { useMemo } from 'react';
import { SketchData, Room } from '../../types';
import { Layout } from 'lucide-react';

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

        // Calculate Bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        visibleRooms.forEach(r => {
            if (r.x < minX) minX = r.x;
            if (r.y < minY) minY = r.y;
            if (r.x + r.width > maxX) maxX = r.x + r.width;
            if (r.y + r.height > maxY) maxY = r.y + r.height;
        });

        // Add padding
        const padding = 150;
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Ensure square aspect ratio logic or just fit
        // Using straight ViewBox based on bounds
        return {
            viewBox: `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`,
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

    const getRoomColor = (type: string) => {
        switch (type) {
            case 'garden': return '#f0fdf4'; // Green-50
            case 'pool': return '#cffafe';   // Cyan-100
            case 'parking': return '#f3f4f6'; // Gray-100
            case 'terrace': 
            case 'balcony': return '#fafafa'; // Gray-50
            default: return '#ffffff';        // White
        }
    };

    const getStrokeColor = (type: string) => {
        if (['garden', 'pool'].includes(type)) return 'transparent';
        return '#1e293b'; // Slate-800
    };

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
                {rooms.map(room => (
                    <g key={room.id}>
                        {/* Floor */}
                        <rect 
                            x={room.x} 
                            y={room.y} 
                            width={room.width} 
                            height={room.height} 
                            fill={getRoomColor(room.type)}
                            stroke="none"
                        />
                        {/* Walls (Simplified) */}
                        {/* Don't draw strokes for landscape elements to keep it clean */}
                        {!['garden', 'pool'].includes(room.type) && (
                            <rect 
                                x={room.x} 
                                y={room.y} 
                                width={room.width} 
                                height={room.height} 
                                fill="none"
                                stroke="#334155"
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
                ))}
            </svg>
        </div>
    );
};