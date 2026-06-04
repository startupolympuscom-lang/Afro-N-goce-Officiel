import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { BudgetMensuel } from '../types';

interface BudgetStore {
  budgets: BudgetMensuel[];
  addBudget: (data: Omit<BudgetMensuel, 'id'>) => BudgetMensuel;
  updateBudget: (id: string, data: Partial<BudgetMensuel>) => void;
  deleteBudget: (id: string) => void;
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    immer((set) => ({
      budgets: [],
      addBudget: (data) => {
        const budget: BudgetMensuel = {
          ...data,
          id: nanoid(),
        };
        set(state => { state.budgets.push(budget); });
        return budget;
      },
      updateBudget: (id, data) =>
        set(state => {
          const idx = state.budgets.findIndex(b => b.id === id);
          if (idx !== -1) Object.assign(state.budgets[idx], data);
        }),
      deleteBudget: (id) =>
        set(state => { state.budgets = state.budgets.filter(b => b.id !== id); }),
    })),
    { name: 'fleetops-budget', storage: createJSONStorage(() => postgresStorage) }
  )
);
