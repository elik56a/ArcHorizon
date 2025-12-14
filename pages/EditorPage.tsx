
import React, { useEffect, useState } from 'react';
import ChatSidebar from '../components/panels/ChatSidebar';
import BlueprintCanvas from '../components/blueprint/BlueprintCanvas';
import RightSidePanel from '../components/panels/right/RightSidePanel';
import { Grid, ArrowRight, Loader2, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Layers, CloudCheck, Image as ImageIcon } from 'lucide-react';

// Stores
import { useProjectStore } from '../store/useProjectStore';
import { useUiStore } from '../store/useUiStore';
import { useTranslation } from '../hooks/useTranslation';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { DISCIPLINE_STYLES } from '../theme';

export const EditorPage: React.FC = () => {
  // Initialize Shortcuts
  useKeyboardShortcuts();
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();

  // State Selectors
  const { 
      sketchOptions, currentOptionIndex, isGenerating, error, renders,
      setCurrentOptionIndex, generateVariation, updateSketchMetadata, failGeneration,
      activeLayerId
  } = useProjectStore();

  const { 
      leftPanelOpen, rightPanelOpen, bottomPanelOpen, 
      togglePanel, setPanelOpen, setActiveRightPanel
  } = useUiStore();

  // Local State for Title Editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  // Consolidated Panel State Management
  const currentStatus = sketchOptions[currentOptionIndex]?.status || 'idle';

  useEffect(() => {
      if (isGenerating) {
          setPanelOpen('bottom', false);
          // Don't mess with side panels while generating to avoid jarring jumps? 
          // Or ensure they are consistent?
          // Usually generating -> loading state.
          return;
      }

      if (isMobile) {
          if (currentStatus === 'idle') {
              setPanelOpen('left', true);
              setPanelOpen('right', false);
              setPanelOpen('bottom', false);
          } else if (currentStatus === 'loaded') {
              setPanelOpen('left', false);
              setPanelOpen('right', false);
              setPanelOpen('bottom', false);
          }
      } else {
          // Desktop Logic
          if (currentStatus === 'idle') {
              setPanelOpen('left', true);
              setPanelOpen('right', false);
              setPanelOpen('bottom', false);
          } else if (currentStatus === 'loaded') {
              setPanelOpen('left', true);
              setPanelOpen('right', true);
              setPanelOpen('bottom', true);
              setActiveRightPanel('library');
          }
      }
  }, [currentStatus, isMobile, isGenerating]);

  const closeMobilePanels = () => {
      setPanelOpen('left', false);
      setPanelOpen('right', false);
  };

  // Derived State for UI
  const currentOption = sketchOptions[currentOptionIndex];
  const hasLoadedData = sketchOptions.some(o => o.status === 'loaded');
  
  // Discipline Styling
  let activeDisciplineKey = 'arc';
  if (hasLoadedData && currentOption.status === 'loaded') {
      const activeLayer = currentOption.data.layers.find(l => l.id === activeLayerId);
      if (activeLayer) activeDisciplineKey = activeLayer.discipline;
  }
  // @ts-ignore
  const disciplineStyle = DISCIPLINE_STYLES[activeDisciplineKey] || DISCIPLINE_STYLES['arc'];

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden font-sans text-gray-900 relative">
      
      {/* Editor Toolbar / Sub-Header with Dynamic Color */}
      <div className={`h-12 border-b bg-white flex items-center px-4 justify-between shrink-0 transition-colors duration-300 ${disciplineStyle.activeBorder}`}>
         <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
             <div className="flex items-center gap-2 min-w-0">
                 <span className="hidden md:inline text-xs font-bold text-gray-400 uppercase tracking-wider">{t('editor.project')}</span>
                 {hasLoadedData && currentOption.status === 'loaded' ? (
                     isEditingTitle ? (
                         <input 
                            autoFocus
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={() => {
                                updateSketchMetadata('title', tempTitle);
                                setIsEditingTitle(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    updateSketchMetadata('title', tempTitle);
                                    setIsEditingTitle(false);
                                }
                            }}
                            className="text-sm font-bold text-black border-b border-black outline-none bg-transparent w-32 md:w-[450px]"
                         />
                     ) : (
                        <button 
                            onClick={() => {
                                setTempTitle(currentOption.data.title);
                                setIsEditingTitle(true);
                            }}
                            className="text-sm font-bold text-black hover:bg-gray-100 px-2 py-1 rounded transition-colors text-left max-w-[120px] md:max-w-lg truncate"
                        >
                            {currentOption.data.title}
                        </button>
                     )
                 ) : (
                     <span className="text-sm font-bold text-gray-400">{t('editor.untitled')}</span>
                 )}
             </div>
             
             {/* Project Stats - Hidden on mobile */}
             {hasLoadedData && currentOption.status === 'loaded' && (
                 <div className="hidden md:flex items-center gap-3 border-l border-gray-200 pl-4 h-6">
                     <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <Layers size={14} className="text-gray-400"/>
                        <span>{t('editor.floors', { count: currentOption.data.floors })}</span>
                     </div>
                     <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <Grid size={14} className="text-gray-400"/>
                        <span>{currentOption.data.totalAreaSqm} {t('common.sqm')}</span>
                     </div>
                 </div>
             )}
         </div>
         
         <div className="flex items-center gap-2 md:gap-4 shrink-0">
             {hasLoadedData && (
                <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 select-none">
                    <CloudCheck size={14} className="text-green-500" />
                    {t('editor.saved')}
                </div>
             )}
             
             {/* GALLERY BUTTON - Only visible if renders exist */}
             {renders.length > 0 && (
                 <button 
                    onClick={() => { setActiveRightPanel('gallery'); setPanelOpen('right', true); }}
                    className="flex items-center gap-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md transition-colors animate-fade-in"
                 >
                     <ImageIcon size={14} className="text-purple-600" />
                     <span className="hidden md:inline">{t('editor.galleryBtn', { count: renders.length })}</span>
                 </button>
             )}
         </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Backdrop */}
        {(leftPanelOpen || rightPanelOpen) && (
            <div 
                className="absolute inset-0 bg-black/50 z-30 md:hidden animate-fade-in" 
                onClick={closeMobilePanels}
            />
        )}

        {/* LEFT PANEL */}
        <div className={`
            absolute md:relative inset-y-0 left-0 z-40 bg-white border-e border-gray-200 shadow-xl md:shadow-none transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
            ${leftPanelOpen ? 'translate-x-0 w-[85%] md:w-[340px]' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-none'}
        `}>
           <ChatSidebar disciplineStyle={disciplineStyle} />
        </div>
        
        {/* CENTER CANVAS AREA */}
        <div className="flex-1 flex flex-col relative bg-[#f8f9fa] min-w-0 overflow-hidden">
          
          {/* Left Toggle */}
          <button 
            onClick={() => togglePanel('left')} 
            className={`
                absolute left-0 rtl:left-auto rtl:right-0 top-1/2 -translate-y-1/2 z-30 bg-white border border-gray-200 
                border-l-0 rtl:border-l rtl:border-r-0 
                py-3 px-0.5 shadow-md hover:px-1.5 transition-all 
                rounded-r-md rtl:rounded-r-none rtl:rounded-l-md 
                text-gray-400 hover:text-gray-900
                ${leftPanelOpen ? 'md:left-0' : 'left-0'}
            `}
          >
             {leftPanelOpen ? <ChevronLeft size={16} className="rtl:rotate-180" /> : <ChevronRight size={16} className="rtl:rotate-180" />}
          </button>

          {/* Right Toggle (Attached to Canvas Edge) */}
          {hasLoadedData && (
            <button 
                onClick={() => togglePanel('right')} 
                className={`
                    absolute right-0 rtl:right-auto rtl:left-0 top-1/2 -translate-y-1/2 z-30 bg-white border border-gray-200 
                    border-r-0 rtl:border-r rtl:border-l-0 
                    py-3 px-0.5 shadow-md hover:px-1.5 transition-all 
                    rounded-l-md rtl:rounded-l-none rtl:rounded-r-md 
                    text-gray-400 hover:text-gray-900
                `}
            >
                {rightPanelOpen ? <ChevronRight size={16} className="rtl:rotate-180" /> : <ChevronLeft size={16} className="rtl:rotate-180" />}
            </button>
          )}

          {hasLoadedData && (
             <button onClick={() => togglePanel('bottom')} className="absolute left-1/2 -translate-x-1/2 z-30 bg-white border border-gray-200 border-b-0 px-4 py-0.5 shadow-lg hover:pb-1.5 transition-all rounded-t-md text-gray-400 hover:text-gray-900" style={{ bottom: bottomPanelOpen ? '140px' : '0px' }}>
               {bottomPanelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
             </button>
          )}

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-600 px-4 py-3 shadow-lg rounded-lg flex items-center gap-2 text-sm w-[90%] md:w-auto">
              <span className="font-semibold truncate">{t('editor.error', { message: error })}</span>
              <button onClick={() => failGeneration("")} className="ml-2 hover:bg-red-100 rounded-full p-1 shrink-0"><X size={14}/></button>
            </div>
          )}

          <div className="absolute inset-0 flex flex-col h-full w-full">
             <div className="flex-1 relative h-full overflow-hidden">
                <BlueprintCanvas />
             </div>

             {/* Bottom Panel */}
             {hasLoadedData && (
                <div className={`relative z-20 bg-white/95 backdrop-blur-md border-t border-gray-200 transition-all duration-300 ease-in-out ${bottomPanelOpen ? 'h-[140px] translate-y-0' : 'h-0 translate-y-full'}`}>
                    <div className="h-full w-full overflow-x-auto no-scrollbar px-4 md:px-8 flex items-center gap-4">
                       <div className="hidden md:flex flex-col items-start mr-4 rtl:mr-0 rtl:ml-4 min-w-max opacity-50">
                          <div className="p-2 rounded-lg bg-gray-100 mb-1"><Layers size={20} className="text-gray-600" /></div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('editor.variations.title')}</span>
                       </div>

                       {sketchOptions.map((opt, idx) => {
                            const isActive = idx === currentOptionIndex;
                            if (opt.status === 'loading') {
                                return (
                                    <div key={idx} className="flex-shrink-0 w-48 md:w-64 h-20 md:h-24 p-3 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-2 animate-pulse">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        <span className="text-xs font-mono font-bold text-gray-400 uppercase">{t('editor.variations.processing')}</span>
                                    </div>
                                );
                            }
                            if (opt.status === 'idle') {
                              return (
                                  <button key={idx} onClick={() => generateVariation(idx)} className="flex-shrink-0 w-48 md:w-64 h-20 md:h-24 rounded-lg border-2 border-dashed border-gray-300 bg-transparent hover:border-black hover:bg-gray-50 flex flex-col items-center justify-center gap-2 transition-all group">
                                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                        <Plus size={16} className="text-gray-400 group-hover:text-white" />
                                      </div>
                                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-black uppercase tracking-wide">{t('editor.variations.generate', { n: idx + 1 })}</span>
                                  </button>
                              );
                            }
                            if (opt.status === 'loaded') {
                                return (
                                  <button key={opt.data.id} onClick={() => setCurrentOptionIndex(idx)} className={`flex-shrink-0 w-48 md:w-64 h-20 md:h-24 p-3 rounded-lg border-2 text-start flex flex-col justify-between transition-all relative overflow-hidden ${isActive ? 'border-black bg-black text-white shadow-lg scale-[1.02]' : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400 hover:shadow-md'}`}>
                                    {isActive && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/10 to-transparent pointer-events-none" />}
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                          <span className={`text-xs font-bold uppercase tracking-wider truncate w-3/4 ${isActive ? 'text-white' : 'text-gray-800'}`}>{opt.data.title}</span>
                                          {isActive && <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>}
                                        </div>
                                        <div className={`text-[10px] font-mono ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>V.{idx + 1}0 • {new Date().toLocaleDateString()}</div>
                                    </div>
                                    <div className={`flex items-end justify-between mt-2 pt-2 border-t border-dashed ${isActive ? 'border-gray-700' : 'border-gray-200'}`}>
                                      <div className="flex gap-3 font-mono text-[10px]">
                                          <span className="flex items-center gap-1"><Layers size={10}/> {opt.data.floors}F</span>
                                          <span className="flex items-center gap-1"><Grid size={10}/> {opt.data.totalAreaSqm}m²</span>
                                      </div>
                                      {!isActive && <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 rtl:rotate-180" />}
                                    </div>
                                  </button>
                                );
                            }
                            return null;
                       })}
                    </div>
                </div>
             )}
          </div>
        </div>
        
        {/* RIGHT PANEL - Sidebar Style */}
        {hasLoadedData && (
           <div className={`
               absolute md:relative inset-y-0 right-0 z-40 bg-white border-s border-gray-200 shadow-xl md:shadow-none transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
               ${rightPanelOpen ? 'translate-x-0 w-[85%] md:w-80' : 'translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden md:border-none'}
           `}>
               <RightSidePanel disciplineStyle={disciplineStyle} />
           </div>
        )}
      </div>
    </div>
  );
};
