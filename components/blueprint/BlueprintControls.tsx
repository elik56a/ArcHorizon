
import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Download, Undo, Redo, Maximize, Layers, RotateCw, RotateCcw, LucideIcon, GripHorizontal, Building2 } from 'lucide-react';
import { SketchData } from '../../types';

// --- HELPER: TOOLTIP BUTTON ---
interface TooltipButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    label: string;
    disabled?: boolean;
    className?: string;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({ onClick, icon: Icon, label, disabled, className = "" }) => {
    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`relative group p-2 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed ${className ? className : 'hover:bg-gray-100 text-gray-700'}`}
        >
            <Icon size={18} />
            
            {/* Tooltip Container */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap">
                <div className="bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg relative">
                    {label}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                </div>
            </div>
        </button>
    );
};

// --- HEADER COMPONENT ---
export const ViewportHeader: React.FC<{ 
    data: SketchData; 
    activeFloor: number; 
    totalFloors: number;
    onDownload: (type: 'svg' | 'pdf' | 'dxf') => void;
}> = ({ data, activeFloor, totalFloors, onDownload }) => {
    const [showExportMenu, setShowExportMenu] = useState(false);

    return (
        <>
            <div className="absolute top-6 left-6 bg-white border-2 border-black px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 flex flex-col pointer-events-none select-none">
                <h1 className="font-mono font-bold text-lg uppercase tracking-tighter">{data.title}</h1>
                <div className="flex gap-4 text-[10px] font-mono mt-1 text-gray-600 uppercase">
                    <span>AREA: {data.totalAreaSqm} M²</span>
                    <span>FLOOR: {activeFloor}/{totalFloors}</span>
                </div>
            </div>

            <div className="absolute top-6 right-6 flex gap-3 z-20">
                <div className="relative">
                    <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="bg-black text-white p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-0.5 hover:shadow-none transition-all rounded-full group relative"
                    >
                        <Download size={20} />
                        {/* Custom Tooltip for the big Download button */}
                        <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50 whitespace-nowrap mr-2">
                            <div className="bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg">
                                Export Project
                            </div>
                        </div>
                    </button>
                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col min-w-[140px]">
                            <button onClick={() => { onDownload('svg'); setShowExportMenu(false); }} className="px-4 py-3 text-left hover:bg-gray-100 font-mono text-xs font-bold border-b border-gray-100">SVG (Vector)</button>
                            <button onClick={() => { onDownload('pdf'); setShowExportMenu(false); }} className="px-4 py-3 text-left hover:bg-gray-100 font-mono text-xs font-bold border-b border-gray-100">PDF (Doc)</button>
                            <button onClick={() => { onDownload('dxf'); setShowExportMenu(false); }} className="px-4 py-3 text-left hover:bg-gray-100 font-mono text-xs font-bold">DXF (AutoCAD R12)</button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// --- FLOOR SELECTOR ---
export const FloorSelector: React.FC<{
    totalFloors: number;
    activeFloor: number;
    showAllFloors: boolean;
    onChange: (floor: number) => void;
    onToggleAll: () => void;
    viewMode: '2d' | '3d';
}> = ({ totalFloors, activeFloor, showAllFloors, onChange, onToggleAll, viewMode }) => {
    
    // If there is only one floor, we don't need a floor selector at all
    if (totalFloors <= 1) return null;

    return (
        <div className="absolute left-6 top-32 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 z-30 flex flex-col gap-2">
           <div className="flex items-center justify-center pb-1 border-b border-gray-100 mb-1">
               <Layers size={16} className="text-gray-400"/>
           </div>
           
           {Array.from({length: totalFloors}, (_, i) => totalFloors - i).map(floor => (
              <button 
                key={floor}
                onClick={() => onChange(floor)}
                title={`Go to Floor ${floor}`}
                className={`w-8 h-8 font-mono text-sm font-bold transition-all border-2 rounded-md flex items-center justify-center ${activeFloor === floor && !showAllFloors ? 'bg-black text-white border-black' : 'border-transparent hover:bg-gray-100 text-black'}`}
              >
                {floor}
              </button>
           ))}
           
           {/* Show Whole Building Button: ONLY in 3D mode */}
           {viewMode === '3d' && (
               <div className="pt-1 mt-1 border-t border-gray-200 flex flex-col gap-1">
                    <button 
                        onClick={onToggleAll}
                        title="Toggle Whole Building View"
                        className={`w-8 h-8 flex items-center justify-center transition-all border-2 rounded-md ${showAllFloors ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200 hover:border-gray-400 text-gray-600'}`}
                    >
                        <Building2 size={16} />
                    </button>
               </div>
           )}
        </div>
    );
};

// --- BOTTOM TOOLBAR ---
interface ToolbarProps {
    viewMode: '2d' | '3d';
    setViewMode: (m: '2d' | '3d') => void;
    scale: number;
    setScale: React.Dispatch<React.SetStateAction<number>>;
    rotateCanvas: (d: 'cw' | 'ccw') => void;
    onFit: () => void;
    history: {
        undo: () => void;
        redo: () => void;
        canUndo: boolean;
        canRedo: boolean;
    } | undefined;
    position?: { x: number, y: number } | null;
    onDragStart?: (e: React.MouseEvent) => void;
}

export const ViewportToolbar: React.FC<ToolbarProps> = ({ 
    viewMode, setViewMode, scale, setScale, rotateCanvas, onFit, history, position, onDragStart
}) => {
    const style = position 
        ? { left: position.x, top: position.y, transform: 'none' } 
        : { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' };

    return (
        <div 
            className="absolute bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-3 py-2 flex items-center gap-3 z-30 rounded-none viewport-toolbar select-none"
            style={style}
        >
             {/* Drag Handle */}
             <div 
               className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
               onMouseDown={onDragStart}
             >
                <GripHorizontal size={20} />
             </div>
             <div className="w-px h-6 bg-gray-300"></div>

             <div className="flex bg-gray-100 p-1 rounded border border-gray-300">
                <button 
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1 text-xs font-bold rounded transition-all ${viewMode === '2d' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                  2D
                </button>
                <button 
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1 text-xs font-bold rounded transition-all ${viewMode === '3d' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                  3D
                </button>
             </div>
             
             <div className="w-px h-6 bg-gray-300"></div>

             {viewMode === '2d' && (
               <>
                <div className="flex gap-2 items-center">
                    <TooltipButton onClick={() => setScale(s => s * 0.9)} icon={ZoomOut} label="Zoom Out" />
                    <span className="font-mono text-xs w-10 text-center select-none text-gray-500">{Math.round(scale * 100)}%</span>
                    <TooltipButton onClick={() => setScale(s => s * 1.1)} icon={ZoomIn} label="Zoom In" />
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="flex gap-2 items-center">
                    <TooltipButton onClick={() => rotateCanvas('ccw')} icon={RotateCcw} label="Rotate Left 90°" />
                    <TooltipButton onClick={() => rotateCanvas('cw')} icon={RotateCw} label="Rotate Right 90°" />
                </div>
               </>
             )}
             
             <div className="w-px h-6 bg-gray-300"></div>
             <TooltipButton onClick={onFit} icon={Maximize} label="Fit to Screen" />
             <div className="w-px h-6 bg-gray-300"></div>
             {history && (
               <>
                 <TooltipButton onClick={history.undo} disabled={!history.canUndo} icon={Undo} label="Undo Change" />
                 <TooltipButton onClick={history.redo} disabled={!history.canRedo} icon={Redo} label="Redo Change" />
               </>
             )}
      </div>
    );
}
