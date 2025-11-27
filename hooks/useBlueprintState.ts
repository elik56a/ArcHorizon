
import { useState } from 'react';

export const useBlueprintState = () => {
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
    const [activeFloor, setActiveFloor] = useState<number>(1);
    const [showAllFloors, setShowAllFloors] = useState(false);
    const [scale, setScale] = useState(0.6);
    const [rotation, setRotation] = useState(0);
    const [pan, setPan] = useState({ x: 50, y: 50 });
    
    // Tool State
    const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'pen' | 'eraser'>('select');
    const [penSize, setPenSize] = useState(4);
    const [eraserSize, setEraserSize] = useState(10);
    const [currentStroke, setCurrentStroke] = useState<{x: number, y: number}[] | null>(null);

    return {
        viewMode, setViewMode,
        activeFloor, setActiveFloor,
        showAllFloors, setShowAllFloors,
        scale, setScale,
        rotation, setRotation,
        pan, setPan,
        activeTool, setActiveTool,
        penSize, setPenSize,
        eraserSize, setEraserSize,
        currentStroke, setCurrentStroke
    };
};
