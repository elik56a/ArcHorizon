
import React, { useState, useRef, useEffect } from 'react';
import { SketchData, Room } from '../types';
import { downloadDXF, downloadPDF, downloadSVG } from '../services/exportService';
import { Loader2, PenTool } from 'lucide-react';
import Canvas3D from './blueprint/Canvas3D';
import Canvas2D from './blueprint/Canvas2D';
import { ViewportHeader, ViewportToolbar, FloorSelector } from './blueprint/BlueprintControls';

interface BlueprintCanvasProps {
  data: SketchData | null;
  isLoading: boolean;
  onUpdate: (newData: SketchData) => void;
  historyControl?: {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  }
}

const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({ data, isLoading, onUpdate, historyControl }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [localData, setLocalData] = useState<SketchData | null>(data);
  const [activeFloor, setActiveFloor] = useState<number>(1);
  
  // Viewport State
  const [scale, setScale] = useState(0.6);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  
  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<'room' | 'element' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Update local data when prop changes, unless dragging
  useEffect(() => {
    if (!draggingId) {
        setLocalData(data);
    }
  }, [data, draggingId]);

  // Reset view when loading new project
  useEffect(() => {
    if (data?.rooms.length) {
        const floors = data.rooms.map(r => r.floor);
        const minFloor = Math.min(...floors);
        setActiveFloor(minFloor);
        setTimeout(() => fitToScreen(minFloor), 100);
        console.log("Data loaded:", data.title);
    }
  }, [data?.id]);

  const getBounds = (rooms: Room[]) => {
    if (rooms.length === 0) return { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };
    return {
      minX: Math.min(...rooms.map(r => r.x)),
      maxX: Math.max(...rooms.map(r => r.x + r.width)),
      minY: Math.min(...rooms.map(r => r.y)),
      maxY: Math.max(...rooms.map(r => r.y + r.height)),
    };
  };

  const fitToScreen = (targetFloor: number = activeFloor) => {
    if (!localData || !containerRef.current) return;
    
    const floorRooms = localData.rooms.filter(r => r.floor === targetFloor);
    const bounds = getBounds(floorRooms);
    
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    if (contentWidth === 0 || contentHeight === 0) return;

    const padding = 150;
    const scaleX = (containerWidth - padding) / contentWidth;
    const scaleY = (containerHeight - padding) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 2.0);

    const centerX = (bounds.maxX + bounds.minX) / 2;
    const centerY = (bounds.maxY + bounds.minY) / 2;

    setScale(newScale);
    setRotation(0);
    setPan({
      x: (containerWidth / 2) - (centerX * newScale),
      y: (containerHeight / 2) - (centerY * newScale)
    });
  };

  const rotateCanvas = (direction: 'cw' | 'ccw') => {
    if (!containerRef.current || !localData) return;
    
    const visibleRooms = localData.rooms.filter(r => r.floor === activeFloor);
    
    let cx = 0, cy = 0;
    if (visibleRooms.length > 0) {
        const bounds = getBounds(visibleRooms);
        cx = (bounds.minX + bounds.maxX) / 2;
        cy = (bounds.minY + bounds.maxY) / 2;
    } else {
        cx = 500; cy = 500;
    }

    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const delta = direction === 'cw' ? 90 : -90;
    const newRotation = rotation + delta;
    const rad = newRotation * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rotatedCx = (cx * cos - cy * sin) * scale;
    const rotatedCy = (cx * sin + cy * cos) * scale;

    setRotation(newRotation);
    setPan({ 
        x: (containerW / 2) - rotatedCx, 
        y: (containerH / 2) - rotatedCy 
    });
  };

  const getModelCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    const dx = mx - pan.x;
    const dy = my - pan.y;
    
    const rad = -rotation * (Math.PI / 180);
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

    return {
        x: rx / scale,
        y: ry / scale
    };
  };

  // --- MOUSE HANDLERS ---

  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode === '3d') return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(s => Math.min(Math.max(s * delta, 0.1), 5));
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id?: string, type?: 'room' | 'element', x?: number, y?: number) => {
    if (viewMode === '3d') return;
    e.stopPropagation();

    if (id && type && x !== undefined && y !== undefined) {
      setDraggingId(id);
      setDraggingType(type);
      const modelPos = getModelCoordinates(e.clientX, e.clientY);
      setDragOffset({
        x: modelPos.x - x,
        y: modelPos.y - y
      });
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (viewMode === '3d') return;
    
    if (draggingId && localData) {
      const modelPos = getModelCoordinates(e.clientX, e.clientY);
      const newX = modelPos.x - dragOffset.x;
      const newY = modelPos.y - dragOffset.y;
      const snappedX = Math.round(newX / 10) * 10; 
      const snappedY = Math.round(newY / 10) * 10;

      if (draggingType === 'room') {
         const updatedRooms = localData.rooms.map(r => 
          r.id === draggingId ? { ...r, x: snappedX, y: snappedY } : r
        );
        setLocalData({ ...localData, rooms: updatedRooms });
      } else if (draggingType === 'element') {
        const updatedElements = localData.elements.map(el => 
          el.id === draggingId ? { ...el, x: snappedX, y: snappedY } : el
        );
        setLocalData({ ...localData, elements: updatedElements });
      }
    } else if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    if (draggingId && localData) {
        onUpdate(localData);
    }
    setDraggingId(null);
    setDraggingType(null);
    setIsPanning(false);
  };

  const handleDownload = (type: 'svg' | 'pdf' | 'dxf') => {
    if (!localData) return;
    const filename = localData.title.replace(/\s+/g, '_').toLowerCase() || 'plan';
    if (type === 'svg' && svgRef.current) downloadSVG(svgRef.current, filename);
    if (type === 'pdf' && svgRef.current) downloadPDF(svgRef.current, filename);
    if (type === 'dxf') downloadDXF(localData, filename);
  };

  // --- RENDERS ---

  if (isLoading) {
      return (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-50">
              <div className="relative mb-6">
                 <div className="absolute inset-0 bg-black rounded-full animate-ping opacity-10" style={{ animationDuration: '2s' }}></div>
                 <div className="relative bg-white p-6 rounded-full shadow-2xl border-4 border-black">
                     <Loader2 className="w-12 h-12 animate-spin text-black" />
                 </div>
              </div>
              <h2 className="text-2xl font-bold text-black tracking-tighter mb-1 uppercase">ArcHorizon</h2>
              <div className="w-32 h-1 bg-black mx-auto mb-2"></div>
              <p className="font-mono text-xs tracking-widest uppercase text-gray-500 animate-pulse">Generating Layout...</p>
          </div>
      );
  }

  if (!localData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white text-gray-400">
        <div className="text-center">
          <PenTool className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-mono text-sm">NO BLUEPRINT LOADED</p>
        </div>
      </div>
    );
  }

  const totalFloors = localData.floors || Math.max(...localData.rooms.map(r => r.floor), 1);
  const currentFloorRooms = localData.rooms.filter(r => r.floor === activeFloor);
  const bounds = getBounds(currentFloorRooms);

  return (
    <div className="flex-1 relative overflow-hidden bg-gray-100 h-full w-full" ref={containerRef}>
      <ViewportHeader 
        data={localData} 
        activeFloor={activeFloor} 
        totalFloors={totalFloors} 
        onDownload={handleDownload} 
      />

      <FloorSelector 
        totalFloors={totalFloors}
        activeFloor={activeFloor}
        onChange={setActiveFloor}
      />

      <ViewportToolbar 
        viewMode={viewMode}
        setViewMode={setViewMode}
        scale={scale}
        setScale={setScale}
        rotateCanvas={rotateCanvas}
        onFit={() => fitToScreen()}
        history={historyControl}
      />

      {viewMode === '3d' ? (
        <Canvas3D data={localData} activeFloor={activeFloor} />
      ) : (
        <Canvas2D 
           svgRef={svgRef}
           data={localData}
           activeFloor={activeFloor}
           pan={pan}
           scale={scale}
           rotation={rotation}
           bounds={bounds}
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onWheel={handleWheel}
        />
      )}
    </div>
  );
};

export default BlueprintCanvas;
