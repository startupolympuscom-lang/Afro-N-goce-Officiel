import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { useCarburantStore } from '../../../../stores/useCarburantStore';
import { useLeasingStore } from '../../../../stores/useLeasingStore';
import { useChargeVariableStore } from '../../../../stores/useChargeVariableStore';
import { useVehiculeStore } from '../../../../stores/useVehiculeStore';
import { scenarioKey, useTresorerieSimStore } from '../../../../stores/useTresorerieSimStore';
import { DISPATCH_COMPANIES, type CompanyId } from '../../../../lib/dispatchCompanies';
import {
  DEFAULT_LEVERS, daysIn, newScenario, normalizeScenario, optimizeSchedule, simulate,
  type SimLevers, type SimResult, type SimScenario,
} from '../../../../lib/tresorerieSim';
import { importFromDispatch } from './importFromDispatch';
import { SolvencyGauge } from './SolvencyGauge';
import { BalanceChart, FlowsChart } from './TreasuryCharts';
import { BankEditor, DepensesEditor, EncaissementsEditor } from './ScenarioEditors';
import { EcheancesCalendar } from './EcheancesCalendar';
import { FormulaPanel } from './FormulaPanel';
import { Meter, NumberInput, SERIES, STATUS, WeekdayPicker, card, fmtMAD, fmtPct, inputClass } from './ui';

type Tab = 'encaissements' | 'banque';

const STATUS_BADGE: Record<SimResult['days'][number]['status'], { label: string; color: string }> = {
  ok: { label: 'Normal', color: STATUS.good },
  sous_seuil: { label: 'Sous le seuil', color: STATUS.warning },
  decouvert: { label: 'À découvert', color: STATUS.warning },
  rupture: { label: 'Paiement impossible', color: STATUS.critical },
};

function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(useTresorerieSimStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useTresorerieSimStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useTresorerieSimStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

function Lever({ label, value, min, max, step, unit, onChange, hint }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void; hint?: string;
}) {
  const shown = unit === '%' && min < 0 && value > 0 ? `+${value}` : String(value);
  return (
    <label className="block" title={hint}>
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900 tabular-nums">{shown} {unit}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full accent-blue-600" />
    </label>
  );
}

