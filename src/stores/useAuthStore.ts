import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { postgresStorage } from '../lib/postgresStorage';
import { immer } from 'zustand/middleware/immer';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set((state) => {
        state.user = user;
        state.isAuthenticated = true;
      }),
      logout: () => set((state) => {
        state.user = null;
        state.isAuthenticated = false;
      }),
    })),
    { 
      name: 'fleetops-auth',
      storage: createJSONStorage(() => postgresStorage)
    }
  )
);
