import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AlertTriangle, OctagonAlert, ShieldCheck } from 'lucide-react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { useCarburantStore } from '../../../../stores/useCarburantStore';
import { useLeasingStore } from '../../../../stores/useLeasingStore';
import { useChargeVariableStore } from '../../../../stores/useChargeVariableStore';
import { useVehiculeStore } from '../../../../stores/useVehiculeStore';
import { scenarioKey, useTresorerieSimStore } from '../../../../stores/useTresorerieSimStore';
import { DISPATCH_COMPANIES, type CompanyId } from '../../../../lib/dispatchCompanies';
import {
  DEFAULT_LEVERS, estimatePriorCredit, findTargets, isPositiveAndHealthy, makeBaseline, newScenario, normalizeDepense, normalizeScenario, optimizeSchedule, daysIn,
  type Baseline, type SimLevers, type SimResult, type SimScenario,
} from '../../../../lib/tresorerieSim';
import { importFromDispatch } from './importFromDispatch';
import { SolvencyGauge } from './SolvencyGauge';
import { BalanceChart } from './TreasuryCharts';
import { BankEditor, DepensesTable, EncaissementsEditor, dayName } from './ScenarioEditors';
import { PaymentPlan } from './PaymentPlan';
import { FormulaPanel } from './FormulaPanel';
import { CashStatement } from './CashStatement';
import { Meter, NumberInput, SERIES, STATUS, WeekdayPicker, card, fmtMAD, fmtPct, inputClass } from './ui';

type Persisted = { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } };
function useHydrated(store: Persisted) {
  const [hydrated, setHydrated] = useState(store.persist.hasHydrated());
  useEffect(() => {
    const unsub = store.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(store.persist.hasHydrated());
    return unsub;
  }, [store]);
  return hydrated;
}

function Lever({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900 tabular-nums">{unit === '%' && value > 0 ? `+${value}` : value} {unit}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full accent-blue-600" />
    </label>
  );
}

/** Collapsible section for everything that is not needed every day. */
function Fold({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={card}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span>
          <span className="block text-sm font-semibold text-slate-900">{title}</span>
          {hint && <span className="block text-xs text-slate-500">{hint}</span>}
        </span>
        <span className="shrink-0 text-sm font-medium text-blue-600">{open ? 'Masquer' : 'Afficher'}</span>
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </section>
  );
}

function Field({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-slate-400">{help}</span>}
    </label>
  );
}

function Figure({ label, amount, tone, before, hint }: { label: string; amount: number; tone?: 'critical' | 'warning'; before?: number; hint?: string }) {
  const delta = before === undefined ? 0 : Math.round(amount - before);
  return (
    <div title={hint}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-lg font-bold text-slate-900">
        {tone && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS[tone] }} />}
        {amount > 0 && label.startsWith('Flux') ? '+' : ''}{Math.round(amount).toLocaleString('fr-FR')}<span className="text-xs font-medium text-slate-500">MAD</span>
      </p>
      {before !== undefined && (
        <p className="text-xs text-slate-500">
          départ : {Math.round(before).toLocaleString('fr-FR')}
          {delta !== 0 && <span className="ml-1 font-medium" style={{ color: delta > 0 ? '#006300' : STATUS.critical }}>{delta > 0 ? '▲ +' : '▼ '}{delta.toLocaleString('fr-FR')}</span>}
        </p>
      )}
    </div>
  );
}

const leverText = (l: SimLevers) => [
  l.salesPct ? `CA ${l.salesPct > 0 ? '+' : ''}${l.salesPct} %` : '',
  l.gasoilPct ? `gasoil ${l.gasoilPct > 0 ? '+' : ''}${l.gasoilPct} %` : '',
  l.variablePct ? `charges diverses ${l.variablePct > 0 ? '+' : ''}${l.variablePct} %` : '',
  l.supplierDelayDays ? `délai gaz +${l.supplierDelayDays} j` : '',
].filter(Boolean).join(', ');

