import React from 'react';
import type { SimResult } from '../../../../lib/tresorerieSim';
import { fmtMAD } from './ui';

function Row({ label, value, sign, strong, muted }: { label: string; value: number; sign?: '+' | '−' | '='; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 px-5 py-2 text-sm ${strong ? 'bg-slate-50 font-semibold text-slate-900' : muted ? 'text-slate-500' : 'text-slate-700'}`}>
      <span><span className="inline-block w-4 text-slate-400">{sign}</span>{label}</span>
      <span className={`tabular-nums ${value < 0 ? 'text-red-700' : ''}`}>{fmtMAD(value)}</span>
    </div>
  );
}

/** Where the money of the month comes from and where it goes: opening balance + receipts - payments = closing balance. */
export function CashStatement({ result: r }: { result: SimResult }) {
  const i = r.inflows;
  const ins = [
    { label: 'Ventes payées comptant', value: i.comptant },
    { label: 'Clients à crédit (ventes du mois)', value: i.creditDuMois },
    { label: 'Clients à crédit (ventes du mois dernier)', value: i.creditMoisPrecedent },
    { label: "Autres rentrées d'argent", value: i.autres },
    { label: 'Argent de la banque (crédit, escompte)', value: i.banque },
  ].filter((x) => x.value > 0);
  const totalIn = ins.reduce((sum, x) => sum + x.value, 0);
  return (
    <div className="divide-y divide-slate-100">
      <Row label="Solde en caisse le 1er" value={r.openingBalance} strong />
      {ins.map((x) => <Row key={x.label} label={x.label} value={x.value} sign="+" />)}
      <Row label="Total des rentrées" value={totalIn} muted />
      {r.outByCategory.map((c) => <Row key={c.id} label={c.label} value={c.amount} sign="−" />)}
      <Row label="Total des sorties" value={r.totalOut} muted />
      <Row label="Solde en caisse en fin de mois" value={r.closingBalance} sign="=" strong />
      <div className="flex items-baseline justify-between gap-4 px-5 py-3 text-sm">
        <span className="font-semibold text-slate-900">Flux de trésorerie du mois (rentrées − sorties)</span>
        <span className={`text-base font-bold tabular-nums ${r.cashFlow < 0 ? 'text-red-700' : 'text-slate-900'}`}>{r.cashFlow > 0 ? '+' : ''}{fmtMAD(r.cashFlow)}</span>
      </div>
      {r.deferredToNextMonth > 0 && (
        <div className="flex items-baseline justify-between gap-4 px-5 py-2 text-sm">
          <span className="text-slate-700">Flux net en comptant les paiements reportés au mois prochain</span>
          <span className={`font-semibold tabular-nums ${r.netFlow < 0 ? 'text-red-700' : 'text-slate-900'}`}>{r.netFlow > 0 ? '+' : ''}{fmtMAD(r.netFlow)}</span>
        </div>
      )}
      {(r.creditNextMonth > 0 || r.deferredToNextMonth > 0) && (
        <div className="space-y-0.5 px-5 py-3 text-xs text-slate-500">
          {r.creditNextMonth > 0 && <p>Ventes à crédit de ce mois encaissées le mois prochain : {fmtMAD(r.creditNextMonth)} (elles comptent dans le chiffre d'affaires, pas dans la caisse de ce mois).</p>}
          {r.deferredToNextMonth > 0 && <p>Paiements gaz reportés au mois prochain grâce au délai : {fmtMAD(r.deferredToNextMonth)} (gain ponctuel : ils seront à payer le mois prochain).</p>}
        </div>
      )}
    </div>
  );
}
