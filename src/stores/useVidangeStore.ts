import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';

export interface OilType {
  id: string;
  name: string;
  intervalKm: number;
}

export interface VidangeFilter {
  id: string;
  type: 'air' | 'gasoil' | 'huile' | 'habitacle' | 'autre';
  name?: string;
  prix: number;
  source: 'magasin' | 'externe';
  magasinItemId?: string;
}

export interface Vidange {
  id: string;
  vehiculeId: string;
  date: string;
  kilometrage: number;
  prochainKilometrage: number;
  typeHuileId?: string;
  coutHuile?: number;
  filtreHuile?: boolean;
  coutFiltreHuile?: number;
  filtreGasoil?: boolean;
  coutFiltreGasoil?: number;
  filtreAir?: boolean;
  coutFiltreAir?: number;
  filters?: VidangeFilter[];
  cout: number;
  notes?: string;
}

interface VidangeStore {
  vidanges: Vidange[];
  oilTypes: OilType[];
  addVidange: (data: Omit<Vidange, 'id'>) => void;
  updateVidange: (id: string, data: Partial<Vidange>) => void;
  deleteVidange: (id: string) => void;
  addOilType: (data: Omit<OilType, 'id'>) => void;
  updateOilType: (id: string, data: Partial<OilType>) => void;
  deleteOilType: (id: string) => void;
}

export const useVidangeStore = create<VidangeStore>()(
  persist(
    immer((set) => ({
      vidanges: [],
      oilTypes: [
        { id: '1', name: '5W-40', intervalKm: 10000 },
        { id: '2', name: '10W-40', intervalKm: 10000 },
        { id: '3', name: '15W-40', intervalKm: 8000 }
      ],
      addVidange: (data) =>
        set((state) => {
          state.vidanges.push({
            ...data,
            id: nanoid(),
          });
        }),
      updateVidange: (id, data) =>
        set((state) => {
          const idx = state.vidanges.findIndex(v => v.id === id);
          if (idx !== -1) Object.assign(state.vidanges[idx], data);
        }),
      deleteVidange: (id) =>
        set((state) => {
          state.vidanges = state.vidanges.filter((v) => v.id !== id);
        }),
      addOilType: (data) =>
        set((state) => {
          state.oilTypes.push({
            ...data,
            id: nanoid(),
          });
        }),
      updateOilType: (id, data) =>
        set((state) => {
          const idx = state.oilTypes.findIndex(o => o.id === id);
          if (idx !== -1) Object.assign(state.oilTypes[idx], data);
        }),
      deleteOilType: (id) =>
        set((state) => {
          state.oilTypes = state.oilTypes.filter((o) => o.id !== id);
        }),
    })),
    { name: 'fleetops-vidanges', storage: createJSONStorage(() => postgresStorage) }
  )
);
