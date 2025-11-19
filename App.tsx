
import React, { useState, useCallback, useRef } from 'react';
import ChatSidebar from './components/ChatSidebar';
import BlueprintCanvas from './components/BlueprintCanvas';
import { SketchOption, SketchData } from './types';
import { generateSingleSketch, generateSketchFromImage, DesignStyle } from './services/geminiService';
import { Layout, Grid, ArrowRight, Loader2, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [sketchOptions, setSketchOptions] = useState<SketchOption[]>([]);
  const [currentOptionIndex, setCurrentOptionIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');

  // History State
  const [history, setHistory] = useState<SketchData[]>([]);
  const [future, setFuture] = useState<SketchData[]>([]);

  // Helper to update current data and manage history
  const handleSketchUpdate = (newData: SketchData) => {
    const currentOption = sketchOptions[currentOptionIndex];
    if (currentOption?.status !== 'loaded') return;

    // Push current state to history before updating
    setHistory(prev => [...prev, currentOption.data]);
    setFuture([]); // Clear future on new action

    // Update the main state
    setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[currentOptionIndex] = { status: 'loaded', data: newData };
        return newOpts;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const currentOption = sketchOptions[currentOptionIndex];
    if (currentOption?.status !== 'loaded') return;

    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    setFuture(prev => [currentOption.data, ...prev]);
    setHistory(newHistory);
    
    setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[currentOptionIndex] = { status: 'loaded', data: previous };
        return newOpts;
    });
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const currentOption = sketchOptions[currentOptionIndex];
    if (currentOption?.status !== 'loaded') return;

    const next = future[0];
    const newFuture = future.slice(1);

    setHistory(prev => [...prev, currentOption.data]);
    setFuture(newFuture);

    setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[currentOptionIndex] = { status: 'loaded', data: next };
        return newOpts;
    });
  };

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    setCurrentOptionIndex(0);
    setHistory([]);
    setFuture([]);
    setLastPrompt(prompt);

    // Initialize: Option 1 loading, others IDLE
    setSketchOptions([
      { status: 'loading', id: 'opt-1' },
      { status: 'idle', id: 'opt-2' },
      { status: 'idle', id: 'opt-3' }
    ]);

    try {
      const styles: DesignStyle[] = ['Modern', 'Rustic', 'Creative'];
      
      // Only Generate Option 1
      const opt1 = await generateSingleSketch(prompt, styles[0]);
      setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[0] = { status: 'loaded', data: opt1 };
        return newOpts;
      });

    } catch (err) {
      console.error(err);
      setError("Failed to generate design. Please try again.");
      setSketchOptions([]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // New Handler for Image/PDF Uploads
  const handleGenerateFromImage = useCallback(async (file: File) => {
    setIsGenerating(true);
    setError(null);
    setHistory([]);
    setFuture([]);
    
    // Add a new loading option slot
    const newIdx = sketchOptions.length;
    setSketchOptions(prev => [...prev, { status: 'loading', id: `upload-${Date.now()}` }]);
    setCurrentOptionIndex(newIdx);

    try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove prefix (e.g. "data:image/png;base64,")
                const result = reader.result as string;
                const base64Data = result.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = error => reject(error);
        });

        const sketch = await generateSketchFromImage(base64, file.type);
        
        setSketchOptions(prev => {
            const newOpts = [...prev];
            newOpts[newIdx] = { status: 'loaded', data: sketch };
            return newOpts;
        });
    } catch (err) {
        console.error("Upload generation failed", err);
        setError(`Failed to analyze ${file.name}. Ensure it is a clear floor plan.`);
        // Remove failed option
        setSketchOptions(prev => prev.filter((_, i) => i !== newIdx));
    } finally {
        setIsGenerating(false);
    }
  }, [sketchOptions.length]);

  const handleGenerateOption = async (index: number) => {
    if (!lastPrompt) return;
    
    setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[index] = { status: 'loading', id: `opt-${index+1}` };
        return newOpts;
    });
    setCurrentOptionIndex(index);

    try {
       const styles: DesignStyle[] = ['Modern', 'Rustic', 'Creative'];
       const newData = await generateSingleSketch(lastPrompt, styles[index]);
       
       setSketchOptions(prev => {
        const newOpts = [...prev];
        newOpts[index] = { status: 'loaded', data: newData };
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
    }
  };

  const currentOption = sketchOptions[currentOptionIndex];
  const currentSketchData = currentOption?.status === 'loaded' ? currentOption.data : null;
  const isLoadingCurrent = currentOption?.status === 'loading' || currentOption?.status === 'pending';

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b-2 border-black bg-white flex items-center px-6 justify-between z-50 relative shadow-sm">
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
             v1.3 PRO
           </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden relative">
        <ChatSidebar 
            onGenerate={handleGenerate} 
            onGenerateFromImage={handleGenerateFromImage}
            isGenerating={isGenerating} 
        />
        
        <div className="flex-1 flex flex-col relative bg-gray-50">
          {/* Error Toast */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border-2 border-red-500 text-red-600 px-6 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
              <span className="font-bold">{error}</span>
              <button onClick={() => setError(null)} className="font-bold ml-4">&times;</button>
            </div>
          )}

          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden">
            <BlueprintCanvas 
              data={currentSketchData} 
              isLoading={isLoadingCurrent}
              onUpdate={handleSketchUpdate}
              historyControl={{
                  undo: handleUndo,
                  redo: handleRedo,
                  canUndo: history.length > 0,
                  canRedo: future.length > 0
              }}
            />
          </div>

          {/* Option Selector Footer */}
          {sketchOptions.length > 0 && (
            <div className="h-auto bg-white border-t-2 border-black p-4 z-30">
              <div className="max-w-5xl mx-auto">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-2 font-mono tracking-wider">
                  <Grid size={12} /> Variation Selector
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {sketchOptions.map((opt, idx) => {
                    const isActive = idx === currentOptionIndex;
                    
                    if (opt.status === 'loading') {
                        return (
                            <div key={idx} className="flex-1 min-w-[200px] h-[80px] p-3 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-black" />
                                <span className="text-xs text-gray-400 font-mono">GENERATING...</span>
                            </div>
                        );
                    }

                    if (opt.status === 'idle') {
                       return (
                          <button 
                            key={idx}
                            onClick={() => handleGenerateOption(idx)}
                            className="flex-1 min-w-[200px] h-[80px] p-3 border-2 border-dashed border-gray-300 bg-white hover:border-black hover:bg-gray-50 flex flex-col items-center justify-center gap-1 transition-all group"
                          >
                              <Plus className="w-5 h-5 text-gray-400 group-hover:text-black" />
                              <span className="text-[10px] font-bold text-gray-400 group-hover:text-black font-mono uppercase">Generate Variation {idx + 1}</span>
                          </button>
                       );
                    }

                    if (opt.status === 'loaded') {
                        return (
                          <button
                            key={opt.data.id}
                            onClick={() => setCurrentOptionIndex(idx)}
                            className={`group relative flex-1 min-w-[200px] p-3 border-2 text-left transition-all ${
                              isActive 
                                ? 'border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' 
                                : 'border-gray-200 hover:border-black bg-white text-black'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs font-bold uppercase tracking-wide font-mono truncate max-w-[160px]`}>
                                {opt.data.title}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
                              <span>{opt.data.totalAreaSqm} M²</span>
                              <span className="flex items-center gap-1">
                                 VIEW <ArrowRight size={10} />
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
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