const STATUS_BADGE: Record<SimResult['days'][number]['status'], { label: string; color: string }> = {
  ok: { label: 'Normal', color: STATUS.good },
  sous_seuil: { label: 'Sous le seuil', color: STATUS.warning },
  decouvert: { label: 'À découvert', color: STATUS.warning },
  rupture: { label: 'Paiement impossible', color: STATUS.critical },
};

export default function DispatchTresoreriePage() {
  const { sales, drivers, commandes, paySlips } = useDispatchGazStore();
  const { tickets, stationInterne } = useCarburantStore();
  const { contrats } = useLeasingStore();
  const { charges: variableCharges } = useChargeVariableStore();
  const { vehicules } = useVehiculeStore();
  const { saveScenario, removeScenario } = useTresorerieSimStore();
  const simHydrated = useHydrated(useTresorerieSimStore);
  const dispatchHydrated = useHydrated(useDispatchGazStore);
  const fuelHydrated = useHydrated(useCarburantStore);

  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [company, setCompany] = useState<'all' | CompanyId>('all');
  const key = scenarioKey(month, company);
  const [draft, setDraft] = useState<SimScenario | null>(null);
  const [dirty, setDirty] = useState(false);
  const [importNotes, setImportNotes] = useState<string[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showOtherIn, setShowOtherIn] = useState(false);
  // Undo: previous versions of the simulation (a burst of typing counts as one change)
  const history = useRef<SimScenario[]>([]);
  const lastPush = useRef(0);
  const [undoCount, setUndoCount] = useState(0);

  // Load the simulation of the chosen month and company (older simulations are converted)
  useEffect(() => {
    if (!simHydrated) return;
    const stored = useTresorerieSimStore.getState().scenarios[key];
    setDraft(stored ? normalizeScenario(stored) : newScenario(month, company));
    setDirty(false);
    setImportNotes([]);
    history.current = [];
    setUndoCount(0);
  }, [key, simHydrated]);

  // Save the simulation (its own store only) shortly after each change, and when leaving the page
  const pending = useRef<SimScenario | null>(null);
  useEffect(() => {
    if (!draft || !dirty) return;
    pending.current = draft;
    const t = setTimeout(() => { saveScenario(draft); pending.current = null; }, 600);
    return () => clearTimeout(t);
  }, [draft, dirty]);
  useEffect(() => () => { if (pending.current) useTresorerieSimStore.getState().saveScenario(pending.current); }, []);

  const commit = (next: SimScenario) => {
    if (draft && Date.now() - lastPush.current > 800) {
      history.current = [...history.current.slice(-49), draft];
      setUndoCount(history.current.length);
    }
    lastPush.current = Date.now();
    setDraft(next);
    setDirty(true);
  };
  const change = (patch: Partial<SimScenario>) => draft && commit({ ...draft, ...patch });
  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    setUndoCount(history.current.length);
    lastPush.current = 0;
    setDraft(prev);
    setDirty(true);
  };
  const setLever = (patch: Partial<SimLevers>) => draft && change({ levers: { ...draft.levers, ...patch } });

  const runImport = (auto = false) => {
    if (!draft) return;
    const { scenario, notes } = importFromDispatch(draft, {
      sales, drivers, commandes: commandes || [], paySlips: paySlips || [], tickets: tickets || [],
      stationSupplies: stationInterne?.historique || [], leasing: contrats || [], variableCharges: variableCharges || [], vehicules: vehicules || [],
    });
    const filled = normalizeScenario(scenario);
    filled.baseline = makeBaseline(optimizeSchedule(filled).result);
    commit(filled);
    setImportNotes(notes);
    if (!auto) toast.success('Simulation remplie avec les données réelles (rien n’est modifié dans Afro Dispatch).');
  };

  // A month opened for the first time is filled with the real data of the last 30 days
  const autoFilled = useRef(new Set<string>());
  useEffect(() => {
    if (!draft || !simHydrated || !dispatchHydrated || !fuelHydrated) return;
    if (useTresorerieSimStore.getState().scenarios[key] || autoFilled.current.has(key)) return;
    if (sales.length === 0 && (commandes || []).length === 0) return;
    autoFilled.current.add(key);
    runImport(true);
  }, [draft, simHydrated, dispatchHydrated, fuelHydrated, key]);

  const best = useMemo(() => (draft ? optimizeSchedule(draft) : null), [draft]);
  // The levers that would make the month positive are searched on a slightly delayed copy, so typing stays fluid
  const deferredDraft = useDeferredValue(draft);
  const targets = useMemo(() => (deferredDraft ? findTargets(deferredDraft) : null), [deferredDraft]);

  const reset = () => {
    if (!window.confirm('Effacer cette simulation et repartir de zéro ?')) return;
    removeScenario(key);
    autoFilled.current.add(key);
    setDraft(newScenario(month, company));
    setDirty(false);
    setImportNotes([]);
    history.current = [];
    setUndoCount(0);
  };

  const rememberStart = () => {
    if (!draft || !best) return;
    change({ baseline: makeBaseline(best.result) });
    toast.success('Situation actuelle mémorisée comme point de départ.');
  };

  const applyCut = (share: number) => {
    if (!draft) return;
    const n = daysIn(draft.month);
    commit({ ...draft, depenses: draft.depenses.map((d) => normalizeDepense({ ...d, monthlyAmount: Math.round(d.monthlyAmount * (1 - share)), source: 'manuel' }, n)) });
  };

  const addOverdraft = (amount: number) => {
    if (!draft) return;
    change({
      bankProducts: [...draft.bankProducts, {
        id: `dec-${Date.now()}`, type: 'decouvert', label: 'Découvert à négocier (taux à ajuster)', amount, rate: 8, day: 1,
        repayDay: best?.result.daysInMonth ?? 30, advanceDays: 0, fees: 0, enabled: true, source: 'manuel',
      }],
    });
    toast.success(`Découvert de ${fmtMAD(amount)} ajouté à la simulation (section Banque).`);
  };

  if (!draft || !best) return <div className="p-8 text-sm text-slate-500">Chargement de la simulation…</div>;

  const r = best.result;
  const b: Baseline | undefined = draft.baseline;
  const monthResult = r.turnover - r.totalExpenses;
  const isEmpty = draft.monthlyTurnover === 0 && draft.depenses.every((d) => d.monthlyAmount === 0);
  const goal = isPositiveAndHealthy(r);
  const critical = r.ruptureDays > 0;
  const neededOverdraft = Math.ceil(Math.max(0, r.grossNeed - r.overdraftLimit) / 1000) * 1000;
  const Icon = goal ? ShieldCheck : critical ? OctagonAlert : AlertTriangle;
  const tone = goal ? STATUS.good : critical ? STATUS.critical : STATUS.warning;
  const activeLevers = leverText(draft.levers);
  const headline = isEmpty
    ? 'Saisissez ce qui rentre et ce qui sort ce mois-ci'
    : critical ? `Il manque ${fmtMAD(r.uncoveredNeed)} pour tout payer`
      : r.cashFlow < 0 ? `La trésorerie baisse de ${fmtMAD(-r.cashFlow)} ce mois-ci`
        : !goal ? `Trésorerie positive (+${fmtMAD(r.cashFlow)}) mais caisse tendue`
          : `Trésorerie positive : +${fmtMAD(r.cashFlow)} ce mois-ci`;
  const explanation = isEmpty
    ? "Indiquez le solde de départ, le chiffre d'affaires et les dépenses : l'outil calcule le flux du mois et propose une date pour chaque paiement."
    : critical
      ? `Même en payant chaque dépense au meilleur jour, la caisse ne peut plus tout payer à partir du ${dayName(month, r.firstRuptureDay!, { weekday: 'long', day: 'numeric' })}.`
      : r.cashFlow < 0
        ? `Tous les paiements passent, mais le mois finit avec moins d'argent qu'au départ : ${fmtMAD(r.closingBalance)} contre ${fmtMAD(r.openingBalance)} le 1er.`
        : !goal
          ? r.daysInOverdraft > 0
            ? `Le mois finit en positif, mais certains jours ne passent que grâce au découvert (${r.daysInOverdraft} jour(s)).`
            : `Le mois finit en positif, mais la caisse descend sous ${fmtMAD(draft.minReserve)} pendant ${r.daysBelowReserve} jour(s).`
          : `En payant chaque dépense à la date conseillée, la caisse ne descend jamais sous ${fmtMAD(draft.minReserve)} et finit le mois à ${fmtMAD(r.closingBalance)}.`;
  const turnoverNow = Math.max(0, draft.monthlyTurnover);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Simulation de trésorerie</h1>
          <p className="mt-1 text-sm text-slate-500">Quand payer chaque dépense du mois pour que la caisse reste saine. Simulation uniquement : rien n’est modifié dans Afro Dispatch.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-500">
            Mois
            <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className={`${inputClass.replace('w-full ', '')} mt-1 block w-40`} />
          </label>
          <label className="text-xs font-medium text-slate-500">
            Société
            <select value={company} onChange={(e) => setCompany(e.target.value as 'all' | CompanyId)} className={`${inputClass.replace('w-full ', '')} mt-1 block w-52`}>
              <option value="all">Toutes les sociétés</option>
              {DISPATCH_COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => runImport()} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Remplir avec les données réelles
          </button>
          <button type="button" onClick={undo} disabled={undoCount === 0} title="Annuler la dernière modification" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
            Annuler{undoCount > 0 ? ` (${undoCount})` : ''}
          </button>
          <button type="button" onClick={reset} className="h-9 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-100">
            Recommencer
          </button>
        </div>
      </div>

      {importNotes.length > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Rempli avec les données réelles des 30 derniers jours. Vérifiez et ajustez les montants.</span>
            <button type="button" onClick={() => setShowNotes((v) => !v)} className="font-medium text-blue-600 hover:text-blue-700">{showNotes ? 'Masquer le détail' : 'Voir le détail'}</button>
          </div>
          {showNotes && <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">{importNotes.map((n) => <li key={n}>{n}</li>)}</ul>}
        </div>
      )}

      {/* Verdict */}
      <section className={`${card} grid gap-5 p-5 md:grid-cols-[220px_1fr] md:items-center`} aria-label="Santé de la caisse">
        <div>
          {isEmpty
            ? <p className="text-center text-sm text-slate-400">L'indice de santé s'affichera ici.</p>
            : <SolvencyGauge result={r} caption="Santé de la caisse (sur 100)" />}
        </div>
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            {!isEmpty && <Icon className="h-5 w-5 shrink-0" style={{ color: tone }} aria-hidden />}
            {headline}
          </p>
          <p className="mt-1 text-sm text-slate-600">{explanation}</p>
          {!isEmpty && (
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Figure label="Flux de trésorerie du mois" amount={r.cashFlow} before={b?.cashFlow} tone={r.cashFlow < 0 ? 'critical' : undefined} hint="Rentrées du mois − sorties du mois (= solde de fin de mois − solde du 1er)" />
              <Figure label="Résultat (CA − dépenses)" amount={monthResult} before={b ? b.turnover - b.totalExpenses : undefined} tone={monthResult < 0 ? 'critical' : undefined} hint="Chiffre d'affaires du mois − dépenses du mois, hors banque" />
              <Figure label="Point le plus bas" amount={r.minBalance} before={b?.minBalance} tone={r.minBalance + r.overdraftLimit < 0 ? 'critical' : r.minBalance < draft.minReserve ? 'warning' : undefined} hint={`Le ${r.minBalanceDay}`} />
              <Figure label="Solde en fin de mois" amount={r.closingBalance} before={b?.closingBalance} tone={r.closingBalance < 0 ? 'critical' : undefined} />
            </div>
          )}
          {!isEmpty && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              {activeLevers && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800 ring-1 ring-amber-200">
                  Scénario testé : {activeLevers}
                  <button type="button" onClick={() => change({ levers: { ...DEFAULT_LEVERS } })} className="ml-2 font-semibold underline">retirer</button>
                </span>
              )}
              <span>
                {b ? `Point de départ mémorisé le ${new Date(b.at).toLocaleDateString('fr-FR')} à ${new Date(b.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.` : 'Aucun point de départ mémorisé.'}
                <button type="button" onClick={rememberStart} className="ml-1.5 font-medium text-blue-600 hover:text-blue-700">
                  {b ? 'Remplacer par la situation actuelle' : 'Mémoriser la situation actuelle'}
                </button>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* What would make the month positive */}
      {!isEmpty && !goal && (
        <section className={card} aria-labelledby="levers-title">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 id="levers-title" className="text-base font-semibold text-slate-900">Pistes pour une trésorerie positive</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Chaque piste, appliquée seule, suffit pour finir le mois avec plus d'argent qu'au départ sans jamais descendre sous {fmtMAD(draft.minReserve)}.
              Vous pouvez aussi combiner de plus petits changements, puis comparer au point de départ.
            </p>
          </div>
          {!targets ? (
            <p className="px-5 py-4 text-sm text-slate-500">Calcul…</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {targets.turnover !== null && (
                <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="text-slate-700">Réaliser un chiffre d'affaires de <strong className="text-slate-900">{fmtMAD(targets.turnover)}</strong> au lieu de {fmtMAD(turnoverNow)} (+{fmtMAD(targets.turnover - turnoverNow)}{turnoverNow > 0 ? `, +${Math.round(((targets.turnover - turnoverNow) / turnoverNow) * 100)} %` : ''}).</span>
                  <button type="button" onClick={() => change({ monthlyTurnover: targets.turnover! })} className="h-8 rounded-lg border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50">Appliquer</button>
                </li>
              )}
              {targets.expenseCut !== null && (
                <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="text-slate-700">Réduire toutes les dépenses de <strong className="text-slate-900">{(targets.expenseCut.share * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %</strong>, soit {fmtMAD(targets.expenseCut.amount)} sur le mois.</span>
                  <button type="button" onClick={() => applyCut(targets.expenseCut!.share)} className="h-8 rounded-lg border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50">Appliquer</button>
                </li>
              )}
              {targets.cashSharePct !== null && (
                <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="text-slate-700">Faire payer comptant <strong className="text-slate-900">{targets.cashSharePct} %</strong> des ventes au lieu de {draft.cashSharePct} %.</span>
                  <button type="button" onClick={() => change({ cashSharePct: targets.cashSharePct! })} className="h-8 rounded-lg border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50">Appliquer</button>
                </li>
              )}
              {targets.creditDelayDays !== null && (
                <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="text-slate-700">Faire payer les clients à crédit en <strong className="text-slate-900">{targets.creditDelayDays} jours</strong> au lieu de {draft.creditDelayDays}.</span>
                  <button type="button" onClick={() => change({ creditDelayDays: targets.creditDelayDays! })} className="h-8 rounded-lg border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50">Appliquer</button>
                </li>
              )}
              {targets.turnover === null && targets.expenseCut === null && targets.cashSharePct === null && targets.creditDelayDays === null && (
                <li className="px-5 py-3 text-sm text-slate-600">Aucun levier seul ne suffit : combinez plusieurs changements (chiffre d'affaires, dépenses, encaissements).</li>
              )}
              {critical && neededOverdraft > 0 && (
                <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="text-slate-700">
                    En attendant, un découvert de <strong className="text-slate-900">{fmtMAD(neededOverdraft)}</strong> éviterait les ruptures de paiement,
                    mais ne rend pas le mois positif et coûte des agios.
                  </span>
                  <button type="button" onClick={() => addOverdraft(neededOverdraft)} className="h-8 rounded-lg border border-slate-200 px-3 font-medium text-slate-700 hover:bg-slate-50">Simuler</button>
                </li>
              )}
            </ul>
          )}
        </section>
      )}

      {/* Step 1 */}
      <section className={card} aria-labelledby="step1">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="step1" className="text-base font-semibold text-slate-900">1. L'argent qui rentre</h2>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Solde en caisse le 1er"><NumberInput value={draft.openingBalance} step={1000} onChange={(openingBalance) => change({ openingBalance })} /></Field>
          <Field label="Chiffre d'affaires prévu du mois" help={`soit ${fmtMAD(r.dailySales)} par jour travaillé`}>
            <NumberInput value={draft.monthlyTurnover} min={0} step={1000} onChange={(monthlyTurnover) => change({ monthlyTurnover })} />
          </Field>
          <Field label="Part payée comptant (%)"><NumberInput value={draft.cashSharePct} min={0} max={100} step={5} onChange={(cashSharePct) => change({ cashSharePct })} /></Field>
          <Field label="Les clients à crédit paient après (jours)"><NumberInput value={draft.creditDelayDays} min={0} max={120} onChange={(creditDelayDays) => change({ creditDelayDays })} /></Field>
          <Field label="Toujours garder en caisse au moins"><NumberInput value={draft.minReserve} min={0} step={500} onChange={(minReserve) => change({ minReserve })} /></Field>
        </div>
        <div className="grid gap-4 border-t border-slate-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <Field label="Clients à crédit du mois dernier à encaisser ce mois-ci (MAD)">
              <NumberInput value={draft.priorCredit} min={0} step={1000} onChange={(priorCredit) => change({ priorCredit })} />
            </Field>
            {(() => {
              const est = estimatePriorCredit(draft);
              return est > 0 && est !== draft.priorCredit ? (
                <p className="mt-1 text-xs text-slate-500">
                  Si le mois dernier ressemblait à celui-ci : {fmtMAD(est)}.{' '}
                  <button type="button" onClick={() => change({ priorCredit: est })} className="font-medium text-blue-600 hover:text-blue-700">Utiliser ce montant</button>
                </p>
              ) : null;
            })()}
          </div>
          <p className="self-center text-xs leading-relaxed text-slate-500 sm:col-span-2 lg:col-span-3">
            Ventes à crédit déjà faites qui seront payées en début de mois (le jour où leur délai se termine). Les ventes à crédit de ce mois-ci sont comptées automatiquement à partir du chiffre d'affaires.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-600">
          <span className="flex items-center gap-2">Jours travaillés <WeekdayPicker label="Jours travaillés" value={draft.workDays} onChange={(workDays) => change({ workDays })} /></span>
          <button type="button" onClick={() => setShowOtherIn((v) => !v)} className="font-medium text-blue-600 hover:text-blue-700">
            {showOtherIn ? 'Masquer les autres rentrées' : `Autres rentrées d'argent (${draft.encaissements.length})`}
          </button>
        </div>
        {showOtherIn && <div className="border-t border-slate-100"><EncaissementsEditor scenario={draft} onChange={change} /></div>}
      </section>

      {/* Step 2 */}
      <section className={card} aria-labelledby="step2">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="step2" className="text-base font-semibold text-slate-900">2. Les dépenses du mois</h2>
          <p className="mt-0.5 text-sm text-slate-500">Pour chaque dépense : le montant du mois et la période où elle peut être payée. La date conseillée s'affiche sur chaque ligne.</p>
        </div>
        <DepensesTable scenario={draft} onChange={change} recommendations={best.recommendations} />
      </section>

      {/* Step 3 */}
      <section className={card} aria-labelledby="step3">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="step3" className="text-base font-semibold text-slate-900">3. Plan de paiement conseillé</h2>
          <p className="mt-0.5 text-sm text-slate-500">Les paiements du mois aux dates conseillées, et ce qui reste en caisse chaque soir.</p>
        </div>
        {!isEmpty && <div className="px-5 pt-4"><BalanceChart result={r} minReserve={draft.minReserve} /></div>}
        <PaymentPlan scenario={draft} result={r} recommendations={best.recommendations} />
      </section>

      {!isEmpty && (
        <section className={card} aria-labelledby="statement">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 id="statement" className="text-base font-semibold text-slate-900">Bilan de trésorerie du mois</h2>
            <p className="mt-0.5 text-sm text-slate-500">D'où vient l'argent et où il va : solde du 1er + rentrées − sorties = solde de fin de mois.</p>
          </div>
          <CashStatement result={r} />
        </section>
      )}

      {/* Optional sections */}
      <Fold title="Tester un scénario" hint="Et si les ventes baissent, si le gasoil augmente, si le fournisseur accorde un délai ?">
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Lever label="Chiffre d'affaires" value={draft.levers.salesPct} min={-50} max={50} step={5} unit="%" onChange={(salesPct) => setLever({ salesPct })} />
          <Lever label="Coût du gasoil" value={draft.levers.gasoilPct} min={-30} max={60} step={5} unit="%" onChange={(gasoilPct) => setLever({ gasoilPct })} />
          <Lever label="Charges diverses" value={draft.levers.variablePct} min={-30} max={60} step={5} unit="%" onChange={(variablePct) => setLever({ variablePct })} />
          <Lever label="Délai accordé par le fournisseur gaz" value={draft.levers.supplierDelayDays} min={0} max={30} step={1} unit="j" onChange={(supplierDelayDays) => setLever({ supplierDelayDays })} />
          <div className="sm:col-span-2">
            <button type="button" onClick={() => change({ levers: { ...DEFAULT_LEVERS } })} className="text-sm font-medium text-blue-600 hover:text-blue-700">Revenir aux valeurs saisies</button>
          </div>
        </div>
      </Fold>

      <Fold title={`Banque : découvert, crédit, leasing (${draft.bankProducts.length})`} hint="Découvert autorisé, facilité de caisse, crédit de trésorerie, escompte, échéances de prêt">
        <BankEditor scenario={draft} onChange={change} />
      </Fold>

      <Fold title="Indicateurs et répartition des dépenses" hint="Détail de l'indice de santé, part du gasoil, des salaires, coût bancaire">
        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <div className="space-y-3">
            <Meter label="Couverture des paiements" value={r.scoreParts.coverage} display={fmtPct(r.coverage)} hint="(Solde du 1er + encaissements) / paiements du mois" />
            <Meter label="Jours sans rupture" value={r.scoreParts.noRupture} display={`${r.daysInMonth - r.ruptureDays} / ${r.daysInMonth}`} />
            <Meter label="Coussin de sécurité" value={r.scoreParts.cushion} display={fmtMAD(r.minBalance + r.overdraftLimit)} />
            <Meter label="Autonomie bancaire" value={r.scoreParts.bankIndependence} display={`${r.daysInOverdraft} j. à découvert`} />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-slate-100 pt-3 text-sm">
              <dt className="text-slate-500">Salaires / chiffre d'affaires</dt>
              <dd className="text-right font-semibold tabular-nums text-slate-900">{r.turnover > 0 ? fmtPct((r.outByCategory.find((c) => c.id === 'salaires')?.amount ?? 0) / r.turnover, 1) : '-'}</dd>
              <dt className="text-slate-500">Coût bancaire estimé</dt>
              <dd className="text-right font-semibold tabular-nums text-slate-900">{fmtMAD(r.bankCost)}</dd>
            </dl>
          </div>
          <ul className="space-y-3">
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
            {r.outByCategory.length === 0 && <li className="text-sm text-slate-500">Aucune dépense saisie.</li>}
          </ul>
        </div>
      </Fold>

      <Fold title="Comment tout est calculé" hint="Ventes, crédits clients, solde, dates conseillées, pistes, banque">
        <div className="p-5"><FormulaPanel scenario={draft} result={r} recommendations={best.recommendations} /></div>
      </Fold>

      <Fold title="Détail jour par jour">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50/60 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Jour</th>
                <th className="px-4 py-2.5 text-right font-semibold">Rentrées</th>
                <th className="px-4 py-2.5 text-left font-semibold">Paiements</th>
                <th className="px-4 py-2.5 text-right font-semibold">Reste le soir</th>
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
      </Fold>
    </div>
  );
}
