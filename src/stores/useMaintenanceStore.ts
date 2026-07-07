import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type MaintenanceType = 'preventive' | 'curative' | 'inspection';
export type MaintenanceStatus = 'planifiee' | 'en_cours' | 'terminee' | 'annulee';

export interface Maintenance {
  id: string;
  vehiculeId: string;
  type: MaintenanceType;
  description: string;
  datePrevue: string;
  dateRealisation?: string;
  kilometrage: number;
  coutEstime: number;
  coutReel?: number;
  prestataireId?: string;
  status: MaintenanceStatus;
  notes?: string;
  pieces: { nom: string; quantite: number; prixUnitaire: number }[];
}

interface MaintenanceState {
  maintenances: Maintenance[];
  addMaintenance: (maintenance: Omit<Maintenance, 'id'>) => void;
  updateMaintenance: (id: string, maintenance: Partial<Maintenance>) => void;
  deleteMaintenance: (id: string) => void;
  getMaintenanceById: (id: string) => Maintenance | undefined;
}

export const useMaintenanceStore = create<MaintenanceState>()(
  persist(
    immer((set, get) => ({
      maintenances: [],
      addMaintenance: (maintenance) =>
        set((state) => {
          state.maintenances.push({
            ...maintenance,
            id: Math.random().toString(36).substring(2, 9),
          });
        }),
      updateMaintenance: (id, updatedMaintenance) =>
        set((state) => {
          const index = state.maintenances.findIndex((m) => m.id === id);
          if (index !== -1) {
            state.maintenances[index] = { ...state.maintenances[index], ...updatedMaintenance };
          }
        }),
      deleteMaintenance: (id) =>
        set((state) => {
          state.maintenances = state.maintenances.filter((m) => m.id !== id);
        }),
      getMaintenanceById: (id) => get().maintenances.find((m) => m.id === id),
    })),
    {
      name: 'maintenance-storage',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
