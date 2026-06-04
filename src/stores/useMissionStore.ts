import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { Mission } from '../types';

interface MissionStore {
  missions: Mission[];
  addMission: (data: Omit<Mission, 'id' | 'createdAt' | 'reference'>) => Mission;
  updateMission: (id: string, data: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  getMissionById: (id: string) => Mission | undefined;
}

export const useMissionStore = create<MissionStore>()(
  persist(
    immer((set, get) => ({
      missions: [],
      addMission: (data) => {
        const mission: Mission = {
          ...data,
          id: nanoid(),
          reference: `MSN-${new Date().getFullYear()}-${String(get().missions.length + 1).padStart(4, '0')}`,
          createdAt: new Date().toISOString(),
        };
        set(state => { state.missions.push(mission); });
        return mission;
      },
      updateMission: (id, data) =>
        set(state => {
          const idx = state.missions.findIndex(m => m.id === id);
          if (idx !== -1) Object.assign(state.missions[idx], data);
        }),
      deleteMission: (id) =>
        set(state => { state.missions = state.missions.filter(m => m.id !== id); }),
      getMissionById: (id) => get().missions.find(m => m.id === id),
    })),
    { name: 'fleetops-missions', storage: createJSONStorage(() => postgresStorage) }
  )
);
