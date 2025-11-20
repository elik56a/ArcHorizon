
import React from 'react';
import { SketchData, Room, ArchitecturalElement } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';

const WALL_STROKE_WIDTH = 12; // Thinner, more precise lines for CAD look
const DIM_COLOR = "#333";
const DIM_FONT_SIZE = 10;

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

// --- UTILS ---
const formatDimension = (cm: number, unitSystem: 'metric' | 'imperial') => {
    if (unitSystem === 'imperial') {
        const totalFeet = cm * 0.0328084;
        const feet = Math.floor(totalFeet);
        const inches = Math.round((totalFeet - feet) * 12);
        return `${feet}'${inches}"`;
    }
    return (cm / 100).toFixed(2) + 'm'; // Display in meters for cleaner architectural look
};

// --- COMPONENTS ---

// Professional Architectural Dimension Line with Ticks
const DimensionLine: React.FC<{x1: number, y1: number, x2: number, y2: number, value: number, offset?: number, unitSystem: 'metric' | 'imperial'}> = ({ x1, y1, x2, y2, value, offset = 20, unitSystem }) => {
    const isVertical = Math.abs(x1 - x2) < 1;
    const angle = isVertical ? -90 : 0;
    
    // Determine normal vector for offset
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    const nx = -dy / len;
    const ny = dx / len;

    const offX = nx * offset;
    const offY = ny * offset;

    const sx1 = x1 + offX; const sy1 = y1 + offY;
    const sx2 = x2 + offX; const sy2 = y2 + offY;
    const mx = (sx1 + sx2) / 2;
    const my = (sy1 + sy2) / 2;

    const tickSize = 6; 

    return (
        <g className="pointer-events-none">
            {/* Extension Lines */}
            <line x1={x1} y1={y1} x2={sx1 + nx * 5} y2={sy1 + ny * 5} stroke={DIM_COLOR} strokeWidth="0.5" opacity="0.5" />
            <line x1={x2} y1={y2} x2={sx2 + nx * 5} y2={sy2 + ny * 5} stroke={DIM_COLOR} strokeWidth="0.5" opacity="0.5" />
            
            {/* Main Dimension Line */}
            <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke={DIM_COLOR} strokeWidth="0.8" />

            {/* Architectural Ticks (45 degree slash) */}
            <line x1={sx1 - tickSize} y1={sy1 + tickSize} x2={sx1 + tickSize} y2={sy1 - tickSize} stroke={DIM_COLOR} strokeWidth="1.5" />
            <line x1={sx2 - tickSize} y1={sy2 + tickSize} x2={sx2 + tickSize} y2={sy2 - tickSize} stroke={DIM_COLOR} strokeWidth="1.5" />

            {/* Text Background for readability */}
            <rect x={mx - 15} y={my - 8} width={30} height={16} fill="white" opacity="0.8" transform={`rotate(${angle} ${mx} ${my})`} />
            
            {/* Dimension Text */}
            <text 
                x={mx} y={my} 
                textAnchor="middle" 
                dominantBaseline="middle" // Centered vertically
                fill={DIM_COLOR} 
                fontSize={DIM_FONT_SIZE} 
                fontFamily="JetBrains Mono, monospace" 
                fontWeight="bold" 
                transform={`rotate(${angle} ${mx} ${my}) translate(0, -2)`} // Slight optical adjustment
            >
                {formatDimension(value, unitSystem)}
            </text>
        </g>
    );
};

