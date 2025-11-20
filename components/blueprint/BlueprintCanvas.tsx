import React, { useState, useRef, useEffect } from 'react';
import { SketchData, Room, ArchitecturalElement } from '../../types';
import { downloadDXF, downloadPDF, downloadSVG } from '../../services/exportService';
import { Compass, Box, Layers, LayoutTemplate, ArrowUpCircle } from 'lucide-react';
import Canvas3D from './Canvas3D';
import Canvas2D from './Canvas2D';
import { ViewportHeader, ViewportToolbar, FloorSelector } from './BlueprintControls';

interface BlueprintCanvasProps {
  data: SketchData | null;
  isLoading: boolean;
  onUpdate: (newData: SketchData) => void;
  historyControl?: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; }
  selectedId?: string;
  onSelect?: (id: string | null, type?: 'room' | 'element') => void;
}

interface DragState { id: string; type: 'room' | 'element'; startX: number; startY: number; initialX: number; initialY: number; }
interface ResizeState { id: string; type: 'room' | 'element'; handle: string; startMouseX: number; startMouseY: number; initialMsg: { x: number, y: number, width: number, height: number, rotation: number }; }

const LoadingOverlay: React.FC = () => {
    const [step, setStep] = useState(0);
    const STEPS = ["INITIALIZING KERNEL...", "RESOLVING SPATIAL CONSTRAINTS...", "GENERATING VECTOR GEOMETRY...", "OPTIMIZING LAYOUT TOPOLOGY..."];

    useEffect(() => {
        const interval = setInterval(() => setStep(p => (p + 1) % STEPS.length), 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center select-none">
            {/* Technical Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <div className="relative z-10 bg-white p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center max-w-md w-full">
                <div className="w-16 h-16 border-4 border-t-black border-gray-200 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-black font-mono uppercase tracking-tighter mb-2">PROCESSING BLUEPRINT</h3>
                <div className="w-full h-2 bg-gray-100 border border-black mb-4 overflow-hidden">
                    <div className="h-full bg-black animate-[progress_2s_ease-in-out_infinite]" style={{ width: '30%' }}></div>
                </div>
                <p className="text-xs font-mono font-bold text-gray-500 animate-pulse">{STEPS[step]}</p>
            </div>
        </div>
    );
};

const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({ data, isLoading, onUpdate, historyControl, selectedId, onSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [localData, setLocalData] = useState<SketchData | null>(data);
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [showAllFloors, setShowAllFloors] = useState(false);
  
  const [scale, setScale] = useState(0.6);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  
  const cameraStateRef = useRef<{ position: any, target: any } | null>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [potentialSelection, setPotentialSelection] = useState<{id: string, type: 'room' | 'element'} | null>(null);
  const mouseDownPos = useRef<{x: number, y: number} | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{x: number, y: number} | null>(null);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [toolbarDragOffset, setToolbarDragOffset] = useState({x: 0, y: 0});

  useEffect(() => { if (!dragState && !resizeState) setLocalData(data); }, [data, dragState, resizeState]);

  useEffect(() => {
    if (data?.rooms.length) {
        const minFloor = Math.min(...data.rooms.map(r => r.floor));
        setActiveFloor(minFloor);
        setTimeout(() => fitToScreen(minFloor), 100);
        cameraStateRef.current = null;
    }
  }, [data?.id]);

  useEffect(() => { if (viewMode === '2d') setShowAllFloors(false); }, [viewMode]);

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
    setPan({ x: (containerWidth / 2) - (centerX * newScale), y: (containerHeight / 2) - (centerY * newScale) });
  };

  const rotateCanvas = (direction: 'cw' | 'ccw') => {
    if (!containerRef.current || !localData) return;
    const visibleRooms = localData.rooms.filter(r => r.floor === activeFloor);
    let cx = 0, cy = 0;
    if (visibleRooms.length > 0) {
        const bounds = getBounds(visibleRooms);
        cx = (bounds.minX + bounds.maxX) / 2;
        cy = (bounds.minY + bounds.maxY) / 2;
    }
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const delta = direction === 'cw' ? 90 : -90;
    const newRotation = rotation + delta;
    const rad = newRotation * (Math.PI / 180);
    const rotatedCx = (cx * Math.cos(rad) - cy * Math.sin(rad)) * scale;
    const rotatedCy = (cx * Math.sin(rad) + cy * Math.cos(rad)) * scale;
    setRotation(newRotation);
    setPan({ x: (containerW / 2) - rotatedCx, y: (containerH / 2) - rotatedCy });
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
    return { x: rx / scale, y: ry / scale };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode === '3d') return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(Math.max(s * delta, 0.1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent, id?: string, type?: 'room' | 'element', x?: number, y?: number, resizeHandle?: string) => {
    if (viewMode === '3d') return;
    e.preventDefault(); e.stopPropagation();
    setHasMoved(false);
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    const modelPos = getModelCoordinates(e.clientX, e.clientY);

    if (resizeHandle && id && type && localData) {
        const item = type === 'room' ? localData.rooms.find(r => r.id === id) : localData.elements.find(el => el.id === id);
        if (item) setResizeState({ id, type, handle: resizeHandle, startMouseX: modelPos.x, startMouseY: modelPos.y, initialMsg: { x: item.x, y: item.y, width: item.width, height: item.height, rotation: (item as any).rotation || 0 } });
        return;
    } 
    if (id && type && x !== undefined && y !== undefined) {
        if (id === selectedId) setDragState({ id, type, startX: modelPos.x, startY: modelPos.y, initialX: x, initialY: y });
        else { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); setPotentialSelection({ id, type }); }
        return;
    } 
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    if (onSelect) onSelect(null);
  };

  const handleToolbarDragStart = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation(); setIsDraggingToolbar(true);
      const rect = (e.currentTarget.closest('.viewport-toolbar') as HTMLElement).getBoundingClientRect();
      setToolbarDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
      const handleMove = (e: MouseEvent) => {
          if (isDraggingToolbar && containerRef.current) {
              const containerRect = containerRef.current.getBoundingClientRect();
              setToolbarPos({ x: e.clientX - containerRect.left - toolbarDragOffset.x, y: e.clientY - containerRect.top - toolbarDragOffset.y });
          }
      };
      const handleUp = () => setIsDraggingToolbar(false);
      if (isDraggingToolbar) { window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleUp); }
      return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); }
  }, [isDraggingToolbar]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (viewMode === '3d' || isDraggingToolbar) return;
    if (mouseDownPos.current) {
        if (Math.abs(e.clientX - mouseDownPos.current.x) > 6 || Math.abs(e.clientY - mouseDownPos.current.y) > 6) setHasMoved(true);
    }
    if (!hasMoved && (!mouseDownPos.current || (Math.abs(e.clientX - mouseDownPos.current.x) <= 6 && Math.abs(e.clientY - mouseDownPos.current.y) <= 6))) return;
    
    const modelPos = getModelCoordinates(e.clientX, e.clientY);

    if (resizeState && localData) {
        const { startMouseX, startMouseY, initialMsg, handle } = resizeState;
        const dx = modelPos.x - startMouseX;
        const dy = modelPos.y - startMouseY;
        const rad = -initialMsg.rotation * (Math.PI / 180);
        const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);
        let newW = initialMsg.width; let newH = initialMsg.height; let deltaCx = 0; let deltaCy = 0; 
        if (handle.includes('e')) { newW += localDx; deltaCx = localDx / 2; } else if (handle.includes('w')) { newW -= localDx; deltaCx = localDx / 2; }
        if (handle.includes('s')) { newH += localDy; deltaCy = localDy / 2; } else if (handle.includes('n')) { newH -= localDy; deltaCy = localDy / 2; }
        if (newW < 10) { newW = 10; deltaCx = 0; } if (newH < 10) { newH = 10; deltaCy = 0; }
        const worldShiftX = deltaCx * Math.cos(-rad) - deltaCy * Math.sin(-rad);
        const worldShiftY = deltaCx * Math.sin(-rad) + deltaCy * Math.cos(-rad);
        const newCx = initialMsg.x + initialMsg.width / 2 + worldShiftX;
        const newCy = initialMsg.y + initialMsg.height / 2 + worldShiftY;
        const newX = newCx - newW / 2; const newY = newCy - newH / 2;
        
        if (resizeState.type === 'room') setLocalData({ ...localData, rooms: localData.rooms.map(r => r.id === resizeState.id ? { ...r, x: newX, y: newY, width: newW, height: newH } : r) });
        else setLocalData({ ...localData, elements: localData.elements.map(el => el.id === resizeState.id ? { ...el, x: newX, y: newY, width: newW, height: newH } : el) });
    } else if (dragState && localData) {
      const dx = modelPos.x - dragState.startX;
      const dy = modelPos.y - dragState.startY;
      const snappedX = Math.round((dragState.initialX + dx) / 10) * 10; 
      const snappedY = Math.round((dragState.initialY + dy) / 10) * 10;
      if (dragState.type === 'room') setLocalData({ ...localData, rooms: localData.rooms.map(r => r.id === dragState.id ? { ...r, x: snappedX, y: snappedY } : r) });
      else setLocalData({ ...localData, elements: localData.elements.map(el => el.id === dragState.id ? { ...el, x: snappedX, y: snappedY } : el) });
    } else if (isPanning) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => {
    if (potentialSelection && !hasMoved && onSelect) onSelect(potentialSelection.id, potentialSelection.type);
    else if (hasMoved && (dragState || resizeState) && localData) { onUpdate(localData); if (dragState && onSelect) onSelect(dragState.id, dragState.type); }
    setDragState(null); setResizeState(null); setIsPanning(false); setPotentialSelection(null); setHasMoved(false); mouseDownPos.current = null;
  };

  const handleDownload = (type: 'svg' | 'pdf' | 'dxf') => {
    if (!localData) return;
    const filename = localData.title.replace(/\s+/g, '_').toLowerCase() || 'plan';
    if (type === 'svg' && svgRef.current) downloadSVG(svgRef.current, filename);
    if (type === 'pdf' && svgRef.current) downloadPDF(svgRef.current, filename);
    if (type === 'dxf') downloadDXF(localData, filename);
  };

  if (isLoading) return <LoadingOverlay />;

  if (!localData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 p-10 select-none">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="max-w-lg w-full text-center space-y-8 opacity-80">
            <div className="relative w-64 h-64 mx-auto border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                <Compass size={64} strokeWidth={1} className="text-black mb-4" />
                <span className="font-mono font-bold text-sm uppercase tracking-widest text-gray-500">No Schematic Data</span>
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-black tracking-tighter uppercase font-mono">Awaiting Input</h2>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-wide">Use the Command Terminal or Spec Sheet to initialize project.</p>
            </div>
        </div>
      </div>
    );
  }

  const totalFloors = Math.max(localData.floors || 0, ...localData.rooms.map(r => r.floor), 1);

  return (
    <div className={`flex-1 relative overflow-hidden bg-[#f0f0f0] h-full w-full ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`} ref={containerRef}>
      <ViewportHeader data={localData} activeFloor={activeFloor} totalFloors={totalFloors} onDownload={handleDownload} />
      <FloorSelector totalFloors={totalFloors} activeFloor={activeFloor} showAllFloors={showAllFloors} onChange={(f) => { setActiveFloor(f); setShowAllFloors(false); }} onToggleAll={() => setShowAllFloors(!showAllFloors)} viewMode={viewMode} />
      <ViewportToolbar viewMode={viewMode} setViewMode={setViewMode} scale={scale} setScale={setScale} rotateCanvas={rotateCanvas} onFit={() => fitToScreen()} history={historyControl} position={toolbarPos} onDragStart={handleToolbarDragStart} />
      {viewMode === '3d' ? (
        <Canvas3D data={localData} activeFloor={activeFloor} showAllFloors={showAllFloors} onUpdate={onUpdate} cameraStateRef={cameraStateRef} />
      ) : (
        <Canvas2D svgRef={svgRef} data={localData} activeFloor={activeFloor} pan={pan} scale={scale} rotation={rotation} bounds={getBounds(localData.rooms.filter(r => r.floor === activeFloor))} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel} selectedId={selectedId} />
      )}
    </div>
  );
};

export default BlueprintCanvas;