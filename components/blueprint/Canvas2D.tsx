
import React from 'react';
import { SketchData, Room } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';

const WALL_STROKE_WIDTH = 15;
const DIM_COLOR = "#444";
const DIM_FONT_SIZE = 12;

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

// Helper to format dimensions based on unit system
const formatDimension = (cm: number, unitSystem: 'metric' | 'imperial') => {
    if (unitSystem === 'imperial') {
        const totalFeet = cm * 0.0328084;
        const feet = Math.floor(totalFeet);
        const inches = Math.round((totalFeet - feet) * 12);
        return `${feet}' ${inches}"`;
    }
    return Math.round(cm).toString();
};

const DimensionLine: React.FC<{x1: number, y1: number, x2: number, y2: number, value: number, offset?: number, unitSystem: 'metric' | 'imperial'}> = ({ x1, y1, x2, y2, value, offset = 20, unitSystem }) => {
    const isVertical = Math.abs(x1 - x2) < 1;
    const angle = isVertical ? -90 : 0;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    
    const dx = isVertical ? offset : 0;
    const dy = isVertical ? 0 : offset;

    const sx1 = x1 - dx; const sy1 = y1 - dy;
    const sx2 = x2 - dx; const sy2 = y2 - dy;

    return (
        <g className="pointer-events-none">
            <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke={DIM_COLOR} strokeWidth="0.5" />
            <line x1={sx1 - (isVertical?4:0)} y1={sy1 - (isVertical?0:4)} x2={sx1 + (isVertical?4:0)} y2={sy1 + (isVertical?0:4)} stroke={DIM_COLOR} strokeWidth="1.5" transform={`rotate(45 ${sx1} ${sy1})`} />
            <line x1={sx2 - (isVertical?4:0)} y1={sy2 - (isVertical?0:4)} x2={sx2 + (isVertical?4:0)} y2={sy2 + (isVertical?0:4)} stroke={DIM_COLOR} strokeWidth="1.5" transform={`rotate(45 ${sx2} ${sy2})`} />
            <line x1={x1} y1={y1} x2={sx1} y2={sy1} stroke={DIM_COLOR} strokeWidth="0.2" strokeDasharray="4,2" />
            <line x1={x2} y1={y2} x2={sx2} y2={sy2} stroke={DIM_COLOR} strokeWidth="0.2" strokeDasharray="4,2" />
            <text x={mx - dx - (isVertical?5:0)} y={my - dy - (isVertical?0:5)} textAnchor="middle" fill={DIM_COLOR} fontSize={DIM_FONT_SIZE} fontFamily="monospace" fontWeight="bold" transform={`rotate(${angle} ${mx - dx} ${my - dy})`}>
                {formatDimension(value, unitSystem)}
            </text>
        </g>
    );
};

interface ResizeHandlesProps {
    width: number;
    height: number;
    rotation: number;
    onResizeStart: (e: React.MouseEvent, handle: string) => void;
    scale: number;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ width, height, rotation, onResizeStart, scale }) => {
    const handleSize = 8 / scale; // Keep constant visual size
    const offset = handleSize / 2;
    const cursors = ['n-resize', 'ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize', 'nw-resize'];
    const getCursor = (baseIndex: number) => {
        const rotSteps = Math.round(rotation / 45);
        const index = (baseIndex + rotSteps + 8) % 8;
        return cursors[index];
    };

    const handles = [
        [width/2, 0, 0, 'n'], [width, 0, 1, 'ne'], [width, height/2, 2, 'e'], [width, height, 3, 'se'],
        [width/2, height, 4, 's'], [0, height, 5, 'sw'], [0, height/2, 6, 'w'], [0, 0, 7, 'nw']
    ] as const;

    return (
        <g>
            <rect x={0} y={0} width={width} height={height} fill="none" stroke="#3b82f6" strokeWidth={1/scale} strokeDasharray={`${4/scale},${4/scale}`} pointerEvents="none"/>
            {handles.map(([x, y, baseIdx, name]) => (
                <rect 
                    key={name}
                    x={x - offset}
                    y={y - offset}
                    width={handleSize}
                    height={handleSize}
                    fill="white"
                    stroke="#3b82f6"
                    strokeWidth={1.5/scale}
                    style={{ cursor: getCursor(baseIdx) }}
                    onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, name); }}
                />
            ))}
        </g>
    );
};

