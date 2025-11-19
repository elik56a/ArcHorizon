
import React, { useState, useRef, useEffect } from 'react';
import { SketchData, Room, ArchitecturalElement } from '../../types';
import { downloadDXF, downloadPDF, downloadSVG } from '../../services/exportService';
import { Loader2, PenTool, Compass, Ruler, Box, Layers } from 'lucide-react';
import Canvas3D from './Canvas3D';
import Canvas2D from './Canvas2D';
import { ViewportHeader, ViewportToolbar, FloorSelector } from './BlueprintControls';

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
  selectedId?: string;
  onSelect?: (id: string | null, type?: 'room' | 'element') => void;
}

// Types for Dragging
interface DragState {
    id: string;
    type: 'room' | 'element';
    startX: number; // Mouse start X
    startY: number; // Mouse start Y
    initialX: number; // Element start X
    initialY: number; // Element start Y
}

interface ResizeState {
    id: string;
    type: 'room' | 'element';
    handle: string; // n, s, e, w, ne, nw, se, sw
    startMouseX: number; // Model coordinates
    startMouseY: number;
    initialMsg: { x: number, y: number, width: number, height: number, rotation: number };
}

// --- 1. CLEANER LOADER COMPONENT ---
const LOADING_STEPS = [
  "Analyzing Architecture...",
  "Optimizing Floor Layout...",
  "Calculating Structure...",
  "Placing Elements..."
];

