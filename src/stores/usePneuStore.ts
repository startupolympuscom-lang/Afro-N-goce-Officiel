import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type PneuPosition = 'avant_gauche' | 'avant_droit' | 'arriere_gauche_ext' | 'arriere_gauche_int' | 'arriere_droit_ext' | 'arriere_droit_int' | 'secours';
export type PneuStatus = 'neuf' | 'bon' | 'moyen' | 'use' | 'a_remplacer';

export interface Pneu {
  id: string;
  vehiculeId: string;
  marque: string;
  modele: string;
  dimensions: string;
  position: PneuPosition;
  dateMontage: string;
  kilometrageMontage: number;
  usureActuelle: number; // Percentage 0-100
  status: PneuStatus;
  cout: number;
}

interface PneuState {
  pneus: Pneu[];
  addPneu: (pneu: Omit<Pneu, 'id'>) => void;
  updatePneu: (id: string, pneu: Partial<Pneu>) => void;
  deletePneu: (id: string) => void;
  getPneusByVehiculeId: (vehiculeId: string) => Pneu[];
}

export const usePneuStore = create<PneuState>()(
  persist(
    immer((set, get) => ({
      pneus: [],
      addPneu: (pneu) =>
        set((state) => {
          state.pneus.push({
            ...pneu,
            id: Math.random().toString(36).substring(2, 9),
          });
        }),
      updatePneu: (id, updatedPneu) =>
        set((state) => {
          const index = state.pneus.findIndex((p) => p.id === id);
          if (index !== -1) {
            state.pneus[index] = { ...state.pneus[index], ...updatedPneu };
          }
        }),
      deletePneu: (id) =>
        set((state) => {
          state.pneus = state.pneus.filter((p) => p.id !== id);
        }),
      getPneusByVehiculeId: (vehiculeId) => get().pneus.filter((p) => p.vehiculeId === vehiculeId),
    })),
    {
      name: 'pneu-storage',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
