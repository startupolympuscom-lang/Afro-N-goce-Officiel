import React, { useId, useMemo, useState } from 'react';
import { BatteryCharging, Factory, FileText, House, Info, Leaf, Minus, Plus, RotateCcw, Store, Tractor, PlugZap, type LucideIcon } from 'lucide-react';
import { container, Reveal, SectionHeading } from './shared';
import { SEGMENT_SECTOR } from './solarContent';
import {
  BATTERY_MODES,
  PANEL_POWERS,
  REGIONS,
  SEGMENT_PROFILES,
  recommendPanels,
  simulateSolar,
  type BatteryMode,
  type SolarSegment,
} from '../../lib/solarSimulation';

export interface SummaryLine {
  label: string;
  value: string;
}

const SEGMENT_ICONS: Record<SolarSegment, LucideIcon> = { habitat: House, tertiaire: Store, industrie: Factory, agriculture: Tractor };
const MAX_PANELS = 5000;

const nf = (value: number, digits = 0) => value.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const kwcLabel = (kwc: number) => `${nf(kwc, kwc < 10 ? 2 : 1)} kWc`;

const fieldLabel = 'flex items-center gap-2.5 font-display text-[15px] font-bold text-afro-ink';
const stepBadge = 'flex h-6 w-6 items-center justify-center rounded-full bg-afro-blue text-xs font-bold text-white';
const optionBase = 'relative flex cursor-pointer rounded-xl border bg-white transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-afro-blue/40';
const optionState = (checked: boolean) => (checked ? 'border-afro-blue bg-afro-blue-50/60 shadow-[0_6px_20px_rgb(14,108,208,0.12)]' : 'border-slate-200 hover:border-afro-blue/40');
const segmentedBtn = (active: boolean) =>
  `flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active ? 'bg-white text-afro-blue shadow-sm' : 'text-slate-500 hover:text-afro-ink'}`;

