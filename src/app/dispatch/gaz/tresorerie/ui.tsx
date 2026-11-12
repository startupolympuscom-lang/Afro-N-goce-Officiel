import React from 'react';

export const card = 'bg-white rounded-2xl border border-slate-200 shadow-xs';
export const inputClass =
  'w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:bg-slate-50';

export const fmtMAD = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} MAD`;
export const fmtPct = (v: number, digits = 0) => `${(v * 100).toLocaleString('fr-FR', { maximumFractionDigits: digits })} %`;

/** Status colors (reserved for state: never used for a data series). */
export const STATUS = { good: '#0ca30c', warning: '#fab219', critical: '#d03b3b' } as const;
/** Series colors (identity). */
export const SERIES = { in: '#2a78d6', out: '#eb6834' } as const;

export const WEEKDAYS = [
  { id: 1, short: 'L', label: 'Lundi' },
  { id: 2, short: 'M', label: 'Mardi' },
  { id: 3, short: 'M', label: 'Mercredi' },
  { id: 4, short: 'J', label: 'Jeudi' },
  { id: 5, short: 'V', label: 'Vendredi' },
  { id: 6, short: 'S', label: 'Samedi' },
  { id: 0, short: 'D', label: 'Dimanche' },
];

export function NumberInput({ value, onChange, min, max, step = 1, className = '', ...rest }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min' | 'max' | 'step'>) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        onChange(Number.isFinite(v) ? (max !== undefined ? Math.min(max, v) : v) : 0);
      }}
      className={`${inputClass} tabular-nums ${className}`}
      {...rest}
    />
  );
}

export function WeekdayPicker({ value, onChange, label }: { value: number[]; onChange: (v: number[]) => void; label: string }) {
  return (
    <div className="flex gap-1" role="group" aria-label={label}>
      {WEEKDAYS.map((d) => {
        const on = value.includes(d.id);
        return (
          <button
            key={d.id}
            type="button"
            title={d.label}
            aria-label={d.label}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== d.id) : [...value, d.id])}
            className={`h-8 w-8 rounded-md text-xs font-semibold transition-colors ${on ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {d.short}
          </button>
        );
      })}
    </div>
  );
}

export function Meter({ label, value, display, hint }: { label: string; value: number; display: string; hint?: string }) {
  const v = Math.max(0, Math.min(1, value));
  const color = v >= 0.7 ? STATUS.good : v >= 0.4 ? STATUS.warning : STATUS.critical;
  return (
    <div title={hint}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900 tabular-nums">{display}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${v * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
