import React, { useState } from 'react';
import type { SimResult } from '../../../../lib/tresorerieSim';
import { STATUS, fmtMAD } from './ui';

const WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const STATUS_COLOR: Record<SimResult['days'][number]['status'], string> = {
  ok: STATUS.good, sous_seuil: STATUS.warning, decouvert: STATUS.warning, rupture: STATUS.critical,
};
const short = (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k` : Math.round(v).toLocaleString('fr-FR'));

/** Month grid of the payments: planned days or best days, with the balance at the end of each day. */
export function EcheancesCalendar({ planned, best }: { planned: SimResult; best: SimResult }) {
  const [view, setView] = useState<'planned' | 'best'>('best');
  const r = view === 'planned' ? planned : best;
  const offset = (r.days[0].date.getDay() + 6) % 7; // Monday first
  const cells: (SimResult['days'][number] | null)[] = [...Array(offset).fill(null), ...r.days];
  while (cells.length % 7) cells.push(null);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Calendrier affiché">
          {([['planned', 'Jours prévus'], ['best', 'Meilleurs jours']] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-600">
          Indice : prévu <strong className="text-slate-900">{planned.score}</strong> · meilleurs jours <strong className="text-slate-900">{best.score}</strong> sur 100
          <span className="mx-2 text-slate-300">|</span>
          Point le plus bas : <strong className="text-slate-900 tabular-nums">{fmtMAD(r.minBalance)}</strong> le {r.minBalanceDay}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-7 gap-1.5">
          {WEEK.map((d) => <div key={d} className="px-2 pb-1 text-xs font-semibold text-slate-500">{d}</div>)}
          {cells.map((d, i) => (
            <div key={i} className={`min-h-[104px] rounded-lg border p-2 ${d ? (d.status === 'rupture' ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white') : 'border-transparent'}`}>
              {d && (
                <div className="flex h-full flex-col">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-slate-900">{d.day}</span>
                    {d.totalIn > 0 && <span className="text-[11px] tabular-nums text-slate-500">+{short(d.totalIn)}</span>}
                  </div>
                  <ul className="mt-1 flex-1 space-y-0.5">
                    {d.outflows.slice(0, 3).map((f, j) => (
                      <li key={j} className="truncate text-[11px] text-slate-700" title={`${f.label} : ${fmtMAD(f.amount)}`}>
                        <span className="tabular-nums font-medium">-{short(f.amount)}</span> {f.label}
                      </li>
                    ))}
                    {d.outflows.length > 3 && <li className="text-[11px] text-slate-400">+{d.outflows.length - 3} autre(s)</li>}
                  </ul>
                  <div className="mt-1 flex items-center gap-1 border-t border-slate-100 pt-1 text-[11px] tabular-nums text-slate-600" title="Solde en fin de journée">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[d.status] }} />
                    {short(d.balance)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Chaque case : encaissements du jour (+), paiements (-) et solde le soir. Point vert : au-dessus du seuil ; orange : sous le seuil ou à découvert ; rouge : paiement impossible.
      </p>
    </div>
  );
}
