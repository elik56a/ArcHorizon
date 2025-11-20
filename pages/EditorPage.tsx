
import React, { useEffect } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import BlueprintCanvas from '../components/blueprint/BlueprintCanvas';
import RightSidePanel from '../components/RightSidePanel';
import { Grid, ArrowRight, Loader2, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Layers, CloudCheck } from 'lucide-react';

// Stores
import { useProjectStore } from '../store/useProjectStore';
import { useUiStore } from '../store/useUiStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const EditorPage: React.FC = () => {
  // Initialize Shortcuts
  useKeyboardShortcuts();

  // State Selectors
  const { 
      sketchOptions, currentOptionIndex, isGenerating, error, 
      setCurrentOptionIndex, generateVariation, loadMock, failGeneration 
  } = useProjectStore();

  const { 
      leftPanelOpen, rightPanelOpen, bottomPanelOpen, 
      togglePanel, setPanel 
  } = useUiStore();

  // React to generation state to toggle bottom panel
  useEffect(() => {
      if (isGenerating) setPanel('bottom', false);
      else if (sketchOptions.some(o => o.status === 'loaded')) setPanel('bottom', true);
  }, [isGenerating, sketchOptions]);

  // Derived State for UI
  const currentOption = sketchOptions[currentOptionIndex];
  const hasLoadedData = sketchOptions.some(o => o.status === 'loaded');

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden font-sans text-gray-900 relative">
      
      {/* Editor Toolbar / Sub-Header */}
      <div className="h-12 border-b border-gray-200 bg-white flex items-center px-4 justify-between shrink-0">
         <div className="flex items-center gap-2">
             <span className="text-sm font-bold text-gray-500">Project:</span>
             <span className="text-sm font-bold text-black">{hasLoadedData && currentOption.status === 'loaded' ? currentOption.data.title : 'Untitled Draft'}</span>
         </div>
         
         <div className="flex items-center gap-3">
             {hasLoadedData && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 animate-fade-in select-none">
                    <CloudCheck size={14} className="text-green-500" />
                    Auto-saved
                </div>
             )}
         </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANEL */}
        <div className={`relative transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] z-20 shadow-xl ${leftPanelOpen ? 'w-[340px] border-r border-gray-200' : 'w-0 opacity-0 overflow-hidden'}`}>
           <ChatSidebar />
        </div>
        
        {/* CENTER CANVAS AREA */}
        <div className="flex-1 flex flex-col relative bg-[#f8f9fa] min-w-0 overflow-hidden">
          
          {/* Toggles */}
          <button onClick={() => togglePanel('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-white border border-gray-200 border-l-0 py-3 px-0.5 shadow-md hover:px-1.5 transition-all rounded-r-md text-gray-400 hover:text-gray-900">
             {leftPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {hasLoadedData && (
            <button onClick={() => togglePanel('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-white border border-gray-200 border-r-0 py-3 px-0.5 shadow-md hover:px-1.5 transition-all rounded-l-md text-gray-400 hover:text-gray-900">
                {rightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}

          {hasLoadedData && (
             <button onClick={() => togglePanel('bottom')} className="absolute left-1/2 -translate-x-1/2 z-40 bg-white border border-gray-200 border-b-0 px-4 py-0.5 shadow-lg hover:pb-1.5 transition-all rounded-t-md text-gray-400 hover:text-gray-900" style={{ bottom: bottomPanelOpen ? '140px' : '0px' }}>
               {bottomPanelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
             </button>
          )}

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-600 px-4 py-3 shadow-lg rounded-lg flex items-center gap-2 text-sm">
              <span className="font-semibold">Error: {error}</span>
              <button onClick={() => failGeneration("")} className="ml-2 hover:bg-red-100 rounded-full p-1"><X size={14}/></button>
            </div>
          )}

          <div className="absolute inset-0 flex flex-col h-full w-full">
             <div className="flex-1 relative h-full overflow-hidden">
                <BlueprintCanvas />
             </div>

             {/* Bottom Panel */}
             {hasLoadedData && (
                <div className={`relative z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 transition-all duration-300 ease-in-out ${bottomPanelOpen ? 'h-[140px] translate-y-0' : 'h-0 translate-y-full'}`}>
                    <div className="h-full w-full overflow-x-auto no-scrollbar px-8 flex items-center gap-4">
                       <div className="flex flex-col items-start mr-4 min-w-max opacity-50">
                          <div className="p-2 rounded-lg bg-gray-100 mb-1"><Layers size={20} className="text-gray-600" /></div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Variations</span>
                       </div>

                       {sketchOptions.map((opt, idx) => {
                            const isActive = idx === currentOptionIndex;
                            if (opt.status === 'loading') {
                                return (
                                    <div key={idx} className="flex-shrink-0 w-64 h-24 p-3 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-2 animate-pulse">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        <span className="text-xs font-mono font-bold text-gray-400 uppercase">Processing...</span>
                                    </div>
                                );
                            }
                            if (opt.status === 'idle') {
                              return (
                                  <button key={idx} onClick={() => generateVariation(idx)} className="flex-shrink-0 w-64 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-transparent hover:border-black hover:bg-gray-50 flex flex-col items-center justify-center gap-2 transition-all group">
                                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                        <Plus size={16} className="text-gray-400 group-hover:text-white" />
                                      </div>
                                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-black uppercase tracking-wide">Generate V{idx + 1}</span>
                                  </button>
                              );
                            }
                            if (opt.status === 'loaded') {
                                return (
                                  <button key={opt.data.id} onClick={() => setCurrentOptionIndex(idx)} className={`flex-shrink-0 w-64 h-24 p-3 rounded-lg border-2 text-left flex flex-col justify-between transition-all relative overflow-hidden ${isActive ? 'border-black bg-black text-white shadow-lg scale-[1.02]' : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400 hover:shadow-md'}`}>
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
                                      {!isActive && <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />}
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
        
        {/* RIGHT PANEL */}
        {hasLoadedData && (
           <div className={`relative transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] z-20 shadow-xl ${rightPanelOpen ? 'w-80 border-l border-gray-200 bg-white' : 'w-0 opacity-0 overflow-hidden'}`}>
               <RightSidePanel />
           </div>
        )}
      </div>
    </div>
  );
};
