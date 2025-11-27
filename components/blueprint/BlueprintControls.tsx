
import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Download, Undo, Redo, Maximize, RotateCw, LucideIcon, Hand, Pen, Eraser, ChevronDown, MousePointer2, Wand2, Building2 } from 'lucide-react';
import { SketchData } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';

// --- HELPER: TOOLTIP BUTTON ---
interface TooltipButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    label: string;
    disabled?: boolean;
    className?: string;
    isActive?: boolean;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({ onClick, icon: Icon, label, disabled, className = "", isActive }) => {
    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`relative group p-2 rounded-md transition-all flex items-center justify-center h-9 w-9 ${
                isActive 
                    ? 'bg-black text-white shadow-md hover:bg-gray-800' 
                    : (className ? className : 'hover:bg-gray-100 text-gray-600')
            } ${disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}`}
        >
            <Icon size={18} />
            
            {/* Tooltip Container */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-50 whitespace-nowrap pointer-events-none">
                <div className="bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg relative">
                    {label}
                    {/* Arrow */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-slate-900"></div>
                </div>
            </div>
        </button>
    );
};

// --- THICKNESS DROPDOWN ---
interface ThicknessDropdownProps {
    value: number;
    onChange: (val: number) => void;
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    disabled?: boolean;
    activeTool: boolean;
}

const ThicknessDropdown: React.FC<ThicknessDropdownProps> = ({ value, onChange, isOpen, setIsOpen, disabled, activeTool }) => {
    const options = [2, 4, 6, 8, 10];
    
    return (
        <div className="relative h-full flex items-center">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                disabled={disabled}
                className={`h-full w-5 flex items-center justify-center rounded-r-md border-l transition-colors ${
                    activeTool 
                        ? 'border-gray-700 text-white hover:bg-gray-800' 
                        : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                <ChevronDown size={10} />
            </button>
            
            {isOpen && !disabled && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-md p-1 min-w-[120px] z-50 flex flex-col gap-1 animate-fade-in">
                     <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">Thickness</div>
                     {options.map(size => (
                         <button
                            key={size}
                            onClick={() => { onChange(size); setIsOpen(false); }}
                            className={`flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded text-xs w-full text-left group ${value === size ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                         >
                             <div className="w-8 flex justify-center items-center">
                                <div className={`rounded-full ${value === size ? 'bg-blue-600' : 'bg-gray-400 group-hover:bg-gray-600'}`} style={{ width: size, height: size }}></div>
                             </div>
                             <span className="font-mono">Size {size}</span>
                         </button>
                     ))}
                </div>
            )}
        </div>
    );
};


// --- TOP TOOLBAR COMPONENT ---
interface TopToolbarProps {
    data: SketchData;
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
    onRender: () => void;
    onDownload: (type: 'svg' | 'pdf' | 'dxf') => void;
    isLoading?: boolean;
    
