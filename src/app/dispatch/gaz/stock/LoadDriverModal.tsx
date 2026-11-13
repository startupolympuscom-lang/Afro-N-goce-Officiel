import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useDispatchGazStore, type StockDispatch } from '../../../../stores/useDispatchGazStore';
import { companyOf, getCompany } from '../../../../lib/dispatchCompanies';
import { Modal, NumberField, buttonPrimary, buttonSecondary, inputClass, nf } from '../../../../components/dispatch/DispatchUI';
import { type CompanyFilter, driverName, findStock, fullLeft, isCheckedIn, matchesCompany, productList } from './stockUtils';

export default function LoadDriverModal({ company, initialDriverId, onClose }: { company: CompanyFilter; initialDriverId?: string; onClose: () => void }) {
  const { drivers, brands, globalStock, stockDispatches, pointages, dispatchStockBatch, addStockActivity } = useDispatchGazStore();
  const [driverId, setDriverId] = useState(initialDriverId || '');
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState<Record<string, number>>({});

  const openLoads = stockDispatches.filter((d) => !d.isValidated);
  const candidates = useMemo(() => drivers
    .filter((d) => d.status !== 'inactif' || d.id === initialDriverId)
    .filter((d) => matchesCompany(company, d.company))
    .filter((d) => !search.trim() || driverName(d).toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => driverName(a).localeCompare(driverName(b))), [drivers, company, search, initialDriverId]);

  const driver = drivers.find((d) => d.id === driverId);
  const driverCompany = companyOf(driver?.company);
  const products = productList(brands).map((p) => {
    const available = findStock(globalStock, p.brandId, p.category, driverCompany)?.full || 0;
    const inTruck = openLoads.filter((d) => d.driverId === driverId && d.brandId === p.brandId && d.category === p.category).reduce((s, d) => s + fullLeft(d), 0);
    return { ...p, available, inTruck, q: qty[p.key] || 0 };
  });
  const total = products.reduce((s, p) => s + p.q, 0);
  const overStock = products.filter((p) => p.q > p.available);

  const submit = () => {
    if (!driver) { toast.error('Choisissez un chauffeur.'); return; }
    const items = products.filter((p) => p.q > 0);
    if (!items.length) { toast.error('Saisissez au moins une quantité.'); return; }
    if (overStock.length) {
      overStock.forEach((p) => toast.error(`Stock insuffisant au dépôt ${getCompany(driverCompany).short} pour ${p.brand.name} ${p.category} (${p.available} disponible).`));
      return;
    }
    if (!isCheckedIn(pointages, driver.id)) toast.warning("Note : le chauffeur n'a pas encore enregistré son pointage aujourd'hui.");
    const batch: StockDispatch[] = items.map((p) => {
      addStockActivity({ action: 'dispatch_driver', company: driverCompany, brandId: p.brandId, category: p.category, quantityFull: p.q, description: `Affectation à ${driver.prenom} ${driver.nom}` });
      return { id: nanoid(), driverId: driver.id, brandId: p.brandId, category: p.category, quantity: p.q, date: new Date().toISOString(), sold: 0, soldConsigned: 0, isValidated: false };
    });
    dispatchStockBatch(batch);
    toast.success(`${nf(total)} bouteille(s) chargée(s) pour ${driverName(driver)}.`);
    onClose();
  };

  return (
    <Modal title="Charger un chauffeur" subtitle="Les bouteilles pleines sortent du dépôt de la société du chauffeur." onClose={onClose} size="xl"
      footer={<>
        <span className="mr-auto text-sm text-slate-600">{driver ? <>Total : <strong className="text-slate-900">{nf(total)}</strong> bouteille(s) pour {driverName(driver)}</> : 'Choisissez un chauffeur'}</span>
        <button type="button" className={buttonSecondary} onClick={onClose}>Annuler</button>
        <button type="button" className={buttonPrimary} onClick={submit} disabled={!driver || total === 0 || overStock.length > 0}>Charger le camion</button>
      </>}>
      <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="border-b border-slate-100 p-4 md:border-b-0 md:border-r">
          <p className="mb-2 text-xs font-semibold text-slate-500">1. Chauffeur</p>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher" aria-label="Rechercher un chauffeur" className={`${inputClass} w-full pl-8`} />
          </div>
          <ul className="max-h-56 space-y-1 overflow-y-auto md:max-h-[52vh]" role="radiogroup" aria-label="Chauffeur">
            {candidates.map((d) => {
              const c = getCompany(d.company);
              const loaded = openLoads.filter((x) => x.driverId === d.id).reduce((s, x) => s + fullLeft(x), 0);
              const checked = isCheckedIn(pointages, d.id);
              const active = d.id === driverId;
              return (
                <li key={d.id}>
                  <button type="button" role="radio" aria-checked={active} onClick={() => { setDriverId(d.id); setQty({}); }}
                    className={`w-full rounded-lg px-3 py-2 text-left ring-1 transition-colors ${active ? 'bg-blue-50 ring-blue-500' : 'ring-transparent hover:bg-slate-50'}`}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">{driverName(d)}</span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${c.badge}`}>{c.short}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: checked ? '#0ca30c' : '#fab219' }} />
                      {checked ? 'Pointé' : 'Pas pointé'}{loaded > 0 ? ` · ${nf(loaded)} déjà dans le camion` : ''}
                    </span>
                  </button>
                </li>
              );
            })}
            {candidates.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">Aucun chauffeur actif.</li>}
          </ul>
        </div>

        <div className="p-4">
          <p className="mb-2 text-xs font-semibold text-slate-500">2. Quantités à charger {driver && <>· dépôt {getCompany(driverCompany).name}</>}</p>
          {!driver ? <p className="rounded-lg bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Choisissez d'abord un chauffeur.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500">
                  <tr className="border-b border-slate-100">
                    <th className="py-2 pr-3 text-left font-semibold">Produit</th>
                    <th className="px-3 py-2 text-right font-semibold">Au dépôt</th>
                    <th className="hidden px-3 py-2 text-right font-semibold sm:table-cell">Déjà au camion</th>
                    <th className="py-2 pl-3 text-right font-semibold text-slate-700">À charger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.key} className={p.available === 0 ? 'text-slate-400' : ''}>
                      <td className="py-2 pr-3 font-medium text-slate-900">{p.brand.name} <span className="text-slate-500">{p.category}</span>{p.inTruck > 0 && <span className="block text-xs font-normal text-slate-500 sm:hidden">{nf(p.inTruck)} déjà au camion</span>}</td>
                      <td className={`px-3 py-2 text-right tabular-nums ${p.available === 0 ? 'text-red-600' : ''}`}>{nf(p.available)}</td>
                      <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell">{p.inTruck ? nf(p.inTruck) : '—'}</td>
                      <td className="py-1.5 pl-3 text-right">
                        <NumberField value={p.q || ''} max={p.available} placeholder="0" disabled={p.available === 0}
                          onChange={(v) => setQty((q) => ({ ...q, [p.key]: Math.max(0, Math.round(v)) }))}
                          aria-label={`Quantité ${p.brand.name} ${p.category}`}
                          className={`w-20 text-right sm:w-24 ${p.q > p.available ? 'border-red-400! bg-red-50!' : ''}`} />
                        {p.q > p.available && <span className="mt-0.5 block text-xs text-red-600">max {p.available}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
