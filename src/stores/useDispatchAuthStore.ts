import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DispatchRole = 'admin' | 'driver' | 'vendeur_comptoir' | 'comptable' | 'stock_superviseur' | 'caissier';

export interface DispatchUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: DispatchRole;
}

interface DispatchAuthState {
  user: DispatchUser | null;
  isAuthenticated: boolean;
  login: (user: DispatchUser) => void;
  logout: () => void;
}

export const useDispatchAuthStore = create<DispatchAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'dispatch-auth-storage',
      // Provide no storage to default to localStorage
    }
  )
);
