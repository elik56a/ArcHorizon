
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, Download, Undo, Redo, Maximize, RotateCw, LucideIcon, Hand, Pen, Eraser, ChevronDown, MousePointer2, Wand2, Building2, Layers, Eye, EyeOff, Check, Box, Sparkles, Plus } from 'lucide-react';
import { SketchData, Layer, Discipline, ViewStyle } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { useTranslation } from '../../hooks/useTranslation';
import { DISCIPLINE_STYLES } from '../../theme';

// --- HELPER: TOOLTIP BUTTON ---
interface TooltipButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    label: string;
    disabled?: boolean;
    className?: string;
    isActive?: boolean;
    hideLabelOnMobile?: boolean;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({ onClick, icon: Icon, label, disabled, className = "", isActive, hideLabelOnMobile }) => {
    return (
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`relative group p-2 rounded-md transition-all flex items-center justify-center h-9 w-9 shrink-0 ${
                isActive 
                    ? 'bg-black text-white shadow-md hover:bg-gray-800' 
                    : (className ? className : 'hover:bg-gray-100 text-gray-600')
            } ${disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}`}
        >
            <Icon size={18} className="rtl:scale-x-[-1]"/>
            
            {/* Tooltip Container */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-[200] whitespace-nowrap pointer-events-none">
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
    const { t } = useTranslation();
    const options = [2, 4, 6, 8, 10];
    
    return (
        <div className="relative h-full flex items-center">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                disabled={disabled}
                className={`h-full w-5 flex items-center justify-center rounded-e-md border-s transition-colors ${
                    activeTool 
                        ? 'border-gray-700 text-white hover:bg-gray-800' 
                        : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                <ChevronDown size={10} />
            </button>
            
            {isOpen && !disabled && (
                <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-md p-1 min-w-[120px] z-[150] flex flex-col gap-1 animate-fade-in">
                     <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider text-start">{t('editor.toolbar.thickness')}</div>
                     {options.map(size => (
                         <button
                            key={size}
                            onClick={() => { onChange(size); setIsOpen(false); }}
                            className={`flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded text-xs w-full text-start group ${value === size ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                         >
                             <div className="w-8 flex justify-center items-center">
                                <div className={`rounded-full ${value === size ? 'bg-blue-600' : 'bg-gray-400 group-hover:bg-gray-600'}`} style={{ width: size, height: size }}></div>
                             </div>
                             <span className="font-mono">{t('editor.toolbar.size', { n: size })}</span>
                         </button>
                     ))}
                </div>
            )}
        </div>
    );
};

// --- LAYER SWITCHER ---
interface LayerSwitcherProps {
    activeLayerId: string;
    setActiveLayer: (id: string) => void;
    setDiscipline: (d: Discipline) => void;
    toggleVisibility: (id: string) => void;
    layers: Layer[];
    disabled?: boolean;
}

