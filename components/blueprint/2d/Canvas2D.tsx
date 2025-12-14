
import React from 'react';
import { SketchData, Room } from '../../../types';
import { useProjectStore } from '../../../store/useProjectStore';
import { Render2DElement } from './Render2DElement';
import { GRID_SIZE, ROOM_LABEL_SIZE, ROOM_SUB_LABEL_SIZE } from '../constants';
import { GlobalDimensionChains } from './GlobalDimensionChains';
import { GlobalWallRenderer } from './GlobalWallRenderer';
import { ResizeHandles } from './ResizeHandles';

interface Canvas2DProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  data: SketchData;
  activeFloor: number;
  pan: { x: number, y: number };
  scale: number;
  rotation: number;
  onMouseDown: (e: React.MouseEvent, id?: string, type?: 'room' | 'element', x?: number, y?: number, resizeHandle?: string) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
  bounds: { minX: number, maxX: number, minY: number, maxY: number };
  selectedId?: string;
  // Drawing Props
  currentStroke?: {x: number, y: number}[] | null;
  penSize?: number;
  activeTool?: string;
  eraserSize?: number;
}

// Helper for touch events
const toMouse = (e: React.TouchEvent) => {
    const t = e.touches[0];
    return {
        ...e,
        clientX: t ? t.clientX : 0,
        clientY: t ? t.clientY : 0,
        button: 0,
        buttons: 1,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation()
    } as unknown as React.MouseEvent;
};

