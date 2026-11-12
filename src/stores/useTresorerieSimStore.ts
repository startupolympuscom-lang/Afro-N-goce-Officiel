import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { postgresStorage } from '../lib/postgresStorage';
import type { SimScenario } from '../lib/tresorerieSim';

/**
 * Treasury simulations. Kept in their own store (own database key) so that a simulation
 * can never change caisse, stock, sales or any other Afro Dispatch data.
 */
export const scenarioKey = (month: string, company: string) => `${month}|${company}`;

interface TresorerieSimState {
  scenarios: Record<string, SimScenario>;
  saveScenario: (scenario: SimScenario) => void;
  removeScenario: (key: string) => void;
}

export const useTresorerieSimStore = create<TresorerieSimState>()(
  persist(
    (set) => ({
      scenarios: {},
      saveScenario: (scenario) => set((state) => ({
        scenarios: { ...state.scenarios, [scenarioKey(scenario.month, scenario.company)]: { ...scenario, updatedAt: new Date().toISOString() } },
      })),
      removeScenario: (key) => set((state) => {
        const scenarios = { ...state.scenarios };
        delete scenarios[key];
        return { scenarios };
      }),
    }),
    {
      name: 'dispatch-tresorerie-simulation',
      storage: createJSONStorage(() => postgresStorage),
    },
  ),
);