const Canvas2D: React.FC<Canvas2DProps> = ({
  svgRef, data, activeFloor, pan, scale, rotation, 
  onMouseDown, onMouseMove, onMouseUp, onWheel, bounds, selectedId
}) => {
  const { unitSystem } = useProjectStore(); // Access global unit preference
  
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
             {visibleRooms.map(room => (
                  <clipPath key={`clip-${room.id}`} id={`clip-${room.id}`}>
                      <rect x={room.x + 5} y={room.y + 5} width={room.width - 10} height={room.height - 10} /> 
                  </clipPath>
              ))}
            
            {/* Pattern Definitions */}
            <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
               <line x1="0" y1="0" x2="0" y2="10" stroke="#ccc" strokeWidth="1" />
            </pattern>
            <pattern id="tiles" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="none" stroke="#e5e5e5" strokeWidth="0.5" />
            </pattern>
            <pattern id="wood" width="100" height="10" patternUnits="userSpaceOnUse">
              <line x1="0" y1="10" x2="100" y2="10" stroke="#e5e5e5" strokeWidth="0.5" />
              <line x1="30" y1="0" x2="30" y2="10" stroke="#e5e5e5" strokeWidth="0.5" />
              <line x1="80" y1="0" x2="80" y2="10" stroke="#e5e5e5" strokeWidth="0.5" />
            </pattern>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f5f5f5" strokeWidth="1"/>
            </pattern>
            <pattern id="grass" width="20" height="20" patternUnits="userSpaceOnUse">
               <path d="M 2 10 L 5 2 L 8 10 M 12 15 L 15 7 L 18 15" stroke="#86efac" fill="none" strokeWidth="1" />
               <rect width="20" height="20" fill="#dcfce7" fillOpacity="0.5" />
            </pattern>
            <pattern id="parking" width="40" height="40" patternUnits="userSpaceOnUse">
               <rect width="40" height="40" fill="#f3f4f6" />
               <path d="M 0 40 L 40 0" stroke="#d1d5db" strokeWidth="2" />
            </pattern>
            <pattern id="water" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#a5f3fc" />
                <path d="M 0 10 Q 5 5 10 10 T 20 10" stroke="#0891b2" fill="none" strokeWidth="0.5" />
            </pattern>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) rotate(${rotation}) scale(${scale})`}>
            <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" />

            {/* Rooms Layer */}
            {visibleRooms.map((room) => {
               const isWetArea = ['bathroom', 'kitchen', 'balcony'].includes(room.type);
               const isLiving = ['living', 'bedroom', 'dining'].includes(room.type);
               const isGarden = room.type === 'garden';
               const isParking = room.type === 'parking';
               const isPool = room.type === 'pool';
               const isBalcony = room.type === 'balcony' || room.type === 'terrace';

               const isSelected = room.id === selectedId;
               
               // Determine Fill
               let fill = "none";
               if (room.color) fill = room.color;
               else if (isPool) fill = "url(#water)";
               else if (isGarden) fill = "url(#grass)";
               else if (isParking) fill = "url(#parking)";
               else if (isBalcony) fill = "url(#tiles)";
               else if (isWetArea) fill = "url(#tiles)";
               else if (isLiving) fill = "url(#wood)";

               // Determine Stroke (Walls)
               const strokeColor = isSelected ? "#3b82f6" : (isGarden || isParking ? "#888" : (isPool ? "#0891b2" : "black"));
               const strokeWidth = isGarden || isParking || isPool ? 2 : WALL_STROKE_WIDTH;
               
               return (
                <g
                  key={room.id}
                  transform={`translate(${room.x}, ${room.y})`}
                  onMouseDown={(e) => { e.preventDefault(); onMouseDown(e, room.id, 'room', room.x, room.y); }}
                  style={{ cursor: isSelected ? "move" : "pointer" }}
                  className="group"
                >
                  <rect
                    width={room.width}
                    height={room.height}
                    fill={isGarden ? "#f0fdf4" : "white"} 
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isGarden ? "5,5" : "none"}
                    className={isSelected ? "shadow-lg" : "shadow-sm"}
                  />
                  {/* Internal Fill Pattern */}
                  <rect 
                     x={strokeWidth/2} y={strokeWidth/2}
                     width={room.width - strokeWidth}
                     height={room.height - strokeWidth}
                     fill={fill}
                     opacity={room.opacity ?? 1}
                     pointerEvents="none"
                  />
                  
                  {/* Text Label */}
                  <text x={room.width/2} y={room.height/2} textAnchor="middle" className={`font-mono text-sm font-bold pointer-events-none select-none tracking-widest ${isGarden ? 'fill-green-700' : 'fill-black'}`}>
                    {room.name.toUpperCase()}
                  </text>
                  <text x={room.width/2} y={room.height/2 + 15} textAnchor="middle" className="font-mono text-[10px] fill-gray-500 pointer-events-none select-none">
                    {getAreaText(room.width, room.height)}
                  </text>
                  {room.label && (
                     <text x={room.width/2} y={room.height/2 + 30} textAnchor="middle" className="font-mono text-[10px] fill-blue-600 font-bold pointer-events-none select-none tracking-tight">
                        {room.label.toUpperCase()}
                     </text>
                  )}
                  {/* Show Dimensions when selected */}
                  {isSelected && (
                      <text x={room.width/2} y={-10} textAnchor="middle" className="font-mono text-[10px] fill-blue-500 font-bold pointer-events-none select-none">
                          {formatDimension(room.width, unitSystem)} x {formatDimension(room.height, unitSystem)}
                      </text>
                  )}
                  
                  {isSelected && (
                    <ResizeHandles 
                        width={room.width} 
                        height={room.height} 
                        rotation={0} 
                        scale={scale}
                        onResizeStart={(e, handle) => onMouseDown(e, room.id, 'room', undefined, undefined, handle)}
                    />
                  )}
                </g>
            )})}

            {/* Elements Layer */}
            {visibleElements.map((el) => {
               const isOpening = ['door', 'window', 'entry_door'].includes(el.type);
               const clipProp = (el.roomId && !isOpening) ? { clipPath: `url(#clip-${el.roomId})` } : {};
               const isSelected = el.id === selectedId;
               
               const render2DShape = () => {
                  const fill = el.color || (isOpening ? "white" : "white");
                  const stroke = isSelected ? "#3b82f6" : "black";
                  const strokeWidth = isSelected ? 3 : 1;

                  switch(el.type) {
                     case 'door': case 'entry_door':
                        return <g><rect x="-5" y="-5" width={el.width+10} height={el.height+10} fill={fill} opacity={el.opacity ?? 1}/><path d={`M 0 ${el.height} A ${el.width} ${el.width} 0 0 1 ${el.width} 0`} fill="none" stroke={stroke} strokeDasharray="5,3"/><line x1="0" y1={el.height} x2={el.width} y2={0} stroke={stroke} strokeWidth="2"/></g>;
                     case 'window':
                        return <g>
                            <rect x="-2" y="-2" width={el.width+4} height={el.height+4} fill="white" stroke="black" strokeWidth="1" />
                            <rect width={el.width} height={el.height} fill={el.color || "#e0f7fa"} stroke={stroke} strokeWidth="2" opacity={el.opacity ?? 1}/>
                            <line x1="0" y1={el.height/2} x2={el.width} y2={el.height/2} stroke={stroke}/>
                        </g>;
                     default:
                        return <rect width={el.width} height={el.height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={el.opacity ?? 1} />;
                  }
               }

               return (
                  <g 
                    key={el.id} 
                    transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation}, ${el.width/2}, ${el.height/2})`}
                    onMouseDown={(e) => { e.preventDefault(); onMouseDown(e, el.id, 'element', el.x, el.y); }}
                    style={{ cursor: isSelected ? "move" : "pointer" }}
                    className="hover:opacity-80"
                    {...clipProp}
                  >
                      {render2DShape()}
                      {el.label && (
                         <text 
                            x={el.width/2} 
                            y={el.height/2} 
                            textAnchor="middle" 
                            dominantBaseline="middle"
                            className="font-mono text-[9px] fill-gray-500 font-bold pointer-events-none select-none"
                            transform={`rotate(${-el.rotation}, ${el.width/2}, ${el.height/2})`}
                         >
                            {el.label}
                         </text>
                      )}
                      {isSelected && (
                        <ResizeHandles 
                            width={el.width} 
                            height={el.height} 
                            rotation={el.rotation} 
                            scale={scale}
                            onResizeStart={(e, handle) => onMouseDown(e, el.id, 'element', undefined, undefined, handle)}
                        />
                      )}
                  </g>
               );
            })}

            {/* Dimensions Layer */}
            {visibleRooms.length > 0 && (
                <g className="opacity-60">
                    <DimensionLine x1={bounds.minX} y1={bounds.minY - 50} x2={bounds.maxX} y2={bounds.minY - 50} value={bounds.maxX - bounds.minX} offset={0} unitSystem={unitSystem} />
                    <DimensionLine x1={bounds.minX - 50} y1={bounds.minY} x2={bounds.minX - 50} y2={bounds.maxY} value={bounds.maxY - bounds.minY} offset={0} unitSystem={unitSystem} />
                </g>
            )}
          </g>
      </svg>
  );
};

export default Canvas2D;
