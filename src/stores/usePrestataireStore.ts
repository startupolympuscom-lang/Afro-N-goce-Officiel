import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type PrestataireType = 'garage' | 'assurance' | 'carburant' | 'pneus' | 'administration' | 'autre';
export type PrestataireStatus = 'actif' | 'inactif';

export interface Prestataire {
  id: string;
  nom: string;
  type: PrestataireType;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  status: PrestataireStatus;
  notes?: string;
}

interface PrestataireState {
  prestataires: Prestataire[];
  addPrestataire: (prestataire: Omit<Prestataire, 'id'>) => void;
  updatePrestataire: (id: string, prestataire: Partial<Prestataire>) => void;
  deletePrestataire: (id: string) => void;
}

export const usePrestataireStore = create<PrestataireState>()(
  persist(
    immer((set) => ({
      prestataires: [],
      addPrestataire: (prestataire) =>
        set((state) => {
          state.prestataires.push({
            ...prestataire,
            id: Math.random().toString(36).substring(2, 9),
          });
        }),
      updatePrestataire: (id, updatedPrestataire) =>
        set((state) => {
          const index = state.prestataires.findIndex((p) => p.id === id);
          if (index !== -1) {
            state.prestataires[index] = { ...state.prestataires[index], ...updatedPrestataire };
          }
        }),
      deletePrestataire: (id) =>
        set((state) => {
          state.prestataires = state.prestataires.filter((p) => p.id !== id);
        }),
    })),
    {
      name: 'prestataire-storage',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