const ResizeHandles: React.FC<{width: number, height: number, scale: number, onResizeStart: (e: React.MouseEvent, handle: string) => void}> = ({ width, height, scale, onResizeStart }) => {
    const handleSize = 6 / scale; 
    const handles = [
        {x: 0, y: 0, c: 'nw-resize', n: 'nw'}, {x: width/2, y: 0, c: 'n-resize', n: 'n'}, {x: width, y: 0, c: 'ne-resize', n: 'ne'},
        {x: width, y: height/2, c: 'e-resize', n: 'e'}, {x: width, y: height, c: 'se-resize', n: 'se'}, {x: width/2, y: height, c: 's-resize', n: 's'},
        {x: 0, y: height, c: 'sw-resize', n: 'sw'}, {x: 0, y: height/2, c: 'w-resize', n: 'w'}
    ];

    return (
        <g>
            <rect x={0} y={0} width={width} height={height} fill="none" stroke="#2563eb" strokeWidth={1/scale} strokeDasharray={`${4/scale},${4/scale}`} pointerEvents="none"/>
            {handles.map(h => (
                <rect 
                    key={h.n} x={h.x - handleSize/2} y={h.y - handleSize/2} width={handleSize} height={handleSize}
                    fill="white" stroke="#2563eb" strokeWidth={1/scale} style={{ cursor: h.c }}
                    onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, h.n); }}
                />
            ))}
        </g>
    );
};

