import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type MaintenanceType = 'preventive' | 'curative' | 'inspection';
export type MaintenanceStatus = 'planifiee' | 'en_cours' | 'terminee' | 'annulee';

export interface SparePart {
  id: string;
  nom: string;
  prixDefaut: number;
}

export interface MaintenancePiece {
  partId: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
  source?: 'magasin' | 'externe';
  magasinItemId?: string;
}

export interface MaintenanceDocument {
  id: string;
  nom: string;
  reference: string;
}

export interface Maintenance {
  id: string;
  vehiculeId: string;
  type: MaintenanceType;
  description: string;
  datePrevue: string;
  dateRealisation?: string;
  kilometrage: number;
  coutEstime: number; // base maintenance / labor cost
  coutReel?: number;
  prestataireId?: string; // kept for compatibility
  fournisseurPieceId?: string;
  fournisseurMaintenanceId?: string;
  status: MaintenanceStatus;
  notes?: string;
  pieces: MaintenancePiece[];
  coutTotalPieces?: number;
  coutTotalGlobal?: number;
  documents?: MaintenanceDocument[];
  numeroCommande?: string;
}

interface MaintenanceState {
  maintenances: Maintenance[];
  spareParts: SparePart[];
  addMaintenance: (maintenance: Omit<Maintenance, 'id'>) => Maintenance;
  updateMaintenance: (id: string, maintenance: Partial<Maintenance>) => void;
  deleteMaintenance: (id: string) => void;
  getMaintenanceById: (id: string) => Maintenance | undefined;
  
  // Spare Parts Database actions
  addSparePart: (part: Omit<SparePart, 'id'>) => void;
  updateSparePart: (id: string, part: Partial<SparePart>) => void;
  deleteSparePart: (id: string) => void;
}

export const useMaintenanceStore = create<MaintenanceState>()(
  persist(
    immer((set, get) => ({
      maintenances: [],
      spareParts: [
        { id: 'part-1', nom: 'Plaquettes de frein', prixDefaut: 450 },
        { id: 'part-2', nom: 'Filtre à air moteur', prixDefaut: 180 },
        { id: 'part-3', nom: 'Batterie 12V 100Ah', prixDefaut: 1200 },
        { id: 'part-4', nom: 'Courroie de distribution', prixDefaut: 950 },
        { id: 'part-5', nom: 'Alternateur', prixDefaut: 1800 },
        { id: 'part-6', nom: 'Disque de frein', prixDefaut: 800 },
        { id: 'part-7', nom: 'Démarreur', prixDefaut: 1500 },
        { id: 'part-8', nom: 'Amortisseur avant', prixDefaut: 1100 }
      ],
      addMaintenance: (maintenance) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newRecord = {
          ...maintenance,
          id,
        };
        set((state) => {
          state.maintenances.push(newRecord);
        });
        return newRecord;
      },
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
      
      // Spare Parts actions
      addSparePart: (part) =>
        set((state) => {
          state.spareParts.push({
            ...part,
            id: Math.random().toString(36).substring(2, 9),
          });
        }),
      updateSparePart: (id, updatedPart) =>
        set((state) => {
          const index = state.spareParts.findIndex((p) => p.id === id);
          if (index !== -1) {
            state.spareParts[index] = { ...state.spareParts[index], ...updatedPart };
          }
        }),
      deleteSparePart: (id) =>
        set((state) => {
          state.spareParts = state.spareParts.filter((p) => p.id !== id);
        }),
    })),
    {
      name: 'maintenance-storage',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
