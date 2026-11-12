import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2 } from 'lucide-react';
import {
  BANK_PRODUCT_TYPES, CATEGORIES, PAYMENT_MODES, countDays, daysIn, installmentWindow, newDepense, normalizeDepense,
  type BankProduct, type BankProductType, type Depense, type EncaissementPrevu, type FlowCategory, type PaymentMode, type Recommendation, type SimScenario,
} from '../../../../lib/tresorerieSim';
import { NumberInput, STATUS, WeekdayPicker, fmtMAD, inputClass } from './ui';

type Patch = (patch: Partial<SimScenario>) => void;

const th = 'px-3 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap';
const td = 'px-3 py-2 align-middle';
const addButton = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50';
const fieldLabel = 'mb-1 block text-xs font-medium text-slate-500';

export const dayName = (month: string, day: number, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' }) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('fr-FR', opts);
};

function DaySelect({ month, value, onChange, label, min = 1, max }: { month: string; value: number; onChange: (d: number) => void; label: string; min?: number; max?: number }) {
  const n = daysIn(month);
  const last = Math.min(n, max ?? n);
  return (
    <select aria-label={label} value={Math.min(Math.max(value, min), last)} onChange={(e) => onChange(Number(e.target.value))} className={`${inputClass} min-w-[92px]`}>
      {Array.from({ length: last - min + 1 }, (_, i) => min + i).map((d) => <option key={d} value={d}>{dayName(month, d)}</option>)}
    </select>
  );
}

function ImportedTag({ source }: { source?: string }) {
  return source === 'import' ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">importé</span> : null;
}

function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

const PRESETS: { label: string; category: FlowCategory; supplier?: string; mode?: PaymentMode; windowStart?: number; windowEnd?: number }[] = [
  { label: 'Paiement gaz', category: 'fournisseur_gaz', supplier: 'Vivo Energy' },
  { label: 'Gasoil', category: 'gasoil', mode: 'quotidien' },
  { label: 'Salaires', category: 'salaires', supplier: 'Personnel' },
  { label: 'CNSS', category: 'charges_sociales', supplier: 'CNSS', windowStart: 1, windowEnd: 10 },
  { label: 'Impôts (TVA, IR…)', category: 'impots', supplier: 'DGI' },
  { label: 'Loyer', category: 'loyer' },
  { label: 'Assurances', category: 'loyer' },
  { label: 'Charges diverses', category: 'autre' },
  { label: 'Autre dépense', category: 'autre' },
];

const REC_STYLE: Record<Recommendation['status'], { color: string; text: (r: Recommendation, month: string) => string }> = {
  ok: { color: STATUS.good, text: (r, m) => `${dayName(m, r.recommendedDay, { weekday: 'long', day: 'numeric' })} : payable sans passer sous le seuil` },
  seuil: { color: STATUS.warning, text: (r, m) => `${dayName(m, r.recommendedDay, { weekday: 'long', day: 'numeric' })} : payable en entamant le seuil de sécurité` },
  decouvert: { color: STATUS.warning, text: (r, m) => `${dayName(m, r.recommendedDay, { weekday: 'long', day: 'numeric' })} : payable seulement avec le découvert` },
  manque: { color: STATUS.critical, text: (r) => `aucun jour ne suffit : il manque ${fmtMAD(r.shortfall)} à la date limite (le ${r.recommendedDay})` },
  reporte: { color: '#94a3b8', text: () => 'à reporter au mois suivant (délai négocié)' },
};

