
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Language = 'en' | 'he';
export type Direction = 'ltr' | 'rtl';

interface LanguageState {
  language: Language;
  dir: Direction;
  setLanguage: (lang: Language) => void;
  initialize: () => void;
}

// Helper to detect system preference
const getSystemDefaults = (): { language: Language; dir: Direction } => {
  const isHebrew = typeof navigator !== 'undefined' && navigator.language.startsWith('he');
  return {
    language: isHebrew ? 'he' : 'en',
    dir: isHebrew ? 'rtl' : 'ltr'
  };
};

const defaults = getSystemDefaults();

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: defaults.language,
      dir: defaults.dir,

      setLanguage: (lang: Language) => {
        const dir = lang === 'he' ? 'rtl' : 'ltr';
        // Update HTML tag attribute
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
        set({ language: lang, dir });
      },

      initialize: () => {
        // Sync DOM with current state (whether default or hydrated)
        const { language, dir } = get();
        document.documentElement.dir = dir;
        document.documentElement.lang = language;
      }
    }),
    {
      name: 'archorizon-language',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Ensure DOM updates immediately after rehydration from local storage
        if (state) {
            document.documentElement.dir = state.dir;
            document.documentElement.lang = state.language;
        }
      }
    }
  )
);
