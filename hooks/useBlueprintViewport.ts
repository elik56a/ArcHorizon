
import React, { useCallback } from 'react';
import { SketchData, Room } from '../types';

export const useBlueprintViewport = (
    containerRef: React.RefObject<HTMLDivElement | null>,
    localData: SketchData | null,
    activeFloor: number,
    scale: number,
    setScale: React.Dispatch<React.SetStateAction<number>>,
    rotation: number,
    setRotation: React.Dispatch<React.SetStateAction<number>>,
    setPan: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>
) => {

    const getBounds = useCallback((rooms: Room[]) => {
        if (rooms.length === 0) return { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };
        return {
            minX: Math.min(...rooms.map(r => r.x)),
            maxX: Math.max(...rooms.map(r => r.x + r.width)),
            minY: Math.min(...rooms.map(r => r.y)),
            maxY: Math.max(...rooms.map(r => r.y + r.height)),
        };
    }, []);

    const fitToScreen = useCallback((targetFloor: number = activeFloor) => {
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
    }, [localData, activeFloor, containerRef, setScale, setRotation, setPan, getBounds]);

    const rotateCanvas = useCallback((direction: 'cw' | 'ccw') => {
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
    }, [localData, activeFloor, containerRef, rotation, scale, setRotation, setPan, getBounds]);

    return { fitToScreen, rotateCanvas, getBounds };
};
