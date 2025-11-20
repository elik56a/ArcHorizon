
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ChatSidebar from './components/ChatSidebar';
import BlueprintCanvas from './components/blueprint/BlueprintCanvas';
import RightSidePanel from './components/RightSidePanel';
import { Logo } from './components/Logo';
import { THEME } from './theme';
import { SketchOption, SketchData, ElementType, RoomType } from './types';
import { generateSingleSketch, generateSketchFromImage, generateSketchFromDXF, DesignStyle } from './services/geminiService';
import { MOCK_ONE_STORY, MOCK_TWO_STORY } from './dev/mockData';
import { Grid, ArrowRight, Loader2, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Wrench, X, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [sketchOptions, setSketchOptions] = useState<SketchOption[]>([]);
  const [currentOptionIndex, setCurrentOptionIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');

  // UI Visibility State
  const [uiState, setUiState] = useState({
    leftPanelOpen: true,
    rightPanelOpen: true,
    bottomPanelOpen: true
  });

  const togglePanel = (panel: 'left' | 'right' | 'bottom') => {
    setUiState(prev => ({
      ...prev,
      [`${panel}PanelOpen`]: !prev[`${panel}PanelOpen`]
    }));
  };

  // Selection State
  const [selection, setSelection] = useState<{id: string, type: 'room' | 'element'} | null>(null);

  // History State
  const [history, setHistory] = useState<SketchData[]>([]);
  const [future, setFuture] = useState<SketchData[]>([]);

  // Helper to update current data and manage history
  const handleSketchUpdate = useCallback((newData: SketchData) => {
    setSketchOptions(prev => {
        const newOpts = [...prev];
        const currentOption = newOpts[currentOptionIndex];
        if (currentOption?.status === 'loaded') {
             setHistory(h => [...h, currentOption.data]);
             setFuture([]);
             
             newOpts[currentOptionIndex] = { status: 'loaded', data: newData };
        }
        return newOpts;
    });
  }, [currentOptionIndex]);

  const handleUndo = useCallback(() => {
    setSketchOptions(prev => {
        const currentOption = prev[currentOptionIndex];
        if (currentOption?.status !== 'loaded' || history.length === 0) return prev;

        const previous = history[history.length - 1];
        const newHistory = history.slice(0, -1);

        setFuture(f => [currentOption.data, ...f]);
        setHistory(newHistory);
        
        const newOpts = [...prev];
        newOpts[currentOptionIndex] = { status: 'loaded', data: previous };
        return newOpts;
    });
  }, [currentOptionIndex, history]);

  const handleRedo = useCallback(() => {
     setSketchOptions(prev => {
        const currentOption = prev[currentOptionIndex];
        if (currentOption?.status !== 'loaded' || future.length === 0) return prev;

        const next = future[0];
        const newFuture = future.slice(1);

        setHistory(h => [...h, currentOption.data]);
        setFuture(newFuture);

        const newOpts = [...prev];
        newOpts[currentOptionIndex] = { status: 'loaded', data: next };
        return newOpts;
    });
  }, [currentOptionIndex, future]);

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (isGenerating) return; 
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
              e.preventDefault();
              if (e.shiftKey) handleRedo();
              else handleUndo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
              e.preventDefault();
              handleRedo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, isGenerating]);

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    setCurrentOptionIndex(0);
    setHistory([]);
    setFuture([]);
    setLastPrompt(prompt);
    setSelection(null);
    
    setSketchOptions([
      { status: 'loading', id: 'opt-1' },
      { status: 'idle', id: 'opt-2' },
      { status: 'idle', id: 'opt-3' }
    ]);
    
    setUiState(prev => ({ ...prev, bottomPanelOpen: false }));

    try {
      const styles: DesignStyle[] = ['Modern', 'Rustic', 'Creative'];
      const finalData = await generateSingleSketch(prompt, styles[0]);

      setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[0] = { status: 'loaded', data: finalData };
        return newOpts;
      });
      
      setUiState(prev => ({ ...prev, bottomPanelOpen: true }));

    } catch (err) {
      console.error(err);
      setError("Failed to generate design. Please try again.");
      setSketchOptions([]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleGenerateFromImage = useCallback(async (file: File) => {
    setIsGenerating(true);
    setError(null);
    setHistory([]);
    setFuture([]);
    setSelection(null);
    
    const newIdx = sketchOptions.length;
    setSketchOptions(prev => [...prev, { status: 'loading', id: `upload-${Date.now()}` }]);
    setCurrentOptionIndex(newIdx);
    setUiState(prev => ({ ...prev, bottomPanelOpen: false }));

    try {
        let sketch: SketchData;

        if (file.name.toLowerCase().endsWith('.dxf')) {
           const text = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsText(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
           });
           sketch = await generateSketchFromDXF(text);
        } else {
           const base64 = await new Promise<string>((resolve, reject) => {
               const reader = new FileReader();
               reader.readAsDataURL(file);
               reader.onload = () => {
                   const result = reader.result as string;
                   const base64Data = result.split(',')[1];
                   resolve(base64Data);
               };
               reader.onerror = error => reject(error);
           });
           sketch = await generateSketchFromImage(base64, file.type);
        }
        
        setSketchOptions(prev => {
            const newOpts = [...prev];
            newOpts[newIdx] = { status: 'loaded', data: sketch };
            return newOpts;
        });
        setUiState(prev => ({ ...prev, bottomPanelOpen: true }));
    } catch (err) {
        console.error("Upload generation failed", err);
        setError(`Failed to analyze ${file.name}. Ensure it is a valid file.`);
        setSketchOptions(prev => prev.filter((_, i) => i !== newIdx));
    } finally {
        setIsGenerating(false);
    }
  }, [sketchOptions.length]);

  const handleGenerateOption = async (index: number) => {
    if (!lastPrompt) return;
    setIsGenerating(true);

    setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[index] = { status: 'loading', id: `opt-${index+1}` };
        return newOpts;
    });
    setCurrentOptionIndex(index);
    setSelection(null);

    try {
       const styles: DesignStyle[] = ['Modern', 'Rustic', 'Creative'];
       const finalData = await generateSingleSketch(lastPrompt, styles[index]);
       
       setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[index] = { status: 'loaded', data: finalData };
        return newOpts;
      });
    } catch (err) {
       console.error(err);
       setError(`Failed to generate variation ${index + 1}`);
       setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[index] = { status: 'idle', id: `opt-${index+1}` };
        return newOpts;
      });
    } finally {
        setIsGenerating(false);
    }
  };

  const loadMockData = (mock: SketchData) => {
      setIsGenerating(true);
      setUiState(prev => ({ ...prev, bottomPanelOpen: false }));
      setTimeout(() => {
          setSketchOptions([{ status: 'loaded', data: JSON.parse(JSON.stringify(mock)) }]);
          setCurrentOptionIndex(0);
          setHistory([]);
          setFuture([]);
          setSelection(null);
          setUiState(prev => ({ ...prev, bottomPanelOpen: true }));
          setIsGenerating(false);
      }, 400);
  };

  const handleUpdateItem = (id: string, type: 'room' | 'element', field: string, value: any) => {
     if (isGenerating) return;
     const currentOption = sketchOptions[currentOptionIndex];
     if (currentOption?.status !== 'loaded') return;
     const newData = { ...currentOption.data };
     if (type === 'room') {
        newData.rooms = newData.rooms.map(r => r.id === id ? { ...r, [field]: value } : r);
     } else {
        newData.elements = newData.elements.map(e => e.id === id ? { ...e, [field]: value } : e);
     }
     handleSketchUpdate(newData);
  };

  const handleDeleteItem = (id: string, type: 'room' | 'element') => {
     if (isGenerating) return;
     const currentOption = sketchOptions[currentOptionIndex];
     if (currentOption?.status !== 'loaded') return;
     const newData = { ...currentOption.data };
     if (type === 'room') {
        newData.rooms = newData.rooms.filter(r => r.id !== id);
        newData.elements = newData.elements.filter(e => e.roomId !== id);
     } else {
        newData.elements = newData.elements.filter(e => e.id !== id);
     }
     handleSketchUpdate(newData);
     setSelection(null);
  };

  const handleAddItem = (type: ElementType | RoomType, category: 'room' | 'element') => {
     if (isGenerating) return;
     const currentOption = sketchOptions[currentOptionIndex];
     if (currentOption?.status !== 'loaded') return;
     const newData = { ...currentOption.data };
     const center = { x: 500, y: 500 };
     if (category === 'room') {
        const newRoom = {
           id: `room-${Date.now()}`,
           name: 'New Room',
           type: type as RoomType,
           floor: 1,
           x: center.x,
           y: center.y,
           width: 300,
           height: 300,
           floorFinish: 'wood'
        };
        // @ts-ignore
        newData.rooms.push(newRoom);
        setSelection({ id: newRoom.id, type: 'room' });
     } else {
        const newEl = {
           id: `el-${Date.now()}`,
           roomId: 'none', 
           type: type as ElementType,
           floor: 1,
           x: center.x + 50,
           y: center.y + 50,
           width: 100,
           height: 100,
           rotation: 0
        };
        if (type.includes('door')) { newEl.width = 90; newEl.height = 15; }
        if (type === 'bed_king') { newEl.width = 180; newEl.height = 200; }
        if (type === 'toilet') { newEl.width = 50; newEl.height = 70; }
        newData.elements.push(newEl);
        setSelection({ id: newEl.id, type: 'element' });
     }
     handleSketchUpdate(newData);
  };

  const currentOption = sketchOptions[currentOptionIndex];
  const currentSketchData = currentOption?.status === 'loaded' ? currentOption.data : null;
  const hasLoadedData = sketchOptions.some(o => o.status === 'loaded');

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-sans text-gray-900">
      
      {/* Header - Modern Clean Style */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-5 justify-between z-50 relative shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8">
             <Logo />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">ArcHorizon<span className="text-blue-600">.ai</span></h1>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Generative Studio</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-gray-600">v1.5 PRO</span>
           </div>
        </div>
      </header>
      
      {/* DEV TOOLS */}
      <div className="fixed top-16 right-4 z-[60] flex flex-col gap-1 opacity-20 hover:opacity-100 transition-opacity group">
         <button onClick={() => loadMockData(MOCK_ONE_STORY)} className="bg-white border border-gray-300 text-[10px] font-bold px-2 py-1 hover:bg-black hover:text-white rounded shadow-sm">1-Story</button>
         <button onClick={() => loadMockData(MOCK_TWO_STORY)} className="bg-white border border-gray-300 text-[10px] font-bold px-2 py-1 hover:bg-black hover:text-white rounded shadow-sm">2-Story</button>
      </div>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANEL */}
        <div className={`relative transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] z-20 shadow-xl ${uiState.leftPanelOpen ? 'w-[380px] border-r border-gray-200' : 'w-0 opacity-0 overflow-hidden'}`}>
           <ChatSidebar 
                onGenerate={handleGenerate} 
                onGenerateFromImage={handleGenerateFromImage}
                isGenerating={isGenerating} 
           />
        </div>
        
        {/* CENTER CANVAS AREA */}
        <div className="flex-1 flex flex-col relative bg-[#f8f9fa] min-w-0 overflow-hidden">
          
          {/* Toggles */}
          <button 
            onClick={() => togglePanel('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-white border border-gray-200 border-l-0 py-3 px-0.5 shadow-md hover:px-1.5 transition-all rounded-r-md text-gray-400 hover:text-gray-900"
          >
             {uiState.leftPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {hasLoadedData && (
            <button 
                onClick={() => togglePanel('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-white border border-gray-200 border-r-0 py-3 px-0.5 shadow-md hover:px-1.5 transition-all rounded-l-md text-gray-400 hover:text-gray-900"
            >
                {uiState.rightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}

          {hasLoadedData && (
             <button 
               onClick={() => togglePanel('bottom')}
               className="absolute left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-200 border-b-0 px-4 py-0.5 shadow-lg hover:pb-1.5 transition-all rounded-t-md text-gray-400 hover:text-gray-900"
               style={{ bottom: uiState.bottomPanelOpen ? '180px' : '0px' }}
             >
               {uiState.bottomPanelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
             </button>
          )}

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-600 px-4 py-3 shadow-lg rounded-lg flex items-center gap-2 text-sm">
              <span className="font-semibold">Error: {error}</span>
              <button onClick={() => setError(null)} className="ml-2 hover:bg-red-100 rounded-full p-1"><X size={14}/></button>
            </div>
          )}

          <div className="absolute inset-0 flex flex-col h-full w-full">
             <div className="flex-1 relative h-full overflow-hidden">
                <BlueprintCanvas 
                  data={currentSketchData} 
                  isLoading={isGenerating && !hasLoadedData} 
                  onUpdate={handleSketchUpdate}
                  historyControl={{
                      undo: handleUndo,
                      redo: handleRedo,
                      canUndo: history.length > 0,
                      canRedo: future.length > 0
                  }}
                  selectedId={selection?.id}
                  onSelect={(id, type) => {
                      if (isGenerating) return;
                      if (id && type) {
                          setSelection({id, type});
                          if (!uiState.rightPanelOpen) togglePanel('right');
                      } else {
                          setSelection(null);
                      }
                  }}
                />
             </div>

             {/* Bottom Panel - NEW DESIGN */}
             {hasLoadedData && (
                <div 
                    className={`relative z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 transition-all duration-300 ease-in-out ${
                        uiState.bottomPanelOpen ? 'h-[180px] translate-y-0' : 'h-0 translate-y-full'
                    }`}
                >
                    <div className="h-full w-full overflow-x-auto no-scrollbar px-8 flex items-center gap-4">
                       
                       {/* Header Label */}
                       <div className="flex flex-col items-start mr-4 min-w-max opacity-50">
                          <div className="p-2 rounded-lg bg-gray-100 mb-1">
                             <Grid size={20} className="text-gray-600" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Variations</span>
                       </div>

                       {sketchOptions.map((opt, idx) => {
                            const isActive = idx === currentOptionIndex;
                            
                            if (opt.status === 'loading') {
                                return (
                                    <div key={idx} className="flex-shrink-0 w-64 h-28 p-4 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-2 animate-pulse">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        <span className="text-xs font-mono font-bold text-gray-400 uppercase">Processing...</span>
                                    </div>
                                );
                            }
                            
                            if (opt.status === 'idle') {
                              return (
                                  <button 
                                    key={idx}
                                    onClick={() => handleGenerateOption(idx)}
                                    className="flex-shrink-0 w-64 h-28 rounded-lg border-2 border-dashed border-gray-300 bg-transparent hover:border-black hover:bg-gray-50 flex flex-col items-center justify-center gap-2 transition-all group"
                                  >
                                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                        <Plus size={16} className="text-gray-400 group-hover:text-white" />
                                      </div>
                                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-black uppercase tracking-wide">Generate V{idx + 1}</span>
                                  </button>
                              );
                            }
                            
                            if (opt.status === 'loaded') {
                                return (
                                  <button
                                    key={opt.data.id}
                                    onClick={() => setCurrentOptionIndex(idx)}
                                    className={`flex-shrink-0 w-64 h-28 p-4 rounded-lg border-2 text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                                      isActive 
                                        ? 'border-black bg-black text-white shadow-lg scale-[1.02]' 
                                        : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400 hover:shadow-md'
                                    }`}
                                  >
                                    {isActive && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/10 to-transparent pointer-events-none" />}
                                    
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                          <span className={`text-xs font-bold uppercase tracking-wider truncate w-3/4 ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                              {opt.data.title || `Variation ${idx + 1}`}
                                          </span>
                                          {isActive && <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>}
                                        </div>
                                        <div className={`text-[10px] font-mono ${isActive ? 'text-gray-400' : 'text-gray-500'}`}>
                                           V.{idx + 1}0 • {new Date().toLocaleDateString()}
                                        </div>
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
           <div className={`relative transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] z-20 shadow-xl ${uiState.rightPanelOpen ? 'w-80 border-l border-gray-200 bg-white' : 'w-0 opacity-0 overflow-hidden'}`}>
               <RightSidePanel 
                  selection={selection}
                  data={currentSketchData}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onAddItem={handleAddItem}
               />
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