export function SolarSimulator({ onRequestQuote }: { onRequestQuote: (sector: string, summary: SummaryLine[]) => void }) {
  const uid = useId();
  const [segment, setSegment] = useState<SolarSegment>('habitat');
  const [unit, setUnit] = useState<'kwh' | 'mad'>('kwh');
  const [amount, setAmount] = useState(SEGMENT_PROFILES.habitat.defaultKwh);
  const [regionId, setRegionId] = useState<string>(REGIONS[0].id);
  const [batteryMode, setBatteryMode] = useState<BatteryMode>('none');
  const [panelWatts, setPanelWatts] = useState<number>(550);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [panelsOverride, setPanelsOverride] = useState<number | null>(null);

  const profile = SEGMENT_PROFILES[segment];
  const price = customPrice && customPrice > 0 ? customPrice : profile.price;
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  const monthlyKwh = Math.max(unit === 'kwh' ? amount : amount / price, 0);

  const inputs = useMemo(
    () => ({ segment, monthlyKwh, regionYield: region.yield, batteryMode, panelWatts }),
    [segment, monthlyKwh, region.yield, batteryMode, panelWatts],
  );
  const recommended = useMemo(() => recommendPanels(inputs), [inputs]);
  const panels = panelsOverride ?? recommended;
  const result = useMemo(() => simulateSolar(inputs, panels, price), [inputs, panels, price]);
  const isCustom = panelsOverride !== null && panelsOverride !== recommended;

  const sliderMax = unit === 'kwh' ? profile.maxKwh : Math.round(profile.maxKwh * price);
  const sliderStep = unit === 'kwh' ? profile.step : Math.max(10, Math.round(profile.step * price));

  const chooseSegment = (next: SolarSegment) => {
    setSegment(next);
    setCustomPrice(null);
    setPanelsOverride(null);
    const kwh = SEGMENT_PROFILES[next].defaultKwh;
    setAmount(unit === 'kwh' ? kwh : Math.round(kwh * SEGMENT_PROFILES[next].price));
  };

  const chooseUnit = (next: 'kwh' | 'mad') => {
    if (next === unit) return;
    setAmount(Math.round(next === 'mad' ? amount * price : amount / price));
    setUnit(next);
  };

  const setPanelCount = (value: number) => {
    if (!Number.isFinite(value)) return;
    setPanelsOverride(Math.min(Math.max(Math.round(value), 1), MAX_PANELS));
  };

  const coveragePct = Math.round(result.coverage * 100);
  const directPct = Math.round(result.directShare * 100);
  const batteryPct = Math.max(coveragePct - directPct, 0);
  const surplusShare = result.productionYear > 0 ? result.surplusYear / result.productionYear : 0;

  const notice =
    surplusShare > 0.15
      ? batteryMode === 'none'
        ? `Environ ${nf(result.surplusYear)} kWh/an ne seront pas consommés au moment de la production : ajoutez des batteries pour les utiliser le soir, ou réduisez le nombre de panneaux.`
        : `Environ ${nf(result.surplusYear)} kWh/an de production excédentaire : vous pouvez réduire le nombre de panneaux.`
      : isCustom && panels < recommended
        ? `Avec ${panels} panneau${panels > 1 ? 'x' : ''}, l'installation couvre ${coveragePct} % de votre consommation. ${recommended} panneaux sont recommandés.`
        : batteryMode === 'none' && coveragePct < 90
          ? `Sans batterie, les panneaux alimentent vos équipements en journée. Pour couvrir aussi le soir et la nuit, choisissez l'option avec batteries.`
          : null;

  const requestQuote = () => {
    const summary: SummaryLine[] = [
      { label: 'Type de site', value: profile.label },
      { label: 'Consommation', value: `${nf(monthlyKwh)} kWh/mois (≈ ${nf(monthlyKwh * price)} MAD/mois)` },
      { label: 'Région', value: region.label },
      { label: 'Stockage', value: BATTERY_MODES[batteryMode].short },
      { label: 'Panneaux recommandés', value: `${recommended} × ${panelWatts} Wc` },
      ...(isCustom ? [{ label: 'Configuration souhaitée', value: `${panels} panneaux (${kwcLabel(result.kwc)})` }] : [{ label: 'Puissance', value: kwcLabel(result.kwc) }]),
      { label: 'Production estimée', value: `${nf(result.productionYear)} kWh/an` },
      { label: 'Couverture estimée', value: `${coveragePct} %` },
      ...(result.batteryKwh > 0 ? [{ label: 'Batteries', value: `${nf(result.batteryKwh)} kWh` }] : []),
      { label: 'Onduleur', value: `${result.inverterType.replace('Onduleur ', '')}, ≈ ${nf(result.inverterKw)} kW` },
    ];
    onRequestQuote(SEGMENT_SECTOR[segment], summary);
  };

  const metrics = [
    { label: 'Puissance installée', value: kwcLabel(result.kwc) },
    { label: 'Production estimée', value: `${nf(result.productionYear)} kWh/an` },
    { label: 'Économies estimées', value: `${nf(result.savingsYear)} MAD/an` },
    { label: 'Batteries', value: result.batteryKwh > 0 ? `${nf(result.batteryKwh)} kWh` : 'Aucune' },
    { label: result.inverterType, value: `≈ ${nf(result.inverterKw)} kW` },
    { label: 'Surface nécessaire', value: `≈ ${nf(result.surfaceM2)} m²` },
  ];

  return (
    <section id="simulateur-solaire" aria-labelledby="simulateur-title" className="bg-white py-20 lg:py-28">
      <div className={container}>
        <SectionHeading
          id="simulateur-title"
          eyebrow="Simulateur solaire"
          title="Combien de panneaux"
          highlight="pour votre consommation ?"
          lead="Indiquez votre consommation d'électricité : le simulateur calcule le nombre de panneaux, la puissance à installer et, si besoin, la capacité des batteries."
        />

        <Reveal className="mt-14 grid items-start gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-9 rounded-[1.75rem] bg-white p-6 shadow-[0_20px_60px_rgb(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:p-8 lg:p-10"
          >
            {/* 1. Site */}
            <fieldset>
              <legend className={fieldLabel}><span className={stepBadge}>1</span> Type de site</legend>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {(Object.keys(SEGMENT_PROFILES) as SolarSegment[]).map((key) => {
                  const Icon = SEGMENT_ICONS[key];
                  const checked = segment === key;
                  return (
                    <label key={key} className={`${optionBase} ${optionState(checked)} flex-col items-start gap-3 p-4`}>
                      <input type="radio" name={`${uid}-segment`} value={key} checked={checked} onChange={() => chooseSegment(key)} className="sr-only" />
                      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${checked ? 'bg-afro-blue text-white' : 'bg-afro-blue-50 text-afro-blue'}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold leading-snug text-afro-ink">{SEGMENT_PROFILES[key].label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* 2. Consumption */}
            <fieldset>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <legend className={fieldLabel}><span className={stepBadge}>2</span> Votre consommation</legend>
                <div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Unité de consommation">
                  <button type="button" aria-pressed={unit === 'kwh'} onClick={() => chooseUnit('kwh')} className={segmentedBtn(unit === 'kwh')}>kWh / mois</button>
                  <button type="button" aria-pressed={unit === 'mad'} onClick={() => chooseUnit('mad')} className={segmentedBtn(unit === 'mad')}>Facture (MAD)</button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <label htmlFor={`${uid}-amount`} className="sr-only">
                  {unit === 'kwh' ? 'Consommation mensuelle en kWh' : 'Montant mensuel de la facture en MAD'}
                </label>
                <div className="relative flex-1">
                  <input
                    id={`${uid}-amount`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={sliderStep}
                    value={Number.isFinite(amount) ? amount : ''}
                    onChange={(e) => setAmount(Math.max(Number(e.target.value), 0))}
                    className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-28 font-display text-2xl font-bold text-afro-ink tabular-nums outline-none transition focus:border-afro-blue focus:ring-4 focus:ring-afro-blue/10"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                    {unit === 'kwh' ? 'kWh / mois' : 'MAD / mois'}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={unit === 'kwh' ? profile.step : sliderStep}
                max={sliderMax}
                step={sliderStep}
                value={Math.min(amount, sliderMax)}
                onChange={(e) => setAmount(Number(e.target.value))}
                aria-label="Ajuster la consommation"
                className="mt-4 w-full accent-[#0E6CD0]"
              />
              <p className="mt-2 text-sm text-slate-500">
                {unit === 'kwh'
                  ? `Relevez la consommation indiquée sur votre facture d'électricité (soit ≈ ${nf(monthlyKwh * price)} MAD/mois).`
                  : `Montant mensuel moyen de votre facture, soit ≈ ${nf(monthlyKwh)} kWh/mois à ${nf(price, 2)} MAD/kWh.`}
              </p>
            </fieldset>

            {/* 3. Region */}
            <div>
              <label htmlFor={`${uid}-region`} className={fieldLabel}><span className={stepBadge}>3</span> Région du site</label>
              <select
                id={`${uid}-region`}
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="mt-4 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium text-afro-ink outline-none transition focus:border-afro-blue focus:ring-4 focus:ring-afro-blue/10"
              >
                {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>

            {/* 4. Storage */}
            <fieldset>
              <legend className={fieldLabel}><span className={stepBadge}>4</span> Besoin de batteries ?</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {([
                  { key: false, title: 'Sans batterie', desc: 'Autoconsommation en journée, raccordé au réseau.', icon: PlugZap },
                  { key: true, title: 'Avec batteries', desc: 'Électricité le soir et la nuit, ou site isolé.', icon: BatteryCharging },
                ] as const).map(({ key, title, desc, icon: Icon }) => {
                  const checked = (batteryMode !== 'none') === key;
                  return (
                    <label key={title} className={`${optionBase} ${optionState(checked)} items-start gap-3.5 p-4`}>
                      <input
                        type="radio"
                        name={`${uid}-battery`}
                        checked={checked}
                        onChange={() => { setBatteryMode(key ? 'night' : 'none'); setPanelsOverride(null); }}
                        className="sr-only"
                      />
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${checked ? 'bg-afro-blue text-white' : 'bg-afro-blue-50 text-afro-blue'}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-afro-ink">{title}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-slate-500">{desc}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {batteryMode !== 'none' && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-afro-ink" id={`${uid}-autonomy`}>Autonomie souhaitée</p>
                  <div className="mt-3 flex rounded-xl bg-slate-200/60 p-1" role="group" aria-labelledby={`${uid}-autonomy`}>
                    {(['night', 'day', 'two-days'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={batteryMode === mode}
                        onClick={() => { setBatteryMode(mode); setPanelsOverride(null); }}
                        className={segmentedBtn(batteryMode === mode)}
                      >
                        {BATTERY_MODES[mode].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>

            {/* 5. Panels */}
            <fieldset>
              <legend className={fieldLabel}><span className={stepBadge}>5</span> Nombre de panneaux</legend>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setPanelCount(panels - 1)}
                    disabled={panels <= 1}
                    aria-label="Retirer un panneau"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-afro-ink transition-colors hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <label htmlFor={`${uid}-panels`} className="sr-only">Nombre de panneaux</label>
                  <input
                    id={`${uid}-panels`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_PANELS}
                    value={panels}
                    onChange={(e) => setPanelCount(Number(e.target.value))}
                    className="h-11 w-20 bg-transparent text-center font-display text-xl font-bold text-afro-ink tabular-nums outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPanelCount(panels + 1)}
                    disabled={panels >= MAX_PANELS}
                    aria-label="Ajouter un panneau"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-afro-ink transition-colors hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="text-sm">
                  <p className="text-slate-600">
                    Recommandé : <span className="font-semibold text-afro-ink">{recommended} panneau{recommended > 1 ? 'x' : ''}</span> de {panelWatts} Wc
                  </p>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => setPanelsOverride(null)}
                      className="mt-1 inline-flex items-center gap-1.5 font-semibold text-afro-blue hover:text-afro-blue-dark"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Revenir à la recommandation
                    </button>
                  )}
                </div>
              </div>
            </fieldset>

            <details className="group rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
                Hypothèses de calcul
                <Plus className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-45" aria-hidden="true" />
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${uid}-watts`} className="text-sm font-medium text-slate-600">Puissance d'un panneau</label>
                  <select
                    id={`${uid}-watts`}
                    value={panelWatts}
                    onChange={(e) => { setPanelWatts(Number(e.target.value)); setPanelsOverride(null); }}
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-afro-ink outline-none focus:border-afro-blue"
                  >
                    {PANEL_POWERS.map((w) => <option key={w} value={w}>{w} Wc</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${uid}-price`} className="text-sm font-medium text-slate-600">Prix moyen du kWh (MAD)</label>
                  <input
                    id={`${uid}-price`}
                    type="number"
                    min={0.1}
                    step={0.05}
                    value={customPrice ?? profile.price}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-afro-ink outline-none focus:border-afro-blue"
                  />
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Production de {nf(region.yield)} kWh par kWc et par an pour cette région. Part de la consommation en journée : {Math.round(profile.dayShare * 100)} % pour ce type de site.
                Batteries lithium (90 % de capacité utile). Hors subventions et hors injection du surplus sur le réseau.
              </p>
            </details>

            {/* Phones: the results sit below the form, keep the answer in sight while filling it in */}
            <a
              href="#resultats-simulation"
              className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-afro-navy px-4 py-3 text-white shadow-[0_16px_40px_rgb(11,31,58,0.35)] lg:hidden"
            >
              <span className="text-sm">
                <span className="font-display text-lg font-bold">{recommended}</span> panneau{recommended > 1 ? 'x' : ''} · {coveragePct} % couverts
              </span>
              <span className="text-sm font-semibold text-afro-green">Voir les résultats</span>
            </a>
          </form>

          {/* Results */}
          <aside id="resultats-simulation" aria-labelledby={`${uid}-results`} className="relative scroll-mt-24 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-afro-navy via-[#0F2C52] to-[#0B3E78] p-6 text-white shadow-[0_30px_70px_rgb(11,31,58,0.35)] sm:p-8 lg:sticky lg:top-28 lg:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#2E8BEA]/25 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-afro-green/15 blur-3xl" aria-hidden="true" />

            <div className="relative">
              <p className="sr-only" aria-live="polite">
                {recommended} panneaux recommandés, {coveragePct} % de la consommation couverte avec {panels} panneaux.
              </p>
              <h3 id={`${uid}-results`} className="text-sm font-medium text-white/70">Panneaux nécessaires</h3>
              <p className="mt-2 flex items-baseline gap-3">
                <span className="font-display text-6xl font-extrabold tracking-tight tabular-nums">{recommended}</span>
                <span className="text-base text-white/75">panneau{recommended > 1 ? 'x' : ''} de {panelWatts} Wc</span>
              </p>
              {isCustom && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-afro-green" aria-hidden="true" />
                  Résultats pour votre choix : {panels} panneau{panels > 1 ? 'x' : ''}
                </p>
              )}

              <div className="mt-8">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-white/70">Consommation couverte</span>
                  <span className="font-display text-2xl font-bold tabular-nums">{coveragePct} %</span>
                </div>
                <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <div className="bg-afro-green transition-all duration-500" style={{ width: `${directPct}%` }} />
                  <div className="bg-[#5BA4F0] transition-all duration-500" style={{ width: `${batteryPct}%` }} />
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/70">
                  <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-afro-green" aria-hidden="true" /> Solaire direct {directPct} %</li>
                  {batteryMode !== 'none' && (
                    <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#5BA4F0]" aria-hidden="true" /> Batteries {batteryPct} %</li>
                  )}
                  <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/25" aria-hidden="true" /> Réseau {100 - coveragePct} %</li>
                </ul>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
                {metrics.map(({ label, value }) => (
                  <div key={label} className="bg-[#0E2A4D]/90 p-4">
                    <dt className="text-xs text-white/60">{label}</dt>
                    <dd className="mt-1 font-display text-[17px] font-bold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 flex items-center gap-2 text-sm text-white/75">
                <Leaf className="h-4 w-4 text-afro-green" aria-hidden="true" />
                ≈ {nf(result.co2Tonnes, result.co2Tonnes < 10 ? 1 : 0)} t de CO₂ évitées par an
              </p>

              {notice && (
                <p className="mt-5 flex gap-2.5 rounded-xl bg-white/10 p-3.5 text-sm leading-relaxed text-white/85">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#FFD27A]" aria-hidden="true" />
                  {notice}
                </p>
              )}

              <button
                type="button"
                onClick={requestQuote}
                className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-afro-navy shadow-lg transition-all hover:-translate-y-0.5 hover:bg-afro-blue-50"
              >
                <FileText className="h-4 w-4" aria-hidden="true" /> Recevoir un devis pour cette configuration
              </button>
              <p className="mt-4 text-xs leading-relaxed text-white/55">
                Estimation indicative. Le dimensionnement définitif est établi après étude de votre site par nos techniciens.
              </p>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
