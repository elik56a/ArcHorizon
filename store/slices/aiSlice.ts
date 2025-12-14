
import { ImageAttachment } from '../../services/ai/types';
import { getAgent } from '../../services/ai/agentRegistry';
import { normalizeSketchData, autoSave } from '../utils';
import { SliceCreator } from './types';

export interface AISlice {
  isGenerating: boolean;
  error: string | null;
  lastPrompt: string;
  
  generateByPrompt: (prompt: string, images?: ImageAttachment[]) => Promise<void>;
  generateByFile: (file: File) => Promise<void>;
  generateVariation: (index: number) => Promise<void>;
  failGeneration: (error: string) => void;
}

export const createAISlice: SliceCreator<AISlice> = (set, get) => ({
  isGenerating: false,
  error: null,
  lastPrompt: '',

  generateByPrompt: async (prompt: string, images: ImageAttachment[] = []) => {
    const { activeLayerId, sketchOptions, currentOptionIndex, getDiscipline, validateActiveLayer } = get();
    const currentOpt = sketchOptions[currentOptionIndex];
    const discipline = getDiscipline();
    const agent = getAgent(discipline);

    set({ isGenerating: true, error: null, lastPrompt: prompt, selection: null });

    // For ARC, we create new options usually
    if (discipline === 'arc') {
        set({
            currentOptionIndex: 0,
            sketchOptions: [{ status: 'loading', id: 'opt-1' }, { status: 'idle', id: 'opt-2' }, { status: 'idle', id: 'opt-3' }]
        });
    }

    try {
        const contextData = currentOpt?.status === 'loaded' ? currentOpt.data : null;
        let finalData = await agent.generate(prompt, contextData, images);
        
        if (discipline === 'arc') {
            finalData = normalizeSketchData(finalData);
            set((state) => {
                 const newOpts = [...state.sketchOptions];
                 newOpts[0] = { status: 'loaded', data: finalData };
                 const activeLayerId = finalData.layers[0]?.id || 'layer-arc-main';
                 const saved = autoSave(finalData, state.savedSketches);
                 return { isGenerating: false, sketchOptions: newOpts, history: [], future: [], activeLayerId, savedSketches: saved };
            });
        } else {
            // MERGE MODE (MEP Layers)
            set((state) => {
                const currentOpt = state.sketchOptions[state.currentOptionIndex];
                if (currentOpt?.status !== 'loaded') return { isGenerating: false };

                const newLayers = currentOpt.data.layers.map(layer => {
                    if (layer.id === activeLayerId) {
                        return { ...layer, elements: [...layer.elements, ...finalData.elements] };
                    }
                    return layer;
                });
                
                const newData = { ...currentOpt.data, layers: newLayers };
                const normalized = normalizeSketchData(newData);
                const newOpts = [...state.sketchOptions];
                newOpts[state.currentOptionIndex] = { status: 'loaded', data: normalized };
                
                const saved = autoSave(normalized, state.savedSketches);
                // Push to history for undo capability
                return { isGenerating: false, sketchOptions: newOpts, history: [...state.history, currentOpt.data], future: [], savedSketches: saved };
            });
        }
        validateActiveLayer();
    } catch (err) {
        console.error(err);
        set({ isGenerating: false, error: "Failed to generate design." });
    }
  },

  generateByFile: async (file: File) => {
      // Placeholder: In a real app, this would convert file to image/text and call agent
      console.log("Generate by file not fully implemented in this refactor");
      set({ isGenerating: false });
  },

  generateVariation: async (index: number) => {
      const { lastPrompt, sketchOptions, validateActiveLayer } = get();
      if (!lastPrompt) return;
      const agent = getAgent('arc'); // Variations typically for Architecture
      
      set({ isGenerating: true, error: null, selection: null, currentOptionIndex: index });
      
      const loadingOpts = [...sketchOptions];
      loadingOpts[index] = { status: 'loading', id: `opt-${index+1}` };
      set({ sketchOptions: loadingOpts });
      
      try {
         let finalData = await agent.generate(lastPrompt, null, []);
         finalData = normalizeSketchData(finalData);
         set((state) => {
             const updatedOpts = [...state.sketchOptions];
             updatedOpts[index] = { status: 'loaded', data: finalData };
             const activeLayerId = finalData.layers[0]?.id || 'layer-arc-main';
             const saved = autoSave(finalData, state.savedSketches);
             return { isGenerating: false, sketchOptions: updatedOpts, activeLayerId, savedSketches: saved };
         });
         validateActiveLayer();
      } catch (err) {
         set((state) => {
             const updatedOpts = [...state.sketchOptions];
             updatedOpts[index] = { status: 'idle', id: `opt-${index+1}` };
             return { isGenerating: false, error: `Failed to generate variation`, sketchOptions: updatedOpts };
         });
      }
  },

  failGeneration: (error) => set({ isGenerating: false, error })
});
