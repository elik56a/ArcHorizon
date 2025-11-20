
import { create } from 'zustand';

interface UiState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  
  togglePanel: (panel: 'left' | 'right' | 'bottom') => void;
  setPanel: (panel: 'left' | 'right' | 'bottom', isOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  bottomPanelOpen: true,

  togglePanel: (panel) => set((state) => ({ 
    [`${panel}PanelOpen`]: !state[`${panel}PanelOpen` as keyof UiState] 
  })),

  setPanel: (panel, isOpen) => set(() => ({ 
    [`${panel}PanelOpen`]: isOpen 
  })),
}));
