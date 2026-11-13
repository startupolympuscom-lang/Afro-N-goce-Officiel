import React, { useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { getCompany } from '../../../../lib/dispatchCompanies';
import { Card, EmptyState, Segmented, buttonSecondary, inputClass, nf } from '../../../../components/dispatch/DispatchUI';
import { ACTION_LABELS, type CompanyFilter, localDay, matchesCompany } from './stockUtils';
import { generateStockReport } from './stockReport';
import type { StockActivityLog } from '../../../../stores/useDispatchGazStore';

type Kind = 'all' | 'chauffeurs' | 'comptoir' | 'ajustements' | 'avaries';
const KIND_ACTIONS: Record<Exclude<Kind, 'all'>, StockActivityLog['action'][]> = {
  chauffeurs: ['dispatch_driver', 'return_driver'],
  comptoir: ['dispatch_comptoir'],
  ajustements: ['set_global'],
  avaries: ['declare_damaged', 'repair_damaged'],
};
/** Direction of each movement for the depot: out of the depot, back into it, or a correction. */
const SIGN: Record<StockActivityLog['action'], '+' | '−' | '±'> = {
  dispatch_driver: '−', dispatch_comptoir: '−', return_driver: '+', set_global: '±', declare_damaged: '−', repair_damaged: '+',
};
const signed = (v: number | undefined, sign: '+' | '−' | '±') => {
  if (!v) return '';
  if (sign === '±') return v > 0 ? `+${nf(v)}` : `−${nf(Math.abs(v))}`;
  return `${sign}${nf(Math.abs(v))}`;
};

export default function StockHistory({ company }: { company: CompanyFilter }) {
  const store = useDispatchGazStore();
  const { brands, stockActivities, globalStockHistory } = store;
  const [day, setDay] = useState(localDay());
  const [kind, setKind] = useState<Kind>('all');
  const [showAll, setShowAll] = useState(false);
  const brandName = (id?: string) => brands.find((b) => b.id === id)?.name || id || '—';

  const activities = useMemo(() => (stockActivities || [])
    .filter((a) => localDay(a.date) === day && matchesCompany(company, a.company))
    .filter((a) => kind === 'all' || KIND_ACTIONS[kind].includes(a.action))
    .sort((a, b) => b.date.localeCompare(a.date)), [stockActivities, day, company, kind]);

  const adjustments = useMemo(() => [...(globalStockHistory || [])]
    .filter((h) => matchesCompany(company, h.company))
    .sort((a, b) => b.date.localeCompare(a.date)), [globalStockHistory, company]);

  return (
    <div className="space-y-5">
      <Card title="Mouvements de stock" subtitle="Chargements, retours, comptoir, avaries et ajustements, jour par jour."
        actions={
          <button type="button" className={buttonSecondary}
            onClick={() => generateStockReport({ day, company, brands, drivers: store.drivers, globalStock: store.globalStock, comptoirStock: store.comptoirStock || [], stockDispatches: store.stockDispatches, stockActivities: store.stockActivities || [] })}>
            <FileDown className="h-4 w-4" /> Rapport PDF
          </button>
        }>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
          <input type="date" value={day} max={localDay()} onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Jour" className={inputClass} />
          <Segmented<Kind> label="Type de mouvement" value={kind} onChange={setKind} options={[
            { id: 'all', label: 'Tout' }, { id: 'chauffeurs', label: 'Chauffeurs' }, { id: 'comptoir', label: 'Comptoir' },
            { id: 'ajustements', label: 'Ajustements' }, { id: 'avaries', label: 'Avaries' },
          ]} />
        </div>
        {activities.length === 0 ? <EmptyState>Aucun mouvement ce jour-là.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50/60 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Heure</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Opération</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Société</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Produit</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Pleines</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Vides</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Avariées</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((a) => {
                  const c = getCompany(a.company);
                  const sign = SIGN[a.action] || '±';
                  const damagedSign = a.action === 'declare_damaged' ? '+' : sign;
                  return (
                    <tr key={a.id}>
                      <td className="px-4 py-2 tabular-nums text-slate-500">{new Date(a.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{ACTION_LABELS[a.action] || a.action}</td>
                      <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${c.badge}`}>{c.short}</span></td>
                      <td className="px-3 py-2 text-slate-700">{brandName(a.brandId)} {a.category}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{signed(a.quantityFull, sign)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{signed(a.quantityEmpty, sign)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{signed(a.quantityDamaged, damagedSign)}</td>
                      <td className="px-4 py-2 text-xs text-slate-500">{a.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">+ entre au dépôt (ou au stock avarié), − sort du dépôt. Les ventes ne figurent pas ici : elles réduisent le stock des camions et du comptoir.</p>
      </Card>

      <Card title="Ajustements et inventaires" subtitle="Toutes les corrections manuelles du stock du dépôt, protégées par le code de sécurité.">
        {adjustments.length === 0 ? <EmptyState>Aucun ajustement enregistré.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50/60 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Société</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Produit</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Pleines</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Vides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(showAll ? adjustments : adjustments.slice(0, 30)).map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2 tabular-nums text-slate-500">{new Date(h.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-3 py-2 text-slate-700">{getCompany(h.company).short}</td>
                    <td className="px-3 py-2 text-slate-900">{brandName(h.brandId)} {h.category}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${h.deltaFull > 0 ? 'text-emerald-700' : h.deltaFull < 0 ? 'text-red-600' : 'text-slate-300'}`}>{h.deltaFull > 0 ? `+${h.deltaFull}` : h.deltaFull}</td>
                    <td className={`px-4 py-2 text-right tabular-nums ${h.deltaEmpty > 0 ? 'text-emerald-700' : h.deltaEmpty < 0 ? 'text-red-600' : 'text-slate-300'}`}>{h.deltaEmpty > 0 ? `+${h.deltaEmpty}` : h.deltaEmpty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {adjustments.length > 30 && !showAll && (
              <button type="button" onClick={() => setShowAll(true)} className="w-full border-t border-slate-100 py-2.5 text-sm font-medium text-blue-600 hover:bg-slate-50">Afficher les {adjustments.length - 30} plus anciens</button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
