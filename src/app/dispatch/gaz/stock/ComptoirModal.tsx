import React, { useState } from 'react';
import { toast } from 'sonner';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { DISPATCH_COMPANIES, DEFAULT_COMPANY, getCompany, type CompanyId } from '../../../../lib/dispatchCompanies';
import { Modal, NumberField, Segmented, buttonPrimary, buttonSecondary, nf } from '../../../../components/dispatch/DispatchUI';
import { type CompanyFilter, findStock, productList } from './stockUtils';

export default function ComptoirModal({ company: initial, onClose }: { company: CompanyFilter; onClose: () => void }) {
  const { brands, globalStock, comptoirStock, dispatchToComptoir, addStockActivity } = useDispatchGazStore();
  const [company, setCompany] = useState<CompanyId>(initial === 'all' ? DEFAULT_COMPANY : initial);
  const [qty, setQty] = useState<Record<string, number>>({});

  const products = productList(brands).map((p) => ({
    ...p,
    available: findStock(globalStock, p.brandId, p.category, company)?.full || 0,
    atCounter: findStock(comptoirStock || [], p.brandId, p.category, company)?.full || 0,
    q: qty[p.key] || 0,
  }));
  const total = products.reduce((s, p) => s + p.q, 0);
  const over = products.filter((p) => p.q > p.available);

  const submit = () => {
    const items = products.filter((p) => p.q > 0);
    if (!items.length) { toast.error('Saisissez au moins une quantité.'); return; }
    if (over.length) { over.forEach((p) => toast.error(`Stock insuffisant au dépôt ${getCompany(company).short} pour ${p.brand.name} ${p.category}.`)); return; }
    items.forEach((p) => {
      dispatchToComptoir(p.brandId, p.category, p.q, company);
      addStockActivity({ action: 'dispatch_comptoir', company, brandId: p.brandId, category: p.category, quantityFull: p.q, description: 'Affectation Comptoir' });
    });
    toast.success(`${nf(total)} bouteille(s) envoyée(s) au comptoir ${getCompany(company).name}.`);
    onClose();
  };

  return (
    <Modal title="Alimenter le comptoir" subtitle="Les bouteilles pleines passent du dépôt au comptoir de vente directe." onClose={onClose} size="lg"
      footer={<>
        <span className="mr-auto text-sm text-slate-600">Total : <strong className="text-slate-900">{nf(total)}</strong> bouteille(s)</span>
        <button type="button" className={buttonSecondary} onClick={onClose}>Annuler</button>
        <button type="button" className={buttonPrimary} onClick={submit} disabled={total === 0 || over.length > 0}>Envoyer au comptoir</button>
      </>}>
      <div className="space-y-4 p-5">
        <Segmented<CompanyId> label="Société" value={company} onChange={(c) => { setCompany(c); setQty({}); }} options={DISPATCH_COMPANIES.map((c) => ({ id: c.id, label: c.name }))} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="py-2 pr-3 text-left font-semibold">Produit</th>
                <th className="px-3 py-2 text-right font-semibold">Au dépôt</th>
                <th className="hidden px-3 py-2 text-right font-semibold sm:table-cell">Au comptoir</th>
                <th className="py-2 pl-3 text-right font-semibold text-slate-700">À envoyer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.key}>
                  <td className="py-2 pr-3 font-medium text-slate-900">{p.brand.name} <span className="text-slate-500">{p.category}</span><span className="block text-xs font-normal text-slate-500 sm:hidden">{nf(p.atCounter)} au comptoir</span></td>
                  <td className={`px-3 py-2 text-right tabular-nums ${p.available === 0 ? 'text-red-600' : ''}`}>{nf(p.available)}</td>
                  <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell">{nf(p.atCounter)}</td>
                  <td className="py-1.5 pl-3 text-right">
                    <NumberField value={p.q || ''} max={p.available} placeholder="0" disabled={p.available === 0}
                      onChange={(v) => setQty((q) => ({ ...q, [p.key]: Math.max(0, Math.round(v)) }))}
                      aria-label={`Quantité comptoir ${p.brand.name} ${p.category}`}
                      className={`w-20 text-right sm:w-24 ${p.q > p.available ? 'border-red-400! bg-red-50!' : ''}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
