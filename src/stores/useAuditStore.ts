import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { postgresStorage } from '../lib/postgresStorage';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';

export interface AuditLog {
  id: string;
  user: string;
  action: 'Création' | 'Modification' | 'Suppression' | 'Connexion';
  resource: string;
  date: string;
  details: string;
}

interface AuditStore {
  logs: AuditLog[];
  addLog: (log: Omit<AuditLog, 'id' | 'date'>) => void;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditStore>()(
  persist(
    immer((set) => ({
      logs: [],
      addLog: (log) =>
        set((state) => {
          state.logs.unshift({
            ...log,
            id: nanoid(),
            date: new Date().toISOString(),
          });
        }),
      clearLogs: () =>
        set((state) => {
          state.logs = [];
        }),
    })),
    {
      name: 'fleetops-audit-storage',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
