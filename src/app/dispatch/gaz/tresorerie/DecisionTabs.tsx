import React, { useMemo, useState } from 'react';
import {
  isPositiveAndHealthy, projectMonths, sensitivity, stressTests,
  type ProjectionMonth, type SimResult, type SimScenario, type StressTest,
} from '../../../../lib/tresorerieSim';
import { ProjectionChart, ScenarioCompareChart, TornadoChart } from './DecisionCharts';
import { NumberInput, STATUS, card, fmtMAD } from './ui';

export interface ScenarioRun {
  id: string;
  name: string;
  /** Colour of the scenario, the same everywhere on the page. */
  color: string;
  scenario: SimScenario;
  result: SimResult;
  current: boolean;
}

const statusOf = (r: SimResult) => (r.ruptureDays > 0 ? 'critical' : isPositiveAndHealthy(r) ? 'good' : 'warning');
const STATUS_WORD = { good: 'Positive et saine', warning: 'Tendue', critical: 'Rupture' } as const;

function StatusCell({ r }: { r: SimResult }) {
  const st = statusOf(r);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-700">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS[st] }} />{STATUS_WORD[st]}
    </span>
  );
}

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className={card} aria-labelledby={id}>
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 id={id} className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

const money = (v: number) => <span className={`whitespace-nowrap tabular-nums ${v < 0 ? "text-red-700" : ""}`}>{fmtMAD(v)}</span>;

