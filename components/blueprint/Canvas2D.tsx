
import React, { useMemo } from 'react';
import { SketchData, Room, ArchitecturalElement } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { Render2DElement } from './ElementRenderer';

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

// --- COMPONENT: GLOBAL WALL RENDERER ---
// Merges all adjacent room walls into a single set of segments to prevent double-drawing
interface WallSegment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    thickness: number;
    isVertical: boolean;
}

const GlobalWallRenderer: React.FC<{ rooms: Room[] }> = ({ rooms }) => {
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

        // Helper to process lines (Scanline Algorithm)
        const processLines = (lines: { pos: number, start: number, end: number }[], isVertical: boolean) => {
            // Group by position (X for vert, Y for horz)
            const groups: Record<number, number[]> = {};
            lines.forEach(l => {
                // Snap to grid/tolerance to group effectively
                const key = Math.round(l.pos); 
                if (!groups[key]) groups[key] = [];
                groups[key].push(l.start);
                groups[key].push(l.end);
            });

            Object.entries(groups).forEach(([posKey, points]) => {
                const pos = Number(posKey);
                const uniquePoints = Array.from(new Set(points)).sort((a, b) => a - b);
                
                // Iterate through intervals defined by unique points
                for (let i = 0; i < uniquePoints.length - 1; i++) {
                    const start = uniquePoints[i];
                    const end = uniquePoints[i+1];
                    const mid = (start + end) / 2;
                    
                    if (end - start < 1) continue; // Skip tiny fragments

                    // Check how many rooms claim this segment edge
                    let count = 0;
                    rooms.forEach(r => {
                        // Use a small buffer to detect occupancy
                        const buffer = 5;
                        if (isVertical) {
                            // Check if this X corresponds to a Left or Right edge of Room R
                            // AND if the Y-interval is within Room R's Y-range
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
                        const thickness = count >= 2 ? WALL_THICKNESS_INT : WALL_THICKNESS_EXT;
                        finalSegments.push({
                            x1: isVertical ? pos : start,
                            y1: isVertical ? start : pos,
                            x2: isVertical ? pos : end,
                            y2: isVertical ? end : pos,
                            thickness,
                            isVertical
                        });
                    }
                }
            });
        };

        processLines(verticalLines.map(l => ({ pos: l.x, start: l.y1, end: l.y2 })), true);
        processLines(horizontalLines.map(l => ({ pos: l.y, start: l.x1, end: l.x2 })), false);

        return finalSegments;
    }, [rooms]);

    // Render two passes: Black Base, then White Inset
    return (
        <g pointerEvents="none">
            {/* Pass 1: Black Base (Full Thickness) */}
            {segments.map((seg, i) => (
                <line 
                    key={`base-${i}`}
                    x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                    stroke="black"
                    strokeWidth={seg.thickness}
                    strokeLinecap="square"
                />
            ))}
            {/* Pass 2: White Inset (Thickness - 3px for border) */}
            {segments.map((seg, i) => (
                <line 
                    key={`inset-${i}`}
                    x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                    stroke="white"
                    strokeWidth={Math.max(0, seg.thickness - 3)} // 1.5px border on each side
                    strokeLinecap="square"
                />
            ))}
            
            {/* Labels for Thickness */}
            {segments.map((seg, i) => {
                if (Math.abs(seg.x2 - seg.x1) < 50 && Math.abs(seg.y2 - seg.y1) < 50) return null; // Skip short walls
                const mx = (seg.x1 + seg.x2) / 2;
                const my = (seg.y1 + seg.y2) / 2;
                return (
                    <text 
                        key={`lbl-${i}`}
                        x={mx} 
                        y={my} 
                        fontSize={8} 
                        fontWeight="bold" 
                        textAnchor="middle" 
                        dominantBaseline="middle"
                        transform={seg.isVertical ? `rotate(-90 ${mx} ${my})` : undefined}
                        fill="black"
                    >
                        {seg.thickness}
                    </text>
                );
            })}
        </g>
    );
};

// --- COMPONENT: GLOBAL DIMENSION CHAINS ---
const GlobalDimensionChains: React.FC<{ rooms: Room[], unitSystem: any }> = ({ rooms, unitSystem }) => {
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

  // Separate functional rooms from landscape
  const builtRooms = visibleRooms.filter(r => !['garden', 'parking', 'pool'].includes(r.type));
  const landscapeRooms = visibleRooms.filter(r => ['garden', 'parking', 'pool'].includes(r.type));

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

            <GlobalDimensionChains rooms={builtRooms} unitSystem={unitSystem} />

            {/* LAYER 1: FLOORS (Background Colors) */}
            {visibleRooms.map((room) => {
               let fill = room.color || "white";
               if (room.type === 'garden') fill = "#f0fdf4";
               if (room.type === 'pool') fill = "#ecfeff";
               if (room.type === 'parking') fill = "#f9fafb";
               return (
                <g 
                    key={`floor-${room.id}`} 
                    transform={`translate(${room.x}, ${room.y})`}
                    onMouseDown={(e) => { e.preventDefault(); onMouseDown(e, room.id, 'room', room.x, room.y); }}
                >
                    <rect width={room.width} height={room.height} fill={fill} stroke="none" />
                </g>
            )})}

            {/* LAYER 2: MERGED WALLS (Global) */}
            <GlobalWallRenderer rooms={builtRooms} />

            {/* LAYER 3: ROOM LABELS (Rendered after walls but before elements) */}
            {builtRooms.map((room) => {
               const isSelected = room.id === selectedId;
               const isSmallRoom = Math.min(room.width, room.height) < 200;
               const textX = room.labelX !== undefined ? room.labelX : room.x + room.width / 2;
               const textY = room.labelY !== undefined ? room.labelY : room.y + room.height / 2;

               return (
                <g key={`label-${room.id}`}>
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
                  {isSelected && (
                      <g transform={`translate(${room.x}, ${room.y})`}>
                         <ResizeHandles width={room.width} height={room.height} onResizeStart={(e, h) => onMouseDown(e, room.id, 'room', 0, 0, h)}/>
                      </g>
                  )}
                </g>
            )})}

            {/* LAYER 4: ELEMENTS (Windows/Doors cut the walls) */}
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