const LayerSwitcher: React.FC<LayerSwitcherProps> = ({ activeLayerId, setActiveLayer, setDiscipline, toggleVisibility, layers, disabled }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    
    // Refs for Portal Positioning and Click Detection
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const { setActiveRightPanel, setPanelOpen } = useUiStore();
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is inside dropdown OR button
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        
        // Update position on scroll/resize to keep attached
        const updatePosition = () => {
            if (isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + 8,
                    left: rect.left
                });
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const activeLayer = layers.find(l => l.id === activeLayerId);
    const activeDiscipline = activeLayer ? activeLayer.discipline : 'arc';
    const activeStyle = DISCIPLINE_STYLES[activeDiscipline];
    const ActiveIcon = activeStyle.icon;

    const handleToggle = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 8,
                left: rect.left
            });
        }
        setIsOpen(!isOpen);
    };

    const handleSwitchDiscipline = (d: Discipline) => {
        setDiscipline(d);
        setIsOpen(false);
        setActiveRightPanel('library');
        setPanelOpen('right', true);
    };

    const disciplines = Object.keys(DISCIPLINE_STYLES) as Discipline[];

    return (
        <div className="relative mr-2 rtl:mr-0 rtl:ml-2">
            <button 
                ref={buttonRef}
                onClick={handleToggle}
                disabled={disabled}
                className={`h-10 ps-2 pe-3 flex items-center gap-2 rounded-lg border transition-all ${
                    isOpen 
                        ? `ring-2 ring-offset-1 ${activeStyle.activeBorder.replace('border', 'ring')}`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white shadow-sm shrink-0 ${activeStyle.highlight}`}>
                    <ActiveIcon size={16} />
                </div>
                <div className="flex flex-col items-start justify-center leading-tight">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-none mb-0.5 hidden md:block">{t('editor.toolbar.workLayer')}</span>
                    <span className={`text-xs font-extrabold ${activeStyle.text} whitespace-nowrap`}>
                        {t(`layers.${activeDiscipline}`)}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 ms-2 transition-transform hidden md:block ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && !disabled && createPortal(
                <div 
                    ref={dropdownRef}
                    className="fixed w-72 bg-white border border-gray-200 shadow-xl rounded-xl p-2 z-[9999] animate-fade-in flex flex-col gap-1"
                    style={{ top: position.top, left: position.left }}
                >
                    <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider flex justify-between items-center">
                        <span>Disciplines</span>
                        <span className="text-[9px] normal-case bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                            {t('editor.toolbar.visibleOnly')}
                        </span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        {disciplines.map(disc => {
                            const style = DISCIPLINE_STYLES[disc];
                            const Icon = style.icon;
                            const isActive = disc === activeDiscipline;
                            const layer = layers.find(l => l.discipline === disc);
                            const layerId = layer ? layer.id : '';
                            const isVisible = layer ? layer.isVisible : false;

                            return (
                                <div key={disc} className={`flex items-center gap-2 p-1.5 rounded-lg transition-all border ${isActive ? `${style.bg} ${style.border}` : 'border-transparent hover:bg-gray-50'}`}>
                                    {/* Visibility Toggle */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(layerId) toggleVisibility(layerId); }}
                                        className={`p-2 rounded-md transition-colors ${isVisible ? 'text-gray-600 hover:text-black hover:bg-white border border-transparent hover:border-gray-200' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                                        title={isVisible ? t('editor.toolbar.hide') : t('editor.toolbar.show')}
                                        disabled={!layer}
                                    >
                                        {isVisible ? <Eye size={16}/> : <EyeOff size={16}/>}
                                    </button>

                                    {/* Selection Button */}
                                    <button 
                                        onClick={() => handleSwitchDiscipline(disc)}
                                        className="flex-1 text-start flex items-center gap-3 group"
                                    >
                                        <div className={`w-8 h-8 rounded flex items-center justify-center border transition-all ${isActive ? 'bg-white border-white shadow-sm' : 'bg-gray-50 border-gray-100 group-hover:bg-white group-hover:border-gray-200'} ${style.text}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${isActive ? style.text : 'text-gray-600 group-hover:text-black'}`}>
                                                {t(`layers.${disc}`)}
                                            </span>
                                            {layer && (
                                                <span className="text-[9px] text-gray-400 font-mono">
                                                    {t('editor.toolbar.items', { count: layer.elements.length + (layer.rooms?.length || 0) })}
                                                </span>
                                            )}
                                        </div>
                                        {isActive && <div className="ms-auto me-2"><Check size={14} className={style.text}/></div>}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};


// --- TOP TOOLBAR COMPONENT ---
interface TopToolbarProps {
    data: SketchData;
    viewMode: '2d' | '3d';
    setViewMode: (m: '2d' | '3d') => void;
    viewStyle: ViewStyle;
    setViewStyle: (s: ViewStyle) => void;
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

    // Layers
    layers: Layer[];
    activeLayerId: string;
    setActiveLayer: (id: string) => void;
    setDiscipline: (d: Discipline) => void;
    toggleLayerVisibility: (id: string) => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({ 
    data,
    viewMode, setViewMode, viewStyle, setViewStyle, scale, setScale, rotateCanvas, onFit, history, onRender, onDownload, isLoading,
    activeTool, setActiveTool, penSize, setPenSize, eraserSize, setEraserSize,
    layers, activeLayerId, setActiveLayer, setDiscipline, toggleLayerVisibility
}) => {
    const { t } = useTranslation();
    const { isRendering } = useProjectStore();
    const { setActiveRightPanel, setPanelOpen, activeRightPanel, rightPanelOpen } = useUiStore();
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

    const handleLibraryToggle = () => {
        if (activeRightPanel === 'library' && rightPanelOpen) {
            setPanelOpen('right', false);
        } else {
            setActiveRightPanel('library'); 
            setPanelOpen('right', true); 
        }
    };

    return (
        <div className="w-full h-16 bg-white border-b border-gray-200 flex items-center px-4 select-none z-[100] shrink-0 shadow-sm relative transition-all overflow-x-auto no-scrollbar">
            
            <div className="flex items-center justify-between w-full min-w-max">
                {/* Left: Tools */}
                <div className="flex items-center gap-2">
                    
                    {/* LAYER SWITCHER (Primary Navigation) */}
                    <LayerSwitcher 
                        layers={layers}
                        activeLayerId={activeLayerId}
                        setActiveLayer={setActiveLayer}
                        setDiscipline={setDiscipline}
                        toggleVisibility={toggleLayerVisibility}
                        disabled={isLoading}
                    />

                    {/* ADD COMPONENT BUTTON */}
                    <button
                        onClick={handleLibraryToggle}
                        className={`h-10 px-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-bold text-xs transition-all shadow-sm group mr-2 rtl:mr-0 rtl:ml-2 relative ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${activeRightPanel === 'library' && rightPanelOpen ? 'bg-gray-100 border-gray-300 shadow-inner' : ''}`}
                        disabled={isLoading}
                    >
                        <Plus size={16} className={`transition-transform duration-200 ${activeRightPanel === 'library' && rightPanelOpen ? 'rotate-45 text-black' : 'text-black'}`} />
                        <span className="hidden xl:inline">{t('editor.panels.library')}</span>
                        
                        {/* Tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-[200] whitespace-nowrap pointer-events-none">
                            <div className="bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg relative">
                                {t('editor.panels.library')}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-slate-900"></div>
                            </div>
                        </div>
                    </button>

                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                    {/* View Switcher */}
                    <div className={`flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 mr-2 rtl:mr-0 rtl:ml-2 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <button 
                        onClick={() => !isLoading && setViewMode('2d')}
                        disabled={isLoading}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === '2d' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                        >
                        {t('editor.toolbar.view2d')}
                        </button>
                        <button 
                        onClick={() => !isLoading && setViewMode('3d')}
                        disabled={isLoading}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewMode === '3d' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                        >
                        {t('editor.toolbar.view3d')}
                        </button>
                    </div>

                    {/* VISUAL STYLE TOGGLE (Only in 3D Mode) */}
                    {viewMode === '3d' && (
                        <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 mr-2 rtl:mr-0 rtl:ml-2 animate-fade-in shrink-0">
                            <button 
                                onClick={() => setViewStyle('blueprint')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewStyle === 'blueprint' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-black'}`}
                                title="Simple schematic view for editing"
                            >
                                <Box size={14} /> <span className="hidden md:inline">{t('editor.toolbar.schematic')}</span>
                            </button>
                            <button 
                                onClick={() => setViewStyle('vivid')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${viewStyle === 'vivid' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                                title="High fidelity realistic view with shadows and details"
                            >
                                <Sparkles size={14} /> <span className="hidden md:inline">{t('editor.toolbar.realistic')}</span>
                            </button>
                        </div>
                    )}

                    {/* 2D TOOLS (Hidden in 3D) */}
                    {viewMode === '2d' && (
                        <>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>

                            <div className="flex items-center gap-1">
                                <TooltipButton onClick={() => setActiveTool('select')} icon={MousePointer2} label={t('editor.toolbar.select')} isActive={activeTool === 'select' && !toolsDisabled} disabled={toolsDisabled} />
                                <TooltipButton onClick={() => setActiveTool('pan')} icon={Hand} label={t('editor.toolbar.pan')} isActive={activeTool === 'pan' && !toolsDisabled} disabled={toolsDisabled} />
                            </div>
                            
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            
                            <div className="flex items-center gap-2">
                                {/* Pen Tool Group */}
                                <div className={`flex items-center rounded-md border h-9 transition-all ${activeTool === 'pen' && !toolsDisabled ? 'border-black bg-black' : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'}`}>
                                    <button 
                                        onClick={() => setActiveTool('pen')}
                                        disabled={toolsDisabled}
                                        className={`pl-3 pr-2 h-full flex items-center gap-2 rounded-s-md ${activeTool === 'pen' && !toolsDisabled ? 'text-white' : 'text-gray-600'} ${toolsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        title="Pen Tool"
                                    >
                                        <Pen size={16} />
                                        <span className="text-xs font-bold hidden md:inline">{t('editor.toolbar.pen')}</span>
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
                                        className={`pl-3 pr-2 h-full flex items-center gap-2 rounded-s-md ${activeTool === 'eraser' && !toolsDisabled ? 'text-white' : 'text-gray-600'} ${toolsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        title="Eraser Tool"
                                    >
                                        <Eraser size={16} />
                                        <span className="text-xs font-bold hidden md:inline">{t('editor.toolbar.eraser')}</span>
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
                        </>
                    )}

                    <div className="w-px h-6 bg-gray-200 mx-2"></div>
                    
                    {/* Undo/Redo */}
                    {history && (
                        <div className="flex items-center gap-1">
                            <TooltipButton onClick={history.undo} disabled={!history.canUndo || isLoading} icon={Undo} label={t('editor.toolbar.undo')} />
                            <TooltipButton onClick={history.redo} disabled={!history.canRedo || isLoading} icon={Redo} label={t('editor.toolbar.redo')} />
                        </div>
                    )}
                </div>

                {/* Right: Zoom & Actions */}
                <div className="flex items-center gap-1 pl-4">
                    <div className={`flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 mr-2 rtl:mr-0 rtl:ml-2 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <TooltipButton onClick={() => setScale(s => s * 0.9)} icon={ZoomOut} label={t('editor.toolbar.zoomOut')} className="h-8 w-8 p-1.5" disabled={isLoading} />
                        <span className="text-xs font-mono font-medium w-12 text-center text-gray-500 hidden md:block">{Math.round(scale * 100)}%</span>
                        <TooltipButton onClick={() => setScale(s => s * 1.1)} icon={ZoomIn} label={t('editor.toolbar.zoomIn')} className="h-8 w-8 p-1.5" disabled={isLoading} />
                    </div>
                    
                    <TooltipButton onClick={onFit} icon={Maximize} label={t('editor.toolbar.fit')} disabled={isLoading} />
                    <TooltipButton onClick={() => rotateCanvas('cw')} icon={RotateCw} label={t('editor.toolbar.rotate')} disabled={toolsDisabled} />

                    <div className="w-px h-6 bg-gray-200 mx-2"></div>

                    <TooltipButton 
                        onClick={onRender} 
                        icon={Wand2} 
                        label={
                            isRendering ? t('editor.toolbar.rendering') : 
                            !hasContent ? t('editor.toolbar.renderHint') : 
                            t('editor.toolbar.render')
                        } 
                        isActive={isRendering}
                        disabled={renderDisabled}
                        className={`transition-all ${isRendering ? 'bg-indigo-600 text-white animate-pulse' : 'text-indigo-600 hover:bg-indigo-50'}`}
                    />

                    <div className={`relative ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="bg-black text-white px-3 md:px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors ml-2 rtl:ml-0 rtl:mr-2 shadow-sm active:scale-95"
                            disabled={isLoading}
                        >
                            <Download size={14} /> <span className="hidden md:inline">{t('editor.toolbar.export')}</span>
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 bg-white border border-gray-200 shadow-xl rounded-lg flex flex-col min-w-[160px] overflow-hidden z-[150] animate-fade-in">
                                <button onClick={() => { onDownload('svg'); setShowExportMenu(false); }} className="px-4 py-3 text-start hover:bg-gray-50 text-xs font-bold border-b border-gray-50 flex items-center gap-2">
                                    <span className="bg-orange-100 text-orange-600 px-1 rounded text-[10px]">SVG</span> {t('editor.toolbar.svg')}
                                </button>
                                <button onClick={() => { onDownload('pdf'); setShowExportMenu(false); }} className="px-4 py-3 text-start hover:bg-gray-50 text-xs font-bold border-b border-gray-50 flex items-center gap-2">
                                    <span className="bg-red-100 text-red-600 px-1 rounded text-[10px]">PDF</span> {t('editor.toolbar.pdf')}
                                </button>
                                <button onClick={() => { onDownload('dxf'); setShowExportMenu(false); }} className="px-4 py-3 text-start hover:bg-gray-50 text-xs font-bold flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-600 px-1 rounded text-[10px]">DXF</span> {t('editor.toolbar.dxf')}
                                </button>
                            </div>
                        )}
                    </div>
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
        <div className="absolute left-6 rtl:left-auto rtl:right-6 top-6 bg-white border border-gray-200 shadow-lg rounded-lg p-1.5 z-20 flex flex-col gap-1.5">
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