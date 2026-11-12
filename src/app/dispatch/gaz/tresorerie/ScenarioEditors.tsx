import React from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2 } from 'lucide-react';
import {
  BANK_PRODUCT_TYPES, countDays, daysIn, expenseFactor, newDepense, normalizeDepense,
  type BankProduct, type BankProductType, type Depense, type EncaissementPrevu, type Recommendation, type SimScenario,
} from '../../../../lib/tresorerieSim';
import { applyStyle, styleOf, styleOptions, type PaymentStyle } from './paymentStyle';
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

const QUICK_ADD: { label: string; patch: Partial<Depense> }[] = [
  { label: 'Loyer', patch: { label: 'Loyer', category: 'loyer' } },
  { label: 'Assurances', patch: { label: 'Assurances', category: 'loyer' } },
  { label: 'Crédit / leasing', patch: { label: 'Échéance crédit / leasing', category: 'banque', locked: true } },
  { label: 'Autre dépense', patch: { label: '', category: 'autre' } },
];

export const STATUS_TEXT: Record<Recommendation['status'], { color: string; label: string }> = {
  ok: { color: STATUS.good, label: 'La caisse reste au-dessus du seuil' },
  seuil: { color: STATUS.warning, label: 'Payable en entamant le seuil de sécurité' },
  decouvert: { color: STATUS.warning, label: 'Payable seulement avec le découvert' },
  manque: { color: STATUS.critical, label: 'Pas assez de trésorerie, même à la date limite' },
  reporte: { color: '#94a3b8', label: 'Reporté au mois suivant (délai négocié)' },
};

