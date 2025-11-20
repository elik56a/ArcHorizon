
import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const STORAGE_KEY = 'archorizon_auth_user';

// Helper to get initial state from local storage
const getInitialUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!getInitialUser(),

  login: (email: string) => {
    // Mock Login
    const mockUser: User = {
      id: 'u-' + Date.now(),
      name: email.split('@')[0] || 'Architect',
      email: email,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${email}`,
      plan: 'Pro'
    };
    
    // Save to local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    
    set({ user: mockUser, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: (data) => set((state) => {
    const newUser = state.user ? { ...state.user, ...data } : null;
    if (newUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    }
    return { user: newUser };
  })
}));
