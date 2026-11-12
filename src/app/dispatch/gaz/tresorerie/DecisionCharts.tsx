import React from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { FlowCategory, ProjectionMonth, SensitivityRow, SimResult } from '../../../../lib/tresorerieSim';
import { SERIES, STATUS, fmtMAD } from './ui';

/** Fixed categorical order (validated palette): a scenario keeps its colour as long as it exists. */
export const SCENARIO_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const TOTAL = '#475569';
const AXIS = { stroke: '#c3c2b7', tick: { fill: '#898781', fontSize: 11 }, tickLine: false };
const compact = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000).toLocaleString('fr-FR')} k` : String(Math.round(v)));
const signed = (v: number) => `${v > 0 ? '+' : ''}${fmtMAD(v)}`;

function Box({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-900">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-4 text-slate-600">
          <span className="flex items-center gap-1.5">{r.color && <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: r.color }} />}{r.label}</span>
          <span className="font-semibold tabular-nums text-slate-900">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          {i.dashed ? <span className="w-4 border-t-2 border-dashed" style={{ borderColor: i.color }} /> : <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: i.color }} />}
          {i.label}
        </span>
      ))}
    </div>
  );
}

const SHORT: Record<FlowCategory, string> = {
  fournisseur_gaz: 'Paiement gaz', gasoil: 'Gasoil', salaires: 'Salaires', charges_sociales: 'CNSS', impots: 'Impôts', loyer: 'Loyers & assurances', banque: 'Banque', autre: 'Charges diverses',
};

/** Cash waterfall: opening balance, each source of money, each kind of payment, closing balance. */
export function WaterfallChart({ result: r }: { result: SimResult }) {
  type Item = { name: string; kind: 'total' | 'in' | 'out'; value: number; range: [number, number] };
  const items: Item[] = [];
  let running = r.openingBalance;
  items.push({ name: 'Solde du 1er', kind: 'total', value: running, range: [Math.min(0, running), Math.max(0, running)] });
  const ins: [string, number][] = [
    ['Ventes comptant', r.inflows.comptant], ['Crédit (ventes du mois)', r.inflows.creditDuMois], ['Crédit (mois dernier)', r.inflows.creditMoisPrecedent],
    ['Autres rentrées', r.inflows.autres], ['Banque (fonds reçus)', r.inflows.banque],
  ];
  ins.filter(([, v]) => v > 0).forEach(([name, v]) => { items.push({ name, kind: 'in', value: v, range: [running, running + v] }); running += v; });
  r.outByCategory.forEach((c) => { items.push({ name: SHORT[c.id], kind: 'out', value: -c.amount, range: [running - c.amount, running] }); running -= c.amount; });
  items.push({ name: 'Solde fin de mois', kind: 'total', value: r.closingBalance, range: [Math.min(0, r.closingBalance), Math.max(0, r.closingBalance)] });
  const color = (k: Item['kind']) => (k === 'in' ? SERIES.in : k === 'out' ? SERIES.out : TOTAL);
  return (
    <div>
      <Legend items={[{ label: 'Rentrées', color: SERIES.in }, { label: 'Sorties', color: SERIES.out }, { label: 'Soldes', color: TOTAL }]} />
      <div style={{ height: 34 * items.length + 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }} barCategoryGap={6}>
            <CartesianGrid horizontal={false} stroke="#e1e0d9" />
            <XAxis type="number" {...AXIS} tickFormatter={compact} />
            <YAxis type="category" dataKey="name" {...AXIS} axisLine={false} width={150} interval={0} />
            <ReferenceLine x={0} stroke="#898781" />
            <Tooltip cursor={{ fill: 'rgba(15,23,42,0.04)' }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const it = payload[0].payload as Item;
              return <Box title={it.name} rows={[{ label: it.kind === 'total' ? 'Solde' : it.kind === 'in' ? 'Rentrée' : 'Sortie', value: it.kind === 'total' ? fmtMAD(it.value) : signed(it.value), color: color(it.kind) }, ...(it.kind !== 'total' ? [{ label: 'Solde après', value: fmtMAD(it.kind === 'in' ? it.range[1] : it.range[0]) }] : [])]} />;
            }} />
            <Bar dataKey="range" radius={4} isAnimationActive={false}>
              {items.map((it, i) => <Cell key={i} fill={color(it.kind)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Daily balance of several scenarios on one chart. */
export function ScenarioCompareChart({ series, minReserve }: { series: { id: string; name: string; color: string; result: SimResult }[]; minReserve: number }) {
  const n = Math.max(...series.map((s) => s.result.days.length));
  const data = Array.from({ length: n }, (_, i) => Object.fromEntries([['day', i + 1], ...series.map((s) => [s.id, s.result.days[i]?.balance ?? null])]));
  return (
    <div>
      <Legend items={[...series.map((s) => ({ label: s.name, color: s.color })), ...(minReserve > 0 ? [{ label: `Seuil de sécurité (${fmtMAD(minReserve)})`, color: STATUS.warning, dashed: true }] : [])]} />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="#e1e0d9" />
            <XAxis dataKey="day" {...AXIS} interval="preserveStartEnd" minTickGap={14} />
            <YAxis {...AXIS} axisLine={false} tickFormatter={compact} width={48} />
            <ReferenceLine y={0} stroke="#898781" />
            {minReserve > 0 && <ReferenceLine y={minReserve} stroke={STATUS.warning} strokeDasharray="4 4" ifOverflow="extendDomain" />}
            <Tooltip cursor={{ stroke: '#c3c2b7' }} content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return <Box title={`Jour ${label}`} rows={series.map((s) => ({ label: s.name, value: fmtMAD(Number((payload[0].payload as Record<string, number>)[s.id] ?? 0)), color: s.color }))} />;
            }} />
            {series.map((s) => <Line key={s.id} type="monotone" dataKey={s.id} name={s.name} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Tornado chart: effect of each factor on the month's cash flow, unfavourable to the left, favourable to the right. */
export function TornadoChart({ rows }: { rows: SensitivityRow[] }) {
  const data = rows.map((r) => ({ ...r, bad: r.unfavourable, good: r.favourable }));
  return (
    <div>
      <Legend items={[{ label: 'Évolution défavorable', color: SERIES.out }, { label: 'Évolution favorable', color: SERIES.in }]} />
      <div style={{ height: 40 * data.length + 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" stackOffset="sign" margin={{ top: 4, right: 16, bottom: 4, left: 4 }} barCategoryGap={8}>
            <CartesianGrid horizontal={false} stroke="#e1e0d9" />
            <XAxis type="number" {...AXIS} tickFormatter={(v) => `${v > 0 ? '+' : ''}${compact(v)}`} />
            <YAxis type="category" dataKey="label" {...AXIS} axisLine={false} width={150} interval={0} />
            <ReferenceLine x={0} stroke="#898781" />
            <Tooltip cursor={{ fill: 'rgba(15,23,42,0.04)' }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload as SensitivityRow;
              return <Box title={r.label} rows={[{ label: r.unfavourableLabel, value: signed(r.unfavourable), color: SERIES.out }, { label: r.favourableLabel, value: signed(r.favourable), color: SERIES.in }]} />;
            }} />
            <Bar dataKey="bad" stackId="t" fill={SERIES.out} radius={[4, 0, 0, 4]} isAnimationActive={false} />
            <Bar dataKey="good" stackId="t" fill={SERIES.in} radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Balance day by day over several months, with the month changes marked. */
export function ProjectionChart({ months, minReserve }: { months: ProjectionMonth[]; minReserve: number }) {
  const data = months.flatMap((m, mi) => m.result.days.map((d) => ({ key: `${mi}-${d.day}`, label: d.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), balance: d.balance, d, first: d.day === 1, monthName: d.date.toLocaleDateString('fr-FR', { month: 'long' }) })));
  return (
    <div>
      <Legend items={[{ label: 'Solde', color: SERIES.in }, ...(minReserve > 0 ? [{ label: `Seuil de sécurité (${fmtMAD(minReserve)})`, color: STATUS.warning, dashed: true }] : []), { label: 'Paiement impossible', color: STATUS.critical }]} />
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 18, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="#e1e0d9" />
            <XAxis dataKey="key" {...AXIS} interval={0} tickFormatter={(k: string, i: number) => (data[i]?.first ? data[i].label : '')} />
            <YAxis {...AXIS} axisLine={false} tickFormatter={compact} width={48} />
            <ReferenceLine y={0} stroke="#898781" />
            {minReserve > 0 && <ReferenceLine y={minReserve} stroke={STATUS.warning} strokeDasharray="4 4" ifOverflow="extendDomain" />}
            {data.filter((p) => p.first).map((p) => (
              <ReferenceLine key={p.key} x={p.key} stroke="#c3c2b7" label={{ value: p.monthName, position: 'insideTopLeft', fill: '#52514e', fontSize: 11 }} />
            ))}
            <Tooltip cursor={{ stroke: '#c3c2b7' }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof data)[number];
              return <Box title={p.d.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })} rows={[{ label: 'Solde', value: fmtMAD(p.balance) }, { label: 'Rentrées', value: fmtMAD(p.d.totalIn), color: SERIES.in }, { label: 'Sorties', value: fmtMAD(p.d.totalOut), color: SERIES.out }]} />;
            }} />
            <Line type="monotone" dataKey="balance" stroke={SERIES.in} strokeWidth={2} isAnimationActive={false} activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
              dot={(props: { cx?: number; cy?: number; payload?: (typeof data)[number]; index?: number }) => {
                const { cx, cy, payload, index } = props;
                if (cx === undefined || cy === undefined || payload?.d.status !== 'rupture') return <g key={`p-${index}`} />;
                return <circle key={`p-${index}`} cx={cx} cy={cy} r={4} fill={STATUS.critical} stroke="#fff" strokeWidth={2} />;
              }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
