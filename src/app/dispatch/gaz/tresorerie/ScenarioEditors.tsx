import React from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2 } from 'lucide-react';
import {
  BANK_PRODUCT_TYPES, CATEGORIES, daysIn,
  type BankProduct, type BankProductType, type ChargeRecurrente, type Echeance, type EncaissementPrevu, type FlowCategory, type Frequency, type SimScenario,
} from '../../../../lib/tresorerieSim';
import { NumberInput, WeekdayPicker, fmtMAD, inputClass } from './ui';

type Patch = (patch: Partial<SimScenario>) => void;

const th = 'px-3 py-2.5 text-left text-xs font-semibold text-slate-500 whitespace-nowrap';
const td = 'px-3 py-2 align-middle';
const addButton = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50';

function DaySelect({ month, value, onChange, label }: { month: string; value: number; onChange: (d: number) => void; label: string }) {
  const n = daysIn(month);
  const [y, m] = month.split('-').map(Number);
  return (
    <select aria-label={label} value={Math.min(value, n)} onChange={(e) => onChange(Number(e.target.value))} className={`${inputClass} min-w-[96px]`}>
      {Array.from({ length: n }, (_, i) => i + 1).map((d) => (
        <option key={d} value={d}>{new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</option>
      ))}
    </select>
  );
}

function CategorySelect({ value, onChange }: { value: FlowCategory; onChange: (c: FlowCategory) => void }) {
  return (
    <select aria-label="Catégorie" value={value} onChange={(e) => onChange(e.target.value as FlowCategory)} className={`${inputClass} min-w-[150px]`}>
      {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
    </select>
  );
}

function ImportedTag({ source }: { source?: string }) {
  return source === 'import' ? <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">importé</span> : null;
}

function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

/** Suppliers and other one-off due dates. */
export function EcheancesEditor({ scenario, onChange }: { scenario: SimScenario; onChange: Patch }) {
  const rows = [...scenario.echeances].sort((a, b) => a.day - b.day);
  const update = (id: string, patch: Partial<Echeance>) => onChange({ echeances: scenario.echeances.map((e) => (e.id === id ? { ...e, ...patch, source: 'manuel' } : e)) });
  const toPay = scenario.echeances.filter((e) => !e.paid).reduce((sum, e) => sum + e.amount, 0);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <th className={th}>Fournisseur / bénéficiaire</th><th className={th}>Libellé</th><th className={th}>Catégorie</th>
              <th className={`${th} text-right`}>Montant (MAD)</th><th className={th}>Échéance</th><th className={th}>Déjà payé</th><th className={th}><span className="sr-only">Supprimer</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((e) => (
              <tr key={e.id} className={e.paid ? 'opacity-50' : ''}>
                <td className={td}><input aria-label="Fournisseur" value={e.supplier} onChange={(ev) => update(e.id, { supplier: ev.target.value })} placeholder="ex : Vivo Energy" className={inputClass} /></td>
                <td className={td}>
                  <div className="flex items-center">
                    <input aria-label="Libellé" value={e.label} onChange={(ev) => update(e.id, { label: ev.target.value })} placeholder="ex : Facture n°…" className={`${inputClass} min-w-[200px]`} />
                    <ImportedTag source={e.source} />
                  </div>
                </td>
                <td className={td}><CategorySelect value={e.category} onChange={(category) => update(e.id, { category })} /></td>
                <td className={td}><NumberInput aria-label="Montant" value={e.amount} min={0} onChange={(amount) => update(e.id, { amount })} className="text-right min-w-[110px]" /></td>
                <td className={td}><DaySelect month={scenario.month} label="Jour d'échéance" value={e.day} onChange={(day) => update(e.id, { day })} /></td>
                <td className={`${td} text-center`}><input type="checkbox" aria-label="Déjà payé" checked={!!e.paid} onChange={(ev) => update(e.id, { paid: ev.target.checked })} className="h-4 w-4 accent-blue-600" /></td>
                <td className={td}><DeleteButton label="Supprimer l'échéance" onClick={() => onChange({ echeances: scenario.echeances.filter((x) => x.id !== e.id) })} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">Aucune échéance. Ajoutez vos factures fournisseurs (gaz, gasoil), salaires, CNSS, loyers, impôts…</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-3 py-3">
        <button type="button" className={addButton} onClick={() => onChange({ echeances: [...scenario.echeances, { id: nanoid(), supplier: '', label: '', category: 'fournisseur_gaz', amount: 0, day: 1, source: 'manuel' }] })}>
          <Plus className="h-4 w-4" /> Ajouter une échéance
        </button>
        <p className="text-sm text-slate-600">Reste à payer : <span className="font-semibold text-slate-900 tabular-nums">{fmtMAD(toPay)}</span></p>
      </div>
    </div>
  );
}

export const occurrences = (scenario: SimScenario, c: ChargeRecurrente) => {
  const n = daysIn(scenario.month);
  const [y, m] = scenario.month.split('-').map(Number);
  if (c.frequency === 'mensuelle') return 1;
  let count = 0;
  for (let d = 1; d <= n; d++) {
    const wd = new Date(y, m - 1, d).getDay();
    if (c.frequency === 'quotidienne' ? scenario.workDays.includes(wd) : c.weekdays.includes(wd)) count++;
  }
  return count;
};

const FREQUENCIES: { id: Frequency; label: string }[] = [
  { id: 'quotidienne', label: 'Chaque jour travaillé' },
  { id: 'hebdomadaire', label: 'Certains jours de la semaine' },
  { id: 'mensuelle', label: 'Une fois par mois' },
];

/** Gasoil and other repeated charges. */
export function ChargesEditor({ scenario, onChange }: { scenario: SimScenario; onChange: Patch }) {
  const update = (id: string, patch: Partial<ChargeRecurrente>) => onChange({ charges: scenario.charges.map((c) => (c.id === id ? { ...c, ...patch, source: 'manuel' } : c)) });
  const monthTotal = scenario.charges.reduce((sum, c) => sum + c.amount * occurrences(scenario, c), 0);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <th className={th}>Libellé</th><th className={th}>Catégorie</th><th className={`${th} text-right`}>Montant par paiement</th>
              <th className={th}>Fréquence</th><th className={th}>Quand</th><th className={`${th} text-right`}>Total du mois</th><th className={th}><span className="sr-only">Supprimer</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scenario.charges.map((c) => (
              <tr key={c.id}>
                <td className={td}>
                  <div className="flex items-center">
                    <input aria-label="Libellé" value={c.label} onChange={(ev) => update(c.id, { label: ev.target.value })} placeholder="ex : Gasoil camions" className={`${inputClass} min-w-[200px]`} />
                    <ImportedTag source={c.source} />
                  </div>
                </td>
                <td className={td}><CategorySelect value={c.category} onChange={(category) => update(c.id, { category })} /></td>
                <td className={td}><NumberInput aria-label="Montant par paiement" value={c.amount} min={0} onChange={(amount) => update(c.id, { amount })} className="text-right min-w-[110px]" /></td>
                <td className={td}>
                  <select aria-label="Fréquence" value={c.frequency} onChange={(e) => update(c.id, { frequency: e.target.value as Frequency, weekdays: c.weekdays.length ? c.weekdays : [1] })} className={`${inputClass} min-w-[190px]`}>
                    {FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </td>
                <td className={td}>
                  {c.frequency === 'hebdomadaire' && <WeekdayPicker label="Jours de paiement" value={c.weekdays} onChange={(weekdays) => update(c.id, { weekdays })} />}
                  {c.frequency === 'mensuelle' && <DaySelect month={scenario.month} label="Jour de paiement" value={c.day} onChange={(day) => update(c.id, { day })} />}
                  {c.frequency === 'quotidienne' && <span className="text-xs text-slate-500">{occurrences(scenario, c)} jours ce mois-ci</span>}
                </td>
                <td className={`${td} text-right font-medium text-slate-900 tabular-nums whitespace-nowrap`}>{fmtMAD(c.amount * occurrences(scenario, c))}</td>
                <td className={td}><DeleteButton label="Supprimer la charge" onClick={() => onChange({ charges: scenario.charges.filter((x) => x.id !== c.id) })} /></td>
              </tr>
            ))}
            {scenario.charges.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">Aucune charge récurrente. Ajoutez le gasoil, les achats de gaz réguliers, les péages, l'entretien…</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-3 py-3">
        <button type="button" className={addButton} onClick={() => onChange({ charges: [...scenario.charges, { id: nanoid(), label: '', category: 'gasoil', amount: 0, frequency: 'quotidienne', weekdays: [1], day: 1, source: 'manuel' }] })}>
          <Plus className="h-4 w-4" /> Ajouter une charge
        </button>
        <p className="text-sm text-slate-600">Total du mois (avant leviers) : <span className="font-semibold text-slate-900 tabular-nums">{fmtMAD(monthTotal)}</span></p>
      </div>
    </div>
  );
}

/** Sales parameters and other expected receipts. */
export function EncaissementsEditor({ scenario, onChange }: { scenario: SimScenario; onChange: Patch }) {
  const update = (id: string, patch: Partial<EncaissementPrevu>) => onChange({ encaissements: scenario.encaissements.map((e) => (e.id === id ? { ...e, ...patch, source: 'manuel' } : e)) });
  return (
    <div>
      <div className="grid gap-4 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">Ventes moyennes par jour travaillé</span>
          <NumberInput value={scenario.dailySales} min={0} step={100} onChange={(dailySales) => onChange({ dailySales })} />
        </label>
        <div className="text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">Jours travaillés</span>
          <WeekdayPicker label="Jours travaillés" value={scenario.workDays} onChange={(workDays) => onChange({ workDays })} />
        </div>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">Seuil de sécurité de la caisse</span>
          <NumberInput value={scenario.minReserve} min={0} step={500} onChange={(minReserve) => onChange({ minReserve })} />
        </label>
        <label className="flex items-start gap-2 text-sm sm:pt-7">
          <input type="checkbox" checked={scenario.includePriorCredit} onChange={(e) => onChange({ includePriorCredit: e.target.checked })} className="mt-0.5 h-4 w-4 accent-blue-600" />
          <span className="text-slate-700">Encaisser au début du mois les ventes à crédit du mois précédent</span>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr><th className={th}>Autre encaissement prévu</th><th className={`${th} text-right`}>Montant (MAD)</th><th className={th}>Date</th><th className={th}><span className="sr-only">Supprimer</span></th></tr>
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
              <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">Recouvrement de créances, apport en compte courant, remboursement attendu…</td></tr>
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
                <span className="mb-1 block font-medium text-slate-500">Produit</span>
                <select value={p.type} onChange={(e) => update(p.id, { type: e.target.value as BankProductType })} className={inputClass}>
                  {BANK_PRODUCT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </label>
              <label className="block text-xs">
                <span className="mb-1 flex items-center font-medium text-slate-500">Banque / libellé<ImportedTag source={p.source} /></span>
                <input value={p.label} onChange={(e) => update(p.id, { label: e.target.value })} className={inputClass} />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-slate-500">{isLine ? 'Plafond (MAD)' : p.type === 'echeance_pret' ? 'Mensualité (MAD)' : 'Montant (MAD)'}</span>
                <NumberInput value={p.amount} min={0} step={1000} onChange={(amount) => update(p.id, { amount })} />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-slate-500">Taux annuel %</span>
                <NumberInput value={p.rate} min={0} step={0.25} disabled={p.type === 'echeance_pret'} onChange={(rate) => update(p.id, { rate })} />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-slate-500">{isLine ? 'Disponible dès le' : p.type === 'echeance_pret' ? 'Prélevé le' : 'Versé le'}</span>
                <DaySelect month={scenario.month} label="Jour" value={p.day} onChange={(day) => update(p.id, { day })} />
              </label>
              <label className="block text-xs">
                {p.type === 'credit_tresorerie' && (<><span className="mb-1 block font-medium text-slate-500">Remboursé le</span><DaySelect month={scenario.month} label="Jour de remboursement" value={p.repayDay} onChange={(repayDay) => update(p.id, { repayDay })} /></>)}
                {p.type === 'escompte' && (<><span className="mb-1 block font-medium text-slate-500">Jours d'avance</span><NumberInput value={p.advanceDays} min={0} onChange={(advanceDays) => update(p.id, { advanceDays })} /></>)}
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-slate-500">Frais (MAD)</span>
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
