import React from 'react';
import { AlertTriangle, OctagonAlert, ShieldCheck } from 'lucide-react';
import type { SimResult } from '../../../../lib/tresorerieSim';
import { STATUS } from './ui';

const LEVELS = {
  solvable: { label: 'Trésorerie saine', color: STATUS.good, Icon: ShieldCheck },
  tendu: { label: 'Trésorerie tendue', color: STATUS.warning, Icon: AlertTriangle },
  critique: { label: 'Rupture de trésorerie', color: STATUS.critical, Icon: OctagonAlert },
} as const;

/** Semicircle gauge of the solvency index (0-100). */
export function SolvencyGauge({ result, caption }: { result: SimResult; caption?: string }) {
  const level = LEVELS[result.level];
  const arc = 'M 20 120 A 100 100 0 0 1 220 120';
  // Threshold ticks at 40 and 70 on the arc
  const tick = (v: number) => {
    const a = Math.PI * (1 - v / 100);
    return { x1: 120 + 84 * Math.cos(a), y1: 120 - 84 * Math.sin(a), x2: 120 + 116 * Math.cos(a), y2: 120 - 116 * Math.sin(a) };
  };
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 132" className="w-full max-w-[280px]" role="img" aria-label={`Indice de solvabilité ${result.score} sur 100 : ${level.label}`}>
        <path d={arc} fill="none" stroke="#e2e8f0" strokeWidth="18" strokeLinecap="round" />
        <path
          d={arc}
          fill="none"
          stroke={level.color}
          strokeWidth="18"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${Math.max(0.5, result.score)} 100`}
          style={{ transition: 'stroke-dasharray 300ms ease, stroke 300ms ease' }}
        />
        {[40, 70].map((v) => <line key={v} {...tick(v)} stroke="#ffffff" strokeWidth="2.5" />)}
        <text x="120" y="104" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 44, fontWeight: 700 }}>{result.score}</text>
        <text x="120" y="124" textAnchor="middle" className="fill-slate-500" style={{ fontSize: 12 }}>sur 100</text>
      </svg>
      {caption ? (
        <p className="mt-1 text-xs font-medium text-slate-500">{caption}</p>
      ) : (
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <level.Icon className="h-4 w-4" style={{ color: level.color }} aria-hidden />
          {level.label}
        </p>
      )}
    </div>
  );
}
