import React, { useMemo } from 'react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { DISPATCH_COMPANIES, companyOf, type CompanyId } from '../../../../lib/dispatchCompanies';
import { Card, EmptyState, Stat, nf } from '../../../../components/dispatch/DispatchUI';
import { type CompanyFilter, fullLeft, matchesCompany, productList } from './stockUtils';

type Totals = { depotFull: number; depotEmpty: number; comptoirFull: number; comptoirEmpty: number; truck: number; damaged: number };
const zero = (): Totals => ({ depotFull: 0, depotEmpty: 0, comptoirFull: 0, comptoirEmpty: 0, truck: 0, damaged: 0 });
const add = (a: Totals, b: Totals): Totals => ({
  depotFull: a.depotFull + b.depotFull, depotEmpty: a.depotEmpty + b.depotEmpty, comptoirFull: a.comptoirFull + b.comptoirFull,
  comptoirEmpty: a.comptoirEmpty + b.comptoirEmpty, truck: a.truck + b.truck, damaged: a.damaged + b.damaged,
});
const totalFull = (t: Totals) => t.depotFull + t.comptoirFull + t.truck;

function Num({ v, alert, muted }: { v: number; alert?: boolean; muted?: boolean }) {
  return <td className={`px-3 py-2.5 text-right tabular-nums ${alert ? 'font-semibold text-red-600' : muted || v === 0 ? 'text-slate-300' : 'text-slate-800'}`}>{nf(v)}</td>;
}

