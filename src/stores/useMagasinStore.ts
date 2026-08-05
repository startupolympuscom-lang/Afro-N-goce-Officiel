import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';

export type MagasinItemType = 'filtre_air' | 'filtre_gasoil' | 'filtre_habitacle' | 'filtre_huile' | 'huile' | 'piece_rechange' | 'pneu' | 'autre';

export interface MagasinItem {
  id: string;
  name: string;
  type: MagasinItemType;
  quantity: number;
  unitPrice: number;
  supplierId?: string;
  dateAdded: string;
  reference?: string;
}

export interface MagasinTransaction {
  id: string;
  itemId: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  reason: string; // e.g. "Achat", "Vidange #123", "Maintenance #456"
  vehiculeId?: string;
}

interface MagasinState {
  items: MagasinItem[];
  transactions: MagasinTransaction[];
  addItem: (item: Omit<MagasinItem, 'id' | 'dateAdded'>) => void;
  updateItem: (id: string, item: Partial<MagasinItem>) => void;
  deleteItem: (id: string) => void;
  addStock: (itemId: string, quantity: number, reason?: string) => void;
  removeStock: (itemId: string, quantity: number, reason: string, vehiculeId?: string) => void;
}

export const useMagasinStore = create<MagasinState>()(
  persist(
    immer((set) => ({
      items: [],
      transactions: [],
      addItem: (item) =>
        set((state) => {
          state.items.push({
            ...item,
            id: nanoid(),
            dateAdded: new Date().toISOString(),
          });
        }),
      updateItem: (id, updatedItem) =>
        set((state) => {
          const index = state.items.findIndex((i) => i.id === id);
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...updatedItem };
          }
        }),
      deleteItem: (id) =>
        set((state) => {
          state.items = state.items.filter((i) => i.id !== id);
        }),
      addStock: (itemId, quantity, reason = 'Achat / Entrée') =>
        set((state) => {
          const index = state.items.findIndex((i) => i.id === itemId);
          if (index !== -1) {
            state.items[index].quantity += quantity;
            state.transactions.push({
              id: nanoid(),
              itemId,
              type: 'in',
              quantity,
              date: new Date().toISOString(),
              reason,
            });
          }
        }),
      removeStock: (itemId, quantity, reason, vehiculeId) =>
        set((state) => {
          const index = state.items.findIndex((i) => i.id === itemId);
          if (index !== -1 && state.items[index].quantity >= quantity) {
            state.items[index].quantity -= quantity;
            state.transactions.push({
              id: nanoid(),
              itemId,
              type: 'out',
              quantity,
              date: new Date().toISOString(),
              reason,
              vehiculeId,
            });
          }
        }),
    })),
    {
      name: 'fleetops-magasin',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
