
import React from 'react';
import { SketchData, Room, ArchitecturalElement } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { Render2DElement } from './ElementRenderer';
import { isExteriorWall } from '../../services/geometryEngine';

// PHYSICS-BASED RENDERING CONSTANTS (Units = CM)
const WALL_THICKNESS_EXT = 25; 
const WALL_THICKNESS_INT = 20;
const ROOM_LABEL_SIZE = 14; 
const ROOM_SUB_LABEL_SIZE = 10; 
const GRID_SIZE = 100; 

interface Canvas2DProps {
  svgRef: React.RefObject<SVGSVGElement>;
  data: SketchData;
  activeFloor: number;
  pan: { x: number, y: number };
  scale: number;
  rotation: number;
  onMouseDown: (e: React.MouseEvent, id?: string, type?: 'room' | 'element', x?: number, y?: number, resizeHandle?: string) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  bounds: { minX: number, maxX: number, minY: number, maxY: number };
  selectedId?: string;
}

// --- COMPONENT: DIMENSION LINE ---
const DimensionLine: React.FC<{x1: number, y1: number, x2: number, y2: number, value: number, offset?: number, unitSystem: 'metric' | 'imperial', isChain?: boolean}> = ({ x1, y1, x2, y2, value, offset = 20, unitSystem, isChain }) => {
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
        return (cm / 100).toFixed(2); // Just number for chains
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

// --- COMPONENT: SMART ARCHITECTURAL WALL ---
// Renders 4 separate polygons to handle variable thickness correctly
const SmartWall: React.FC<{ room: Room, elements: ArchitecturalElement[], allRooms: Room[] }> = ({ room, elements, allRooms }) => {
    
    const isExtN = isExteriorWall(room, 'north', allRooms);
    const isExtS = isExteriorWall(room, 'south', allRooms);
    const isExtW = isExteriorWall(room, 'west', allRooms);
    const isExtE = isExteriorWall(room, 'east', allRooms);

    const tN = isExtN ? WALL_THICKNESS_EXT : WALL_THICKNESS_INT;
    const tS = isExtS ? WALL_THICKNESS_EXT : WALL_THICKNESS_INT;
    const tW = isExtW ? WALL_THICKNESS_EXT : WALL_THICKNESS_INT;
    const tE = isExtE ? WALL_THICKNESS_EXT : WALL_THICKNESS_INT;

    // Helper to check if center of wall is obstructed by window/door
    const isObstructed = (wall: 'n' | 's' | 'w' | 'e') => {
        const cx = room.x + room.width/2;
        const cy = room.y + room.height/2;
        return elements.some(el => {
            if (el.roomId !== room.id) return false;
            const elCx = el.x + el.width/2;
            const elCy = el.y + el.height/2;
            if (wall === 'n') return Math.abs(el.y - room.y) < 20 && Math.abs(elCx - cx) < 60;
            if (wall === 's') return Math.abs(el.y - (room.y + room.height)) < 20 && Math.abs(elCx - cx) < 60;
            if (wall === 'w') return Math.abs(el.x - room.x) < 20 && Math.abs(elCy - cy) < 60;
            if (wall === 'e') return Math.abs(el.x - (room.x + room.width)) < 20 && Math.abs(elCy - cy) < 60;
            return false;
        });
    };

    // Generate Path Data for "Ring" Style (Double Line Wall)
    // Using fill-rule="evenodd" to create a hole
    const outerPath = `M 0 0 H ${room.width} V ${room.height} H 0 Z`;
    const innerPath = `M ${tW} ${tN} H ${room.width - tE} V ${room.height - tS} H ${tW} Z`;

    return (
        <g pointerEvents="none">
            {/* The Wall "Ring" - White Body, Black Edges */}
            <path 
                d={`${outerPath} ${innerPath}`} 
                fillRule="evenodd" 
                fill="white" 
                stroke="black" 
                strokeWidth={2} 
                vectorEffect="non-scaling-stroke"
            />

            {/* Thickness Labels */}
            {/* Only show if room is big enough */}
            {room.width > 100 && (
                <>
                    {/* North */}
                    <text x={isObstructed('n') ? room.width * 0.75 : room.width * 0.5} y={tN/2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="black" fontWeight="bold" className="select-none pointer-events-none">{tN}</text>
                    {/* South */}
                    <text x={isObstructed('s') ? room.width * 0.25 : room.width * 0.5} y={room.height - tS/2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="black" fontWeight="bold" className="select-none pointer-events-none">{tS}</text>
                </>
            )}
            {room.height > 100 && (
                <>
                    {/* West */}
                    <text x={tW/2} y={isObstructed('w') ? room.height * 0.75 : room.height * 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="black" fontWeight="bold" transform={`rotate(-90 ${tW/2} ${isObstructed('w') ? room.height * 0.75 : room.height * 0.5})`} className="select-none pointer-events-none">{tW}</text>
                    {/* East */}
                    <text x={room.width - tE/2} y={isObstructed('e') ? room.height * 0.25 : room.height * 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="black" fontWeight="bold" transform={`rotate(-90 ${room.width - tE/2} ${isObstructed('e') ? room.height * 0.25 : room.height * 0.5})`} className="select-none pointer-events-none">{tE}</text>
                </>
            )}
        </g>
    );
};

// --- COMPONENT: GLOBAL DIMENSION CHAINS ---
const GlobalDimensionChains: React.FC<{ rooms: Room[], unitSystem: any }> = ({ rooms, unitSystem }) => {
    if (rooms.length === 0) return null;

    // 1. Get Grid Lines
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

    // Filter close lines (snap tolerance)
    const cleanX = sortedX.filter((x, i) => i === 0 || x - sortedX[i-1] > 20);
    const cleanY = sortedY.filter((y, i) => i === 0 || y - sortedY[i-1] > 20);

    const minX = cleanX[0];
    const maxX = cleanX[cleanX.length-1];
    const minY = cleanY[0];
    const maxY = cleanY[cleanY.length-1];

    const TOP_OFFSET = minY - 60;
    const LEFT_OFFSET = minX - 60;

    return (
        <g pointerEvents="none">
            {/* Top Chain */}
            {cleanX.map((x, i) => {
                if (i === cleanX.length - 1) return null;
                const nextX = cleanX[i+1];
                return (
                    <React.Fragment key={`dim-x-${i}`}>
                        <DimensionLine x1={x} y1={TOP_OFFSET} x2={nextX} y2={TOP_OFFSET} value={nextX - x} offset={0} unitSystem={unitSystem} isChain />
                        {/* Tick Lines extending to building */}
                        <line x1={x} y1={TOP_OFFSET} x2={x} y2={minY} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4,4" />
                        {i === cleanX.length - 2 && <line x1={nextX} y1={TOP_OFFSET} x2={nextX} y2={minY} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4,4" />}
                    </React.Fragment>
                );
            })}

            {/* Left Chain */}
            {cleanY.map((y, i) => {
                if (i === cleanY.length - 1) return null;
                const nextY = cleanY[i+1];
                return (
                    <React.Fragment key={`dim-y-${i}`}>
                        <DimensionLine x1={LEFT_OFFSET} y1={y} x2={LEFT_OFFSET} y2={nextY} value={nextY - y} offset={0} unitSystem={unitSystem} isChain />
                        {/* Tick Lines */}
                        <line x1={LEFT_OFFSET} y1={y} x2={minX} y2={y} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4,4" />
                        {i === cleanY.length - 2 && <line x1={LEFT_OFFSET} y1={nextY} x2={minX} y2={nextY} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4,4" />}
                    </React.Fragment>
                );
            })}
        </g>
    );
};

const ResizeHandles: React.FC<{width: number, height: number, onResizeStart: (e: React.MouseEvent, handle: string) => void}> = ({ width, height, onResizeStart }) => {
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
                <rect key={h.n} x={h.x - handleSize/2} y={h.y - handleSize/2} width={handleSize} height={handleSize} fill="white" stroke="#2563eb" strokeWidth={strokeW} style={{ cursor: h.c }} onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, h.n); }}/>
            ))}
        </g>
    );
};

