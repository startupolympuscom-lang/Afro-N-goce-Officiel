// Indicative photovoltaic sizing for the public simulator. Average-day model: good enough to size a
// project before a site visit, not a substitute for the technical study.

export type SolarSegment = 'habitat' | 'tertiaire' | 'industrie' | 'agriculture';
export type BatteryMode = 'none' | 'night' | 'day' | 'two-days';

export interface SegmentProfile {
  label: string;
  /** Share of the consumption that happens while the sun is up. */
  dayShare: number;
  /** Average electricity price, MAD per kWh (editable in the simulator). */
  price: number;
  defaultKwh: number;
  maxKwh: number;
  step: number;
}

export const SEGMENT_PROFILES: Record<SolarSegment, SegmentProfile> = {
  habitat: { label: 'Habitat', dayShare: 0.4, price: 1.2, defaultKwh: 400, maxKwh: 3000, step: 10 },
  tertiaire: { label: 'Commerce & tertiaire', dayShare: 0.65, price: 1.4, defaultKwh: 2500, maxKwh: 30000, step: 50 },
  industrie: { label: 'Industrie', dayShare: 0.7, price: 1.1, defaultKwh: 25000, maxKwh: 300000, step: 500 },
  agriculture: { label: 'Agriculture & pompage', dayShare: 0.85, price: 1.0, defaultKwh: 3000, maxKwh: 50000, step: 50 },
};

/** Yearly production of 1 kWc, optimal tilt, system losses included (kWh/kWc/an). */
export const REGIONS = [
  { id: 'meknes-fes', label: 'Meknès – Fès', yield: 1750 },
  { id: 'casa-rabat', label: 'Casablanca – Rabat', yield: 1700 },
  { id: 'tanger', label: 'Tanger – Tétouan', yield: 1650 },
  { id: 'oriental', label: 'Oriental (Oujda, Nador)', yield: 1800 },
  { id: 'marrakech', label: 'Marrakech – Béni Mellal', yield: 1850 },
  { id: 'souss', label: 'Agadir – Souss-Massa', yield: 1850 },
  { id: 'draa', label: 'Drâa-Tafilalet (Ouarzazate, Errachidia)', yield: 1950 },
  { id: 'sud', label: 'Provinces du Sud (Laâyoune, Dakhla)', yield: 1900 },
] as const;

export const PANEL_POWERS = [450, 550, 600] as const;

export const BATTERY_MODES: Record<BatteryMode, { label: string; short: string }> = {
  none: { label: 'Sans batterie', short: 'Sans batterie' },
  night: { label: 'Soir et nuit', short: 'Batteries (soir et nuit)' },
  day: { label: '1 jour d\'autonomie', short: 'Batteries (1 jour)' },
  'two-days': { label: '2 jours (site isolé)', short: 'Batteries (2 jours)' },
};

const BATTERY_EFFICIENCY = 0.9; // charge/discharge round trip
const BATTERY_DEPTH = 0.9; // usable share of a lithium (LiFePO4) battery
const BATTERY_MODULE_KWH = 5;
const PANEL_EFFICIENCY = 0.21; // modern monocrystalline module, W per m² / 1000
const LAYOUT_FACTOR = 1.15; // spacing and walkways around the modules
const AUTONOMY_MARGIN = 1.2; // extra panels so a site running on its batteries copes with cloudy days
const DC_AC_RATIO = 1.15;
const GRID_CO2_KG_PER_KWH = 0.7; // Moroccan grid, mostly thermal
const INVERTER_SIZES = [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 36, 40, 50, 60, 75, 100];

export interface SolarInputs {
  segment: SolarSegment;
  monthlyKwh: number;
  /** kWh produced per kWc per year at the site. */
  regionYield: number;
  batteryMode: BatteryMode;
  panelWatts: number;
}

export interface SolarResult {
  panels: number;
  kwc: number;
  productionYear: number;
  /** Share of the consumption supplied by the panels, directly or through the batteries (0–1). */
  coverage: number;
  directShare: number;
  batteryShare: number;
  /** Production neither used nor stored, kWh per year (injected into the grid or lost). */
  surplusYear: number;
  batteryKwh: number;
  batteryModules: number;
  inverterKw: number;
  inverterType: string;
  surfaceM2: number;
  savingsYear: number;
  co2Tonnes: number;
}

function demand({ segment, monthlyKwh }: Pick<SolarInputs, 'segment' | 'monthlyKwh'>) {
  const daily = (Math.max(monthlyKwh, 0) * 12) / 365;
  const day = daily * SEGMENT_PROFILES[segment].dayShare;
  return { daily, day, night: daily - day };
}

function batteryCapacity(mode: BatteryMode, daily: number, night: number) {
  if (mode === 'none') return 0;
  const stored = mode === 'night' ? night : mode === 'day' ? daily : daily * 2;
  return Math.ceil(stored / BATTERY_DEPTH / BATTERY_MODULE_KWH) * BATTERY_MODULE_KWH;
}

function inverterSize(kwc: number) {
  const target = kwc / DC_AC_RATIO;
  return INVERTER_SIZES.find((size) => size >= target) ?? Math.ceil(target / 25) * 25;
}

/** Panels needed to supply the consumption: daytime use without batteries, the whole day with them. */
export function recommendPanels(inputs: SolarInputs) {
  const { day, night } = demand(inputs);
  let dailyNeed = inputs.batteryMode === 'none' ? day : day + night / BATTERY_EFFICIENCY;
  if (inputs.batteryMode === 'day' || inputs.batteryMode === 'two-days') dailyNeed *= AUTONOMY_MARGIN;
  const kwc = (dailyNeed * 365) / inputs.regionYield;
  return Math.max(1, Math.ceil((kwc * 1000) / inputs.panelWatts));
}

export function simulateSolar(inputs: SolarInputs, panels: number, pricePerKwh: number): SolarResult {
  const { daily, day, night } = demand(inputs);
  const kwc = (panels * inputs.panelWatts) / 1000;
  const productionYear = kwc * inputs.regionYield;
  const productionDay = productionYear / 365;

  const batteryKwh = batteryCapacity(inputs.batteryMode, daily, night);
  const direct = Math.min(productionDay, day);
  const surplus = productionDay - direct;
  const stored = Math.min(surplus * BATTERY_EFFICIENCY, night, batteryKwh * BATTERY_DEPTH);
  const covered = direct + stored;
  const coveredYear = covered * 365;

  return {
    panels,
    kwc,
    productionYear,
    coverage: daily > 0 ? Math.min(covered / daily, 1) : 0,
    directShare: daily > 0 ? direct / daily : 0,
    batteryShare: daily > 0 ? stored / daily : 0,
    surplusYear: Math.max(surplus - stored / BATTERY_EFFICIENCY, 0) * 365,
    batteryKwh,
    batteryModules: batteryKwh / BATTERY_MODULE_KWH,
    inverterKw: inverterSize(kwc),
    inverterType: inputs.batteryMode === 'none' ? 'Onduleur réseau' : inputs.batteryMode === 'night' ? 'Onduleur hybride' : 'Onduleur hybride autonome',
    surfaceM2: Math.ceil(((panels * inputs.panelWatts) / (PANEL_EFFICIENCY * 1000)) * LAYOUT_FACTOR),
    savingsYear: coveredYear * pricePerKwh,
    co2Tonnes: (coveredYear * GRID_CO2_KG_PER_KWH) / 1000,
  };
}
