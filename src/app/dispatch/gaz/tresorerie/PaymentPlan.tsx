import React from 'react';
import type { Recommendation, SimResult, SimScenario } from '../../../../lib/tresorerieSim';
import { STATUS, fmtMAD } from './ui';
import { STATUS_TEXT, dayName } from './ScenarioEditors';

/** Every payment of the month at its suggested date, grouped by day, with the balance left in the evening. */
export function PaymentPlan({ scenario, result, recommendations }: { scenario: SimScenario; result: SimResult; recommendations: Recommendation[] }) {
  const daily = scenario.depenses.filter((d) => !d.paid && d.monthlyAmount > 0 && (d.mode === 'quotidien' || d.mode === 'jours_fixes'));
  const dailyIds = new Set(daily.map((d) => d.id));
  const recOf = (id?: string, i?: number) => recommendations.find((r) => r.depenseId === id && r.index === (i ?? 0));
  const days = result.days
    .map((d) => ({ d, items: d.outflows.filter((f) => !(f.depenseId && dailyIds.has(f.depenseId))) }))
    .filter((x) => x.items.length > 0);
  const deferred = recommendations.filter((r) => r.status === 'reporte');

  if (days.length === 0 && daily.length === 0) {
    return <p className="p-5 text-sm text-slate-500">Saisissez le montant des dépenses pour obtenir le plan de paiement.</p>;
  }

  return (
    <div>
      {daily.length > 0 && (
        <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Chaque jour travaillé : </span>
          {daily.map((d, i) => {
            const count = d.mode === 'quotidien' ? result.workDaysCount : result.days.filter((x) => d.weekdays.includes(x.date.getDay())).length;
            return <span key={d.id}>{i > 0 && ' · '}{d.label} {fmtMAD(count ? d.monthlyAmount / count : 0)}</span>;
          })}
        </div>
      )}
      <ol className="divide-y divide-slate-100">
        {days.map(({ d, items }) => {
          const tone = d.status === 'rupture' ? STATUS.critical : d.status === 'ok' ? STATUS.good : STATUS.warning;
          return (
            <li key={d.day} className="grid gap-2 px-5 py-3 sm:grid-cols-[110px_1fr_230px] sm:items-start">
              <p className="text-sm font-semibold capitalize text-slate-900">{dayName(scenario.month, d.day, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
              <ul className="space-y-1.5">
                {items.map((f, i) => {
                  const rec = recOf(f.depenseId, f.installment);
                  const dep = scenario.depenses.find((x) => x.id === f.depenseId);
                  const note = rec
                    ? rec.status === 'ok'
                      ? rec.window[1] !== d.day ? `au plus tard le ${Math.min(rec.window[1], result.daysInMonth)}` : 'date limite'
                      : STATUS_TEXT[rec.status].label
                    : dep?.locked ? 'date fixe' : f.category === 'banque' ? 'banque' : '';
                  return (
                    <li key={i} className="flex items-start justify-between gap-x-4 text-sm">
                      <span className="flex items-start gap-2 text-slate-800">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: rec ? STATUS_TEXT[rec.status].color : '#cbd5e1' }} />
                        <span>
                          {f.label}
                          {note && <span className={`block text-xs ${rec && rec.status !== 'ok' ? 'text-red-700' : 'text-slate-500'}`}>{note}</span>}
                        </span>
                      </span>
                      <span className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{fmtMAD(f.amount)}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600 sm:justify-end">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tone }} />
                Reste le soir : <span className={`font-semibold tabular-nums ${d.balance < 0 ? 'text-red-700' : 'text-slate-900'}`}>{fmtMAD(d.balance)}</span>
              </p>
            </li>
          );
        })}
      </ol>
      {deferred.length > 0 && (
        <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-600">
          Reporté au mois suivant grâce au délai négocié : {deferred.map((r) => `${r.label}${r.installments > 1 ? ` (${r.index + 1}/${r.installments})` : ''} ${fmtMAD(r.amount)}`).join(', ')}.
        </p>
      )}
    </div>
  );
}
