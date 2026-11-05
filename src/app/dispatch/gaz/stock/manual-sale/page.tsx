import React, { useId, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useDispatchGazStore, type GazClient, type StockDispatch } from '../../../../../stores/useDispatchGazStore';
import { companyName } from '../../../../../lib/dispatchCompanies';
import { useDispatchAuthStore } from '../../../../../stores/useDispatchAuthStore';
import { isPointageOn, localDay, timestampForDay, todayLocal } from '../../../../../lib/dispatchDates';

type PaymentMethod = 'espece' | 'cheque' | 'credit';

interface Lot {
  dispatch: StockDispatch;
  /** Bottles of this dispatch not yet sold (nor returned full, once the returns are validated). */
  remaining: number;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = { espece: 'Espèces', cheque: 'Chèque', credit: 'Crédit' };
const card = 'bg-white rounded-2xl border border-slate-200 shadow-xs';
const rowGrid = 'sm:grid-cols-[minmax(0,1.3fr)_auto_7rem_8.5rem_6rem] sm:gap-4';
const inputClass = 'w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const formatDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shiftDay = (day: string, delta: number) => {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return localDay(d);
};
const mad = (value: number) => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DH`;

/** Was this dispatch on the road on `day`? Open dispatches run until their returns are validated. */
function isActiveOn(sd: StockDispatch, day: string) {
  const start = localDay(sd.date);
  if (start > day) return false;
  if (!sd.isValidated) return true;
  return sd.validatedAt ? localDay(sd.validatedAt) >= day : start === day;
}

function ClientPicker({ clients, zoneName, value, onChange }: {
  clients: GazClient[];
  zoneName: (zoneId: string) => string;
  value: string;
  onChange: (id: string) => void;
}) {
  const uid = useId();
  const selected = clients.find((c) => c.id === value);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    const list = q ? clients.filter((c) => normalize(`${c.name} ${c.city} ${c.code ?? ''}`).includes(q)) : clients;
    return list.slice(0, 8);
  }, [clients, query]);

  const choose = (client: GazClient) => {
    onChange(client.id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor={`${uid}-input`} className="block text-sm font-medium text-slate-700 mb-1.5">Client</label>
      <input
        id={`${uid}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Rechercher par nom, ville ou code"
        value={open ? query : selected ? `${selected.name} · ${selected.city}` : query}
        onFocus={() => { setOpen(true); setActive(0); }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); if (value) onChange(''); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, matches.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter' && open && matches[active]) { e.preventDefault(); choose(matches[active]); }
          else if (e.key === 'Escape') setOpen(false);
        }}
        className={inputClass}
      />
      {open && (
        <ul id={`${uid}-list`} role="listbox" className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg custom-scrollbar">
          {matches.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); choose(c); }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3.5 py-2 text-sm ${i === active ? 'bg-blue-50' : ''}`}
            >
              <span className="font-medium text-slate-900">{c.name}</span>
              <span className="text-slate-500"> · {c.city}{c.code ? ` · ${c.code}` : ''}</span>
            </li>
          ))}
          {matches.length === 0 && <li className="px-3.5 py-2 text-sm text-slate-500">Aucun client trouvé.</li>}
        </ul>
      )}
      {selected && (
        <p className="mt-1.5 text-xs text-slate-500">
          Zone tarifaire : {zoneName(selected.zoneId)}{selected.hasSpecialPrice ? ' · tarifs spéciaux' : ''}
        </p>
      )}
    </div>
  );
}

export default function DispatchManualSalePage() {
  const { clients, brands, prices, zones, drivers, stockDispatches, pointages, sales, addSale, deleteSale, gplConfig } = useDispatchGazStore();
  const user = useDispatchAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const today = todayLocal();

  const initialDay = searchParams.get('date');
  const [day, setDay] = useState(initialDay && initialDay <= today ? initialDay : today);
  const [driverId, setDriverId] = useState(searchParams.get('driver') ?? '');
  const [clientId, setClientId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number | ''>>({});
  const [consigned, setConsigned] = useState<Record<string, boolean>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('espece');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const isPastDay = day < today;
  const client = clients.find((c) => c.id === clientId);
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? '';
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;

  // Drivers who checked in on the day and carry stock from a dispatch active that day
  const driverRows = useMemo(() => {
    return drivers.map((driver) => {
      const pointed = pointages.some((p) => isPointageOn(p, day) && (p.driverId === driver.id || (!!driver.email && p.driverId === driver.email)));
      const lots: Lot[] = stockDispatches
        .filter((sd) => sd.driverId === driver.id && isActiveOn(sd, day))
        .map((sd) => ({
          dispatch: sd,
          remaining: Math.max(0, sd.quantity - sd.sold - (sd.soldConsigned || 0) - (sd.isValidated ? sd.returnedFull || 0 : 0)),
        }));
      const stockLeft = lots.reduce((sum, lot) => sum + lot.remaining, 0);
      const reason = !pointed
        ? (lots.length > 0 ? 'Stock affecté mais pas de pointage ce jour' : null)
        : lots.length === 0 ? 'Pointé, aucun stock affecté' : stockLeft === 0 ? 'Stock entièrement vendu' : null;
      return { driver, lots, stockLeft, available: pointed && stockLeft > 0, reason };
    });
  }, [drivers, pointages, stockDispatches, day]);

  const availableDrivers = driverRows.filter((r) => r.available);
  const unavailableDrivers = driverRows.filter((r) => !r.available && r.reason);
  const current = availableDrivers.find((r) => r.driver.id === driverId);
  const lots = (current?.lots ?? []).filter((lot) => lot.remaining > 0);

  const defaultPrice = (sd: StockDispatch) => {
    if (!client) return 0;
    const special = client.hasSpecialPrice ? client.specialPrices?.find((p) => p.brandId === sd.brandId && p.category === sd.category && p.price > 0) : undefined;
    return special?.price ?? prices.find((p) => p.brandId === sd.brandId && p.category === sd.category && p.zoneId === client.zoneId)?.price ?? 0;
  };
  const consignmentPrice = (sd: StockDispatch) => gplConfig?.consignationPrices?.[sd.brandId]?.[sd.category] || 0;
  const unitPrice = (sd: StockDispatch) => {
    const override = priceOverrides[sd.id];
    return override === undefined ? defaultPrice(sd) : Number(override) || 0;
  };
  const lineTotal = (sd: StockDispatch) => (quantities[sd.id] || 0) * (unitPrice(sd) + (consigned[sd.id] ? consignmentPrice(sd) : 0));

  const selectedLots = lots.filter((lot) => (quantities[lot.dispatch.id] || 0) > 0);
  const total = selectedLots.reduce((sum, lot) => sum + lineTotal(lot.dispatch), 0);
  const missingPrice = selectedLots.some((lot) => unitPrice(lot.dispatch) <= 0);

  const daySales = useMemo(
    () => sales.filter((s) => s.driverId === driverId && localDay(s.date) === day).sort((a, b) => b.date.localeCompare(a.date)),
    [sales, driverId, day],
  );
  const daySalesTotal = daySales.reduce((sum, s) => sum + s.totalPrice, 0);

  const resetSale = () => {
    setClientId('');
    setQuantities({});
    setPriceOverrides({});
    setConsigned({});
    setPaymentMethod('espece');
  };

  const chooseDay = (next: string) => {
    if (!next || next > today) return;
    setDay(next);
    setDriverId('');
    resetSale();
    setPendingDelete(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !client) return;
    if (selectedLots.length === 0) {
      toast.error('Indiquez au moins une quantité vendue.');
      return;
    }
    if (missingPrice) {
      toast.error('Renseignez un prix unitaire pour chaque produit vendu.');
      return;
    }
    const tooMany = selectedLots.find((lot) => quantities[lot.dispatch.id] > lot.remaining);
    if (tooMany) {
      toast.error(`Stock insuffisant : il reste ${tooMany.remaining} × ${tooMany.dispatch.category}.`);
      return;
    }

    const recordedAt = new Date().toISOString();
    selectedLots.forEach(({ dispatch: sd }) => {
      const quantity = quantities[sd.id];
      const price = unitPrice(sd) + (consigned[sd.id] ? consignmentPrice(sd) : 0);
      addSale({
        id: nanoid(),
        date: timestampForDay(day),
        driverId: current.driver.id,
        clientId: client.id,
        brandId: sd.brandId,
        category: sd.category,
        quantity,
        unitPrice: price,
        totalPrice: price * quantity,
        paymentMethod,
        isConsignment: !!consigned[sd.id],
        source: 'manuelle',
        dispatchId: sd.id,
        recordedAt,
        recordedBy: user ? `${user.prenom} ${user.nom}` : undefined,
      });
    });
    toast.success(`Vente enregistrée pour ${current.driver.prenom} ${current.driver.nom}${isPastDay ? ` (${formatDay(day)})` : ''}.`);
    resetSale();
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vente manuelle</h1>
        <p className="text-slate-500 mt-1">
          Saisissez les ventes des chauffeurs-vendeurs pointés et chargés, y compris pour un jour passé.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start">
        {/* Day and driver */}
        <section className={`${card} p-5 sm:p-6`} aria-labelledby="journee-title">
          <h2 id="journee-title" className="font-semibold text-slate-900">1. Journée et chauffeur</h2>

          <label htmlFor="sale-day" className="block text-sm font-medium text-slate-700 mt-5 mb-1.5">Date des ventes</label>
          <input id="sale-day" type="date" max={today} value={day} onChange={(e) => chooseDay(e.target.value)} className={inputClass} />
          <div className="mt-2 flex gap-2">
            {[{ label: "Aujourd'hui", value: today }, { label: 'Hier', value: shiftDay(today, -1) }].map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => chooseDay(value)}
                aria-pressed={day === value}
                className={`h-8 px-3 rounded-lg text-sm font-medium border transition-colors ${day === value ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500 first-letter:uppercase">{formatDay(day)}</p>

          <h3 className="text-sm font-medium text-slate-700 mt-6 mb-2">Chauffeurs disponibles</h3>
          {availableDrivers.length > 0 ? (
            <ul className="space-y-2" role="radiogroup" aria-label="Chauffeurs disponibles">
              {availableDrivers.map(({ driver, lots: driverLots }) => {
                const checked = driver.id === driverId;
                return (
                  <li key={driver.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => { setDriverId(driver.id); resetSale(); setPendingDelete(null); }}
                      className={`w-full text-left rounded-xl border p-3.5 transition-all ${checked ? 'border-blue-600 bg-blue-50/60 shadow-sm' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-medium text-slate-900">{driver.prenom} {driver.nom}</span>
                        <span className="text-xs text-slate-500">{companyName(driver.company)}</span>
                      </span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {driverLots.filter((l) => l.remaining > 0).map((l) => (
                          <span key={l.dispatch.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 tabular-nums">
                            {brandName(l.dispatch.brandId)} {l.dispatch.category} · {l.remaining}
                          </span>
                        ))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Aucun chauffeur disponible ce jour-là. Un chauffeur doit avoir pointé et avoir du stock affecté.
            </div>
          )}

          {unavailableDrivers.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-medium text-slate-500 mb-1.5">Non disponibles</h3>
              <ul className="divide-y divide-slate-100 text-sm">
                {unavailableDrivers.map(({ driver, reason }) => (
                  <li key={driver.id} className="flex justify-between gap-3 py-2">
                    <span className="text-slate-700">{driver.prenom} {driver.nom}</span>
                    <span className="text-right text-slate-500">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm font-medium">
            <Link to={`/dispatch/gaz/hr/manual-pointage?date=${day}`} className="text-blue-600 hover:text-blue-700">Pointage manuel →</Link>
            <Link to="/dispatch/gaz/stock" className="text-blue-600 hover:text-blue-700">Affecter du stock →</Link>
          </div>
        </section>

        <div className="space-y-6 min-w-0">
          {/* New sale */}
          <section className={`${card} p-5 sm:p-6`} aria-labelledby="vente-title">
            <h2 id="vente-title" className="font-semibold text-slate-900">2. Nouvelle vente</h2>

            {!current ? (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Choisissez un chauffeur pour saisir ses ventes.</p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-6">
                {isPastDay && (
                  <p className="rounded-xl border-l-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Vente d'une journée passée : elle sera datée du {formatDay(day)} et marquée « saisie manuelle ».
                  </p>
                )}

                <ClientPicker clients={clients} zoneName={zoneName} value={clientId} onChange={setClientId} />

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Produits vendus (stock de {current.driver.prenom})</p>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                    <div className={`hidden ${rowGrid} rounded-t-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 sm:grid`} aria-hidden="true">
                      <span>Produit</span><span>Quantité</span><span>Prix unitaire</span><span>Consignation</span><span className="text-right">Total</span>
                    </div>
                    {lots.map(({ dispatch: sd, remaining }) => {
                      const qty = quantities[sd.id] || 0;
                      const setQty = (value: number) => setQuantities((q) => ({ ...q, [sd.id]: Math.min(Math.max(0, value), remaining) }));
                      return (
                        <div key={sd.id} className={`grid grid-cols-2 items-center gap-3 px-3.5 py-3 ${rowGrid}`}>
                          <div className="col-span-2 sm:col-span-1">
                            <p className="font-medium text-slate-900">{brandName(sd.brandId)} {sd.category}</p>
                            <p className="text-xs text-slate-500">Reste {remaining}</p>
                          </div>
                          <div>
                            <span className="mb-1 block text-xs text-slate-500 sm:hidden">Quantité</span>
                            <div className="flex items-center">
                              <button type="button" aria-label={`Retirer un ${sd.category}`} onClick={() => setQty(qty - 1)} disabled={qty <= 0} className="h-9 w-9 rounded-l-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">−</button>
                              <input
                                type="number"
                                min={0}
                                max={remaining}
                                aria-label={`Quantité ${brandName(sd.brandId)} ${sd.category}`}
                                value={qty || ''}
                                placeholder="0"
                                onChange={(e) => setQty(Number(e.target.value))}
                                className="h-9 w-14 border-y border-slate-200 text-center font-semibold tabular-nums outline-none"
                              />
                              <button type="button" aria-label={`Ajouter un ${sd.category}`} onClick={() => setQty(qty + 1)} disabled={qty >= remaining} className="h-9 w-9 rounded-r-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">+</button>
                            </div>
                          </div>
                          <div>
                            <span className="mb-1 block text-xs text-slate-500 sm:hidden">Prix unitaire (DH)</span>
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              aria-label={`Prix unitaire ${brandName(sd.brandId)} ${sd.category}`}
                              value={priceOverrides[sd.id] ?? (client ? defaultPrice(sd) || '' : '')}
                              placeholder={client ? '0' : 'Client ?'}
                              onChange={(e) => setPriceOverrides((p) => ({ ...p, [sd.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                              className="h-9 w-full max-w-28 rounded-lg border border-slate-200 px-2.5 tabular-nums outline-none focus:border-blue-500"
                            />
                          </div>
                          <label className="inline-flex items-center gap-2 whitespace-nowrap text-slate-700">
                            <input
                              type="checkbox"
                              checked={!!consigned[sd.id]}
                              onChange={(e) => setConsigned((c) => ({ ...c, [sd.id]: e.target.checked }))}
                              className="h-4 w-4 accent-blue-600"
                            />
                            <span><span className="sm:hidden">Consignation </span>+{consignmentPrice(sd)} DH</span>
                          </label>
                          <p className="text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">{qty > 0 ? mad(lineTotal(sd)) : '—'}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Consignation : le client achète aussi la bouteille.</p>
                </div>

                <fieldset>
                  <legend className="text-sm font-medium text-slate-700 mb-2">Mode de paiement</legend>
                  <div className="flex rounded-xl bg-slate-100 p-1 max-w-md">
                    {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        aria-pressed={paymentMethod === method}
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${paymentMethod === method ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {PAYMENT_LABELS[method]}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-slate-600">
                    Total : <span className="text-2xl font-bold text-slate-900 tabular-nums">{mad(total)}</span>
                  </p>
                  <button
                    type="submit"
                    disabled={!client || selectedLots.length === 0 || missingPrice}
                    className="h-11 px-6 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enregistrer la vente
                  </button>
                </div>
                {!client && <p className="text-sm text-slate-500 -mt-3">Choisissez le client pour calculer les prix.</p>}
              </form>
            )}
          </section>

          {/* Sales of the day */}
          {current && (
            <section className={card} aria-labelledby="ventes-jour-title">
              <div className="flex flex-wrap items-baseline justify-between gap-2 p-5 sm:px-6 border-b border-slate-100">
                <h2 id="ventes-jour-title" className="font-semibold text-slate-900">
                  Ventes de {current.driver.prenom} {current.driver.nom} ce jour
                </h2>
                <p className="text-sm text-slate-500">
                  {daySales.length} vente{daySales.length > 1 ? 's' : ''} · <span className="font-semibold text-slate-900 tabular-nums">{mad(daySalesTotal)}</span>
                </p>
              </div>
              {daySales.length === 0 ? (
                <p className="p-5 sm:px-6 text-sm text-slate-500">Aucune vente enregistrée pour ce jour.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-slate-500">
                      <tr className="border-b border-slate-100">
                        <th className="px-5 sm:px-6 py-2.5 font-medium">Client</th>
                        <th className="px-3 py-2.5 font-medium">Produit</th>
                        <th className="hidden sm:table-cell px-3 py-2.5 font-medium">Paiement</th>
                        <th className="hidden sm:table-cell px-3 py-2.5 font-medium">Saisie</th>
                        <th className="px-3 py-2.5 font-medium text-right">Montant</th>
                        <th className="px-5 sm:px-6 py-2.5"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {daySales.map((s) => {
                        const saleClient = clients.find((c) => c.id === s.clientId);
                        const isManual = s.source === 'manuelle';
                        return (
                          <tr key={s.id}>
                            <td className="px-5 sm:px-6 py-3 text-slate-900 max-w-[220px] truncate">{saleClient?.name ?? 'Client inconnu'}</td>
                            <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{s.quantity} × {brandName(s.brandId)} {s.category}</td>
                            <td className="hidden sm:table-cell px-3 py-3 text-slate-700">{PAYMENT_LABELS[s.paymentMethod]}</td>
                            <td className="hidden sm:table-cell px-3 py-3 text-slate-500 whitespace-nowrap">
                              {isManual ? 'Manuelle' : `Chauffeur · ${new Date(s.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                              {isManual && s.recordedBy && <span className="block text-xs text-slate-400">{s.recordedBy}</span>}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">{mad(s.totalPrice)}</td>
                            <td className="px-5 sm:px-6 py-3 text-right whitespace-nowrap">
                              {isManual && (pendingDelete === s.id ? (
                                <span className="inline-flex gap-2">
                                  <button type="button" onClick={() => { deleteSale(s.id); setPendingDelete(null); toast.success('Vente supprimée, stock du chauffeur rétabli.'); }} className="text-sm font-semibold text-red-600 hover:text-red-700">Confirmer</button>
                                  <button type="button" onClick={() => setPendingDelete(null)} className="text-sm text-slate-500 hover:text-slate-700">Annuler</button>
                                </span>
                              ) : (
                                <button type="button" onClick={() => setPendingDelete(s.id)} className="text-sm text-slate-500 hover:text-red-600">Supprimer</button>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