/** Day-by-day payment capacity of the window, as used to choose the best day. */
function CapacityDetail({ rec, month, reserve }: { rec: Recommendation; month: string; reserve: number }) {
  return (
    <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
      <p>
        Capacité de paiement d'un jour = plus petit solde entre ce jour et la fin du mois, moins le seuil de sécurité ({fmtMAD(reserve)}),
        en tenant compte des paiements déjà placés. Le meilleur jour est le premier où elle couvre <strong className="text-slate-900">{fmtMAD(rec.amount)}</strong>.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {rec.capacity.map((c) => {
          const enough = c.value >= rec.amount;
          const chosen = c.day === rec.recommendedDay;
          return (
            <span
              key={c.day}
              className={`rounded-md border px-2 py-1 tabular-nums ${chosen ? 'border-slate-900 bg-white font-semibold text-slate-900' : 'border-slate-200 bg-white'}`}
              title={`${dayName(month, c.day, { weekday: 'long', day: 'numeric' })} : capacité ${fmtMAD(c.value)}`}
            >
              <span className="mr-1 text-slate-400">{dayName(month, c.day)}</span>
              <span style={{ color: enough ? STATUS.good : STATUS.critical }}>{Math.round(c.value / 1000).toLocaleString('fr-FR')} k {enough ? '≥' : '<'}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** The expenses of the month and their due dates (main input of the simulation). */
export function DepensesEditor({ scenario, onChange, recommendations, onApplyBest }: {
  scenario: SimScenario;
  onChange: Patch;
  recommendations: Recommendation[];
  onApplyBest: () => void;
}) {
  const n = daysIn(scenario.month);
  const [openCalc, setOpenCalc] = useState<string | null>(null);
  const [preset, setPreset] = useState(0);
  const update = (id: string, patch: Partial<Depense>) =>
    onChange({ depenses: scenario.depenses.map((d) => (d.id === id ? normalizeDepense({ ...d, ...patch, source: 'manuel' }, n) : d)) });
  const recOf = (id: string, i: number) => recommendations.find((r) => r.depenseId === id && r.index === i);
  const total = scenario.depenses.filter((d) => !d.paid).reduce((sum, d) => sum + d.monthlyAmount, 0);
  const movable = recommendations.filter((r) => r.status !== 'reporte' && r.recommendedDay !== r.plannedDay).length;
  const workDaysCount = countDays(scenario.month, scenario.workDays);

  return (
    <div>
      <ul className="divide-y divide-slate-100">
        {scenario.depenses.map((d) => {
          const k = d.installments;
          return (
            <li key={d.id} className={`p-4 ${d.paid ? 'opacity-50' : ''}`}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.4fr_1.1fr_1.2fr_150px_1.3fr_auto] lg:items-end">
                <label className="col-span-2 block lg:col-span-1">
                  <span className={`${fieldLabel} flex items-center gap-1.5`}>Dépense <ImportedTag source={d.source} /></span>
                  <input value={d.label} onChange={(e) => update(d.id, { label: e.target.value })} placeholder="ex : Paiement gaz" className={inputClass} />
                </label>
                <label className="col-span-2 block lg:col-span-1">
                  <span className={fieldLabel}>Fournisseur / bénéficiaire</span>
                  <input value={d.supplier} onChange={(e) => update(d.id, { supplier: e.target.value })} placeholder="ex : Vivo Energy" className={inputClass} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Catégorie</span>
                  <select value={d.category} onChange={(e) => update(d.id, { category: e.target.value as FlowCategory })} className={inputClass}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className={fieldLabel}>Montant du mois (MAD)</span>
                  <NumberInput value={d.monthlyAmount} min={0} step={1000} onChange={(monthlyAmount) => update(d.id, { monthlyAmount })} className="text-right" />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Paiement</span>
                  <select value={d.mode} onChange={(e) => update(d.id, { mode: e.target.value as PaymentMode })} className={inputClass}>
                    {PAYMENT_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </label>
                <DeleteButton label={`Supprimer ${d.label || 'la dépense'}`} onClick={() => onChange({ depenses: scenario.depenses.filter((x) => x.id !== d.id) })} />
              </div>

              {d.mode === 'echeances' && (
                <>
                  <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2 text-sm">
                    <label className="block">
                      <span className={fieldLabel}>Nombre de paiements</span>
                      <select value={k} onChange={(e) => update(d.id, { installments: Number(e.target.value), days: [] })} className={`${inputClass.replace('w-full ', '')} w-24`}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </label>
                    <div>
                      <span className={fieldLabel}>Fenêtre autorisée (date limite incluse)</span>
                      <div className="flex items-center gap-2">
                        <DaySelect month={scenario.month} label="Payer au plus tôt le" value={d.windowStart} onChange={(windowStart) => update(d.id, { windowStart, days: [] })} />
                        <span className="text-slate-500">au</span>
                        <DaySelect month={scenario.month} label="Date limite" value={d.windowEnd} min={d.windowStart} onChange={(windowEnd) => update(d.id, { windowEnd, days: [] })} />
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 pb-2 text-xs text-slate-600" title="Date fixée par le créancier : elle n'est pas déplacée">
                      <input type="checkbox" checked={!!d.locked} onChange={(e) => update(d.id, { locked: e.target.checked })} className="h-4 w-4 accent-blue-600" /> Date imposée
                    </label>
                    <label className="flex items-center gap-1.5 pb-2 text-xs text-slate-600">
                      <input type="checkbox" checked={!!d.paid} onChange={(e) => update(d.id, { paid: e.target.checked })} className="h-4 w-4 accent-blue-600" /> Déjà payée
                    </label>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {Array.from({ length: k }, (_, i) => {
                      const [ws, we] = installmentWindow(d, i, n);
                      const rec = recOf(d.id, i);
                      const key = `${d.id}-${i}`;
                      return (
                        <li key={key} className="rounded-xl border border-slate-100 p-3">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <span className="min-w-[150px] text-slate-700">
                              {k > 1 ? `Paiement ${i + 1}/${k}` : 'Paiement'} : <strong className="tabular-nums text-slate-900">{fmtMAD(d.monthlyAmount / k)}</strong>
                              {k > 1 && <span className="ml-1 text-xs text-slate-400">(entre le {ws} et le {we})</span>}
                            </span>
                            <label className="flex items-center gap-2 whitespace-nowrap text-slate-600">
                              Prévu le
                              <DaySelect month={scenario.month} label={`Jour prévu du paiement ${i + 1}`} value={d.days[i]} onChange={(day) => update(d.id, { days: d.days.map((x, j) => (j === i ? day : x)) })} />
                            </label>
                            {d.paid ? (
                              <span className="text-xs text-slate-500">Déjà payée</span>
                            ) : d.locked ? (
                              <span className="text-xs text-slate-500">Date imposée : non déplacée</span>
                            ) : rec ? (
                              <span className="flex items-center gap-1.5 text-slate-700">
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: REC_STYLE[rec.status].color }} />
                                <span>Meilleur jour : {rec.status === 'ok' && rec.recommendedDay === d.days[i] ? 'déjà le bon jour' : REC_STYLE[rec.status].text(rec, scenario.month)}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Saisissez un montant</span>
                            )}
                            {rec && !d.paid && !d.locked && rec.capacity.length > 0 && (
                              <button type="button" onClick={() => setOpenCalc(openCalc === key ? null : key)} aria-expanded={openCalc === key} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                {openCalc === key ? 'Masquer le calcul' : 'Voir le calcul'}
                              </button>
                            )}
                          </div>
                          {rec && openCalc === key && <CapacityDetail rec={rec} month={scenario.month} reserve={scenario.minReserve} />}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {d.mode === 'quotidien' && (
                <p className="mt-3 text-sm text-slate-600">
                  Payé chaque jour travaillé : <strong className="tabular-nums text-slate-900">{fmtMAD(workDaysCount ? d.monthlyAmount / workDaysCount : 0)}</strong> par jour ({workDaysCount} jours).
                </p>
              )}
              {d.mode === 'jours_fixes' && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <WeekdayPicker label="Jours de paiement" value={d.weekdays} onChange={(weekdays) => update(d.id, { weekdays })} />
                  <span>
                    {countDays(scenario.month, d.weekdays)} paiements de <strong className="tabular-nums text-slate-900">{fmtMAD(countDays(scenario.month, d.weekdays) ? d.monthlyAmount / countDays(scenario.month, d.weekdays) : 0)}</strong>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3 border-t border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Type de dépense à ajouter" value={preset} onChange={(e) => setPreset(Number(e.target.value))} className={`${inputClass.replace('w-full ', '')} w-48`}>
            {PRESETS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
          </select>
          <button type="button" className={addButton} onClick={() => { const p = PRESETS[preset]; onChange({ depenses: [...scenario.depenses, newDepense(n, { ...p, supplier: p.supplier ?? '' })] }); }}>
            <Plus className="h-4 w-4" /> Ajouter la dépense
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-slate-600">Total du mois : <span className="font-semibold text-slate-900 tabular-nums">{fmtMAD(total)}</span></p>
          <button type="button" disabled={movable === 0} onClick={onApplyBest} className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
            Appliquer les meilleurs jours{movable > 0 ? ` (${movable})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Other expected receipts. */
export function EncaissementsEditor({ scenario, onChange }: { scenario: SimScenario; onChange: Patch }) {
  const update = (id: string, patch: Partial<EncaissementPrevu>) => onChange({ encaissements: scenario.encaissements.map((e) => (e.id === id ? { ...e, ...patch, source: 'manuel' } : e)) });
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr><th className={th}>Encaissement prévu</th><th className={`${th} text-right`}>Montant (MAD)</th><th className={th}>Date</th><th className={th}><span className="sr-only">Supprimer</span></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scenario.encaissements.map((e) => (
              <tr key={e.id}>
                <td className={td}><input aria-label="Libellé" value={e.label} onChange={(ev) => update(e.id, { label: ev.target.value })} placeholder="ex : Recouvrement client X" className={inputClass} /></td>
                <td className={td}><NumberInput aria-label="Montant" value={e.amount} min={0} onChange={(amount) => update(e.id, { amount })} className="text-right min-w-[110px]" /></td>
                <td className={td}><DaySelect month={scenario.month} label="Date d'encaissement" value={e.day} onChange={(day) => update(e.id, { day })} /></td>
                <td className={td}><DeleteButton label="Supprimer l'encaissement" onClick={() => onChange({ encaissements: scenario.encaissements.filter((x) => x.id !== e.id) })} /></td>
              </tr>
            ))}
            {scenario.encaissements.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">En plus du chiffre d'affaires : recouvrement de créances, apport en compte courant, remboursement attendu…</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 px-3 py-3">
        <button type="button" className={addButton} onClick={() => onChange({ encaissements: [...scenario.encaissements, { id: nanoid(), label: '', amount: 0, day: 15, source: 'manuel' }] })}>
          <Plus className="h-4 w-4" /> Ajouter un encaissement
        </button>
      </div>
    </div>
  );
}

/** Overdraft, short-term credit, discounting, loan instalments. */
export function BankEditor({ scenario, onChange }: { scenario: SimScenario; onChange: Patch }) {
  const n = daysIn(scenario.month);
  const update = (id: string, patch: Partial<BankProduct>) => onChange({ bankProducts: scenario.bankProducts.map((p) => (p.id === id ? { ...p, ...patch, source: 'manuel' } : p)) });
  const add = (type: BankProductType) => onChange({
    bankProducts: [...scenario.bankProducts, {
      id: nanoid(), type, label: BANK_PRODUCT_TYPES.find((t) => t.id === type)!.label, amount: 0,
      rate: type === 'echeance_pret' ? 0 : 8, day: 1, repayDay: n, advanceDays: 60, fees: 0, enabled: true, source: 'manuel',
    }],
  });
  return (
    <div>
      <div className="divide-y divide-slate-100">
        {scenario.bankProducts.map((p) => {
          const type = BANK_PRODUCT_TYPES.find((t) => t.id === p.type)!;
          const isLine = p.type === 'decouvert' || p.type === 'facilite_caisse';
          return (
            <div key={p.id} className={`grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[180px_1fr_140px_100px_130px_130px_110px_auto] lg:items-end ${p.enabled ? '' : 'opacity-50'}`}>
              <label className="block text-xs">
                <span className={fieldLabel}>Produit</span>
                <select value={p.type} onChange={(e) => update(p.id, { type: e.target.value as BankProductType })} className={inputClass}>
                  {BANK_PRODUCT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </label>
              <label className="block text-xs">
                <span className={`${fieldLabel} flex items-center gap-1.5`}>Banque / libellé <ImportedTag source={p.source} /></span>
                <input value={p.label} onChange={(e) => update(p.id, { label: e.target.value })} className={inputClass} />
              </label>
              <label className="block text-xs">
                <span className={fieldLabel}>{isLine ? 'Plafond (MAD)' : p.type === 'echeance_pret' ? 'Mensualité (MAD)' : 'Montant (MAD)'}</span>
                <NumberInput value={p.amount} min={0} step={1000} onChange={(amount) => update(p.id, { amount })} />
              </label>
              <label className="block text-xs">
                <span className={fieldLabel}>Taux annuel %</span>
                <NumberInput value={p.rate} min={0} step={0.25} disabled={p.type === 'echeance_pret'} onChange={(rate) => update(p.id, { rate })} />
              </label>
              <label className="block text-xs">
                <span className={fieldLabel}>{isLine ? 'Disponible dès le' : p.type === 'echeance_pret' ? 'Prélevé le' : 'Versé le'}</span>
                <DaySelect month={scenario.month} label="Jour" value={p.day} onChange={(day) => update(p.id, { day })} />
              </label>
              <label className="block text-xs">
                {p.type === 'credit_tresorerie' && (<><span className={fieldLabel}>Remboursé le</span><DaySelect month={scenario.month} label="Jour de remboursement" value={p.repayDay} onChange={(repayDay) => update(p.id, { repayDay })} /></>)}
                {p.type === 'escompte' && (<><span className={fieldLabel}>Jours d'avance</span><NumberInput value={p.advanceDays} min={0} onChange={(advanceDays) => update(p.id, { advanceDays })} /></>)}
              </label>
              <label className="block text-xs">
                <span className={fieldLabel}>Frais (MAD)</span>
                <NumberInput value={p.fees} min={0} disabled={p.type === 'echeance_pret'} onChange={(fees) => update(p.id, { fees })} />
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <input type="checkbox" checked={p.enabled} onChange={(e) => update(p.id, { enabled: e.target.checked })} className="h-4 w-4 accent-blue-600" />
                  Actif
                </label>
                <DeleteButton label="Supprimer le produit bancaire" onClick={() => onChange({ bankProducts: scenario.bankProducts.filter((x) => x.id !== p.id) })} />
              </div>
              <p className="text-xs text-slate-500 sm:col-span-2 lg:col-span-8">{type.help}</p>
            </div>
          );
        })}
        {scenario.bankProducts.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun produit bancaire. Ajoutez votre découvert autorisé, une facilité de caisse, un crédit de trésorerie, un escompte ou vos échéances de prêt et de leasing.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 px-3 py-3">
        {BANK_PRODUCT_TYPES.map((t) => (
          <button key={t.id} type="button" className={addButton} onClick={() => add(t.id)}>
            <Plus className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
