
import { create } from 'zustand';
import { RightPanelType } from '../types';

interface UiState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  activeRightPanel: RightPanelType;
  
  togglePanel: (panel: 'left' | 'right' | 'bottom') => void;
  setPanelOpen: (panel: 'left' | 'right' | 'bottom', isOpen: boolean) => void;
  setActiveRightPanel: (type: RightPanelType) => void;
  
  // Helpers
  isGalleryOpen: () => boolean;
  setGalleryOpen: (isOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  bottomPanelOpen: true,
  activeRightPanel: 'library',

  togglePanel: (panel) => set((state) => ({ 
    [`${panel}PanelOpen`]: !state[`${panel}PanelOpen` as keyof UiState] 
  })),

  setPanelOpen: (panel, isOpen) => set(() => ({ 
    [`${panel}PanelOpen`]: isOpen 
  })),

  setActiveRightPanel: (type) => set({ activeRightPanel: type }),

  // Computed helper for backward compatibility or specific checks
  isGalleryOpen: () => get().activeRightPanel === 'gallery',

  setGalleryOpen: (isOpen) => set((state) => {
    if (isOpen) {
        return { activeRightPanel: 'gallery', rightPanelOpen: true };
    } else {
        if (state.activeRightPanel === 'gallery') {
            return { rightPanelOpen: false };
        }
        return {};
    }
  }),
}));
