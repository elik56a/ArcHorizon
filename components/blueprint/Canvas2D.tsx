
import React from 'react';
import { SketchData, Room } from '../../types';

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
  onMouseDown: (e: React.MouseEvent, id?: string, type?: 'room' | 'element', x?: number, y?: number) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  bounds: { minX: number, maxX: number, minY: number, maxY: number };
}

const DimensionLine: React.FC<{x1: number, y1: number, x2: number, y2: number, value: number, offset?: number}> = ({ x1, y1, x2, y2, value, offset = 20 }) => {
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
                {Math.round(value)}
            </text>
        </g>
    );
};

const Canvas2D: React.FC<Canvas2DProps> = ({
  svgRef, data, activeFloor, pan, scale, rotation, 
  onMouseDown, onMouseMove, onMouseUp, onWheel, bounds
}) => {
  
  const visibleRooms = data.rooms.filter(r => r.floor === activeFloor);
  const visibleElements = data.elements.filter(e => e.floor === activeFloor);

  return (
      <svg
          ref={svgRef}
          className="w-full h-full bg-white cursor-grab active:cursor-grabbing touch-none"
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
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) rotate(${rotation}) scale(${scale})`}>
            <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" />

            {/* Rooms Layer */}
            {visibleRooms.map((room) => {
               const isWetArea = ['bathroom', 'kitchen', 'balcony'].includes(room.type);
               const isLiving = ['living', 'bedroom', 'dining'].includes(room.type);
               
               return (
                <g
                  key={room.id}
                  transform={`translate(${room.x}, ${room.y})`}
                  onMouseDown={(e) => onMouseDown(e, room.id, 'room', room.x, room.y)}
                  className="cursor-move group"
                >
                  <rect
                    width={room.width}
                    height={room.height}
                    fill="white" 
                    stroke="black"
                    strokeWidth={WALL_STROKE_WIDTH}
                    className="shadow-sm"
                  />
                  <rect 
                     x={WALL_STROKE_WIDTH/2} y={WALL_STROKE_WIDTH/2}
                     width={room.width - WALL_STROKE_WIDTH}
                     height={room.height - WALL_STROKE_WIDTH}
                     fill={isWetArea ? "url(#tiles)" : isLiving ? "url(#wood)" : "none"}
                     pointerEvents="none"
                  />
                  <text x={room.width/2} y={room.height/2} textAnchor="middle" className="font-mono text-sm font-bold fill-black pointer-events-none select-none tracking-widest">
                    {room.name.toUpperCase()}
                  </text>
                  <text x={room.width/2} y={room.height/2 + 15} textAnchor="middle" className="font-mono text-[10px] fill-gray-500 pointer-events-none select-none">
                    {Math.round((room.width * room.height) / 10000)}m²
                  </text>
                </g>
            )})}

            {/* Elements Layer */}
            {visibleElements.map((el) => {
               const isOpening = ['door', 'window', 'entry_door'].includes(el.type);
               const clipProp = (el.roomId && !isOpening) ? { clipPath: `url(#clip-${el.roomId})` } : {};
               
               const render2DShape = () => {
                  switch(el.type) {
                     case 'door': case 'entry_door':
                        return <g><rect x="-5" y="-5" width={el.width+10} height={el.height+10} fill="white"/><path d={`M 0 ${el.height} A ${el.width} ${el.width} 0 0 1 ${el.width} 0`} fill="none" stroke="black" strokeDasharray="5,3"/><line x1="0" y1={el.height} x2={el.width} y2={0} stroke="black" strokeWidth="2"/></g>;
                     case 'window':
                        return <g>
                            <rect x="-2" y="-2" width={el.width+4} height={el.height+4} fill="white"/>
                            <rect width={el.width} height={el.height} fill="#e0f7fa" stroke="black" strokeWidth="2"/>
                            <line x1="0" y1={el.height/2} x2={el.width} y2={el.height/2} stroke="black"/>
                        </g>;
                     default:
                        return <rect width={el.width} height={el.height} fill="white" stroke="black" />;
                  }
               }

               return (
                  <g 
                    key={el.id} 
                    transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation}, ${el.width/2}, ${el.height/2})`}
                    onMouseDown={(e) => onMouseDown(e, el.id, 'element', el.x, el.y)}
                    className="cursor-move hover:opacity-80"
                    {...clipProp}
                  >
                      {render2DShape()}
                  </g>
               );
            })}

            {/* Dimensions Layer */}
            {visibleRooms.length > 0 && (
                <g className="opacity-60">
                    <DimensionLine x1={bounds.minX} y1={bounds.minY - 50} x2={bounds.maxX} y2={bounds.minY - 50} value={bounds.maxX - bounds.minX} offset={0} />
                    <DimensionLine x1={bounds.minX - 50} y1={bounds.minY} x2={bounds.minX - 50} y2={bounds.maxY} value={bounds.maxY - bounds.minY} offset={0} />
                </g>
            )}
          </g>
      </svg>
  );
};

export default Canvas2D;