const LoadingOverlay: React.FC = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % LOADING_STEPS.length);
        }, 3000); // SLOWER: 3 seconds per text
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center select-none transition-all duration-500">
            <div className="flex flex-col items-center gap-6">
                {/* Clean Minimalist Spinner */}
                <div className="relative">
                    <div className="w-16 h-16 border-[3px] border-gray-100 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-[3px] border-black border-t-transparent rounded-full animate-spin"></div>
                    <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-black/20" strokeWidth={1.5}/>
                </div>
                
                {/* Clean Typography */}
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight font-sans">GENERATING BLUEPRINT</h3>
                    <div key={step} className="h-6 animate-in slide-in-from-bottom-2 fade-in duration-700">
                        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                             {LOADING_STEPS[step]}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({ 
    data, isLoading, onUpdate, historyControl, selectedId, onSelect 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [localData, setLocalData] = useState<SketchData | null>(data);
  const [activeFloor, setActiveFloor] = useState<number>(1);
  
  // Viewport State (2D)
  const [scale, setScale] = useState(0.6);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 50, y: 50 });

  // Viewport State (3D)
  // We use a ref to persist camera state (position/target) across mounts/unmounts of Canvas3D
  const cameraStateRef = useRef<{ position: any, target: any } | null>(null);
  
  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  // Toolbar Drag State
  const [toolbarPos, setToolbarPos] = useState<{x: number, y: number} | null>(null);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [toolbarDragOffset, setToolbarDragOffset] = useState({x: 0, y: 0});

  // Update local data when prop changes, unless interacting
  useEffect(() => {
    if (!dragState && !resizeState) {
        setLocalData(data);
    }
  }, [data, dragState, resizeState]);

  // Reset view when loading new project
  useEffect(() => {
    if (data?.rooms.length) {
        const floors = data.rooms.map(r => r.floor);
        const minFloor = Math.min(...floors);
        setActiveFloor(minFloor);
        setTimeout(() => fitToScreen(minFloor), 100);
        
        // Reset 3D camera state for new project
        cameraStateRef.current = null;
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
    // Allow zooming without Ctrl to match 3D behavior if desired, 
    // but generally keeping simple scroll behavior is better. 
    // User requested: "scrolling through the past zooms in or out". 
    // So we allow direct zoom on wheel.
    
    e.preventDefault(); // Prevent browser scroll
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(Math.max(s * delta, 0.1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent, id?: string, type?: 'room' | 'element', x?: number, y?: number, resizeHandle?: string) => {
    if (viewMode === '3d') return;
    e.stopPropagation();
    setHasMoved(false);

    const modelPos = getModelCoordinates(e.clientX, e.clientY);

    if (resizeHandle && id && type && localData) {
        // RESIZE START
        const item = type === 'room' 
            ? localData.rooms.find(r => r.id === id) 
            : localData.elements.find(el => el.id === id);
        
        if (item) {
            setResizeState({
                id, type, handle: resizeHandle,
                startMouseX: modelPos.x, startMouseY: modelPos.y,
                initialMsg: { 
                    x: item.x, y: item.y, width: item.width, height: item.height, 
                    // @ts-ignore
                    rotation: item.rotation || 0 
                }
            });
        }
    } else if (id && type && x !== undefined && y !== undefined) {
        // DRAG START
        setDragState({
            id, type, startX: modelPos.x, startY: modelPos.y, initialX: x, initialY: y
        });
    } else {
        // PAN START
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        if (onSelect) onSelect(null);
    }
  };

  // --- TOOLBAR DRAG HANDLERS ---
  const handleToolbarDragStart = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingToolbar(true);
      // Calculate offset from the mouse to the toolbar's top-left corner
      const rect = (e.currentTarget.closest('.viewport-toolbar') as HTMLElement).getBoundingClientRect();
      setToolbarDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      });
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingToolbar && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const x = e.clientX - containerRect.left - toolbarDragOffset.x;
          const y = e.clientY - containerRect.top - toolbarDragOffset.y;
          setToolbarPos({ x, y });
          return; // Don't do other canvas moves
      }
  };

  const handleGlobalMouseUp = () => {
      setIsDraggingToolbar(false);
  };

  useEffect(() => {
      if (isDraggingToolbar) {
          window.addEventListener('mousemove', handleGlobalMouseMove);
          window.addEventListener('mouseup', handleGlobalMouseUp);
      } else {
          window.removeEventListener('mousemove', handleGlobalMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleGlobalMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp);
      }
  }, [isDraggingToolbar]);


  const handleMouseMove = (e: React.MouseEvent) => {
    if (viewMode === '3d' || isDraggingToolbar) return;
    setHasMoved(true);
    
    const modelPos = getModelCoordinates(e.clientX, e.clientY);

    if (resizeState && localData) {
        // --- RESIZE LOGIC ---
        const { startMouseX, startMouseY, initialMsg, handle } = resizeState;
        const dx = modelPos.x - startMouseX;
        const dy = modelPos.y - startMouseY;

        const rad = -initialMsg.rotation * (Math.PI / 180);
        const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);

        let newW = initialMsg.width;
        let newH = initialMsg.height;
        let deltaCx = 0; 
        let deltaCy = 0; 

        if (handle.includes('e')) { newW += localDx; deltaCx = localDx / 2; } 
        else if (handle.includes('w')) { newW -= localDx; deltaCx = localDx / 2; }

        if (handle.includes('s')) { newH += localDy; deltaCy = localDy / 2; } 
        else if (handle.includes('n')) { newH -= localDy; deltaCy = localDy / 2; }

        if (newW < 10) { newW = 10; deltaCx = 0; }
        if (newH < 10) { newH = 10; deltaCy = 0; }

        const worldShiftX = deltaCx * Math.cos(-rad) - deltaCy * Math.sin(-rad);
        const worldShiftY = deltaCx * Math.sin(-rad) + deltaCy * Math.cos(-rad);

        const oldCx = initialMsg.x + initialMsg.width / 2;
        const oldCy = initialMsg.y + initialMsg.height / 2;
        const newCx = oldCx + worldShiftX;
        const newCy = oldCy + worldShiftY;

        const newX = newCx - newW / 2;
        const newY = newCy - newH / 2;

        if (resizeState.type === 'room') {
            const updatedRooms = localData.rooms.map(r => 
                r.id === resizeState.id ? { ...r, x: newX, y: newY, width: newW, height: newH } : r
            );
            setLocalData({ ...localData, rooms: updatedRooms });
        } else {
            const updatedElements = localData.elements.map(el => 
                el.id === resizeState.id ? { ...el, x: newX, y: newY, width: newW, height: newH } : el
            );
            setLocalData({ ...localData, elements: updatedElements });
        }

    } else if (dragState && localData) {
      // --- DRAG LOGIC ---
      const dx = modelPos.x - dragState.startX;
      const dy = modelPos.y - dragState.startY;
      
      const newX = dragState.initialX + dx;
      const newY = dragState.initialY + dy;
      
      const snappedX = Math.round(newX / 10) * 10; 
      const snappedY = Math.round(newY / 10) * 10;

      if (dragState.type === 'room') {
         const updatedRooms = localData.rooms.map(r => 
          r.id === dragState.id ? { ...r, x: snappedX, y: snappedY } : r
        );
        setLocalData({ ...localData, rooms: updatedRooms });
      } else if (dragState.type === 'element') {
        const updatedElements = localData.elements.map(el => 
          el.id === dragState.id ? { ...el, x: snappedX, y: snappedY } : el
        );
        setLocalData({ ...localData, elements: updatedElements });
      }
    } else if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    if (!hasMoved && !resizeState && dragState && onSelect) {
        onSelect(dragState.id, dragState.type);
    } else if (hasMoved && (dragState || resizeState) && localData) {
        onUpdate(localData);
        if (dragState && onSelect) onSelect(dragState.id, dragState.type);
    }
    setDragState(null);
    setResizeState(null);
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
      return <LoadingOverlay />;
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
        position={toolbarPos} // PASS POSITION
        onDragStart={handleToolbarDragStart} // PASS DRAG HANDLER
      />

      {viewMode === '3d' ? (
        <Canvas3D 
            data={localData} 
            activeFloor={activeFloor} 
            onUpdate={onUpdate}
            cameraStateRef={cameraStateRef} 
        />
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
           selectedId={selectedId}
        />
      )}
    </div>
  );
};

export default BlueprintCanvas;
