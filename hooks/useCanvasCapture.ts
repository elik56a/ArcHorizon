
import React from 'react';
import { SketchData } from '../types';
import { getRoomBounds } from '../services/geometry/engine/utils';
import { useProjectStore } from '../store/useProjectStore';

interface CaptureProps {
    svgRef: React.RefObject<SVGSVGElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    localData: SketchData | null;
    activeFloor: number;
    viewMode: '2d' | '3d';
}

export const useCanvasCapture = ({ svgRef, containerRef, localData, activeFloor, viewMode }: CaptureProps) => {
    const { generateRender, setIsRendering } = useProjectStore();

    const handleMagicRender = async () => {
        // Set rendering state immediately to lock UI
        setIsRendering(true);
        
        if (!localData) {
            setIsRendering(false);
            return;
        }
  
        // Add delay to let UI update
        setTimeout(async () => {
            if (viewMode === '2d' && svgRef.current) {
                // 2D CAPTURE - SMART FIT
                try {
                    const serializer = new XMLSerializer();
                    // Clone to avoid modifying the visible DOM during serialization
                    const svgNode = svgRef.current.cloneNode(true) as SVGSVGElement;
                    
                    // Calculate FULL bounds of the floor
                    const floorRooms = localData.rooms.filter(r => r.floor === activeFloor);
                    const b = getRoomBounds(floorRooms);
                    
                    if (b.w > 0 && b.h > 0) {
                        // Add padding
                        const padding = 200;
                        const viewBox = `${b.x - padding} ${b.y - padding} ${b.w + padding*2} ${b.h + padding*2}`;
                        
                        // Remove any transforms on the group to ensure raw coordinates map to viewBox
                        const g = svgNode.querySelector('g');
                        if (g) {
                             g.removeAttribute('transform');
                        }
  
                        svgNode.setAttribute('viewBox', viewBox);
                        svgNode.setAttribute('width', '2048');
                        svgNode.setAttribute('height', '2048');
                    }
  
                    const svgStr = serializer.serializeToString(svgNode);
                    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
                    const url = URL.createObjectURL(svgBlob);
                    
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 2048;
                        canvas.height = 2048;
                        
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.fillStyle = "white";
                            ctx.fillRect(0,0, canvas.width, canvas.height);
                            // Draw centered
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            const base64 = canvas.toDataURL('image/png').split(',')[1];
                            generateRender(base64);
                        }
                        URL.revokeObjectURL(url);
                    };
                    img.src = url;
                } catch (e) {
                    console.error("SVG Capture failed", e);
                    setIsRendering(false);
                }
            } else if (viewMode === '3d' && containerRef.current) {
                // 3D CAPTURE
                try {
                    const canvasEl = containerRef.current.querySelector('canvas');
                    if (canvasEl) {
                        // Must use preserveDrawingBuffer: true in Canvas3D
                        const base64 = canvasEl.toDataURL('image/png').split(',')[1];
                        generateRender(base64);
                    }
                } catch (e) {
                    console.error("WebGL Capture failed", e);
                    setIsRendering(false);
                }
            }
        }, 100);
    };

    return { handleMagicRender };
};