/** Suggested date(s) of an expense, next to its inputs. */
function SuggestedDates({ dep, recs, month, workDaysCount }: { dep: Depense; recs: Recommendation[]; month: string; workDaysCount: number }) {
  if (dep.monthlyAmount <= 0) return <span className="text-xs text-slate-400">Saisissez le montant</span>;
  if (dep.mode === 'quotidien') return <span className="text-sm text-slate-600">{fmtMAD(workDaysCount ? dep.monthlyAmount / workDaysCount : 0)} chaque jour travaillé</span>;
  if (dep.mode === 'jours_fixes') return <span className="text-sm text-slate-600">Aux jours choisis</span>;
  if (dep.locked) return <span className="text-sm text-slate-600">Le {dep.days[0]} (date fixe)</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {recs.map((r) => {
        const st = STATUS_TEXT[r.status];
        const text = r.status === 'reporte' ? 'mois suivant' : dayName(month, r.recommendedDay);
        return (
          <span key={r.index} title={`${r.installments > 1 ? `Paiement ${r.index + 1}/${r.installments} : ` : ''}${fmtMAD(r.amount)} — ${st.label}${r.shortfall > 0 ? ` (il manque ${fmtMAD(r.shortfall)})` : ''}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-900">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: st.color }} />
            {text}
          </span>
        );
      })}
      {recs.some((r) => r.status === 'manque') && (
        <span className="w-full text-xs text-red-700">Il manque {fmtMAD(recs.reduce((sum, r) => sum + r.shortfall, 0))}</span>
      )}
    </div>
  );
}

/** The expenses of the month: what is paid, how, and until when. The suggested dates are shown on each line. */
export function DepensesTable({ scenario, onChange, recommendations }: { scenario: SimScenario; onChange: Patch; recommendations: Recommendation[] }) {
  const n = daysIn(scenario.month);
  const workDaysCount = countDays(scenario.month, scenario.workDays);
  const update = (id: string, patch: Partial<Depense>) =>
    onChange({ depenses: scenario.depenses.map((d) => (d.id === id ? normalizeDepense({ ...d, ...patch, source: 'manuel' }, n) : d)) });
  const replace = (dep: Depense) => onChange({ depenses: scenario.depenses.map((d) => (d.id === dep.id ? dep : d)) });
  const total = scenario.depenses.filter((d) => !d.paid).reduce((sum, d) => sum + d.monthlyAmount, 0);
  const totalWithScenario = scenario.depenses.filter((d) => !d.paid).reduce((sum, d) => sum + d.monthlyAmount * expenseFactor(scenario.levers, d.category), 0);
  const turnover = Math.max(0, scenario.monthlyTurnover) * (1 + scenario.levers.salesPct / 100);
  const cols = 'md:grid-cols-[minmax(140px,1.3fr)_130px_200px_minmax(250px,1.4fr)_minmax(160px,1.2fr)_36px]';

  return (
    <div>
      <div className={`hidden gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs font-semibold text-slate-500 md:grid ${cols}`}>
        <span>Dépense</span><span className="text-right">Montant du mois</span><span>Comment c'est payé</span><span>Période de paiement</span><span>Date conseillée</span><span />
      </div>
      <ul className="divide-y divide-slate-100">
        {scenario.depenses.map((d) => {
          const style = styleOf(d);
          const recs = recommendations.filter((r) => r.depenseId === d.id).sort((a, b) => a.index - b.index);
          return (
            <li key={d.id} className={`grid grid-cols-2 items-center gap-3 px-5 py-3 ${cols}`}>
              <input aria-label="Dépense" value={d.label} onChange={(e) => update(d.id, { label: e.target.value })} placeholder="Nom de la dépense" className={`${inputClass} col-span-2 md:col-span-1`} />
              <div>
                <NumberInput aria-label={`Montant du mois : ${d.label}`} value={d.monthlyAmount} min={0} step={1000} onChange={(monthlyAmount) => update(d.id, { monthlyAmount })} className="text-right" />
                {d.monthlyAmount > 0 && (
                  <p className="mt-0.5 text-right text-[11px] leading-tight text-slate-500">
                    {expenseFactor(scenario.levers, d.category) !== 1
                      ? <span className="font-medium text-slate-700">{fmtMAD(d.monthlyAmount * expenseFactor(scenario.levers, d.category))} avec le scénario</span>
                      : turnover > 0 ? `${((d.monthlyAmount / turnover) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % du CA` : null}
                  </p>
                )}
              </div>
              <select aria-label={`Comment est payé : ${d.label}`} value={style} onChange={(e) => replace(applyStyle(d, e.target.value as PaymentStyle, n))} className={inputClass}>
                {styleOptions(d).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <div className="col-span-2 flex items-center gap-2 text-sm text-slate-500 md:col-span-1">
                {(style === 'une_fois' || style === 'deux_fois' || style === 'quatre_fois' || style === 'n_fois') && (
                  <>
                    <span>du</span>
                    <DaySelect month={scenario.month} label={`Payer au plus tôt le : ${d.label}`} value={d.windowStart} onChange={(windowStart) => update(d.id, { windowStart, windowEnd: Math.max(windowStart, d.windowEnd), days: [] })} />
                    <span>au</span>
                    <DaySelect month={scenario.month} label={`Date limite : ${d.label}`} value={d.windowEnd} min={d.windowStart} onChange={(windowEnd) => update(d.id, { windowEnd, days: [] })} />
                  </>
                )}
                {style === 'date_fixe' && (
                  <>
                    <span>le</span>
                    <DaySelect month={scenario.month} label={`Date du prélèvement : ${d.label}`} value={d.days[0]} onChange={(day) => update(d.id, { windowStart: day, windowEnd: day, days: [day] })} />
                  </>
                )}
                {style === 'chaque_jour' && <span>Tout le mois ({workDaysCount} jours)</span>}
                {style === 'jours_fixes' && <WeekdayPicker label={`Jours de paiement : ${d.label}`} value={d.weekdays} onChange={(weekdays) => update(d.id, { weekdays })} />}
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="mb-1 block text-xs font-medium text-slate-500 md:hidden">Date conseillée</span>
                <SuggestedDates dep={d} recs={recs} month={scenario.month} workDaysCount={workDaysCount} />
              </div>
              <div className="col-span-2 flex justify-end md:col-span-1">
                <DeleteButton label={`Supprimer ${d.label || 'la dépense'}`} onClick={() => onChange({ depenses: scenario.depenses.filter((x) => x.id !== d.id) })} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Ajouter :</span>
          {QUICK_ADD.map((q) => (
            <button key={q.label} type="button" className={addButton}
              onClick={() => {
                const dep = newDepense(n, { ...q.patch, locked: false });
                onChange({ depenses: [...scenario.depenses, q.patch.locked ? applyStyle(dep, 'date_fixe', n) : dep] });
              }}>
              <Plus className="h-4 w-4" /> {q.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-600">
          Total des dépenses : <span className="font-semibold text-slate-900 tabular-nums">{fmtMAD(total)}</span>
          {Math.round(totalWithScenario) !== Math.round(total) && <span className="ml-1 text-slate-500">({fmtMAD(totalWithScenario)} avec le scénario)</span>}
          {turnover > 0 && <span className="ml-1 text-slate-500">· {((totalWithScenario / turnover) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % du CA</span>}
        </p>
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
              {isLine ? (
                <p className="text-xs text-slate-500 lg:pb-2.5">Disponible tout le mois</p>
              ) : (
                <label className="block text-xs">
                  <span className={fieldLabel}>{p.type === 'echeance_pret' ? 'Prélevé le' : 'Versé le'}</span>
                  <DaySelect month={scenario.month} label="Jour" value={p.day} onChange={(day) => update(p.id, { day })} />
                </label>
              )}
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
