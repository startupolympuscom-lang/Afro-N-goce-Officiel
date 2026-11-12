import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { postgresStorage } from '../lib/postgresStorage';
import type { SimScenario } from '../lib/tresorerieSim';

/**
 * Treasury simulations. Kept in their own store (own database key) so that a simulation
 * can never change caisse, stock, sales or any other Afro Dispatch data.
 * Each month and company has a main simulation ('base') and optional named scenarios.
 */
export const BASE_VARIANT = 'base';
export const scenarioKey = (month: string, company: string, variantId: string = BASE_VARIANT) =>
  variantId === BASE_VARIANT ? `${month}|${company}` : `${month}|${company}|${variantId}`;

export interface VariantRef {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

/** The scenarios saved for a month and company, the main one first. */
export function listVariants(scenarios: Record<string, SimScenario>, month: string, company: string): VariantRef[] {
  const prefix = `${month}|${company}|`;
  const others = Object.entries(scenarios)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, s]) => ({ id: s.variantId ?? key.slice(prefix.length), name: s.name || 'Scénario', key, createdAt: s.createdAt ?? '' }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const baseKey = scenarioKey(month, company);
  return [{ id: BASE_VARIANT, name: scenarios[baseKey]?.name || 'Situation actuelle', key: baseKey, createdAt: '' }, ...others];
}

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
        scenarios: {
          ...state.scenarios,
          [scenarioKey(scenario.month, scenario.company, scenario.variantId ?? BASE_VARIANT)]: { ...scenario, updatedAt: new Date().toISOString() },
        },
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
