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
import { DEFAULT_LEVERS, newScenario, simulate, suggestPaymentPlan, type SimLevers, type SimResult, type SimScenario } from '../../../../lib/tresorerieSim';
import { importFromDispatch } from './importFromDispatch';
import { SolvencyGauge } from './SolvencyGauge';
import { BalanceChart, FlowsChart } from './TreasuryCharts';
import { BankEditor, ChargesEditor, EcheancesEditor, EncaissementsEditor } from './ScenarioEditors';
import { Meter, NumberInput, SERIES, STATUS, card, fmtMAD, fmtPct, inputClass } from './ui';

type Tab = 'echeances' | 'charges' | 'encaissements' | 'banque';
const TABS: { id: Tab; label: string }[] = [
  { id: 'echeances', label: 'Fournisseurs & échéances' },
  { id: 'charges', label: 'Charges récurrentes (gasoil…)' },
  { id: 'encaissements', label: 'Ventes & encaissements' },
  { id: 'banque', label: 'Produits bancaires' },
];

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
          {tone && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS[tone] }} />}
          {sub}
        </p>
      )}
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
  const { scenarios, saveScenario, removeScenario } = useTresorerieSimStore();
  const hydrated = useStoreHydrated();

  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [company, setCompany] = useState<'all' | CompanyId>('all');
  const key = scenarioKey(month, company);
  const [draft, setDraft] = useState<SimScenario | null>(null);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>('echeances');
  const [importNotes, setImportNotes] = useState<string[]>([]);
  const [showDays, setShowDays] = useState(false);

  // Load the simulation of the chosen month and company
  useEffect(() => {
    if (!hydrated) return;
    setDraft(useTresorerieSimStore.getState().scenarios[key] ?? newScenario(month, company));
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
  const plan = useMemo(() => (draft && result && result.firstRuptureDay !== null ? suggestPaymentPlan(draft) : null), [draft, result]);

  const runImport = () => {
    if (!draft) return;
    const { scenario, notes } = importFromDispatch(draft, {
      sales, drivers, commandes: commandes || [], paySlips: paySlips || [], tickets: tickets || [],
      stationSupplies: stationInterne?.historique || [], leasing: contrats || [], variableCharges: variableCharges || [], vehicules: vehicules || [],
    });
    setDraft(scenario);
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

  const applyPlan = () => {
    if (!draft || !plan) return;
    const moves = plan.moves.filter((mv) => mv.toDay !== null);
    change({
      echeances: draft.echeances.map((e) => {
        const mv = moves.find((x) => x.echeanceId === e.id);
        if (!mv) return e;
        const shift = e.category === 'fournisseur_gaz' ? Math.round(draft.levers.supplierDelayDays) : 0;
        return { ...e, day: mv.toDay! - shift };
      }),
    });
    toast.success('Plan de paiement appliqué à la simulation.');
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

  if (!draft || !result) {
    return <div className="p-8 text-sm text-slate-500">Chargement de la simulation…</div>;
  }

  const r = result;
  const share = (id: string) => r.outByCategory.find((c) => c.id === id)?.share ?? 0;
  const salaries = r.outByCategory.find((c) => c.id === 'salaires')?.amount ?? 0;
  const neededOverdraft = Math.ceil(r.grossNeed / 1000) * 1000;
  const verdict =
    r.level === 'critique' && r.firstRuptureDay
      ? `À partir du ${dateLabel(month, r.firstRuptureDay)}, la caisse ne peut plus payer toutes les échéances : il manque ${fmtMAD(r.uncoveredNeed)} au pire moment.`
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
          <p className="mt-1 text-sm text-slate-500">Anticipez chaque jour du mois : ce qui rentre, ce qui sort, et si la caisse peut payer fournisseurs, gasoil et salaires à leur échéance.</p>
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

      {draft.dailySales === 0 && draft.echeances.length === 0 && draft.charges.length === 0 && draft.encaissements.length === 0 && (
        <div className={`${card} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <p className="text-sm text-slate-600">Simulation vide : pré-remplissez-la avec les ventes, commandes fournisseurs, gasoil, salaires et leasing réels, puis ajustez les montants et les dates.</p>
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
          <div className={`${card} p-4`}>
            <label htmlFor="opening" className="text-xs font-medium text-slate-500">Solde au 1er (caisse + banque)</label>
            <NumberInput id="opening" value={draft.openingBalance} step={1000} onChange={(openingBalance) => change({ openingBalance })} className="mt-1 text-base font-bold" />
          </div>
          <Tile label="Solde en fin de mois" amount={r.closingBalance} sub={r.closingBalance < 0 ? 'Négatif' : undefined} tone={r.closingBalance < 0 ? 'critical' : undefined} />
          <Tile label="Encaissements du mois" amount={r.totalIn - r.bankIn} sub={r.bankIn > 0 ? `+ ${fmtMAD(r.bankIn)} de la banque` : `dont ventes ${fmtMAD(r.salesIn)}`} />
          <Tile label="Décaissements du mois" amount={r.totalOut} sub={r.deferredToNextMonth > 0 ? `${fmtMAD(r.deferredToNextMonth)} reportés` : undefined} />
          <Tile label="Point le plus bas" amount={r.minBalance} sub={`le ${r.minBalanceDay}`} tone={r.minBalance + r.overdraftLimit < 0 ? 'critical' : r.minBalance < draft.minReserve ? 'warning' : undefined} />
          <Tile
            label="Besoin de financement"
            amount={r.uncoveredNeed}
            sub={r.overdraftLimit > 0 ? `découvert de ${fmtMAD(r.overdraftLimit)} déjà compté` : 'aucun découvert saisi'}
            tone={r.uncoveredNeed > 0 ? 'critical' : undefined}
          />
        </div>

      {/* Gauge and levers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${card} p-5`} aria-labelledby="gauge-title">
          <h2 id="gauge-title" className="text-sm font-semibold text-slate-900">Indice de solvabilité</h2>
          <div className="mt-3"><SolvencyGauge result={r} /></div>
          <p className="mt-3 text-center text-sm text-slate-600">{verdict}</p>
          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            <Meter label="Couverture des paiements" value={r.scoreParts.coverage} display={fmtPct(r.coverage)} hint="(Solde au 1er + encaissements) / décaissements du mois" />
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
            <Lever label="Volume des ventes" value={draft.levers.salesPct} min={-50} max={50} step={5} unit="%" onChange={(salesPct) => setLever({ salesPct })} />
            <Lever label="Part des ventes payées comptant" value={draft.cashSharePct} min={0} max={100} step={5} unit="%" onChange={(cashSharePct) => change({ cashSharePct })} />
            <Lever label="Délai d'encaissement du crédit client" value={draft.creditDelayDays} min={0} max={90} step={1} unit="j" onChange={(creditDelayDays) => change({ creditDelayDays })} />
            <Lever label="Coût du gasoil" value={draft.levers.gasoilPct} min={-30} max={60} step={5} unit="%" onChange={(gasoilPct) => setLever({ gasoilPct })} />
            <Lever label="Autres charges variables" value={draft.levers.variablePct} min={-30} max={60} step={5} unit="%" onChange={(variablePct) => setLever({ variablePct })} />
            <Lever label="Délai négocié avec les fournisseurs gaz" value={draft.levers.supplierDelayDays} min={0} max={30} step={1} unit="j" onChange={(supplierDelayDays) => setLever({ supplierDelayDays })} hint="Repousse les paiements de la catégorie Fournisseurs gaz" />
          </div>
        </section>

      </div>

      {/* Cash curve */}
      <section className={`${card} p-5`} aria-labelledby="curve-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="curve-title" className="text-sm font-semibold text-slate-900">Solde de trésorerie jour par jour</h2>
        </div>
        <div className="mt-3"><BalanceChart result={r} minReserve={draft.minReserve} /></div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${card} p-5`} aria-labelledby="flows-title">
          <h2 id="flows-title" className="text-sm font-semibold text-slate-900">Encaissements et décaissements par jour</h2>
          <div className="mt-3"><FlowsChart result={r} /></div>
        </section>

        <section className={`${card} p-5`} aria-labelledby="split-title">
          <h2 id="split-title" className="text-sm font-semibold text-slate-900">Où part l'argent</h2>
          {r.outByCategory.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">Aucun décaissement saisi.</p>
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
            <dt className="text-slate-500">Gasoil / décaissements</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{fmtPct(share('gasoil'), 1)}</dd>
            <dt className="text-slate-500">Fournisseurs gaz / décaissements</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{fmtPct(share('fournisseur_gaz'), 1)}</dd>
            <dt className="text-slate-500">Salaires / ventes encaissées</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{r.salesIn > 0 ? fmtPct(salaries / r.salesIn, 1) : '-'}</dd>
            <dt className="text-slate-500">Coût bancaire estimé</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{fmtMAD(r.bankCost)}</dd>
            <dt className="text-slate-500">Jours à découvert</dt><dd className="text-right font-semibold text-slate-900 tabular-nums">{r.daysInOverdraft} / {r.daysInMonth}</dd>
          </dl>
        </section>
      </div>

      {/* Alerts and suggested payment plan */}
      <section className={`${card} p-5`} aria-labelledby="alerts-title">
        <h2 id="alerts-title" className="text-sm font-semibold text-slate-900">Alertes et plan de paiement</h2>
        <div className="mt-3 space-y-3 text-sm">
          {r.firstRuptureDay === null && r.daysBelowReserve === 0 && (
            <p className="flex items-start gap-2 text-slate-700"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS.good }} />Aucune difficulté de paiement prévue ce mois-ci.</p>
          )}
          {r.firstRuptureDay !== null && (
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
              <p className="font-semibold text-red-800">Paiements impossibles à partir du {dateLabel(month, r.firstRuptureDay)}</p>
              <ul className="mt-1.5 space-y-0.5 text-red-900/80">
                {r.days[r.firstRuptureDay - 1].outflows.map((f, i) => <li key={i}>{f.label} : {fmtMAD(f.amount)}</li>)}
              </ul>
              <p className="mt-2 text-red-900/80">{r.ruptureDays} jour(s) en rupture ce mois-ci ; il manque jusqu'à {fmtMAD(r.uncoveredNeed)}.</p>
            </div>
          )}
          {r.firstRuptureDay === null && r.daysBelowReserve > 0 && (
            <p className="flex items-start gap-2 text-slate-700"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS.warning }} />La caisse passe sous le seuil de sécurité ({fmtMAD(draft.minReserve)}) pendant {r.daysBelowReserve} jour(s).</p>
          )}
          {r.deferredToNextMonth > 0 && (
            <p className="flex items-start gap-2 text-slate-700"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-400" />Avec le délai négocié, {fmtMAD(r.deferredToNextMonth)} de paiements fournisseurs glissent sur le mois suivant.</p>
          )}

          {plan && plan.moves.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">Plan de paiement suggéré</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
                {plan.moves.map((mv, i) => (
                  <li key={i}>
                    {mv.toDay !== null
                      ? <>Payer <strong>{mv.label}</strong> ({fmtMAD(mv.amount)}) le {mv.toDay} au lieu du {mv.fromDay}.</>
                      : <><strong>{mv.label}</strong> ({fmtMAD(mv.amount)}, le {mv.fromDay}) : aucune date ce mois-ci ne suffit, il faut un financement ou un report au mois suivant.</>}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-slate-600">Avec ce plan, l'indice passe de {r.score} à <strong>{plan.result.score}</strong> sur 100{plan.result.ruptureDays > 0 ? `, avec encore ${plan.result.ruptureDays} jour(s) en rupture` : ', sans rupture'}.</p>
              {plan.moves.some((mv) => mv.toDay !== null) && (
                <button type="button" onClick={applyPlan} className="mt-3 h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Appliquer ce plan à la simulation</button>
              )}
            </div>
          )}
          {r.grossNeed > r.overdraftLimit && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
              <p className="text-slate-700">Pour tout payer à la date prévue sans rien décaler, il faudrait un découvert d'au moins <strong>{fmtMAD(neededOverdraft)}</strong>{r.overdraftLimit > 0 ? ` (${fmtMAD(r.overdraftLimit)} déjà saisis)` : ''}.</p>
              <button type="button" onClick={() => addOverdraft(Math.max(1000, neededOverdraft - r.overdraftLimit))} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Simuler ce découvert
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Inputs */}
      <section className={card} aria-label="Données de la simulation">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors ${tab === t.id ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-slate-400">
                {t.id === 'echeances' ? draft.echeances.length : t.id === 'charges' ? draft.charges.length : t.id === 'encaissements' ? draft.encaissements.length : draft.bankProducts.length}
              </span>
            </button>
          ))}
        </div>
        {tab === 'echeances' && <EcheancesEditor scenario={draft} onChange={change} />}
        {tab === 'charges' && <ChargesEditor scenario={draft} onChange={change} />}
        {tab === 'encaissements' && <EncaissementsEditor scenario={draft} onChange={change} />}
        {tab === 'banque' && <BankEditor scenario={draft} onChange={change} />}
      </section>

      {/* Day-by-day table */}
      <section className={card}>
        <button type="button" onClick={() => setShowDays((v) => !v)} aria-expanded={showDays} className="flex w-full items-center justify-between p-5 text-left">
          <span className="text-sm font-semibold text-slate-900">Calendrier de trésorerie jour par jour</span>
          <span className="text-sm font-medium text-blue-600">{showDays ? 'Masquer' : 'Afficher'}</span>
        </button>
        {showDays && (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50/60 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Jour</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Encaissements</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Décaissements</th>
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