const Canvas2D: React.FC<Canvas2DProps> = ({
  svgRef, data, activeFloor, pan, scale, rotation, 
  onMouseDown, onMouseMove, onMouseUp, onWheel, bounds, selectedId,
  currentStroke, penSize = 4, activeTool, eraserSize = 10
}) => {
  const { unitSystem, viewStyle } = useProjectStore();
  const isVivid = viewStyle === 'vivid';
  
  const visibleRooms = data.rooms.filter(r => r.floor === activeFloor);
  const visibleElements = data.elements.filter(e => e.floor === activeFloor);
  const visibleDrawings = (data.drawings || []).filter(d => d.floor === activeFloor);

  const getAreaText = (width: number, height: number) => {
      const areaSqm = (width * height) / 10000;
      if (unitSystem === 'imperial') {
          return `${Math.round(areaSqm * 10.764)} sq ft`;
      }
      return `${Math.round(areaSqm)}m²`;
  };

  const getRoomFill = (room: Room) => {
      if (!isVivid) {
          if (room.type === 'garden') return "#f0fdf4";
          // Darker blue/gray for better visibility in blueprint mode
          if (room.type === 'pool') return "#bae6fd"; 
          if (room.type === 'parking') return "#e5e7eb";
          return room.color || "white";
      }
      switch(room.type) {
          case 'garden': return "#bbf7d0"; 
          case 'pool': return "#67e8f9"; 
          case 'parking': return "#e2e8f0"; 
          case 'kitchen': return "#ffedd5"; 
          case 'bathroom': return "#e0f2fe"; 
          case 'bedroom': return "#f1f5f9"; 
          case 'living': return "#fff7ed"; 
          case 'corridor': return "#f8fafc";
          case 'entry': return "#f8fafc";
          default: return "white";
      }
  };

  // Determine which rooms should have walls drawn around them.
  const builtRooms = visibleRooms.filter(r => {
      if (r.type === 'garden' || r.type === 'pool') return false;
      if (r.type === 'parking') {
          return r.name.toLowerCase().includes('garage');
      }
      return true;
  });

  const strokeToPath = (points: {x:number, y:number}[]) => {
      if (points.length < 2) return "";
      return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  };

  return (
      <svg
          ref={svgRef}
          className="w-full h-full bg-white touch-none"
          style={{ cursor: 'inherit' }}
          onMouseDown={(e) => onMouseDown(e)}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onTouchStart={(e) => onMouseDown(toMouse(e))}
          onTouchMove={(e) => onMouseMove(toMouse(e))}
          onTouchEnd={(e) => onMouseUp({ ...e, preventDefault:()=>{}, stopPropagation:()=>{}, buttons: 0 } as any)}
        >
          <defs>
            <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#f3f4f6" strokeWidth={2}/>
            </pattern>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) rotate(${rotation}) scale(${scale})`}>
            <rect x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid)" />

            <GlobalDimensionChains rooms={builtRooms} unitSystem={unitSystem} />

            {/* LAYER 1: FLOORS */}
            {visibleRooms.map((room) => {
               const fill = getRoomFill(room);
               return (
                <g 
                    key={`floor-${room.id}`} 
                    transform={`translate(${room.x}, ${room.y})`}
                    onMouseDown={(e) => { 
                        if (activeTool !== 'select') return;
                        e.preventDefault(); 
                        onMouseDown(e, room.id, 'room', room.x, room.y); 
                    }}
                    onTouchStart={(e) => {
                        if (activeTool !== 'select') return;
                        // e.preventDefault(); // Prevent scroll?
                        onMouseDown(toMouse(e), room.id, 'room', room.x, room.y);
                    }}
                >
                    <rect width={room.width} height={room.height} fill={fill} stroke="none" />
                </g>
            )})}

            {/* LAYER 2: MERGED WALLS */}
            <GlobalWallRenderer rooms={builtRooms} elements={visibleElements} isVivid={isVivid} />

            {/* LAYER 3: ROOM LABELS */}
            {builtRooms.map((room) => {
               const isSelected = room.id === selectedId;
               const isSmallRoom = Math.min(room.width, room.height) < 200;
               const textX = room.labelX !== undefined ? room.labelX : room.x + room.width / 2;
               const textY = room.labelY !== undefined ? room.labelY : room.y + room.height / 2;

               return (
                <g key={`label-${room.id}`}>
                  <g transform={`translate(${textX}, ${textY})`}>
                        <text y={isSmallRoom ? 5 : -5} textAnchor="middle" fontSize={ROOM_LABEL_SIZE} fontWeight="bold" fill={isVivid ? "#334155" : "black"} className="uppercase pointer-events-none font-mono tracking-widest">
                        {room.name}
                        </text>
                        {!isSmallRoom && (
                            <text y={18} textAnchor="middle" fontSize={ROOM_SUB_LABEL_SIZE} fill="#6b7280" className="pointer-events-none font-mono">
                            {getAreaText(room.width, room.height)}
                            </text>
                        )}
                  </g>
                  {isSelected && activeTool === 'select' && (
                      <g transform={`translate(${room.x}, ${room.y})`}>
                         <ResizeHandles 
                            width={room.width} 
                            height={room.height} 
                            onResizeStart={(e, h) => onMouseDown(e, room.id, 'room', 0, 0, h)}
                            onTouchStart={(e, h) => onMouseDown(toMouse(e), room.id, 'room', 0, 0, h)}
                         />
                      </g>
                  )}
                </g>
            )})}

            {/* LAYER 4: ELEMENTS */}
            {visibleElements.map((el) => {
               const isSelected = el.id === selectedId;
               return (
                  <g 
                    key={el.id} 
                    transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation}, ${el.width/2}, ${el.height/2})`}
                    onMouseDown={(e) => { 
                        if (activeTool !== 'select') return;
                        e.preventDefault(); 
                        onMouseDown(e, el.id, 'element', el.x, el.y); 
                    }}
                    onTouchStart={(e) => {
                        if (activeTool !== 'select') return;
                        onMouseDown(toMouse(e), el.id, 'element', el.x, el.y);
                    }}
                    style={{ cursor: activeTool === 'select' ? (isSelected ? "move" : "pointer") : "inherit" }}
                    className={activeTool === 'select' ? "hover:opacity-80" : ""}
                  >
                      <Render2DElement el={el} isSelected={isSelected} viewStyle={viewStyle} />
                      {isSelected && activeTool === 'select' && (
                        <ResizeHandles 
                            width={el.width} 
                            height={el.height} 
                            onResizeStart={(e, h) => onMouseDown(e, el.id, 'element', 0, 0, h)}
                            onTouchStart={(e, h) => onMouseDown(toMouse(e), el.id, 'element', 0, 0, h)}
                        />
                      )}
                  </g>
               );
            })}
            
            {/* LAYER 5: DRAWINGS */}
            {visibleDrawings.map((d) => (
                <path 
                    key={d.id}
                    d={strokeToPath(d.points)}
                    stroke={d.color}
                    strokeWidth={d.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none"
                />
            ))}

            {/* CURRENT STROKE */}
            {currentStroke && (
                <path 
                    d={strokeToPath(currentStroke)}
                    stroke="black"
                    strokeWidth={penSize}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none"
                    opacity={0.6}
                />
            )}
          </g>
      </svg>
  );
};

export default Canvas2D;