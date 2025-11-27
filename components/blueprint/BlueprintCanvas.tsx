import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore'; 
import { useUiStore } from '../../store/useUiStore'; 
import { SketchData } from '../../types';
import { downloadDXF, downloadPDF, downloadSVG } from '../../services/exportService';
import Canvas3D from './3d/Canvas3D';
import Canvas2D from './2d/Canvas2D';
import { TopToolbar, FloorSelector } from './BlueprintControls';
import { useBlueprintState } from '../../hooks/useBlueprintState';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { useCanvasCapture } from '../../hooks/useCanvasCapture';
import { useBlueprintViewport } from '../../hooks/useBlueprintViewport';
import { LoadingOverlay, EmptyState, RenderSuccessToast } from './BlueprintOverlays';
import { CURSOR_PEN, CURSOR_ERASER } from './constants';

const BlueprintCanvas: React.FC = () => {
  const { 
      getCurrentSketch, isGenerating, selection, 
      currentOptionIndex, sketchOptions,
      undo, redo, history, future, currentRenderUrl, clearRender,
      renderTrigger, updateOptionStatus
  } = useProjectStore();

  const { setGalleryOpen } = useUiStore();

  const data = getCurrentSketch();
  const isLoading = isGenerating && (!data || sketchOptions[currentOptionIndex]?.status === 'loading');

  // Use Custom Hooks for State Logic
  const {
      viewMode, setViewMode, activeFloor, setActiveFloor, showAllFloors, setShowAllFloors,
      scale, setScale, rotation, setRotation, pan, setPan,
      activeTool, setActiveTool, penSize, setPenSize, eraserSize, setEraserSize,
      currentStroke, setCurrentStroke
  } = useBlueprintState();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraStateRef = useRef<{ position: any, target: any } | null>(null);
  
  // Local Data for immediate feedback during interactions
  const [localData, setLocalData] = useState<SketchData | null>(data);

  // Sync Data
  useEffect(() => { 
      setLocalData(data); 
  }, [data]);

  const { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, isPanning } = useCanvasInteraction({
      svgRef, containerRef, localData, setLocalData: setLocalData as any, activeFloor, scale, rotation, pan, setPan,
      activeTool, eraserSize, penSize, setCurrentStroke, currentStroke, currentOptionIndex, viewMode
  });

  const { fitToScreen, rotateCanvas, getBounds } = useBlueprintViewport(
      containerRef, localData, activeFloor, scale, setScale, rotation, setRotation, setPan
  );

  const { handleMagicRender } = useCanvasCapture({
      svgRef, containerRef, localData, activeFloor, viewMode
  });

  // Fit Screen Logic
  useEffect(() => {
    if (data?.rooms.length) {
        const minFloor = Math.min(...data.rooms.map(r => r.floor));
        setActiveFloor(minFloor);
        setTimeout(() => fitToScreen(minFloor), 100);
        cameraStateRef.current = null;
    }
  }, [data?.id]);

  useEffect(() => {
      if (viewMode === '2d') fitToScreen(activeFloor);
      else if (showAllFloors) { setShowAllFloors(false); setActiveFloor(1); }
  }, [activeFloor, viewMode]);
  
  // Remote Render Trigger
  const prevTriggerRef = useRef(renderTrigger);
  useEffect(() => {
      if (renderTrigger !== prevTriggerRef.current) {
          prevTriggerRef.current = renderTrigger;
          handleMagicRender();
      }
  }, [renderTrigger]);

  const handleDownload = (type: 'svg' | 'pdf' | 'dxf') => {
    if (!localData) return;
    const filename = localData.title.replace(/\s+/g, '_').toLowerCase() || 'plan';
    if (type === 'svg' && svgRef.current) downloadSVG(svgRef.current, filename);
    if (type === 'pdf' && svgRef.current) downloadPDF(svgRef.current, filename);
    if (type === 'dxf') downloadDXF(localData, filename);
  };

  const handle3DUpdate = (newData: SketchData) => {
      updateOptionStatus(currentOptionIndex, { status: 'loaded', data: newData });
  };

  const totalFloors = localData ? Math.max(localData.floors || 0, ...localData.rooms.map(r => r.floor), 1) : 1;
  const cursorStyle = activeTool === 'pen' ? CURSOR_PEN : activeTool === 'eraser' ? CURSOR_ERASER : isPanning ? 'grabbing' : 'default';

  return (
    <div className="flex flex-col h-full w-full bg-[#f0f0f0]">
      
      {(localData || isLoading) && (
          <TopToolbar 
              data={localData || {} as SketchData} 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              scale={scale} 
              setScale={setScale} 
              rotateCanvas={rotateCanvas} 
              onFit={() => fitToScreen()} 
              history={{ undo, redo, canUndo: history.length > 0, canRedo: future.length > 0 }} 
              onRender={handleMagicRender}
              onDownload={handleDownload}
              isLoading={isLoading}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              penSize={penSize}
              setPenSize={setPenSize}
              eraserSize={eraserSize}
              setEraserSize={setEraserSize}
          />
      )}

      <div 
        className={`flex-1 relative overflow-hidden w-full`} 
        style={{ cursor: cursorStyle }}
        ref={containerRef}
      >
        {localData && (
            <>
                <FloorSelector 
                    totalFloors={totalFloors} 
                    activeFloor={activeFloor} 
                    showAllFloors={showAllFloors} 
                    onChange={(f) => { setActiveFloor(f); setShowAllFloors(false); }} 
                    onToggleAll={() => setShowAllFloors(!showAllFloors)} 
                    viewMode={viewMode} 
                />
                
                <RenderSuccessToast 
                    url={currentRenderUrl} 
                    onClose={clearRender} 
                    onViewGallery={() => { clearRender(); setGalleryOpen(true); }}
                />
            </>
        )}
        
        {!localData ? (
             <EmptyState />
        ) : (
             viewMode === '3d' ? (
                <Canvas3D 
                    data={localData} 
                    activeFloor={activeFloor} 
                    showAllFloors={showAllFloors} 
                    onUpdate={handle3DUpdate} 
                    cameraStateRef={cameraStateRef}
                    cameraMode='perspective'
                />
            ) : (
                <Canvas2D 
                    svgRef={svgRef} 
                    data={localData} 
                    activeFloor={activeFloor} 
                    pan={pan} 
                    scale={scale} 
                    rotation={rotation} 
                    bounds={getBounds(localData.rooms.filter(r => r.floor === activeFloor))} 
                    onMouseDown={handleMouseDown} 
                    onMouseMove={handleMouseMove} 
                    onMouseUp={handleMouseUp} 
                    onWheel={(e) => handleWheel(e, setScale)} 
                    selectedId={selection?.id} 
                    currentStroke={currentStroke}
                    penSize={penSize}
                    activeTool={activeTool}
                    eraserSize={eraserSize}
                />
            )
        )}

        {isLoading && <LoadingOverlay />}

      </div>
    </div>
  );
};

export default BlueprintCanvas;