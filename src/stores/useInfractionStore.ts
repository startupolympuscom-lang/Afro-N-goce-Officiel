import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type InfractionStatus = 'non_payee' | 'payee' | 'contestee';

export interface Infraction {
  id: string;
  vehiculeId: string;
  chauffeurId?: string;
  date: string;
  lieu: string;
  type: string;
  montant: number;
  pointsRetires: number;
  status: InfractionStatus;
  numeroPv?: string;
}

interface InfractionState {
  infractions: Infraction[];
  addInfraction: (infraction: Omit<Infraction, 'id'>) => void;
  updateInfraction: (id: string, infraction: Partial<Infraction>) => void;
  deleteInfraction: (id: string) => void;
}

export const useInfractionStore = create<InfractionState>()(
  persist(
    immer((set) => ({
      infractions: [],
      addInfraction: (infraction) =>
        set((state) => {
          state.infractions.push({
            ...infraction,
            id: Math.random().toString(36).substring(2, 9),
          });
        }),
      updateInfraction: (id, updatedInfraction) =>
        set((state) => {
          const index = state.infractions.findIndex((i) => i.id === id);
          if (index !== -1) {
            state.infractions[index] = { ...state.infractions[index], ...updatedInfraction };
          }
        }),
      deleteInfraction: (id) =>
        set((state) => {
          state.infractions = state.infractions.filter((i) => i.id !== id);
        }),
    })),
    {
      name: 'infraction-storage',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
