import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';

export interface ChargeVariable {
  id: string;
  vehiculeId: string;
  date: string;
  description: string;
  montant: number;
}

interface ChargeVariableStore {
  charges: ChargeVariable[];
  addCharge: (data: Omit<ChargeVariable, 'id'>) => void;
  deleteCharge: (id: string) => void;
}

export const useChargeVariableStore = create<ChargeVariableStore>()(
  persist(
    immer((set) => ({
      charges: [],
      addCharge: (data) =>
        set((state) => {
          state.charges.push({
            ...data,
            id: nanoid(),
          });
        }),
      deleteCharge: (id) =>
        set((state) => {
          state.charges = state.charges.filter((c) => c.id !== id);
        }),
    })),
    { name: 'fleetops-charges-variables', storage: createJSONStorage(() => postgresStorage) }
  )
);
