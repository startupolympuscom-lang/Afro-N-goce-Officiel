import React, { useMemo, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatchGazStore, type StockDispatch } from '../../../../stores/useDispatchGazStore';
import { getCompany } from '../../../../lib/dispatchCompanies';
import { Card, EmptyState, NumberField, buttonPrimary, buttonSecondary, nf } from '../../../../components/dispatch/DispatchUI';
import { type CompanyFilter, driverName, emptyExpected, fullLeft, isCheckedIn, localDay, matchesCompany } from './stockUtils';

type Returned = { full: number; empty: number };
const time = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');

function gapText(full: number, empty: number) {
  const parts: string[] = [];
  if (full) parts.push(`${Math.abs(full)} pleine${Math.abs(full) > 1 ? 's' : ''}`);
  if (empty) parts.push(`${Math.abs(empty)} vide${Math.abs(empty) > 1 ? 's' : ''}`);
  return parts.join(' et ');
}

export default function DriverLoads({ company, onLoad }: { company: CompanyFilter; onLoad: (driverId?: string) => void }) {
  const { drivers, brands, stockDispatches, pointages, validateStockDispatch } = useDispatchGazStore();
  const [form, setForm] = useState<Record<string, Partial<Returned>>>({});
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name || 'Marque supprimée';

  const groups = useMemo(() => {
    const byDriver = new Map<string, StockDispatch[]>();
    stockDispatches.filter((d) => !d.isValidated).forEach((d) => byDriver.set(d.driverId, [...(byDriver.get(d.driverId) || []), d]));
    return [...byDriver.entries()]
      .map(([driverId, loads]) => ({ driverId, driver: drivers.find((x) => x.id === driverId), loads }))
      .filter((g) => matchesCompany(company, g.driver?.company))
      .sort((a, b) => driverName(a.driver).localeCompare(driverName(b.driver)));
  }, [stockDispatches, drivers, company]);

  const validatedToday = useMemo(() => {
    const today = localDay();
    return stockDispatches
      .filter((d) => d.isValidated && d.validatedAt && localDay(d.validatedAt) === today)
      .filter((d) => matchesCompany(company, drivers.find((x) => x.id === d.driverId)?.company))
      .sort((a, b) => (b.validatedAt || '').localeCompare(a.validatedAt || ''));
  }, [stockDispatches, drivers, company]);

  const returnedOf = (d: StockDispatch): Returned => ({ full: form[d.id]?.full ?? fullLeft(d), empty: form[d.id]?.empty ?? emptyExpected(d) });
  const setReturned = (id: string, patch: Partial<Returned>) => setForm((f) => ({ ...f, [id]: { ...f[id], ...patch } }));

  const validate = (driverId: string, loads: StockDispatch[]) => {
    const short = loads.filter((d) => { const r = returnedOf(d); return r.full < fullLeft(d) || r.empty < emptyExpected(d); });
    if (short.length) {
      toast.error('Écart de stock détecté ! Rendez-vous en caisse pour arbitrage.', {
        description: short.map((d) => { const r = returnedOf(d); return `${brandName(d.brandId)} ${d.category} : il manque ${gapText(Math.max(0, fullLeft(d) - r.full), Math.max(0, emptyExpected(d) - r.empty))}`; }).join(' · '),
      });
      return;
    }
    let full = 0; let empty = 0;
    loads.forEach((d) => { const r = returnedOf(d); full += r.full; empty += r.empty; validateStockDispatch(d.id, r.full, r.empty); });
    setForm((f) => { const n = { ...f }; loads.forEach((d) => delete n[d.id]); return n; });
    toast.success(`Retour de ${driverName(drivers.find((x) => x.id === driverId))} validé : ${nf(full)} pleine(s) et ${nf(empty)} vide(s) remises au dépôt.`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
        <strong className="text-slate-900">Comment ça marche :</strong> à son retour, le chauffeur rend les pleines invendues et un vide par bouteille vendue en échange
        (les ventes avec consigne ne rendent pas de vide). Les quantités attendues sont pré-remplies ; corrigez-les si le compte réel est différent, puis validez.
        S'il manque des bouteilles, le retour est bloqué et se règle en caisse.
      </div>

      {groups.length === 0 ? (
        <Card>
          <EmptyState>
            Aucun chauffeur en tournée{company !== 'all' ? ` pour ${getCompany(company).name}` : ''}.{' '}
            <button type="button" onClick={() => onLoad()} className="font-medium text-blue-600 hover:text-blue-700">Charger un chauffeur</button>
          </EmptyState>
        </Card>
      ) : groups.map(({ driverId, driver, loads }) => {
        const c = getCompany(driver?.company);
        const checked = isCheckedIn(pointages, driverId);
        const firstLoad = loads.map((d) => d.date).sort()[0];
        const totals = loads.reduce((t, d) => {
          const r = returnedOf(d);
          return { loaded: t.loaded + d.quantity, sold: t.sold + d.sold + (d.soldConsigned || 0), full: t.full + r.full, empty: t.empty + r.empty, short: t.short || r.full < fullLeft(d) || r.empty < emptyExpected(d) };
        }, { loaded: 0, sold: 0, full: 0, empty: 0, short: false });
        const pct = totals.loaded ? Math.min(100, Math.round((totals.sold / totals.loaded) * 100)) : 0;
        return (
          <Card key={driverId}
            title={<span className="flex flex-wrap items-center gap-2">{driverName(driver)}<span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${c.badge}`}>{c.short}</span></span>}
            subtitle={<span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Chargé à {time(firstLoad)}{localDay(firstLoad) !== localDay() ? ` le ${new Date(firstLoad).toLocaleDateString('fr-FR')}` : ''}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: checked ? '#0ca30c' : '#fab219' }} />{checked ? 'Pointé' : 'Pas encore pointé'}</span>
              <span>{nf(totals.sold)} / {nf(totals.loaded)} vendues ({pct} %)</span>
            </span>}
            actions={<button type="button" className={buttonSecondary} onClick={() => onLoad(driverId)}><Plus className="h-4 w-4" /> Ajouter du stock</button>}
          >
            <div className="h-1 bg-slate-100"><div className="h-1 bg-blue-600" style={{ width: `${pct}%` }} /></div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-slate-50/60 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Produit</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Chargé</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Vendu (échange)</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Vendu (consigne)</th>
                    <th className="border-l border-slate-100 px-3 py-2.5 text-right font-semibold">Pleines attendues</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-700">Pleines rendues</th>
                    <th className="border-l border-slate-100 px-3 py-2.5 text-right font-semibold">Vides attendus</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-slate-700">Vides rendus</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Contrôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loads.map((d) => {
                    const r = returnedOf(d);
                    const missFull = fullLeft(d) - r.full;
                    const missEmpty = emptyExpected(d) - r.empty;
                    const short = missFull > 0 || missEmpty > 0;
                    const extra = !short && (missFull < 0 || missEmpty < 0);
                    return (
                      <tr key={d.id} className={short ? 'bg-red-50/40' : ''}>
                        <td className="px-4 py-2 font-medium text-slate-900">{brandName(d.brandId)} <span className="text-slate-500">{d.category}</span></td>
                        <td className="px-3 py-2 text-right tabular-nums">{nf(d.quantity)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{nf(d.sold)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{nf(d.soldConsigned || 0)}</td>
                        <td className="border-l border-slate-100 px-3 py-2 text-right tabular-nums text-slate-500">{nf(fullLeft(d))}</td>
                        <td className="px-3 py-1.5 text-right"><NumberField value={r.full} onChange={(v) => setReturned(d.id, { full: Math.max(0, Math.round(v)) })} aria-label={`Pleines rendues ${brandName(d.brandId)} ${d.category}`} className="w-20 text-right" /></td>
                        <td className="border-l border-slate-100 px-3 py-2 text-right tabular-nums text-slate-500">{nf(emptyExpected(d))}</td>
                        <td className="px-3 py-1.5 text-right"><NumberField value={r.empty} onChange={(v) => setReturned(d.id, { empty: Math.max(0, Math.round(v)) })} aria-label={`Vides rendus ${brandName(d.brandId)} ${d.category}`} className="w-20 text-right" /></td>
                        <td className="px-4 py-2 text-xs font-medium">
                          {short ? <span className="text-red-700">Manque {gapText(Math.max(0, missFull), Math.max(0, missEmpty))}</span>
                            : extra ? <span className="text-amber-700">{gapText(Math.max(0, -missFull), Math.max(0, -missEmpty))} en plus</span>
                              : <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="h-3.5 w-3.5" /> Conforme</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Phone layout: one block per product, the two counts side by side. */}
            <ul className="divide-y divide-slate-100 sm:hidden">
              {loads.map((d) => {
                const r = returnedOf(d);
                const missFull = fullLeft(d) - r.full;
                const missEmpty = emptyExpected(d) - r.empty;
                const short = missFull > 0 || missEmpty > 0;
                const extra = !short && (missFull < 0 || missEmpty < 0);
                return (
                  <li key={d.id} className={`space-y-2 px-4 py-3 ${short ? 'bg-red-50/40' : ''}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="whitespace-nowrap font-medium text-slate-900">{brandName(d.brandId)} <span className="text-slate-500">{d.category}</span></span>
                      <span className="text-xs text-slate-500">chargé {nf(d.quantity)} · vendu {nf(d.sold)} + {nf(d.soldConsigned || 0)} consigne</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs text-slate-500">Pleines rendues <span className="text-slate-400">(attendu {nf(fullLeft(d))})</span>
                        <NumberField value={r.full} onChange={(v) => setReturned(d.id, { full: Math.max(0, Math.round(v)) })} className="mt-1 block w-full text-right" />
                      </label>
                      <label className="text-xs text-slate-500">Vides rendus <span className="text-slate-400">(attendu {nf(emptyExpected(d))})</span>
                        <NumberField value={r.empty} onChange={(v) => setReturned(d.id, { empty: Math.max(0, Math.round(v)) })} className="mt-1 block w-full text-right" />
                      </label>
                    </div>
                    <p className="text-xs font-medium">
                      {short ? <span className="text-red-700">Manque {gapText(Math.max(0, missFull), Math.max(0, missEmpty))}</span>
                        : extra ? <span className="text-amber-700">{gapText(Math.max(0, -missFull), Math.max(0, -missEmpty))} en plus</span>
                          : <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="h-3.5 w-3.5" /> Conforme</span>}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <p className={`text-sm ${totals.short ? 'font-medium text-red-700' : 'text-slate-600'}`}>
                {totals.short ? 'Écart de stock : le chauffeur doit passer en caisse avant la validation.' : `À la validation : +${nf(totals.full)} pleine(s) et +${nf(totals.empty)} vide(s) au dépôt ${c.name}.`}
              </p>
              <button type="button" className={buttonPrimary} onClick={() => validate(driverId, loads)}><Check className="h-4 w-4" /> Valider le retour</button>
            </div>
          </Card>
        );
      })}

      <Card title="Retours validés aujourd'hui" subtitle={validatedToday.length ? `${validatedToday.length} ligne(s)` : undefined}>
        {validatedToday.length === 0 ? <EmptyState>Aucun retour validé aujourd'hui.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50/60 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Heure</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Chauffeur</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Produit</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Chargé</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Vendu</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Pleines rendues</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Vides rendus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {validatedToday.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 tabular-nums text-slate-500">{time(d.validatedAt)}</td>
                    <td className="px-3 py-2 text-slate-900">{driverName(drivers.find((x) => x.id === d.driverId))}</td>
                    <td className="px-3 py-2 text-slate-700">{brandName(d.brandId)} {d.category}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{nf(d.quantity)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{nf(d.sold + (d.soldConsigned || 0))}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{nf(d.returnedFull || 0)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{nf(d.returnedEmpty || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