function Tile({ label, amount, sub, tone }: { label: string; amount: number; sub?: string; tone?: 'critical' | 'warning' }) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 whitespace-nowrap text-xl font-bold text-slate-900">
        {Math.round(amount).toLocaleString('fr-FR')}<span className="ml-1 text-xs font-medium text-slate-500">MAD</span>
      </p>
      {sub && (
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
          {tone && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS[tone] }} />}
          {sub}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ id, title, subtitle, action }: { id: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
      <div>
        <h2 id={id} className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const dateLabel = (month: string, day: number) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function DispatchTresoreriePage() {
  const { sales, drivers, commandes, paySlips } = useDispatchGazStore();
  const { tickets, stationInterne } = useCarburantStore();
  const { contrats } = useLeasingStore();
  const { charges: variableCharges } = useChargeVariableStore();
  const { vehicules } = useVehiculeStore();
  const { saveScenario, removeScenario } = useTresorerieSimStore();
  const hydrated = useStoreHydrated();

  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [company, setCompany] = useState<'all' | CompanyId>('all');
  const key = scenarioKey(month, company);
  const [draft, setDraft] = useState<SimScenario | null>(null);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>('encaissements');
  const [importNotes, setImportNotes] = useState<string[]>([]);
  const [showDays, setShowDays] = useState(false);
  const [showFormulas, setShowFormulas] = useState(true);

  // Load the simulation of the chosen month and company (older simulations are converted)
  useEffect(() => {
    if (!hydrated) return;
    const stored = useTresorerieSimStore.getState().scenarios[key];
    setDraft(stored ? normalizeScenario(stored) : newScenario(month, company));
    setDirty(false);
    setImportNotes([]);
  }, [key, hydrated]);

  // Save the simulation (its own store only) shortly after each change, and when leaving the page
  const pending = useRef<SimScenario | null>(null);
  useEffect(() => {
    if (!draft || !dirty) return;
    pending.current = draft;
    const t = setTimeout(() => { saveScenario(draft); pending.current = null; }, 600);
    return () => clearTimeout(t);
  }, [draft, dirty]);
  useEffect(() => () => { if (pending.current) useTresorerieSimStore.getState().saveScenario(pending.current); }, []);

  const change = (patch: Partial<SimScenario>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  };
  const setLever = (patch: Partial<SimLevers>) => draft && change({ levers: { ...draft.levers, ...patch } });

  const result = useMemo(() => (draft ? simulate(draft) : null), [draft]);
  const best = useMemo(() => (draft ? optimizeSchedule(draft) : null), [draft]);

  const runImport = () => {
    if (!draft) return;
    const { scenario, notes } = importFromDispatch(draft, {
      sales, drivers, commandes: commandes || [], paySlips: paySlips || [], tickets: tickets || [],
      stationSupplies: stationInterne?.historique || [], leasing: contrats || [], variableCharges: variableCharges || [], vehicules: vehicules || [],
    });
    setDraft(normalizeScenario(scenario));
    setDirty(true);
    setImportNotes(notes);
    toast.success('Simulation pré-remplie à partir des données réelles (rien n’a été modifié dans Afro Dispatch).');
  };

  const reset = () => {
    if (!window.confirm('Effacer cette simulation et repartir de zéro ?')) return;
    removeScenario(key);
    setDraft(newScenario(month, company));
    setDirty(false);
    setImportNotes([]);
  };

  const applyBest = () => {
    if (!draft || !best) return;
    const n = daysIn(draft.month);
    const delay = Math.round(draft.levers.supplierDelayDays);
    change({
      depenses: draft.depenses.map((d) => {
        const days = best.days[d.id];
        if (!days) return d;
        // Planned days are stored before the negotiated delay; payments moved to next month keep their day
        const shift = d.category === 'fournisseur_gaz' ? delay : 0;
        return { ...d, days: days.map((day, i) => (day > n ? d.days[i] : Math.max(1, day - shift))), source: 'manuel' };
      }),
    });
    toast.success('Meilleurs jours appliqués aux échéances de la simulation.');
  };

  const addOverdraft = (amount: number) => {
    if (!draft) return;
    change({
      bankProducts: [...draft.bankProducts, {
        id: `dec-${Date.now()}`, type: 'decouvert', label: 'Découvert à négocier (taux à ajuster)', amount, rate: 8, day: 1,
        repayDay: result?.daysInMonth ?? 30, advanceDays: 0, fees: 0, enabled: true, source: 'manuel',
      }],
    });
    setTab('banque');
  };

  if (!draft || !result || !best) {
    return <div className="p-8 text-sm text-slate-500">Chargement de la simulation…</div>;
  }

  const r = result;
  const b = best.result;
  const share = (id: string) => r.outByCategory.find((c) => c.id === id)?.share ?? 0;
  const salaries = r.outByCategory.find((c) => c.id === 'salaires')?.amount ?? 0;
  const monthResult = r.turnover - r.totalExpenses;
  const isEmpty = draft.monthlyTurnover === 0 && draft.depenses.every((d) => d.monthlyAmount === 0);
  const missing = best.recommendations.filter((x) => x.status === 'manque');
  const neededOverdraft = Math.ceil(b.grossNeed / 1000) * 1000;
  const verdict =
    r.level === 'critique' && r.firstRuptureDay
      ? `Avec les jours prévus, la caisse ne peut plus tout payer à partir du ${dateLabel(month, r.firstRuptureDay)} (il manque ${fmtMAD(r.uncoveredNeed)}).`
      : r.daysInOverdraft > 0
        ? `Les paiements passent grâce au découvert : ${r.daysInOverdraft} jour(s) à découvert, jusqu'à ${fmtMAD(r.grossNeed)}.`
        : r.daysBelowReserve > 0
          ? `Tous les paiements passent, mais la caisse descend sous le seuil de sécurité pendant ${r.daysBelowReserve} jour(s).`
          : `Tous les paiements du mois passent sans découvert. Point le plus bas : ${fmtMAD(r.minBalance)} le ${r.minBalanceDay}.`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      {/* Header and scope */}
      <div className={`${card} flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between`}>
        <div>
          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Simulation : aucune donnée réelle n’est modifiée</span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Simulation de trésorerie</h1>
          <p className="mt-1 text-sm text-slate-500">Simulez un mois de travail : chiffre d'affaires, paiement gaz, gasoil, salaires, CNSS, impôts, charges diverses, et trouvez le meilleur jour pour chaque échéance.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-500">
            Mois simulé
            <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className={`${inputClass} mt-1 w-40`} />
          </label>
          <label className="text-xs font-medium text-slate-500">
            Société
            <select value={company} onChange={(e) => setCompany(e.target.value as 'all' | CompanyId)} className={`${inputClass} mt-1 w-52`}>
              <option value="all">Toutes les sociétés</option>
              {DISPATCH_COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={runImport} className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            Pré-remplir depuis Afro Dispatch
          </button>
          <button type="button" onClick={reset} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Réinitialiser
          </button>
        </div>
      </div>

      {isEmpty && (
        <div className={`${card} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <p className="text-sm text-slate-600">Saisissez le chiffre d'affaires et les dépenses du mois, ou pré-remplissez la simulation avec les ventes, commandes gaz, gasoil, salaires et leasing réels.</p>
          <button type="button" onClick={runImport} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Pré-remplir</button>
        </div>
      )}

      {importNotes.length > 0 && (
        <div className={`${card} p-4`}>
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold text-slate-900">Ce qui a été repris des données réelles</p>
            <button type="button" onClick={() => setImportNotes([])} className="text-sm font-medium text-blue-600 hover:text-blue-700">Masquer</button>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {importNotes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </div>
      )}

      {/* Key figures */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Tile label="Chiffre d'affaires du mois" amount={r.turnover} sub={`${fmtMAD(r.dailySales)} par jour travaillé`} />
        <Tile label="Dépenses du mois" amount={r.totalExpenses} sub={r.turnover > 0 ? `${fmtPct(r.totalExpenses / r.turnover)} du CA` : undefined} />
        <Tile label="Résultat du mois (CA − dépenses)" amount={monthResult} sub={monthResult < 0 ? 'Les dépenses dépassent le CA' : undefined} tone={monthResult < 0 ? 'critical' : undefined} />
        <Tile label="Solde en fin de mois" amount={r.closingBalance} sub={r.deferredToNextMonth > 0 ? `${fmtMAD(r.deferredToNextMonth)} reportés` : undefined} tone={r.closingBalance < 0 ? 'critical' : undefined} />
        <Tile label="Point le plus bas" amount={r.minBalance} sub={`le ${r.minBalanceDay}`} tone={r.minBalance + r.overdraftLimit < 0 ? 'critical' : r.minBalance < draft.minReserve ? 'warning' : undefined} />
        <Tile label="Besoin de financement" amount={r.uncoveredNeed} sub={r.overdraftLimit > 0 ? `découvert de ${fmtMAD(r.overdraftLimit)} compté` : 'aucun découvert saisi'} tone={r.uncoveredNeed > 0 ? 'critical' : undefined} />
      </div>

      {/* Turnover, gauge, levers */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${card} p-5`} aria-labelledby="ca-title">
          <h2 id="ca-title" className="text-sm font-semibold text-slate-900">Chiffre d'affaires et caisse</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Chiffre d'affaires du mois (MAD)</span>
              <NumberInput value={draft.monthlyTurnover} min={0} step={1000} onChange={(monthlyTurnover) => change({ monthlyTurnover })} className="text-base font-semibold" />
              <span className="mt-1 block text-xs text-slate-500">= {fmtMAD(r.dailySales)} par jour travaillé ({r.workDaysCount} jours){draft.levers.salesPct !== 0 ? `, levier ventes inclus` : ''}</span>
            </label>
            <div>
              <span className="mb-1 block text-xs font-medium text-slate-500">Jours travaillés</span>
              <WeekdayPicker label="Jours travaillés" value={draft.workDays} onChange={(workDays) => change({ workDays })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">Solde au 1er (caisse + banque)</span>
                <NumberInput value={draft.openingBalance} step={1000} onChange={(openingBalance) => change({ openingBalance })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">Seuil de sécurité</span>
                <NumberInput value={draft.minReserve} min={0} step={500} onChange={(minReserve) => change({ minReserve })} />
              </label>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={draft.includePriorCredit} onChange={(e) => change({ includePriorCredit: e.target.checked })} className="mt-0.5 h-4 w-4 accent-blue-600" />
              <span className="text-slate-600">Encaisser au début du mois les ventes à crédit du mois précédent</span>
            </label>
          </div>
        </section>

        <section className={`${card} p-5`} aria-labelledby="gauge-title">
          <h2 id="gauge-title" className="text-sm font-semibold text-slate-900">Indice de solvabilité (jours prévus)</h2>
          <div className="mt-3"><SolvencyGauge result={r} /></div>
          <p className="mt-3 text-center text-sm text-slate-600">{verdict}</p>
          {b.score !== r.score && <p className="mt-1 text-center text-sm text-slate-600">Avec les meilleurs jours : <strong className="text-slate-900">{b.score}</strong> sur 100.</p>}
          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            <Meter label="Couverture des paiements" value={r.scoreParts.coverage} display={fmtPct(r.coverage)} hint="(Solde au 1er + encaissements) / paiements du mois" />
            <Meter label="Jours sans rupture" value={r.scoreParts.noRupture} display={`${r.daysInMonth - r.ruptureDays} / ${r.daysInMonth}`} hint="Jours où toutes les échéances peuvent être payées" />
            <Meter label="Coussin de sécurité" value={r.scoreParts.cushion} display={fmtMAD(r.minBalance + r.overdraftLimit)} hint="Disponible au point le plus bas (solde + découvert), comparé au seuil de sécurité" />
            <Meter label="Autonomie bancaire" value={r.scoreParts.bankIndependence} display={`${r.daysInOverdraft} j. à découvert`} hint="Moins de jours à découvert = moins de dépendance à la banque" />
          </div>
        </section>

        <section className={`${card} p-5`} aria-labelledby="levers-title">
          <div className="flex items-center justify-between">
            <h2 id="levers-title" className="text-sm font-semibold text-slate-900">Leviers de simulation</h2>
            <button type="button" onClick={() => change({ levers: { ...DEFAULT_LEVERS } })} className="text-xs font-medium text-blue-600 hover:text-blue-700">Remettre à zéro</button>
          </div>
          <div className="mt-4 space-y-4">
            <Lever label="Chiffre d'affaires" value={draft.levers.salesPct} min={-50} max={50} step={5} unit="%" onChange={(salesPct) => setLever({ salesPct })} />
            <Lever label="Part des ventes payées comptant" value={draft.cashSharePct} min={0} max={100} step={5} unit="%" onChange={(cashSharePct) => change({ cashSharePct })} />
            <Lever label="Délai d'encaissement du crédit client" value={draft.creditDelayDays} min={0} max={90} step={1} unit="j" onChange={(creditDelayDays) => change({ creditDelayDays })} />
            <Lever label="Coût du gasoil" value={draft.levers.gasoilPct} min={-30} max={60} step={5} unit="%" onChange={(gasoilPct) => setLever({ gasoilPct })} />
            <Lever label="Charges diverses" value={draft.levers.variablePct} min={-30} max={60} step={5} unit="%" onChange={(variablePct) => setLever({ variablePct })} />
            <Lever label="Délai négocié avec le fournisseur gaz" value={draft.levers.supplierDelayDays} min={0} max={30} step={1} unit="j" onChange={(supplierDelayDays) => setLever({ supplierDelayDays })} hint="Recule la date limite des paiements gaz" />
          </div>
        </section>
      </div>

      {/* Expenses and due dates: the heart of the simulation */}
      <section className={card} aria-labelledby="depenses-title">
        <SectionTitle
          id="depenses-title"
          title="Dépenses du mois et échéances"
          subtitle="Pour chaque dépense : montant du mois, nombre de paiements et fenêtre autorisée (jusqu'à la date limite). Le meilleur jour de chaque paiement est calculé automatiquement."
        />
        <DepensesEditor scenario={draft} onChange={change} recommendations={best.recommendations} onApplyBest={applyBest} />
      </section>

      <section className={`${card} p-5`} aria-labelledby="calendar-title">
        <h2 id="calendar-title" className="mb-4 text-base font-semibold text-slate-900">Calendrier des échéances du mois</h2>
        <EcheancesCalendar planned={r} best={b} />
      </section>

      <section className={card} aria-labelledby="formulas-title">
        <button type="button" onClick={() => setShowFormulas((v) => !v)} aria-expanded={showFormulas} className="flex w-full items-center justify-between p-5 text-left">
          <span id="formulas-title" className="text-base font-semibold text-slate-900">Comment c'est calculé</span>
          <span className="text-sm font-medium text-blue-600">{showFormulas ? 'Masquer' : 'Afficher'}</span>
        </button>
        {showFormulas && <div className="border-t border-slate-100 p-5"><FormulaPanel scenario={draft} result={r} recommendations={best.recommendations} /></div>}
      </section>

      {/* Alerts */}
      <section className={`${card} p-5`} aria-labelledby="alerts-title">
        <h2 id="alerts-title" className="text-base font-semibold text-slate-900">Alertes</h2>
        <div className="mt-3 space-y-3 text-sm">
          {r.firstRuptureDay === null && r.daysBelowReserve === 0 && !isEmpty && (
            <p className="flex items-start gap-2 text-slate-700"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS.good }} />Aucune difficulté de paiement prévue avec les jours prévus.</p>
          )}
          {r.firstRuptureDay !== null && (
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
              <p className="font-semibold text-red-800">Jours prévus : paiements impossibles à partir du {dateLabel(month, r.firstRuptureDay)}</p>
              <ul className="mt-1.5 space-y-0.5 text-red-900/80">
                {r.days[r.firstRuptureDay - 1].outflows.map((f, i) => <li key={i}>{f.label} : {fmtMAD(f.amount)}</li>)}
              </ul>
              <p className="mt-2 text-red-900/80">
                {b.ruptureDays === 0
                  ? `Avec les meilleurs jours, tous les paiements passent (indice ${b.score} sur 100).`
                  : `Même avec les meilleurs jours, ${b.ruptureDays} jour(s) restent en rupture.`}
              </p>
            </div>
          )}
          {r.firstRuptureDay === null && r.daysBelowReserve > 0 && (
            <p className="flex items-start gap-2 text-slate-700"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS.warning }} />La caisse passe sous le seuil de sécurité ({fmtMAD(draft.minReserve)}) pendant {r.daysBelowReserve} jour(s).</p>
          )}
          {missing.map((x) => (
            <p key={`${x.depenseId}-${x.index}`} className="flex items-start gap-2 text-slate-700">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS.critical }} />
              {x.label}{x.installments > 1 ? ` (${x.index + 1}/${x.installments})` : ''} : aucun jour de sa fenêtre ne suffit, il manque {fmtMAD(x.shortfall)} à la date limite. Négociez un report, un découvert ou un crédit de trésorerie.
            </p>
          ))}
          {r.deferredToNextMonth > 0 && (
            <p className="flex items-start gap-2 text-slate-700"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-400" />Avec le délai négocié, {fmtMAD(r.deferredToNextMonth)} de paiements gaz glissent sur le mois suivant.</p>
          )}
          {b.grossNeed > b.overdraftLimit && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
              <p className="text-slate-700">Même aux meilleurs jours, il faudrait un découvert d'au moins <strong>{fmtMAD(neededOverdraft)}</strong>{b.overdraftLimit > 0 ? ` (${fmtMAD(b.overdraftLimit)} déjà saisis)` : ''} pour tout payer dans les délais.</p>
              <button type="button" onClick={() => addOverdraft(Math.max(1000, neededOverdraft - b.overdraftLimit))} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Simuler ce découvert
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Charts */}
      <section className={`${card} p-5`} aria-labelledby="curve-title">
        <h2 id="curve-title" className="text-sm font-semibold text-slate-900">Solde de trésorerie jour par jour (jours prévus)</h2>
        <div className="mt-3"><BalanceChart result={r} minReserve={draft.minReserve} /></div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${card} p-5`} aria-labelledby="flows-title">
          <h2 id="flows-title" className="text-sm font-semibold text-slate-900">Encaissements et paiements par jour</h2>
          <div className="mt-3"><FlowsChart result={r} /></div>
        </section>

        <section className={`${card} p-5`} aria-labelledby="split-title">
          <h2 id="split-title" className="text-sm font-semibold text-slate-900">Où part l'argent</h2>
          {r.outByCategory.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">Aucun paiement saisi.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {r.outByCategory.map((c) => (
                <li key={c.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-slate-700">{c.label}</span>
                    <span className="tabular-nums text-slate-900"><span className="font-semibold">{fmtPct(c.share)}</span><span className="ml-2 text-slate-500">{fmtMAD(c.amount)}</span></span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${(c.amount / r.outByCategory[0].amount) * 100}%`, backgroundColor: SERIES.out }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
            <dt className="text-slate-500">Couverture des paiements</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{fmtPct(r.coverage)}</dd>
            <dt className="text-slate-500">Gasoil / paiements</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{fmtPct(share('gasoil'), 1)}</dd>
            <dt className="text-slate-500">Paiement gaz / paiements</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{fmtPct(share('fournisseur_gaz'), 1)}</dd>
            <dt className="text-slate-500">Salaires / chiffre d'affaires</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{r.turnover > 0 ? fmtPct(salaries / r.turnover, 1) : '-'}</dd>
            <dt className="text-slate-500">Coût bancaire estimé</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{fmtMAD(r.bankCost)}</dd>
            <dt className="text-slate-500">Jours à découvert</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{r.daysInOverdraft} / {r.daysInMonth}</dd>
          </dl>
        </section>
      </div>

      {/* Other receipts and bank products */}
      <section className={card} aria-label="Autres données de la simulation">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3" role="tablist">
          {([['encaissements', 'Autres encaissements', draft.encaissements.length], ['banque', 'Produits bancaires', draft.bankProducts.length]] as const).map(([id, label, count]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors ${tab === id ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              {label}<span className="ml-1.5 text-xs text-slate-400">{count}</span>
            </button>
          ))}
        </div>
        {tab === 'encaissements' && <EncaissementsEditor scenario={draft} onChange={change} />}
        {tab === 'banque' && <BankEditor scenario={draft} onChange={change} />}
      </section>

      {/* Day-by-day table */}
      <section className={card}>
        <button type="button" onClick={() => setShowDays((v) => !v)} aria-expanded={showDays} className="flex w-full items-center justify-between p-5 text-left">
          <span className="text-sm font-semibold text-slate-900">Détail jour par jour (jours prévus)</span>
          <span className="text-sm font-medium text-blue-600">{showDays ? 'Masquer' : 'Afficher'}</span>
        </button>
        {showDays && (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50/60 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Jour</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Encaissements</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Paiements</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Solde</th>
                  <th className="px-4 py-2.5 text-left font-semibold">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.days.map((d) => (
                  <tr key={d.day} className={d.status === 'rupture' ? 'bg-red-50/40' : ''}>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-700">{d.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-900">{d.totalIn ? fmtMAD(d.totalIn) : '-'}</td>
                    <td className="px-4 py-2">
                      <span className="tabular-nums text-slate-900">{d.totalOut ? fmtMAD(d.totalOut) : '-'}</span>
                      {d.outflows.length > 0 && <span className="ml-2 text-xs text-slate-500">{d.outflows.map((f) => f.label).join(', ')}</span>}
                    </td>
                    <td className={`px-4 py-2 text-right font-semibold tabular-nums ${d.balance < 0 ? 'text-red-700' : 'text-slate-900'}`}>{fmtMAD(d.balance)}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_BADGE[d.status].color }} />
                        {STATUS_BADGE[d.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