export default function StockOverview({ company, onPickCompany, onOpenDrivers }: { company: CompanyFilter; onPickCompany: (c: CompanyId) => void; onOpenDrivers: () => void }) {
  const { brands, drivers, globalStock, comptoirStock, stockDispatches } = useDispatchGazStore();

  const { rows, byCompany, total, driversOnRoad } = useMemo(() => {
    const driverCompany = new Map<string, CompanyId>(drivers.map((d) => [d.id, companyOf(d.company)]));
    const openLoads = stockDispatches.filter((d) => !d.isValidated);
    const cell = new Map<string, Totals>(); // key: company|brand|category
    const bump = (c: CompanyId, brandId: string, category: string, patch: Partial<Totals>) => {
      const k = `${c}|${brandId}|${category}`;
      const t = cell.get(k) || zero();
      cell.set(k, add(t, { ...zero(), ...patch }));
    };
    globalStock.forEach((g) => bump(companyOf(g.company), g.brandId, g.category, { depotFull: g.full, depotEmpty: g.empty, damaged: g.damaged || 0 }));
    (comptoirStock || []).forEach((g) => bump(companyOf(g.company), g.brandId, g.category, { comptoirFull: g.full, comptoirEmpty: g.empty }));
    openLoads.forEach((d) => bump(driverCompany.get(d.driverId) || companyOf(undefined), d.brandId, d.category, { truck: fullLeft(d) }));

    // Products from settings, plus any product removed from settings that still has bottles.
    const products = productList(brands).map((p) => ({ brandId: p.brandId, category: p.category, name: p.brand.name, image: p.brand.productImages?.[p.category] }));
    const known = new Set(products.map((p) => `${p.brandId}|${p.category}`));
    const orphans = new Map<string, { brandId: string; category: string }>();
    cell.forEach((t, k) => {
      const [, brandId, category] = k.split('|');
      if (!known.has(`${brandId}|${category}`) && totalFull(t) + t.depotEmpty + t.comptoirEmpty + t.damaged !== 0) orphans.set(`${brandId}|${category}`, { brandId, category });
    });
    [...orphans.values()].sort((a, b) => a.brandId.localeCompare(b.brandId) || (parseFloat(a.category) || 0) - (parseFloat(b.category) || 0))
      .forEach((o) => products.push({ ...o, name: brands.find((b) => b.id === o.brandId)?.name || 'Produit retiré', image: undefined }));

    const companies = DISPATCH_COMPANIES.filter((c) => matchesCompany(company, c.id));
    const rows = products.map((p) => ({
      ...p,
      t: companies.reduce((acc, c) => add(acc, cell.get(`${c.id}|${p.brandId}|${p.category}`) || zero()), zero()),
    }));
    const byCompany = DISPATCH_COMPANIES.map((c) => ({
      company: c,
      t: products.reduce((acc, p) => add(acc, cell.get(`${c.id}|${p.brandId}|${p.category}`) || zero()), zero()),
    }));
    const onRoad = new Set(openLoads.filter((d) => matchesCompany(company, driverCompany.get(d.driverId))).map((d) => d.driverId));
    return { rows, byCompany, total: rows.reduce((acc, r) => add(acc, r.t), zero()), driversOnRoad: onRoad.size };
  }, [brands, drivers, globalStock, comptoirStock, stockDispatches, company]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Pleines au dépôt" value={nf(total.depotFull)} sub="prêtes à charger" />
        <Stat label="Vides au dépôt" value={nf(total.depotEmpty)} sub="à remplir chez le fournisseur" />
        <Stat label="Au comptoir" value={nf(total.comptoirFull)} sub={`pleines · ${nf(total.comptoirEmpty)} vides`} />
        <Stat label="Dans les camions" value={nf(total.truck)}
          sub={<button type="button" onClick={onOpenDrivers} className="text-blue-600 hover:text-blue-700">{driversOnRoad} chauffeur(s) en tournée</button>} />
        <Stat label="Avariées" value={nf(total.damaged)} sub={total.damaged > 0 ? 'à réparer ou retourner' : 'aucune'} tone={total.damaged > 0 ? 'warning' : 'good'} />
      </div>

      {company === 'all' && (
        <Card title="Par société" subtitle="Cliquez sur une société pour voir uniquement son stock.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50/60 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Société</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Dépôt pleines</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Dépôt vides</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Comptoir</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Camions</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Avariées</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-slate-700">Total pleines</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byCompany.map(({ company: c, t }) => (
                  <tr key={c.id} onClick={() => onPickCompany(c.id)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: c.color }} />{c.name}</td>
                    <Num v={t.depotFull} /><Num v={t.depotEmpty} /><Num v={t.comptoirFull} /><Num v={t.truck} /><Num v={t.damaged} />
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">{nf(totalFull(t))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title="Stock par produit" subtitle="Total pleines = dépôt + comptoir + camions. Un 0 en rouge signale un produit épuisé au dépôt.">
        {rows.length === 0 ? <EmptyState>Aucune marque configurée. Ajoutez-en dans Paramètres GPL.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-xs text-slate-500">
                <tr className="bg-slate-50/60">
                  <th rowSpan={2} className="px-4 py-2 text-left align-bottom font-semibold">Produit</th>
                  <th colSpan={2} className="border-l border-slate-100 px-3 pt-2 text-center font-semibold text-slate-600">Dépôt</th>
                  <th colSpan={2} className="border-l border-slate-100 px-3 pt-2 text-center font-semibold text-slate-600">Comptoir</th>
                  <th rowSpan={2} className="border-l border-slate-100 px-3 py-2 text-right align-bottom font-semibold">Camions</th>
                  <th rowSpan={2} className="px-3 py-2 text-right align-bottom font-semibold">Avariées</th>
                  <th rowSpan={2} className="px-4 py-2 text-right align-bottom font-semibold text-slate-700">Total pleines</th>
                </tr>
                <tr className="bg-slate-50/60">
                  <th className="border-l border-slate-100 px-3 pb-2 text-right font-medium">Pleines</th>
                  <th className="px-3 pb-2 text-right font-medium">Vides</th>
                  <th className="border-l border-slate-100 px-3 pb-2 text-right font-medium">Pleines</th>
                  <th className="px-3 pb-2 text-right font-medium">Vides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={`${r.brandId}|${r.category}`}>
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50 ring-1 ring-slate-200">
                          {r.image ? <img src={r.image} alt="" className="h-full w-full object-contain" /> : <span className="text-[10px] font-semibold text-slate-400">{r.category}</span>}
                        </span>
                        <span className="font-medium text-slate-900">{r.name} <span className="text-slate-500">{r.category}</span></span>
                      </span>
                    </td>
                    <Num v={r.t.depotFull} alert={r.t.depotFull <= 0} /><Num v={r.t.depotEmpty} />
                    <Num v={r.t.comptoirFull} /><Num v={r.t.comptoirEmpty} />
                    <Num v={r.t.truck} />
                    <td className={`px-3 py-2.5 text-right tabular-nums ${r.t.damaged > 0 ? 'font-semibold text-amber-700' : 'text-slate-300'}`}>{nf(r.t.damaged)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">{nf(totalFull(r.t))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50/60 font-semibold text-slate-900">
                <tr>
                  <td className="px-4 py-2.5">Total</td>
                  {[total.depotFull, total.depotEmpty, total.comptoirFull, total.comptoirEmpty, total.truck, total.damaged].map((v, i) => <td key={i} className="px-3 py-2.5 text-right tabular-nums">{nf(v)}</td>)}
                  <td className="px-4 py-2.5 text-right tabular-nums">{nf(totalFull(total))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