    // Tools
    activeTool: 'select' | 'pan' | 'pen' | 'eraser';
    setActiveTool: (t: 'select' | 'pan' | 'pen' | 'eraser') => void;
    penSize: number;
    setPenSize: (s: number) => void;
    eraserSize: number;
    setEraserSize: (s: number) => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({ 
    data,
    viewMode, setViewMode, scale, setScale, rotateCanvas, onFit, history, onRender, onDownload, isLoading,
    activeTool, setActiveTool, penSize, setPenSize, eraserSize, setEraserSize
}) => {
    const { isRendering } = useProjectStore();
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [penMenuOpen, setPenMenuOpen] = useState(false);
    const [eraserMenuOpen, setEraserMenuOpen] = useState(false);

    // In 3D, all tools are irrelevant, so we disable them visually
    // isLoading also disables everything
    const toolsDisabled = viewMode === '3d' || isLoading;
    
    // Check if drawing has any content to render
    const hasContent = data && ((data.rooms && data.rooms.length > 0) || (data.elements && data.elements.length > 0) || (data.drawings && data.drawings.length > 0));
    
    // Specific check for Render button: Disabled if loading OR already rendering OR no content
    const renderDisabled = isLoading || isRendering || !hasContent;

    return (
        <div className="w-full h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 select-none z-30 shrink-0 shadow-sm relative transition-all">
            
            {/* Left: Tools */}
            <div className="flex items-center gap-2">
                {/* View Switcher */}
                <div className={`flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 mr-2 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <button 
                      onClick={() => !isLoading && setViewMode('2d')}
                      disabled={isLoading}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === '2d' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                    >
                      2D
                    </button>
                    <button 
                      onClick={() => !isLoading && setViewMode('3d')}
                      disabled={isLoading}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === '3d' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                    >
                      3D
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-1">
                     <TooltipButton onClick={() => setActiveTool('select')} icon={MousePointer2} label="Select" isActive={activeTool === 'select' && !toolsDisabled} disabled={toolsDisabled} />
                     <TooltipButton onClick={() => setActiveTool('pan')} icon={Hand} label="Pan" isActive={activeTool === 'pan' && !toolsDisabled} disabled={toolsDisabled} />
                </div>
                
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                
                {/* Drawing Tools */}
                <div className="flex items-center gap-2">
                    {/* Pen Tool Group */}
                    <div className={`flex items-center rounded-md border h-9 transition-all ${activeTool === 'pen' && !toolsDisabled ? 'border-black bg-black' : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'}`}>
                        <button 
                            onClick={() => setActiveTool('pen')}
                            disabled={toolsDisabled}
                            className={`pl-3 pr-2 h-full flex items-center gap-2 rounded-l-md ${activeTool === 'pen' && !toolsDisabled ? 'text-white' : 'text-gray-600'} ${toolsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                            title="Pen Tool"
                        >
                            <Pen size={16} />
                            <span className="text-xs font-bold">Pen</span>
                        </button>
                        <ThicknessDropdown 
                            value={penSize} 
                            onChange={setPenSize} 
                            isOpen={penMenuOpen} 
                            setIsOpen={(v) => { setPenMenuOpen(v); if(v) setEraserMenuOpen(false); }} 
                            disabled={toolsDisabled}
                            activeTool={activeTool === 'pen' && !toolsDisabled}
                        />
                    </div>

                    {/* Eraser Tool Group */}
                    <div className={`flex items-center rounded-md border h-9 transition-all ${activeTool === 'eraser' && !toolsDisabled ? 'border-black bg-black' : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'}`}>
                        <button 
                            onClick={() => setActiveTool('eraser')}
                            disabled={toolsDisabled}
                            className={`pl-3 pr-2 h-full flex items-center gap-2 rounded-l-md ${activeTool === 'eraser' && !toolsDisabled ? 'text-white' : 'text-gray-600'} ${toolsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                            title="Eraser Tool"
                        >
                            <Eraser size={16} />
                            <span className="text-xs font-bold">Eraser</span>
                        </button>
                        <ThicknessDropdown 
                            value={eraserSize} 
                            onChange={setEraserSize} 
                            isOpen={eraserMenuOpen} 
                            setIsOpen={(v) => { setEraserMenuOpen(v); if(v) setPenMenuOpen(false); }} 
                            disabled={toolsDisabled}
                            activeTool={activeTool === 'eraser' && !toolsDisabled}
                        />
                    </div>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                
                 {/* Undo/Redo */}
                 {history && (
                    <div className="flex items-center gap-1">
                         <TooltipButton onClick={history.undo} disabled={!history.canUndo || isLoading} icon={Undo} label="Undo" />
                         <TooltipButton onClick={history.redo} disabled={!history.canRedo || isLoading} icon={Redo} label="Redo" />
                    </div>
                 )}
            </div>

            {/* Right: Zoom & Actions */}
            <div className="flex items-center gap-1">
                 <div className={`flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 mr-2 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <TooltipButton onClick={() => setScale(s => s * 0.9)} icon={ZoomOut} label="Zoom Out" className="h-8 w-8 p-1.5" disabled={isLoading} />
                    <span className="text-xs font-mono font-medium w-12 text-center text-gray-500">{Math.round(scale * 100)}%</span>
                    <TooltipButton onClick={() => setScale(s => s * 1.1)} icon={ZoomIn} label="Zoom In" className="h-8 w-8 p-1.5" disabled={isLoading} />
                 </div>
                 
                 <TooltipButton onClick={onFit} icon={Maximize} label="Fit to Screen" disabled={isLoading} />
                 <TooltipButton onClick={() => rotateCanvas('cw')} icon={RotateCw} label="Rotate" disabled={toolsDisabled} />

                 <div className="w-px h-6 bg-gray-200 mx-2"></div>

                 <TooltipButton 
                    onClick={onRender} 
                    icon={Wand2} 
                    label={
                        isRendering ? "Rendering..." : 
                        !hasContent ? "Draw or add items to render" : 
                        "Realistic Image created using AI"
                    } 
                    isActive={isRendering}
                    disabled={renderDisabled}
                    className={`transition-all ${isRendering ? 'bg-indigo-600 text-white animate-pulse' : 'text-indigo-600 hover:bg-indigo-50'}`}
                 />

                 <div className={`relative ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="bg-black text-white px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors ml-2 shadow-sm active:scale-95"
                        disabled={isLoading}
                    >
                        <Download size={14} /> Export
                    </button>
                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 shadow-xl rounded-lg flex flex-col min-w-[160px] overflow-hidden z-50 animate-fade-in">
                            <button onClick={() => { onDownload('svg'); setShowExportMenu(false); }} className="px-4 py-3 text-left hover:bg-gray-50 text-xs font-bold border-b border-gray-50 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 px-1 rounded text-[10px]">SVG</span> Vector Image
                            </button>
                            <button onClick={() => { onDownload('pdf'); setShowExportMenu(false); }} className="px-4 py-3 text-left hover:bg-gray-50 text-xs font-bold border-b border-gray-50 flex items-center gap-2">
                                <span className="bg-red-100 text-red-600 px-1 rounded text-[10px]">PDF</span> Document
                            </button>
                            <button onClick={() => { onDownload('dxf'); setShowExportMenu(false); }} className="px-4 py-3 text-left hover:bg-gray-50 text-xs font-bold flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 px-1 rounded text-[10px]">DXF</span> AutoCAD
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- FLOOR SELECTOR (Floating) ---
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
        <div className="absolute left-6 top-6 bg-white border border-gray-200 shadow-lg rounded-lg p-1.5 z-20 flex flex-col gap-1.5">
           {Array.from({length: totalFloors}, (_, i) => totalFloors - i).map(floor => (
              <button 
                key={floor}
                onClick={() => onChange(floor)}
                title={`Go to Floor ${floor}`}
                className={`w-8 h-8 font-mono text-xs font-bold transition-all rounded-md flex items-center justify-center border ${activeFloor === floor && !showAllFloors ? 'bg-black text-white border-black shadow-md' : 'bg-white border-transparent hover:bg-gray-100 text-gray-500'}`}
              >
                {floor}
              </button>
           ))}
           
           {/* Show Whole Building Button: ONLY in 3D mode */}
           {viewMode === '3d' && (
               <div className="pt-1 mt-0.5 border-t border-gray-100 flex flex-col gap-1">
                    <button 
                        onClick={onToggleAll}
                        title="Toggle Whole Building View"
                        className={`w-8 h-8 flex items-center justify-center transition-all rounded-md border ${showAllFloors ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 border-transparent hover:bg-gray-100 text-blue-600'}`}
                    >
                        <Building2 size={14} />
                    </button>
               </div>
           )}
        </div>
    );
};