const Canvas2D: React.FC<Canvas2DProps> = ({
  svgRef, data, activeFloor, pan, scale, rotation, 
  onMouseDown, onMouseMove, onMouseUp, onWheel, bounds, selectedId
}) => {
  const { unitSystem } = useProjectStore();
  
  const visibleRooms = data.rooms.filter(r => r.floor === activeFloor);
  const visibleElements = data.elements.filter(e => e.floor === activeFloor);

  const getAreaText = (width: number, height: number) => {
      const areaSqm = (width * height) / 10000;
      if (unitSystem === 'imperial') {
          return `${Math.round(areaSqm * 10.764)} sq ft`;
      }
      return `${Math.round(areaSqm)}m²`;
  };

  return (
      <svg
          ref={svgRef}
          className="w-full h-full bg-white touch-none"
          style={{ cursor: 'default' }}
          onMouseDown={(e) => onMouseDown(e)}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <defs>
            <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#f3f4f6" strokeWidth={2}/>
            </pattern>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) rotate(${rotation}) scale(${scale})`}>
            <rect x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid)" />

            {/* Global Dimensions */}
            <GlobalDimensionChains rooms={visibleRooms.filter(r => !['garden', 'parking', 'pool'].includes(r.type))} unitSystem={unitSystem} />

            {/* LAYER 1: FLOORS (Background Colors) */}
            {visibleRooms.map((room) => {
               let fill = room.color || "white";
               if (room.type === 'garden') fill = "#f0fdf4";
               if (room.type === 'pool') fill = "#ecfeff";
               if (room.type === 'parking') fill = "#f9fafb";
               return (
                <g key={`floor-${room.id}`} transform={`translate(${room.x}, ${room.y})`}>
                    <rect width={room.width} height={room.height} fill={fill} stroke="none" />
                </g>
            )})}

            {/* LAYER 2: WALLS (Smart Hollow Walls) */}
            {visibleRooms.map((room) => {
               if (['garden', 'pool', 'parking'].includes(room.type)) return null;
               const isSelected = room.id === selectedId;
               const isSmallRoom = Math.min(room.width, room.height) < 200;
               const textX = room.labelX !== undefined ? (room.labelX - room.x) : room.width / 2;
               const textY = room.labelY !== undefined ? (room.labelY - room.y) : room.height / 2;

               return (
                <g
                  key={`wall-${room.id}`}
                  transform={`translate(${room.x}, ${room.y})`}
                  onMouseDown={(e) => { e.preventDefault(); onMouseDown(e, room.id, 'room', room.x, room.y); }}
                  style={{ cursor: isSelected ? "move" : "pointer" }}
                >
                  {/* Replaced simple Wall with SmartWall that handles thickness */}
                  <SmartWall room={room} elements={visibleElements} allRooms={data.rooms.filter(r => r.floor === activeFloor)} />

                  {/* Room Label */}
                  <g transform={`translate(${textX}, ${textY})`}>
                        <text y={isSmallRoom ? 5 : -5} textAnchor="middle" fontSize={ROOM_LABEL_SIZE} fontWeight="bold" fill="black" className="uppercase pointer-events-none font-mono tracking-widest">
                        {room.name}
                        </text>
                        {!isSmallRoom && (
                            <text y={18} textAnchor="middle" fontSize={ROOM_SUB_LABEL_SIZE} fill="#6b7280" className="pointer-events-none font-mono">
                            {getAreaText(room.width, room.height)}
                            </text>
                        )}
                  </g>

                  {/* Hit Area */}
                  <rect width={room.width} height={room.height} fill="transparent" stroke="none" />
                  {isSelected && <ResizeHandles width={room.width} height={room.height} onResizeStart={(e, h) => onMouseDown(e, room.id, 'room', 0, 0, h)}/>}
                </g>
            )})}

            {/* LAYER 3: ELEMENTS (Windows/Doors cut the walls) */}
            {visibleElements.map((el) => {
               const isSelected = el.id === selectedId;
               return (
                  <g 
                    key={el.id} 
                    transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation}, ${el.width/2}, ${el.height/2})`}
                    onMouseDown={(e) => { e.preventDefault(); onMouseDown(e, el.id, 'element', el.x, el.y); }}
                    style={{ cursor: isSelected ? "move" : "pointer" }}
                    className="hover:opacity-80"
                  >
                      <Render2DElement el={el} isSelected={isSelected} />
                      {isSelected && <ResizeHandles width={el.width} height={el.height} onResizeStart={(e, h) => onMouseDown(e, el.id, 'element', 0, 0, h)}/>}
                  </g>
               );
            })}
          </g>
      </svg>
  );
};

export default Canvas2D;
