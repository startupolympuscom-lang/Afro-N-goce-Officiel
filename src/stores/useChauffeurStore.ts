import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { Chauffeur } from '../types';

interface ChauffeurStore {
  chauffeurs: Chauffeur[];
  addChauffeur: (data: Omit<Chauffeur, 'id' | 'createdAt' | 'status' | 'score'>) => Chauffeur;
  updateChauffeur: (id: string, data: Partial<Chauffeur>) => void;
  deleteChauffeur: (id: string) => void;
  getChauffeurById: (id: string) => Chauffeur | undefined;
}

export const useChauffeurStore = create<ChauffeurStore>()(
  persist(
    immer((set, get) => ({
      chauffeurs: [],
      addChauffeur: (data) => {
        const chauffeur: Chauffeur = {
          ...data,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          status: 'actif',
          score: 100
        };
        set(state => { state.chauffeurs.push(chauffeur); });
        return chauffeur;
      },
      updateChauffeur: (id, data) =>
        set(state => {
          const idx = state.chauffeurs.findIndex(c => c.id === id);
          if (idx !== -1) Object.assign(state.chauffeurs[idx], data);
        }),
      deleteChauffeur: (id) =>
        set(state => { state.chauffeurs = state.chauffeurs.filter(c => c.id !== id); }),
      getChauffeurById: (id) => get().chauffeurs.find(c => c.id === id),
    })),
    { name: 'fleetops-chauffeurs', storage: createJSONStorage(() => postgresStorage) }
  )
);
