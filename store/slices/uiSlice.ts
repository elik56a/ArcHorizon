
import { UnitSystem, ViewStyle, RenderImage } from '../../types';
import { generateRealisticRender } from '../../services/geminiService';
import { SliceCreator } from './types';

export interface UISlice {
  unitSystem: UnitSystem;
  viewStyle: ViewStyle;
  isRendering: boolean;
  currentRenderUrl: string | null;
  renderTrigger: number;
  renders: RenderImage[];

  setUnitSystem: (system: UnitSystem) => void;
  setViewStyle: (style: ViewStyle) => void;
  setIsRendering: (isRendering: boolean) => void;
  clearRender: () => void;
  addRender: (url: string) => void;
  deleteRender: (id: string) => void;
  triggerCanvasRender: () => void;
  generateRender: (base64: string) => Promise<void>;
}

export const createUISlice: SliceCreator<UISlice> = (set, get) => ({
  unitSystem: 'metric',
  viewStyle: 'blueprint',
  isRendering: false,
  currentRenderUrl: null,
  renderTrigger: 0,
  renders: [],

  setUnitSystem: (unitSystem) => set({ unitSystem }),
  setViewStyle: (viewStyle) => set({ viewStyle }),
  setIsRendering: (isRendering) => set({ isRendering }),
  clearRender: () => set({ currentRenderUrl: null }),
  triggerCanvasRender: () => set(state => ({ renderTrigger: state.renderTrigger + 1 })),
  
  addRender: (url) => set((state) => {
      const sketch = get().getCurrentSketch();
      const sketchId = sketch?.id || 'unknown';
      const newRender: RenderImage = { id: `render-${Date.now()}`, sketchId, url, timestamp: Date.now(), prompt: "Render" };
      return { renders: [newRender, ...state.renders] };
  }),
  
  deleteRender: (id) => set((state) => ({ renders: state.renders.filter(r => r.id !== id) })),

  generateRender: async (base64: string) => {
    const sketch = get().getCurrentSketch();
    if (!sketch) return;
    set({ isRendering: true, error: null });
    try {
        const url = await generateRealisticRender(base64, "High quality architectural render, top down, photorealistic lighting");
        get().addRender(url);
        set({ isRendering: false, currentRenderUrl: url });
    } catch (err) {
        console.error(err);
        set({ isRendering: false, error: "Failed to generate render." });
    }
  },
});
