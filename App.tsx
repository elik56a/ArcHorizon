
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ChatSidebar from './components/ChatSidebar';
import BlueprintCanvas from './components/BlueprintCanvas';
import RightSidePanel from './components/RightSidePanel';
import { SketchOption, SketchData, ElementType, RoomType } from './types';
import { generateSingleSketch, generateSketchFromImage, generateSketchFromDXF, DesignStyle } from './services/geminiService';
import { Layout, Grid, ArrowRight, Loader2, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Lock } from 'lucide-react';

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
    
    // Initialize with a loading state
    setSketchOptions([
      { status: 'loading', id: 'opt-1' },
      { status: 'idle', id: 'opt-2' },
      { status: 'idle', id: 'opt-3' }
    ]);
    
    // HIDE bottom panel during initial generation (as requested)
    setUiState(prev => ({ ...prev, bottomPanelOpen: false }));

    try {
      const styles: DesignStyle[] = ['Modern', 'Rustic', 'Creative'];
      
      // STANDARD GENERATION
      const finalData = await generateSingleSketch(prompt, styles[0]);

      // Finalize
      setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[0] = { status: 'loaded', data: finalData };
        return newOpts;
      });
      
      // Only show bottom panel after generation is done and we have data
      setUiState(prev => ({ ...prev, bottomPanelOpen: true }));

    } catch (err) {
      console.error(err);
      setError("Failed to generate design. Please try again.");
      setSketchOptions([]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // New Handler for Image/PDF/DXF Uploads (Non-streaming for now as it's atomic)
  const handleGenerateFromImage = useCallback(async (file: File) => {
    setIsGenerating(true);
    setError(null);
    setHistory([]);
    setFuture([]);
    setSelection(null);
    
    const newIdx = sketchOptions.length;
    setSketchOptions(prev => [...prev, { status: 'loading', id: `upload-${Date.now()}` }]);
    setCurrentOptionIndex(newIdx);
    // Hide bottom during load
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

  // --- ITEM CRUD Handlers ---

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
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      
      {/* Header */}
      <header className="h-16 border-b-2 border-black bg-white flex items-center px-6 justify-between z-50 relative shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-black p-2">
             <Layout className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black tracking-tighter uppercase">ArcHorizon.ai</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-xs font-bold font-mono text-black bg-gray-100 px-3 py-1 border border-gray-300">
             v1.5 STUDIO
           </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANEL */}
        <div className={`relative transition-all duration-300 ease-in-out bg-white z-20 ${uiState.leftPanelOpen ? 'w-[400px] border-r border-gray-200' : 'w-0 opacity-0 overflow-hidden'}`}>
           <ChatSidebar 
                onGenerate={handleGenerate} 
                onGenerateFromImage={handleGenerateFromImage}
                isGenerating={isGenerating} 
           />
        </div>
        
        {/* CENTER CANVAS AREA */}
        <div className="flex-1 flex flex-col relative bg-gray-50 min-w-0 overflow-hidden">
          
          {/* --- FLOATING TOGGLES --- */}
          
          {/* Left Toggle */}
          <button 
            onClick={() => togglePanel('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-white border-2 border-gray-200 border-l-0 py-3 px-1 rounded-r-lg shadow-md hover:bg-gray-50 hover:pl-2 transition-all flex items-center justify-center group"
          >
             {uiState.leftPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Right Toggle - Only if loaded */}
          {hasLoadedData && (
            <button 
                onClick={() => togglePanel('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-white border-2 border-gray-200 border-r-0 py-3 px-1 rounded-l-lg shadow-md hover:bg-gray-50 hover:pr-2 transition-all flex items-center justify-center"
            >
                {uiState.rightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}

          {/* Bottom Toggle - Only if loaded */}
          {hasLoadedData && (
             <button 
               onClick={() => togglePanel('bottom')}
               className="absolute left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-gray-200 border-b-0 px-4 py-1 rounded-t-lg shadow-md hover:bg-gray-50 hover:pb-2 transition-all flex items-center justify-center group"
               style={{ bottom: uiState.bottomPanelOpen ? '18vh' : '0px' }}
             >
               {uiState.bottomPanelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
             </button>
          )}

          {/* Error Toast */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border-2 border-red-500 text-red-600 px-6 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
              <span className="font-bold">{error}</span>
              <button onClick={() => setError(null)} className="font-bold ml-4">&times;</button>
            </div>
          )}

          {/* Canvas Area */}
          <div className="absolute inset-0 flex flex-col h-full w-full">
             <div className="flex-1 relative h-full overflow-hidden">
                <BlueprintCanvas 
                  data={currentSketchData} 
                  isLoading={isGenerating && !hasLoadedData} // Only full page load if nothing loaded yet
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

             {/* Option Selector Footer */}
             {hasLoadedData && (
                <div 
                    className={`relative z-40 bg-white transition-all duration-300 ease-in-out border-black ${
                        uiState.bottomPanelOpen ? 'h-[18vh] opacity-100 border-t-2' : 'h-0 opacity-0 border-none'
                    }`}
                >
                    <div className="p-2 h-full overflow-hidden">
                      <div className="max-w-5xl mx-auto h-full flex flex-col">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-2 font-mono tracking-wider shrink-0">
                          <Grid size={12} /> Variation Selector
                        </h3>
                        <div className="flex gap-4 overflow-x-auto pb-2 h-full items-center">
                          {sketchOptions.map((opt, idx) => {
                            const isActive = idx === currentOptionIndex;
                            
                            if (opt.status === 'loading') {
                                return (
                                    <div key={idx} className="flex-1 min-w-[160px] h-[80%] p-3 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center gap-2 rounded">
                                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                                        <span className="text-xs text-gray-400 font-mono">THINKING...</span>
                                    </div>
                                );
                            }

                            if (opt.status === 'idle') {
                              return (
                                  <button 
                                    key={idx}
                                    onClick={() => handleGenerateOption(idx)}
                                    className="flex-1 min-w-[160px] h-[80%] p-3 border-2 border-dashed border-gray-300 bg-white hover:border-black hover:bg-gray-50 flex flex-col items-center justify-center gap-1 transition-all group rounded"
                                  >
                                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-black" />
                                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-black font-mono uppercase">Var {idx + 1}</span>
                                  </button>
                              );
                            }

                            if (opt.status === 'loaded') {
                                return (
                                  <button
                                    key={opt.data.id}
                                    onClick={() => setCurrentOptionIndex(idx)}
                                    className={`group relative flex-1 min-w-[160px] h-[80%] p-3 border-2 text-left transition-all rounded ${
                                      isActive 
                                        ? 'border-black bg-black text-white shadow-md' 
                                        : 'border-gray-200 hover:border-black bg-white text-black'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-xs font-bold uppercase tracking-wide font-mono truncate w-full">
                                        {opt.data.title || `Design ${idx + 1}`}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-mono opacity-80 mt-2">
                                      <span>{opt.data.totalAreaSqm} M²</span>
                                      <span className="flex items-center gap-1">
                                        {isActive ? 'ACTIVE' : 'LOAD'} <ArrowRight size={10} />
                                      </span>
                                    </div>
                                  </button>
                                );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                </div>
             )}
          </div>

        </div>
        
        {/* RIGHT PANEL */}
        {hasLoadedData && (
           <div className={`relative transition-all duration-300 ease-in-out bg-white z-20 ${uiState.rightPanelOpen ? 'w-80 border-l border-gray-200' : 'w-0 opacity-0 overflow-hidden'}`}>
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