/** Saved scenarios side by side, stress tests and the factors that weigh most on the cash flow. */
export function CompareTab({ runs, current, onOpen, onSaveTest }: {
  runs: ScenarioRun[];
  current: SimScenario;
  onOpen: (id: string) => void;
  onSaveTest: (test: StressTest) => void;
}) {
  const tests = useMemo(() => stressTests(current), [current]);
  const sens = useMemo(() => sensitivity(current), [current]);
  const currentRun = runs.find((r) => r.current)!;
  const metrics: { label: string; value: (r: SimResult) => number; better: 'high' | 'low'; fmt?: (v: number) => React.ReactNode }[] = [
    { label: "Chiffre d'affaires", value: (r) => r.turnover, better: 'high' },
    { label: 'Dépenses du mois', value: (r) => r.totalExpenses, better: 'low' },
    { label: 'Flux net du mois (après reports)', value: (r) => r.netFlow, better: 'high' },
    { label: 'Paiements reportés au mois suivant', value: (r) => r.deferredToNextMonth, better: 'low' },
    { label: 'Solde en fin de mois', value: (r) => r.closingBalance, better: 'high' },
    { label: 'Point le plus bas', value: (r) => r.minBalance, better: 'high' },
    { label: 'Jours de paiement impossible', value: (r) => r.ruptureDays, better: 'low', fmt: (v) => `${v} j` },
    { label: 'Besoin de financement', value: (r) => r.uncoveredNeed, better: 'low' },
    { label: 'Coût bancaire', value: (r) => r.bankCost, better: 'low' },
    { label: 'Indice de santé', value: (r) => r.score, better: 'high', fmt: (v) => `${v} / 100` },
  ];

  return (
    <div className="space-y-5">
      <Section id="cmp-title" title="Comparer les scénarios" subtitle="Créez des scénarios (bouton « Nouveau scénario » en haut) pour comparer des choix : négocier un délai, réduire une dépense, prendre un découvert…">
        {runs.length < 2 ? (
          <p className="px-5 py-4 text-sm text-slate-600">Un seul scénario pour ce mois. Créez-en un autre à partir de la situation actuelle, modifiez-le, puis revenez ici pour comparer. Vous pouvez aussi enregistrer un test de résistance ci-dessous comme scénario.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50/60 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Indicateur</th>
                    {runs.map((r) => (
                      <th key={r.id} className="px-4 py-2.5 text-right font-semibold">
                        <button type="button" onClick={() => onOpen(r.id)} className="inline-flex items-center gap-1.5 hover:text-slate-900" title="Ouvrir ce scénario">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: r.color }} />
                          {r.name}{r.current ? ' (ouvert)' : ''}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2 text-slate-600">État</td>
                    {runs.map((r) => <td key={r.id} className="px-4 py-2 text-right"><StatusCell r={r.result} /></td>)}
                  </tr>
                  {metrics.map((m) => {
                    const values = runs.map((r) => m.value(r.result));
                    const best = m.better === 'high' ? Math.max(...values) : Math.min(...values);
                    const allSame = values.every((v) => v === values[0]);
                    return (
                      <tr key={m.label}>
                        <td className="px-4 py-2 text-slate-600">{m.label}</td>
                        {runs.map((r, i) => (
                          <td key={r.id} className={`px-4 py-2 text-right text-slate-900 ${!allSame && values[i] === best ? 'font-semibold' : ''}`}>
                            {m.fmt ? m.fmt(values[i]) : money(values[i])}
                            {!allSame && values[i] === best && <span className="ml-1.5 text-[10px] font-medium uppercase text-slate-500">meilleur</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 p-5">
              <ScenarioCompareChart series={runs.map((r) => ({ id: r.id, name: r.name, color: r.color, result: r.result }))} minReserve={current.minReserve} />
            </div>
          </>
        )}
      </Section>

      <Section id="stress-title" title="Tests de résistance" subtitle={`Que devient « ${currentRun.name} » si les choses se passent mal ? Chaque test est simulé avec ses propres dates de paiement conseillées.`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50/60 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Test</th>
                <th className="px-4 py-2.5 text-left font-semibold">État</th>
                <th className="px-4 py-2.5 text-right font-semibold" title="Après paiements reportés">Flux net du mois</th>
                <th className="px-4 py-2.5 text-right font-semibold">Écart</th>
                <th className="px-4 py-2.5 text-right font-semibold">Point le plus bas</th>
                <th className="px-4 py-2.5 text-right font-semibold">Besoin de financement</th>
                <th className="px-4 py-2.5"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-slate-50/40">
                <td className="px-4 py-2 font-medium text-slate-900">Simulation actuelle</td>
                <td className="px-4 py-2"><StatusCell r={currentRun.result} /></td>
                <td className="px-4 py-2 text-right">{money(currentRun.result.netFlow)}</td>
                <td className="px-4 py-2 text-right text-slate-400">-</td>
                <td className="px-4 py-2 text-right">{money(currentRun.result.minBalance)}</td>
                <td className="px-4 py-2 text-right">{money(currentRun.result.uncoveredNeed)}</td>
                <td />
              </tr>
              {tests.map((t) => {
                const gap = t.result.netFlow - currentRun.result.netFlow;
                return (
                  <tr key={t.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-slate-900">{t.label}</p>
                      <p className="hidden text-xs text-slate-500 sm:block">{t.description}</p>
                    </td>
                    <td className="px-4 py-2"><StatusCell r={t.result} /></td>
                    <td className="px-4 py-2 text-right">{money(t.result.netFlow)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600">{Math.round(gap) === 0 ? '0' : `${gap > 0 ? '+' : ''}${fmtMAD(gap)}`}</td>
                    <td className="px-4 py-2 text-right">{money(t.result.minBalance)}</td>
                    <td className="px-4 py-2 text-right">{money(t.result.uncoveredNeed)}</td>
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => onSaveTest(t)} className="whitespace-nowrap text-xs font-medium text-blue-600 hover:text-blue-700">Enregistrer comme scénario</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          {(() => {
            const failing = tests.filter((t) => t.result.ruptureDays > 0).length;
            return failing === 0
              ? 'La trésorerie résiste à tous les tests : aucun ne provoque de paiement impossible.'
              : `${failing} test(s) sur ${tests.length} provoquent des paiements impossibles : prévoyez une marge (découvert, délai fournisseur, encaissements plus rapides).`;
          })()}
        </p>
      </Section>

      <Section id="sens-title" title="Ce qui pèse le plus sur la trésorerie" subtitle="Effet sur le flux net du mois si chaque élément bouge seul de 10 % (10 points pour la part comptant, 10 jours pour le délai des clients). Les plus longues barres sont les leviers à surveiller en priorité.">
        <div className="p-5">
          {sens.length === 0 ? <p className="text-sm text-slate-500">Saisissez le chiffre d'affaires et les dépenses pour voir l'analyse.</p> : <TornadoChart rows={sens} />}
        </div>
      </Section>
    </div>
  );
}

/** The month and the next ones, chained. */
export function ProjectionTab({ current }: { current: SimScenario }) {
  const [count, setCount] = useState(3);
  const [turnoverPct, setTurnoverPct] = useState(0);
  const [expensesPct, setExpensesPct] = useState(0);
  const months: ProjectionMonth[] = useMemo(() => projectMonths(current, count, { turnoverPct, expensesPct }), [current, count, turnoverPct, expensesPct]);
  const last = months[months.length - 1].result;
  const firstRupture = months.find((m) => m.result.ruptureDays > 0);
  const total = months.reduce((sum, m) => sum + m.result.cashFlow, 0);
  const monthName = (m: string) => {
    const [y, mo] = m.split('-').map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };
  return (
    <div className="space-y-5">
      <Section id="proj-title" title={`Projection sur ${count} mois`} subtitle="Chaque mois repart du solde de fin du mois précédent, encaisse ses ventes à crédit et paie les paiements reportés. Les éléments ponctuels (arriérés, encaissements exceptionnels, crédits et escomptes) ne sont pas répétés.">
        <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Durée</span>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm">
              <option value={3}>3 mois</option><option value={6}>6 mois</option><option value={12}>12 mois</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Évolution du chiffre d'affaires par mois (%)</span>
            <NumberInput value={turnoverPct} min={-50} max={50} step={1} onChange={setTurnoverPct} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Évolution des dépenses par mois (%)</span>
            <NumberInput value={expensesPct} min={-50} max={50} step={1} onChange={setExpensesPct} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-sm">
          <span className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: firstRupture ? STATUS.critical : total >= 0 ? STATUS.good : STATUS.warning }} />
            {firstRupture
              ? `Première rupture de paiement en ${monthName(firstRupture.month)}`
              : total >= 0 ? `La trésorerie progresse de ${fmtMAD(total)} sur ${count} mois` : `La trésorerie baisse de ${fmtMAD(-total)} sur ${count} mois, sans rupture`}
          </span>
          <span className="text-slate-600">Solde dans {count} mois : <strong className={last.closingBalance < 0 ? 'text-red-700' : 'text-slate-900'}>{fmtMAD(last.closingBalance)}</strong></span>
        </div>
        <div className="px-5 pb-5"><ProjectionChart months={months} minReserve={current.minReserve} /></div>
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50/60 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Mois</th>
                <th className="px-4 py-2.5 text-left font-semibold">État</th>
                <th className="px-4 py-2.5 text-right font-semibold">Chiffre d'affaires</th>
                <th className="px-4 py-2.5 text-right font-semibold">Dépenses</th>
                <th className="px-4 py-2.5 text-right font-semibold">Flux du mois (caisse)</th>
                <th className="px-4 py-2.5 text-right font-semibold">Reporté au mois suivant</th>
                <th className="px-4 py-2.5 text-right font-semibold">Point le plus bas</th>
                <th className="px-4 py-2.5 text-right font-semibold">Solde fin de mois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {months.map((m) => (
                <tr key={m.month}>
                  <td className="px-4 py-2 capitalize text-slate-900">{monthName(m.month)}</td>
                  <td className="px-4 py-2"><StatusCell r={m.result} /></td>
                  <td className="px-4 py-2 text-right">{money(m.result.turnover)}</td>
                  <td className="px-4 py-2 text-right">{money(m.result.totalExpenses)}</td>
                  <td className="px-4 py-2 text-right">{money(m.result.cashFlow)}</td>
                  <td className="px-4 py-2 text-right">{money(m.result.deferredToNextMonth)}</td>
                  <td className="px-4 py-2 text-right">{money(m.result.minBalance)}</td>
                  <td className="px-4 py-2 text-right font-semibold">{money(m.result.closingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