// --- FURNITURE RENDERER ---
const RenderElementShape = ({ el, isSelected }: { el: ArchitecturalElement, isSelected: boolean }) => {
    const stroke = isSelected ? "#2563eb" : "#000";
    const strokeWidth = isSelected ? 2 : 1;
    const fill = el.color || "white";
    const { width: w, height: h } = el;

    // Common styles for CAD blocks
    const thinStroke = 0.5;
    const detailColor = "#444";

    switch (el.type) {
        case 'door':
        case 'entry_door':
            return (
                <g>
                     {/* Frame */}
                     <rect x={-2} y={-2} width={4} height={h+4} fill="black" />
                     <rect x={w-2} y={-2} width={4} height={h+4} fill="black" />
                     {/* Swing Arc */}
                     <path d={`M 0 ${h} A ${w} ${w} 0 0 1 ${w} 0`} fill="none" stroke={stroke} strokeWidth={thinStroke} strokeDasharray="3,2" />
                     {/* Door Leaf */}
                     <rect x={0} y={0} width={w} height={5} fill="white" stroke={stroke} strokeWidth={strokeWidth} transform={`rotate(${-90} 0 ${h}) translate(${-h} 0)`} /> 
                     {/* Actual Door Leaf in Open Position (90 deg) - Simplified for plan view as open */}
                     <line x1={0} y1={h} x2={w} y2={0} stroke={stroke} strokeWidth={strokeWidth} />
                </g>
            );
        case 'sliding_door':
            return (
                <g>
                    <rect x={0} y={h/2-2} width={w} height={4} fill="none" stroke={stroke} />
                    <rect x={0} y={h/2-2} width={w/2} height={4} fill="white" stroke={stroke} />
                    <rect x={w/2} y={h/2+2} width={w/2} height={4} fill="white" stroke={stroke} />
                    <line x1={w/2} y1={h/2} x2={w/2 + 10} y2={h/2} stroke={stroke} markerEnd="url(#arrow)" />
                </g>
            );
        case 'window':
            return (
                <g>
                    <rect x={0} y={0} width={w} height={h} fill="white" stroke="none" /> {/* Clear wall fill */}
                    <line x1={0} y1={h/2-2} x2={w} y2={h/2-2} stroke={stroke} strokeWidth={thinStroke} />
                    <line x1={0} y1={h/2+2} x2={w} y2={h/2+2} stroke={stroke} strokeWidth={thinStroke} />
                    <rect x={0} y={0} width={w} height={h} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
                </g>
            );
        case 'bed_king':
        case 'bed_queen':
        case 'bed_single':
            return (
                <g>
                    {/* Mattress */}
                    <rect x={0} y={0} width={w} height={h} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    {/* Pillows */}
                    <rect x={w*0.1} y={h*0.05} width={w*0.35} height={h*0.15} rx={2} fill="white" stroke={detailColor} strokeWidth={thinStroke} />
                    {el.type !== 'bed_single' && <rect x={w*0.55} y={h*0.05} width={w*0.35} height={h*0.15} rx={2} fill="white" stroke={detailColor} strokeWidth={thinStroke} />}
                    {/* Blanket/Fold */}
                    <path d={`M 0 ${h*0.3} Q ${w/2} ${h*0.35} ${w} ${h*0.3}`} fill="none" stroke={detailColor} strokeWidth={thinStroke} />
                    <rect x={0} y={h*0.3} width={w} height={h*0.7} fill="none" stroke="none" /> 
                </g>
            );
        case 'toilet':
            return (
                <g>
                    {/* Tank */}
                    <rect x={0} y={0} width={w} height={h*0.25} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                    {/* Bowl */}
                    <ellipse cx={w/2} cy={h*0.6} rx={w*0.35} ry={h*0.4} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                </g>
            );
        case 'sink_single':
            return (
                <g>
                    <rect x={0} y={0} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    <ellipse cx={w/2} cy={h/2} rx={w*0.35} ry={h*0.35} fill="white" stroke={detailColor} strokeWidth={thinStroke} />
                    {/* Tap */}
                    <line x1={w/2} y1={0} x2={w/2} y2={h*0.2} stroke={detailColor} strokeWidth={1} />
                </g>
            );
        case 'sofa':
        case 'sofa_l_shape':
        case 'armchair':
            const armW = Math.min(w*0.15, 20);
            const backD = Math.min(h*0.2, 20);
            return (
                <g>
                     {/* Base */}
                     <path d={`
                        M 0 0 L ${w} 0 L ${w} ${h} L ${w-armW} ${h} L ${w-armW} ${backD} 
                        L ${armW} ${backD} L ${armW} ${h} L 0 ${h} Z
                     `} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                     {/* Cushions */}
                     <line x1={w/2} y1={backD} x2={w/2} y2={h} stroke={detailColor} strokeWidth={thinStroke} />
                     <rect x={armW} y={0} width={w - 2*armW} height={backD} fill="none" stroke={detailColor} strokeWidth={thinStroke} />
                </g>
            );
        case 'dining_table':
            return (
                <g>
                    <rect x={0} y={0} width={w} height={h} rx={4} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    {/* Chairs representation (simple boxes around) */}
                    <rect x={w/2 - 15} y={-20} width={30} height={15} fill="white" stroke={detailColor} strokeWidth={thinStroke} />
                    <rect x={w/2 - 15} y={h+5} width={30} height={15} fill="white" stroke={detailColor} strokeWidth={thinStroke} />
                    <rect x={-20} y={h/2-15} width={15} height={30} fill="white" stroke={detailColor} strokeWidth={thinStroke} />
                    <rect x={w+5} y={h/2-15} width={15} height={30} fill="white" stroke={detailColor} strokeWidth={thinStroke} />
                </g>
            );
        case 'stove':
             return (
                 <g>
                     <rect x={0} y={0} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                     <circle cx={w*0.25} cy={h*0.25} r={w*0.15} fill="none" stroke={detailColor} />
                     <circle cx={w*0.75} cy={h*0.25} r={w*0.15} fill="none" stroke={detailColor} />
                     <circle cx={w*0.25} cy={h*0.75} r={w*0.15} fill="none" stroke={detailColor} />
                     <circle cx={w*0.75} cy={h*0.75} r={w*0.15} fill="none" stroke={detailColor} />
                 </g>
             );
        case 'shower':
             return (
                 <g>
                     <rect x={0} y={0} width={w} height={h} fill="white" stroke={stroke} strokeWidth={strokeWidth} />
                     <line x1={0} y1={0} x2={w} y2={h} stroke={detailColor} strokeWidth={thinStroke} />
                     <line x1={w} y1={0} x2={0} y2={h} stroke={detailColor} strokeWidth={thinStroke} />
                     <circle cx={w/2} cy={h/2} r={4} fill="white" stroke={detailColor} />
                 </g>
             );
        case 'wardrobe':
             return (
                 <g>
                     <rect x={0} y={0} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                     <line x1={0} y1={h} x2={w} y2={0} stroke={detailColor} strokeWidth={thinStroke} strokeDasharray="5,5"/>
                     <rect x={0} y={h-5} width={w} height={5} fill="none" stroke={detailColor} />
                 </g>
             );
        default:
            return (
                <g>
                    <rect x={0} y={0} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                    <line x1={0} y1={0} x2={w} y2={h} stroke={stroke} strokeWidth={thinStroke} opacity={0.3} />
                    <line x1={w} y1={0} x2={0} y2={h} stroke={stroke} strokeWidth={thinStroke} opacity={0.3} />
                </g>
            );
    }
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

  // Calculate Auto-Dimensions for Rooms
  const renderAutoDimensions = () => {
      return visibleRooms.map(room => {
          // Internal room dimensions
          return (
              <g key={`dim-${room.id}`} opacity={0.4}>
                   <text x={room.x + room.width/2} y={room.y + 15} textAnchor="middle" fontSize="8" fill="#666" fontFamily="monospace">
                       {formatDimension(room.width, unitSystem)}
                   </text>
                   <text x={room.x + 10} y={room.y + room.height/2} textAnchor="middle" fontSize="8" fill="#666" fontFamily="monospace" transform={`rotate(-90, ${room.x + 10}, ${room.y + room.height/2})`}>
                       {formatDimension(room.height, unitSystem)}
                   </text>
              </g>
          );
      });
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
                      <rect x={room.x + 2} y={room.y + 2} width={room.width - 4} height={room.height - 4} /> 
                  </clipPath>
              ))}
            
            {/* Architectural Hatch Patterns */}
            <pattern id="wallHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
               <line x1="0" y1="0" x2="0" y2="8" stroke="#000" strokeWidth="2" />
            </pattern>
            <pattern id="tiles" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="none" stroke="#e5e5e5" strokeWidth="0.5" />
            </pattern>
            <pattern id="wood" width="100" height="10" patternUnits="userSpaceOnUse">
              <line x1="0" y1="10" x2="100" y2="10" stroke="#e5e5e5" strokeWidth="0.5" />
              <line x1="30" y1="0" x2="30" y2="10" stroke="#e5e5e5" strokeWidth="0.5" />
              <line x1="80" y1="0" x2="80" y2="10" stroke="#e5e5e5" strokeWidth="0.5" />
            </pattern>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#f5f5f5" strokeWidth="1"/>
            </pattern>
            <pattern id="grass" width="20" height="20" patternUnits="userSpaceOnUse">
               <circle cx="2" cy="2" r="1" fill="#86efac" />
               <circle cx="12" cy="12" r="1" fill="#86efac" />
            </pattern>
             <pattern id="concrete" width="50" height="50" patternUnits="userSpaceOnUse">
                 <filter id="noise">
                     <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                 </filter>
                 <rect width="50" height="50" fill="transparent" opacity="0.1" filter="url(#noise)"/>
            </pattern>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) rotate(${rotation}) scale(${scale})`}>
            <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" />

            {/* Rooms Layer (Walls + Floor) */}
            {visibleRooms.map((room) => {
               const isWetArea = ['bathroom', 'kitchen', 'utility'].includes(room.type);
               const isLiving = ['living', 'bedroom', 'dining', 'corridor', 'study'].includes(room.type);
               const isGarden = room.type === 'garden';
               const isParking = room.type === 'parking';
               const isPool = room.type === 'pool';
               
               const isSelected = room.id === selectedId;
               
               // Fill Logic
               let fill = "white";
               if (room.color) fill = room.color;
               else if (isPool) fill = "#cffafe";
               else if (isGarden) fill = "url(#grass)";
               else if (isParking) fill = "#f3f4f6";
               else if (isWetArea) fill = "url(#tiles)";
               else if (isLiving) fill = "url(#wood)";

               // Wall Style
               const strokeColor = isSelected ? "#2563eb" : "#000";
               // Structural walls are thick black lines in CAD
               const strokeWidth = (isGarden || isParking) ? 2 : WALL_STROKE_WIDTH;
               
               return (
                <g
                  key={room.id}
                  transform={`translate(${room.x}, ${room.y})`}
                  onMouseDown={(e) => { e.preventDefault(); onMouseDown(e, room.id, 'room', room.x, room.y); }}
                  style={{ cursor: isSelected ? "move" : "pointer" }}
                >
                  {/* The Wall (Outer Stroke) */}
                  <rect
                    width={room.width}
                    height={room.height}
                    fill={fill} 
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={(isGarden || isParking) ? "10,5" : "none"}
                    className="transition-colors"
                  />
                  
                  {/* Room Tag (Center) */}
                  {!isGarden && !isParking && (
                      <g transform={`translate(${room.width/2}, ${room.height/2})`}>
                          <text y={-5} textAnchor="middle" className="font-mono text-sm font-black fill-black tracking-widest uppercase select-none pointer-events-none">
                            {room.name}
                          </text>
                          <text y={10} textAnchor="middle" className="font-mono text-[10px] fill-gray-600 font-bold select-none pointer-events-none">
                            {getAreaText(room.width, room.height)}
                          </text>
                          {room.floorFinish && (
                              <text y={22} textAnchor="middle" className="font-mono text-[8px] fill-gray-400 uppercase select-none pointer-events-none">
                                  FL: {room.floorFinish}
                              </text>
                          )}
                      </g>
                  )}

                  {isSelected && (
                    <ResizeHandles width={room.width} height={room.height} scale={scale} onResizeStart={(e, h) => onMouseDown(e, room.id, 'room', 0, 0, h)}/>
                  )}
                </g>
            )})}

            {/* Internal Dimensions (Subtle) */}
            {renderAutoDimensions()}

            {/* Elements Layer (Furniture) */}
            {visibleElements.map((el) => {
               const isSelected = el.id === selectedId;
               return (
                  <g 
                    key={el.id} 
                    transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation}, ${el.width/2}, ${el.height/2})`}
                    onMouseDown={(e) => { e.preventDefault(); onMouseDown(e, el.id, 'element', el.x, el.y); }}
                    style={{ cursor: isSelected ? "move" : "pointer" }}
                    className="group hover:opacity-80"
                  >
                      <RenderElementShape el={el} isSelected={isSelected} />
                      
                      {isSelected && (
                        <ResizeHandles width={el.width} height={el.height} scale={scale} onResizeStart={(e, h) => onMouseDown(e, el.id, 'element', 0, 0, h)}/>
                      )}
                  </g>
               );
            })}

            {/* Overall External Dimensions (The "Lines along the length") */}
            {visibleRooms.length > 0 && (
                <g>
                    {/* Top Chain */}
                    <DimensionLine 
                        x1={bounds.minX} y1={bounds.minY} x2={bounds.maxX} y2={bounds.minY} 
                        value={bounds.maxX - bounds.minX} offset={-50} unitSystem={unitSystem} 
                    />
                    {/* Left Chain */}
                    <DimensionLine 
                        x1={bounds.minX} y1={bounds.minY} x2={bounds.minX} y2={bounds.maxY} 
                        value={bounds.maxY - bounds.minY} offset={-50} unitSystem={unitSystem} 
                    />
                    {/* Bottom Chain */}
                     <DimensionLine 
                        x1={bounds.minX} y1={bounds.maxY} x2={bounds.maxX} y2={bounds.maxY} 
                        value={bounds.maxX - bounds.minX} offset={50} unitSystem={unitSystem} 
                    />
                     {/* Right Chain */}
                     <DimensionLine 
                        x1={bounds.maxX} y1={bounds.minY} x2={bounds.maxX} y2={bounds.maxY} 
                        value={bounds.maxY - bounds.minY} offset={50} unitSystem={unitSystem} 
                    />
                </g>
            )}
          </g>
      </svg>
  );
};

export default Canvas2D;
