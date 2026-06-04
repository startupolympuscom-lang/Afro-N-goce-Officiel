import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { Vehicule, OutilBoite } from '../types';

interface VehiculeStore {
  vehicules: Vehicule[];
  parcs: { id: string, name: string }[];
  addParc: (name: string) => void;
  updateParc: (id: string, name: string) => void;
  deleteParc: (id: string) => void;
  addVehicule: (data: Omit<Vehicule, 'id' | 'createdAt' | 'status' | 'documentStatus'>) => Vehicule;
  updateVehicule: (id: string, data: Partial<Vehicule>) => void;
  deleteVehicule: (id: string) => void;
  getVehiculeById: (id: string) => Vehicule | undefined;
  assignDriver: (vehiculeId: string, chauffeurId: string | undefined) => void;
  addEquipement: (vehiculeId: string, equipement: Omit<OutilBoite, 'id' | 'dateAjout' | 'status'>) => void;
  removeEquipement: (vehiculeId: string, equipementId: string) => void;
}

export const useVehiculeStore = create<VehiculeStore>()(
  persist(
    immer((set, get) => ({
      vehicules: [],
      parcs: [
        { id: 'p1', name: 'Afro Négoce' },
        { id: 'p2', name: 'Chakirine Gaz' }
      ],
      addParc: (name) =>
        set(state => {
          state.parcs.push({ id: nanoid(), name });
        }),
      updateParc: (id, name) =>
        set(state => {
          const p = state.parcs.find(x => x.id === id);
          if (p) p.name = name;
        }),
      deleteParc: (id) =>
        set(state => {
          state.parcs = state.parcs.filter(x => x.id !== id);
        }),
      addVehicule: (data) => {
        const vehicule: Vehicule = {
          ...data,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          status: 'disponible',
          documentStatus: 'valide'
        };
        set(state => { state.vehicules.push(vehicule); });
        return vehicule;
      },
      updateVehicule: (id, data) =>
        set(state => {
          const idx = state.vehicules.findIndex(v => v.id === id);
          if (idx !== -1) Object.assign(state.vehicules[idx], data);
        }),
      deleteVehicule: (id) =>
        set(state => { state.vehicules = state.vehicules.filter(v => v.id !== id); }),
      getVehiculeById: (id) => get().vehicules.find(v => v.id === id),
      assignDriver: (vehiculeId, chauffeurId) =>
        set(state => {
          const v = state.vehicules.find(v => v.id === vehiculeId);
          if (v) v.chauffeurAssigneId = chauffeurId;
        }),
      addEquipement: (vehiculeId, equipement) =>
        set(state => {
          const v = state.vehicules.find(v => v.id === vehiculeId);
          if (v) {
            if (!v.outillage) v.outillage = [];
            v.outillage.push({
              ...equipement,
              id: nanoid(),
              dateAjout: new Date().toISOString(),
              status: 'present'
            });
          }
        }),
      removeEquipement: (vehiculeId, equipementId) =>
        set(state => {
          const v = state.vehicules.find(v => v.id === vehiculeId);
          if (v && v.outillage) {
            const eq = v.outillage.find(e => e.id === equipementId);
            if (eq) {
              eq.status = 'retire';
              eq.dateRetrait = new Date().toISOString();
            }
          }
        }),
    })),
    { name: 'fleetops-vehicules', storage: createJSONStorage(() => postgresStorage) }
  )
);
