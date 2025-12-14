
import React, { useState, useRef } from 'react';
import { SketchData } from '../types';
import { useProjectStore } from '../store/useProjectStore';
import { useUiStore } from '../store/useUiStore';

interface DragState { id: string; type: 'room' | 'element'; startX: number; startY: number; initialX: number; initialY: number; }
interface ResizeState { id: string; type: 'room' | 'element'; handle: string; startMouseX: number; startMouseY: number; initialMsg: { x: number, y: number, width: number, height: number, rotation: number }; }

interface InteractionProps {
    svgRef: React.RefObject<SVGSVGElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    localData: SketchData | null;
    setLocalData: (data: SketchData) => void;
    activeFloor: number;
    scale: number;
    rotation: number;
    pan: { x: number, y: number };
    setPan: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
    activeTool: 'select' | 'pan' | 'pen' | 'eraser';
    eraserSize: number;
    penSize: number;
    setCurrentStroke: React.Dispatch<React.SetStateAction<{ x: number, y: number }[] | null>>;
    currentStroke: { x: number, y: number }[] | null;
    currentOptionIndex: number;
    viewMode: '2d' | '3d';
    setScale: React.Dispatch<React.SetStateAction<number>>;
}

export const useCanvasInteraction = ({
    containerRef, localData, setLocalData, activeFloor, scale, rotation, pan, setPan,
    activeTool, eraserSize, penSize, setCurrentStroke, currentStroke, currentOptionIndex, viewMode, setScale
}: InteractionProps) => {
    
    const { 
        setSelection, updateOptionStatus, addDrawing, deleteDrawing, deleteItem, selection,
        activeLayerId, getActiveLayerConfig
    } = useProjectStore();
    
    const { setActiveRightPanel, setPanelOpen } = useUiStore();

    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [resizeState, setResizeState] = useState<ResizeState | null>(null);
    const [hasMoved, setHasMoved] = useState(false);
    const mouseDownPos = useRef<{x: number, y: number} | null>(null);
    
    // Pinch Zoom State
    const [pinchDist, setPinchDist] = useState<number | null>(null);

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

    // --- MOUSE HANDLERS ---

    const handleMouseDown = (e: React.MouseEvent, id?: string, type?: 'room' | 'element', x?: number, y?: number, resizeHandle?: string) => {
        if (viewMode === '3d') return; 
        e.preventDefault(); e.stopPropagation();
        setHasMoved(false);
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
        const modelPos = getModelCoordinates(e.clientX, e.clientY);
    
        // TOOL LOGIC
        if (activeTool === 'pen') {
            const config = getActiveLayerConfig();
            if (config.editableScopes.drawings) {
                setCurrentStroke([{ x: modelPos.x, y: modelPos.y }]);
            } else {
                console.warn("Drawings not allowed in this layer");
            }
            return;
        }
        // Pan tool explicit
        if (activeTool === 'pan') {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            return;
        }
    
        // ERASER DRAG START (Handled in Move)
        if (activeTool === 'eraser') {
            return; 
        }
    
        // CHECK EDITABLE SCOPES BEFORE ALLOWING DRAG/RESIZE
        const config = getActiveLayerConfig();
        let isEditable = false;
        
        if (id && type && localData) {
            const item = type === 'room' 
                ? localData.rooms.find(r => r.id === id) 
                : localData.elements.find(el => el.id === id);
            
            if (item) {
                // 1. Layer Check: Can only edit items on active layer
                if (item.layerId === activeLayerId) {
                    // 2. Scope Check
                    if (type === 'room') {
                        isEditable = config.editableScopes.rooms;
                    } else {
                        const isOpening = ['window', 'door', 'entry_door', 'sliding_door', 'wall_opening'].includes((item as any).type);
                        isEditable = isOpening ? config.editableScopes.openings : config.editableScopes.elements;
                    }
                }
            }
        }

        // SELECT TOOL INTERACTIONS
        // RESIZE START
        if (resizeHandle && id && type && localData && activeTool === 'select' && isEditable) {
            const item = type === 'room' ? localData.rooms.find(r => r.id === id) : localData.elements.find(el => el.id === id);
            if (item) setResizeState({ id, type, handle: resizeHandle, startMouseX: modelPos.x, startMouseY: modelPos.y, initialMsg: { x: item.x, y: item.y, width: item.width, height: item.height, rotation: (item as any).rotation || 0 } });
            return;
        } 
        // DRAG START
        if (id && type && x !== undefined && y !== undefined && activeTool === 'select') {
            // IMPROVED SELECTION: Select immediately on click for better UX
            if (id !== selection?.id) {
                setSelection({ id, type });
                // Automatically switch the right panel to properties
                setActiveRightPanel('properties');
                setPanelOpen('right', true);
            }
            
            // Start dragging immediately only if editable
            if (isEditable) {
                setDragState({ id, type, startX: modelPos.x, startY: modelPos.y, initialX: x, initialY: y });
            }
            return;
        } 
        // CANVAS PAN START (Fallback)
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        if(activeTool === 'select') {
            setSelection(null); 
            // When deselecting, switch back to library
            setActiveRightPanel('library');
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (viewMode === '3d') return;
        const modelPos = getModelCoordinates(e.clientX, e.clientY);
        
        // PEN DRAWING
        if (activeTool === 'pen' && currentStroke) {
            setCurrentStroke(prev => [...(prev || []), { x: modelPos.x, y: modelPos.y }]);
            return;
        }
    
        // ERASER DRAGGING
        if (activeTool === 'eraser' && (e.buttons === 1)) {
            const config = getActiveLayerConfig();
            if (localData) {
                 const eraseRad = eraserSize / scale;
                 // Erase Drawings
                 if (localData.drawings && config.editableScopes.drawings) {
                    const hitDrawing = localData.drawings.find(d => {
                        if (d.floor !== activeFloor) return false;
                        if (d.layerId !== activeLayerId) return false; // Layer Guard
                        return d.points.some(p => Math.hypot(p.x - modelPos.x, p.y - modelPos.y) < eraseRad);
                    });
                    if (hitDrawing) {
                        deleteDrawing(hitDrawing.id);
                    }
                 }
                 // Erase Elements
                 const hitEl = localData.elements.find(el => {
                    if (el.floor !== activeFloor) return false;
                    if (el.layerId !== activeLayerId) return false; // Layer Guard
                    
                    const inX = modelPos.x >= el.x && modelPos.x <= el.x + el.width;
                    const inY = modelPos.y >= el.y && modelPos.y <= el.y + el.height;
                    return inX && inY;
                 });
                 if (hitEl) { 
                   // Scope Check for Eraser
                   const isOpening = ['window', 'door', 'entry_door', 'sliding_door', 'wall_opening'].includes(hitEl.type);
                   const canDelete = isOpening ? config.editableScopes.openings : config.editableScopes.elements;
                   if (canDelete) deleteItem(hitEl.id, 'element'); 
                 }
            }
            return;
        }
    
        if (mouseDownPos.current) {
            if (Math.abs(e.clientX - mouseDownPos.current.x) > 6 || Math.abs(e.clientY - mouseDownPos.current.y) > 6) setHasMoved(true);
        }
        
        // Ignore small movements for selection/pan distinction
        if (!hasMoved && (!mouseDownPos.current || (Math.abs(e.clientX - mouseDownPos.current.x) <= 6 && Math.abs(e.clientY - mouseDownPos.current.y) <= 6))) return;
        
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
        } else if (isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        // PEN COMMIT
        if (activeTool === 'pen' && currentStroke) {
            if (currentStroke.length > 1) {
                addDrawing({
                    id: `draw-${Date.now()}`,
                    floor: activeFloor,
                    points: currentStroke,
                    strokeWidth: penSize,
                    color: '#000000',
                    layerId: activeLayerId // Attach current active layer
                });
            }
            setCurrentStroke(null);
            return;
        }
        
        // ERASER CLICK
        if (activeTool === 'eraser' && !hasMoved && localData) {
            const config = getActiveLayerConfig();
            const modelPos = getModelCoordinates(e.clientX, e.clientY);
            const eraseRad = eraserSize / scale;
            
            // Drawings
            if (config.editableScopes.drawings) {
                const hitDrawing = (localData.drawings || []).find(d => {
                     if (d.floor !== activeFloor) return false;
                     if (d.layerId !== activeLayerId) return false;
                     return d.points.some(p => Math.hypot(p.x - modelPos.x, p.y - modelPos.y) < eraseRad);
                });
                if (hitDrawing) { deleteDrawing(hitDrawing.id); return; }
            }
    
            // Elements
            const hitEl = localData.elements.find(el => {
                 if (el.floor !== activeFloor) return false;
                 if (el.layerId !== activeLayerId) return false;
                 const inX = modelPos.x >= el.x && modelPos.x <= el.x + el.width;
                 const inY = modelPos.y >= el.y && modelPos.y <= el.y + el.height;
                 return inX && inY;
            });
            if (hitEl) { 
                const isOpening = ['window', 'door', 'entry_door', 'sliding_door', 'wall_opening'].includes(hitEl.type);
                const canDelete = isOpening ? config.editableScopes.openings : config.editableScopes.elements;
                if (canDelete) deleteItem(hitEl.id, 'element'); 
                return; 
            }
        }
    
        // Handle Item Clicks (Selection without moving)
        if (dragState && !hasMoved && activeTool === 'select') {
             // Logic handled in MouseDown for panel switching, but ensure panel is open
             setPanelOpen('right', true);
             setActiveRightPanel('properties');
        }
        else if (hasMoved && (dragState || resizeState) && localData) {
            // Finished Drag/Resize: Commit to Store
            updateOptionStatus(currentOptionIndex, { status: 'loaded', data: localData });
            if (dragState) setSelection({ id: dragState.id, type: dragState.type });
        }
        
        // Reset Interaction States
        setDragState(null); setResizeState(null); setIsPanning(false); setHasMoved(false); mouseDownPos.current = null;
    };

    const handleWheel = (e: React.WheelEvent, setScale: React.Dispatch<React.SetStateAction<number>>) => {
        if (viewMode === '3d') return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(s => Math.min(Math.max(s * delta, 0.1), 5));
    };

    // --- TOUCH HANDLERS ---

    const handleTouchStart = (e: React.TouchEvent, id?: string, type?: 'room' | 'element', x?: number, y?: number, resizeHandle?: string) => {
        // Multi-touch = Pinch Start
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            setPinchDist(dist);
            // Cancel any drag/pan that might have started with the first finger
            setDragState(null);
            setIsPanning(false);
            return;
        }

        // Single touch = Mouse Down Logic
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const fakeEvent = {
                ...e,
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0,
                buttons: 1,
                preventDefault: () => {},
                stopPropagation: () => {}
            } as unknown as React.MouseEvent;
            
            handleMouseDown(fakeEvent, id, type, x, y, resizeHandle);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // Pinch Zoom Logic
        if (e.touches.length === 2 && pinchDist) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const zoomFactor = dist / pinchDist;
            setScale(prev => Math.min(Math.max(prev * zoomFactor, 0.1), 5));
            setPinchDist(dist);
            return;
        }

        // Single Touch Move
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const fakeEvent = {
                ...e,
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0,
                buttons: 1
            } as unknown as React.MouseEvent;
            handleMouseMove(fakeEvent);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        setPinchDist(null);
        // Only trigger mouse up logic if we were not pinching
        // If touches drops to 0, call mouse up
        if (e.touches.length === 0) {
            const touch = e.changedTouches[0];
            const fakeEvent = {
                ...e,
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0,
                buttons: 0
            } as unknown as React.MouseEvent;
            handleMouseUp(fakeEvent);
        }
    };

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        isPanning,
        dragState,
        resizeState
    };
};
