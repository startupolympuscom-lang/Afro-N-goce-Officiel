// Indicative photovoltaic sizing for the public estimator. Average-day model: good enough to size a
// project before a site visit, not a substitute for the technical study.

export type SolarSegment = 'habitat' | 'tertiaire' | 'agriculture';

interface SegmentProfile {
  /** Share of the consumption that happens while the sun is up. */
  dayShare: number;
  /** Average electricity price, MAD per kWh. */
  price: number;
  defaultKwh: number;
}

export const SEGMENT_PROFILES: Record<SolarSegment, SegmentProfile> = {
  habitat: { dayShare: 0.4, price: 1.2, defaultKwh: 400 },
  tertiaire: { dayShare: 0.65, price: 1.4, defaultKwh: 2500 },
  agriculture: { dayShare: 0.85, price: 1.0, defaultKwh: 3000 },
};

const PANEL_WATTS = 550;
const YIELD_KWH_PER_KWC = 1750; // yearly production of 1 kWc in central Morocco, losses included
const BATTERY_EFFICIENCY = 0.9; // charge/discharge round trip
const BATTERY_DEPTH = 0.9; // usable share of a lithium (LiFePO4) battery
const BATTERY_MODULE_KWH = 5;

export interface SolarEstimate {
  panels: number;
  kwc: number;
  batteryKwh: number;
  /** Share of the consumption supplied by the panels, directly or through the batteries (0–1). */
  coverage: number;
  savingsYear: number;
}

/**
 * Without batteries the panels cover the daytime consumption; with batteries they also charge
 * enough for the evening and the night.
 */
export function estimateSolar(segment: SolarSegment, monthlyKwh: number, withBattery: boolean): SolarEstimate {
  const { dayShare, price } = SEGMENT_PROFILES[segment];
  const daily = (Math.max(monthlyKwh, 0) * 12) / 365;
  const day = daily * dayShare;
  const night = daily - day;

  const dailyNeed = withBattery ? day + night / BATTERY_EFFICIENCY : day;
  const panels = Math.max(1, Math.ceil(((dailyNeed * 365) / YIELD_KWH_PER_KWC) * (1000 / PANEL_WATTS)));
  const covered = withBattery ? daily : day;

  return {
    panels,
    kwc: (panels * PANEL_WATTS) / 1000,
    batteryKwh: withBattery ? Math.ceil(night / BATTERY_DEPTH / BATTERY_MODULE_KWH) * BATTERY_MODULE_KWH : 0,
    coverage: daily > 0 ? covered / daily : 0,
    savingsYear: covered * 365 * price,
  };
}
