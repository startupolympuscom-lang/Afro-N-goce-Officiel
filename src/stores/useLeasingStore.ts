import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { LeasingContrat } from '../types';

interface LeasingState {
  contrats: LeasingContrat[];
  addContrat: (contrat: Omit<LeasingContrat, 'id' | 'createdAt'>) => void;
  updateContrat: (id: string, contrat: Partial<LeasingContrat>) => void;
  deleteContrat: (id: string) => void;
}

export const useLeasingStore = create<LeasingState>()(
  persist(
    immer((set) => ({
      contrats: [],
      addContrat: (contrat) => set((state) => {
        state.contrats.push({
          ...contrat,
          id: nanoid(),
          createdAt: new Date().toISOString(),
        });
      }),
      updateContrat: (id, updatedContrat) => set((state) => {
        const index = state.contrats.findIndex(c => c.id === id);
        if (index !== -1) {
          state.contrats[index] = { ...state.contrats[index], ...updatedContrat };
        }
      }),
      deleteContrat: (id) => set((state) => {
        state.contrats = state.contrats.filter(c => c.id !== id);
      })
    })),
    { name: 'fleetops-leasing', storage: createJSONStorage(() => postgresStorage) }
  )
);
