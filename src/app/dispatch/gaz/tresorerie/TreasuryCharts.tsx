import React from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SimResult } from '../../../../lib/tresorerieSim';
import { SERIES, STATUS, fmtMAD } from './ui';

const AXIS = { stroke: '#c3c2b7', tick: { fill: '#898781', fontSize: 11 }, tickLine: false };
const compact = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000).toLocaleString('fr-FR')} k` : String(Math.round(v)));
const dayLabel = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const STATUS_LABEL = { ok: 'Normal', sous_seuil: 'Sous le seuil de sécurité', decouvert: 'À découvert', rupture: 'Paiements impossibles' } as const;

function TooltipBox({ title, rows, note }: { title: string; rows: { label: string; value: string; color?: string }[]; note?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-900">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-4 text-slate-600">
          <span className="flex items-center gap-1.5">
            {r.color && <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: r.color }} />}
            {r.label}
          </span>
          <span className="font-semibold text-slate-900 tabular-nums">{r.value}</span>
        </p>
      ))}
      {note && <p className="mt-1 text-slate-500">{note}</p>}
    </div>
  );
}

export function BalanceChart({ result, minReserve }: { result: SimResult; minReserve: number }) {
  const data = result.days.map((d) => ({ day: d.day, balance: d.balance, d }));
  const dash = (color: string) => <span className="w-4 border-t-2 border-dashed" style={{ borderColor: color }} />;
  return (
    <div>
    <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ backgroundColor: SERIES.in }} />Solde</span>
      {minReserve > 0 && <span className="flex items-center gap-1.5">{dash(STATUS.warning)}Seuil de sécurité ({fmtMAD(minReserve)})</span>}
      {result.overdraftLimit > 0 && <span className="flex items-center gap-1.5">{dash(STATUS.critical)}Plafond du découvert (-{fmtMAD(result.overdraftLimit)})</span>}
      {result.ruptureDays > 0 && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS.critical }} />Échéance impossible à payer</span>}
    </div>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid vertical={false} stroke="#e1e0d9" />
          <XAxis dataKey="day" {...AXIS} interval="preserveStartEnd" minTickGap={14} />
          <YAxis {...AXIS} axisLine={false} tickFormatter={compact} width={48} />
          <ReferenceLine y={0} stroke="#898781" />
          {minReserve > 0 && <ReferenceLine y={minReserve} stroke={STATUS.warning} strokeDasharray="4 4" ifOverflow="extendDomain" />}
          {result.overdraftLimit > 0 && <ReferenceLine y={-result.overdraftLimit} stroke={STATUS.critical} strokeDasharray="4 4" ifOverflow="extendDomain" />}
          <Tooltip
            cursor={{ stroke: '#c3c2b7' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = (payload[0].payload as { d: SimResult['days'][number] }).d;
              return (
                <TooltipBox
                  title={dayLabel(d.date)}
                  rows={[
                    { label: 'Solde', value: fmtMAD(d.balance) },
                    { label: 'Encaissements', value: fmtMAD(d.totalIn), color: SERIES.in },
                    { label: 'Décaissements', value: fmtMAD(d.totalOut), color: SERIES.out },
                  ]}
                  note={STATUS_LABEL[d.status]}
                />
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Solde"
            stroke={SERIES.in}
            strokeWidth={2}
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; payload?: { d: SimResult['days'][number] }; index?: number }) => {
              const { cx, cy, payload, index } = props;
              if (cx === undefined || cy === undefined || payload?.d.status !== 'rupture') return <g key={`dot-${index}`} />;
              return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4.5} fill={STATUS.critical} stroke="#ffffff" strokeWidth={2} />;
            }}
            activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    </div>
  );
}
