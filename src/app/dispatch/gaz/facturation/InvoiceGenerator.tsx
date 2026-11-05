import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useDispatchGazStore, type GazSale } from '../../../../stores/useDispatchGazStore';
import { useLandingStore } from '../../../../stores/useLandingStore';
import { formatPhoneMA } from '../../../../lib/formatters';
import { downloadInvoicePdf, formatAmount, printInvoicePdf, type InvoiceInput, type InvoiceLine } from './invoicePdf';
import { INVOICE_COMPANIES, saleCompany, toIssuer, type InvoiceCompanyId } from './companies';

type Sale = GazSale & { isConsignment?: boolean };

interface SaleGroup {
  key: string;
  label: string;
  sales: Sale[];
  quantity: number;
  total: number;
}

const card = 'bg-white rounded-2xl border border-slate-200 shadow-xs';
const selectClass = 'w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400';
const categoryOrder = (category: string) => parseFloat(category) || 0;

function TriCheckbox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate: boolean; onChange: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="h-4 w-4 shrink-0 accent-blue-600" />;
}

export function InvoiceGenerator() {
  const { clients, sales, brands, drivers } = useDispatchGazStore();
  const { contactAddress, contactPhone, contactEmail } = useLandingStore();
  const [companyId, setCompanyId] = useState<InvoiceCompanyId>('afro_negoce');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [clientId, setClientId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showInvoice, setShowInvoice] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const company = INVOICE_COMPANIES.find((c) => c.id === companyId) ?? INVOICE_COMPANIES[0];
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? id;
  const periodLabel = format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: fr }).toUpperCase();

  const months = useMemo(() => {
    const unique = new Set<string>(sales.filter((s) => s.date).map((s) => s.date.substring(0, 7)));
    unique.add(format(new Date(), 'yyyy-MM'));
    return Array.from(unique).sort().reverse();
  }, [sales]);

  // Sales of the chosen company in the chosen month
  const monthSales = useMemo(
    () => (sales as Sale[]).filter((s) => s.date?.startsWith(month) && (!company.salesOf || saleCompany(s, drivers) === company.salesOf)),
    [sales, drivers, month, company.salesOf],
  );
  const monthClients = useMemo(() => {
    const ids = new Set(monthSales.map((s) => s.clientId));
    return clients.filter((c) => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, monthSales]);
  const client = clients.find((c) => c.id === clientId);
  const clientSales = useMemo(
    () => monthSales.filter((s) => s.clientId === clientId).sort((a, b) => a.date.localeCompare(b.date)),
    [monthSales, clientId],
  );

  // Sales grouped by brand and product for the selection
  const groups = useMemo<SaleGroup[]>(() => {
    const map = new Map<string, SaleGroup>();
    clientSales.forEach((sale) => {
      const key = `${sale.brandId}|${sale.category}`;
      const group = map.get(key) ?? { key, label: `${brandName(sale.brandId)} ${sale.category}`, sales: [], quantity: 0, total: 0 };
      group.sales.push(sale);
      group.quantity += sale.quantity;
      group.total += sale.totalPrice;
      map.set(key, group);
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'fr', { numeric: true }));
  }, [clientSales, brands]);

  const selectedSales = clientSales.filter((s) => selected.has(s.id));
  const selectedTotal = selectedSales.reduce((sum, s) => sum + s.totalPrice, 0);

  // Invoice lines: one per brand, product, unit price and deposit, so quantity × price = total
  const lines = useMemo<InvoiceLine[]>(() => {
    const map = new Map<string, InvoiceLine & { brand: string; category: string }>();
    selectedSales.forEach((sale) => {
      const key = `${sale.brandId}|${sale.category}|${sale.unitPrice}|${sale.isConsignment ? 1 : 0}`;
      const line = map.get(key) ?? {
        brand: brandName(sale.brandId),
        category: sale.category,
        label: `${brandName(sale.brandId)} - ${sale.category}${sale.isConsignment ? ' (avec consignation)' : ''}`,
        quantity: 0,
        unitPrice: sale.unitPrice,
        total: 0,
      };
      line.quantity += sale.quantity;
      line.total += sale.totalPrice;
      map.set(key, line);
    });
    return Array.from(map.values()).sort((a, b) => a.brand.localeCompare(b.brand) || categoryOrder(a.category) - categoryOrder(b.category) || a.unitPrice - b.unitPrice);
  }, [selectedSales, brands]);

  const issuerDetails = company.id === 'afro_negoce'
    ? [contactAddress, contactPhone ? formatPhoneMA(contactPhone) : '', contactEmail].filter(Boolean)
    : [];
  const issuer = toIssuer(company, issuerDetails);

  const chooseCompany = (id: InvoiceCompanyId) => {
    setCompanyId(id);
    setClientId('');
    setSelected(new Set());
    setShowInvoice(false);
  };
  const chooseMonth = (value: string) => {
    setMonth(value);
    setClientId('');
    setSelected(new Set());
    setShowInvoice(false);
  };
  const chooseClient = (id: string) => {
    setClientId(id);
    setExpanded(new Set());
    setShowInvoice(false);
    // Everything is included by default; groups or single sales can then be removed
    setSelected(new Set(monthSales.filter((s) => s.clientId === id).map((s) => s.id)));
  };
  const toggleGroup = (group: SaleGroup) => {
    const allIn = group.sales.every((s) => selected.has(s.id));
    setSelected((prev) => {
      const next = new Set(prev);
      group.sales.forEach((s) => (allIn ? next.delete(s.id) : next.add(s.id)));
      return next;
    });
  };
  const toggleSale = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleExpanded = (key: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const generate = async (action: 'download' | 'print') => {
    if (!client || lines.length === 0) return;
    const input: InvoiceInput = {
      issuer,
      client: { name: client.name, address: client.address, city: client.city, ice: client.ice, code: client.code },
      periodLabel,
      issuedOn: new Date(),
      lines,
      total: selectedTotal,
      // Plain ASCII file name: accents make some browsers fall back to "download"
      fileName: `Facture_${company.name}_${client.name}_${month}`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9_-]+/g, '-') + '.pdf',
    };
    setIsGenerating(true);
    try {
      await (action === 'download' ? downloadInvoicePdf(input) : printInvoicePdf(input));
    } catch (error) {
      console.error(error);
      toast.error("La facture n'a pas pu être générée. Réessayez.");
    } finally {
      setIsGenerating(false);
    }
  };

  const top = issuer.letterheadUrl ? '22.2%' : '17.5%';
  const bottom = issuer.letterheadUrl ? '11.8%' : '9.1%';

  return (
    <div className="space-y-6">
      {!showInvoice && (
        <>
          <section className={`${card} p-5 sm:p-6`}>
            <h2 id="societe-label" className="text-sm font-semibold text-slate-700 mb-2.5">1. Société qui facture</h2>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby="societe-label">
              {INVOICE_COMPANIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={companyId === c.id}
                  onClick={() => chooseCompany(c.id)}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${companyId === c.id ? 'border-blue-600 bg-blue-50/60 font-semibold text-slate-900 ring-1 ring-blue-600' : 'border-slate-200 text-slate-700 hover:border-blue-300'}`}
                >
                  {c.name}
                  <span className="text-xs font-normal text-slate-500">{c.letterheadUrl ? 'Papier en-tête' : 'En-tête simple'}</span>
                </button>
              ))}
            </div>
            {!company.salesOf && (
              <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                Aucun chauffeur n'est rattaché à {company.name} : les ventes des deux sociétés sont proposées.
              </p>
            )}

            <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
              <div>
                <label htmlFor="invoice-month" className="block text-sm font-semibold text-slate-700 mb-2.5">2. Mois</label>
                <select id="invoice-month" value={month} onChange={(e) => chooseMonth(e.target.value)} className={selectClass}>
                  {months.map((m) => <option key={m} value={m}>{format(parseISO(`${m}-01`), 'MMMM yyyy', { locale: fr }).toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="invoice-client" className="block text-sm font-semibold text-slate-700 mb-2.5">3. Client</label>
                <select id="invoice-client" value={clientId} onChange={(e) => chooseClient(e.target.value)} disabled={monthClients.length === 0} className={selectClass}>
                  <option value="">Sélectionnez un client…</option>
                  {monthClients.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.city}</option>)}
                </select>
                {monthClients.length === 0 && (
                  <p className="mt-2 text-xs text-slate-500">Aucune vente de {company.name} ce mois-ci.</p>
                )}
              </div>
            </div>
          </section>

          {client && (
            <section className={card} aria-labelledby="ventes-title">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h2 id="ventes-title" className="font-semibold text-slate-900">4. Ventes à facturer</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {client.name} · {periodLabel} · regroupées par marque et produit
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelected(new Set(clientSales.map((s) => s.id)))} className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Tout inclure</button>
                  <button type="button" onClick={() => setSelected(new Set())} className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Tout retirer</button>
                </div>
              </div>

              <ul className="divide-y divide-slate-100">
                {groups.map((group) => {
                  const included = group.sales.filter((s) => selected.has(s.id));
                  const isOpen = expanded.has(group.key);
                  return (
                    <li key={group.key}>
                      <div className="flex items-start gap-3 px-5 py-3.5 sm:items-center sm:gap-4">
                        <span className="flex pt-1 sm:pt-0">
                          <TriCheckbox
                            checked={included.length === group.sales.length}
                            indeterminate={included.length > 0 && included.length < group.sales.length}
                            onChange={() => toggleGroup(group)}
                            label={`Inclure ${group.label}`}
                          />
                        </span>
                        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">{group.label}</p>
                            <p className="text-sm text-slate-500">
                              {group.sales.length} vente{group.sales.length > 1 ? 's' : ''} · {group.quantity} bouteille{group.quantity > 1 ? 's' : ''}
                              {included.length > 0 && included.length < group.sales.length && ` · ${included.length} incluse${included.length > 1 ? 's' : ''}`}
                            </p>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-4 sm:mt-0">
                            <div className="sm:text-right">
                              <p className={`font-semibold tabular-nums ${included.length ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                                {formatAmount(included.length ? included.reduce((sum, s) => sum + s.totalPrice, 0) : group.total)} MAD
                              </p>
                              {included.length > 0 && included.length < group.sales.length && (
                                <p className="text-xs text-slate-500 tabular-nums">sur {formatAmount(group.total)} MAD</p>
                              )}
                            </div>
                            <button type="button" onClick={() => toggleExpanded(group.key)} aria-expanded={isOpen} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                              {isOpen ? 'Masquer' : 'Détail'}
                            </button>
                          </div>
                        </div>
                      </div>
                      {isOpen && (
                        <ul className="mx-5 mb-3.5 divide-y divide-slate-100 rounded-xl bg-slate-50 text-sm">
                          {group.sales.map((sale) => (
                            <li key={sale.id}>
                              <label className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5">
                                <input type="checkbox" checked={selected.has(sale.id)} onChange={() => toggleSale(sale.id)} className="h-4 w-4 accent-blue-600" />
                                <span className="min-w-0 flex-1 sm:flex sm:items-center">
                                  <span className="block tabular-nums text-slate-500 sm:w-28 sm:shrink-0">{format(parseISO(sale.date), 'dd/MM/yyyy')}</span>
                                  <span className="block text-slate-700">
                                    {sale.quantity} × {formatAmount(sale.unitPrice)} MAD{sale.isConsignment ? ' · consignation' : ''}
                                  </span>
                                </span>
                                <span className="whitespace-nowrap font-medium text-slate-900 tabular-nums">{formatAmount(sale.totalPrice)} MAD</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  {selectedSales.length} vente{selectedSales.length > 1 ? 's' : ''} incluse{selectedSales.length > 1 ? 's' : ''} ·{' '}
                  <span className="text-lg font-bold text-slate-900 tabular-nums">{formatAmount(selectedTotal)} MAD</span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowInvoice(true)}
                  disabled={selectedSales.length === 0}
                  className="h-11 px-6 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer la facture
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {showInvoice && client && (
        <section className={`${card} p-5 sm:p-6`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setShowInvoice(false)} className="h-10 px-4 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              ← Modifier la sélection
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => generate('print')} disabled={isGenerating} className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Imprimer
              </button>
              <button type="button" onClick={() => generate('download')} disabled={isGenerating} className="h-10 px-5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {isGenerating ? 'Génération…' : 'Télécharger le PDF'}
              </button>
            </div>
          </div>

          {/* Preview with the issuing company's letterhead; the PDF uses the same layout */}
          <div className="mx-auto w-full max-w-[794px] shadow-lg ring-1 ring-slate-200" style={{ containerType: 'inline-size' }}>
            <div
              className="relative bg-white bg-cover bg-top"
              style={{ aspectRatio: '210 / 297', backgroundImage: issuer.letterheadUrl ? `url(${issuer.letterheadUrl})` : undefined }}
            >
              {!issuer.letterheadUrl && (
                <>
                  <div className="absolute flex items-start justify-between" style={{ top: '5%', left: '8.6%', right: '8.6%' }}>
                    <div>
                      <p className="font-bold" style={{ fontSize: '3.6cqw', color: `rgb(${issuer.color.join(',')})`, lineHeight: 1.1 }}>{issuer.name}</p>
                      <p className="text-slate-500" style={{ fontSize: '1.3cqw' }}>{issuer.tagline}</p>
                    </div>
                    <div className="text-right text-slate-600" style={{ fontSize: '1.2cqw' }}>
                      {issuer.details.map((d) => <p key={d}>{d}</p>)}
                    </div>
                  </div>
                  <div className="absolute flex" style={{ top: '13.8%', left: '8.6%', right: '8.6%', height: '0.3cqw' }}>
                    <span style={{ flex: 62, backgroundColor: `rgb(${issuer.color.join(',')})` }} />
                    <span style={{ flex: 38, backgroundColor: `rgb(${issuer.accent.join(',')})` }} />
                  </div>
                  <div className="absolute border-t border-slate-200 pt-[0.8cqw] text-center text-slate-500" style={{ bottom: '3%', left: '8.6%', right: '8.6%', fontSize: '1.1cqw' }}>
                    {issuer.name}
                  </div>
                </>
              )}
              <div className="absolute overflow-hidden text-slate-900" style={{ top, bottom, left: '8.6%', right: '8.6%', fontSize: '1.5cqw' }}>
                <div className="flex items-start justify-between gap-[3cqw]">
                  <div>
                    <h2 className="font-bold tracking-tight" style={{ fontSize: '3.6cqw', lineHeight: 1.1 }}>FACTURE</h2>
                    <p className="mt-[1.4cqw] text-slate-500">Période : <span className="font-bold text-slate-900">{periodLabel}</span></p>
                    <p className="text-slate-500">Date d'édition : <span className="font-bold text-slate-900">{format(new Date(), 'dd/MM/yyyy')}</span></p>
                  </div>
                  <div className="w-[40%] rounded-[0.6cqw] border border-slate-300 bg-white p-[1.6cqw]">
                    <p className="font-bold text-slate-500" style={{ fontSize: '1.1cqw' }}>FACTURÉ À</p>
                    <p className="font-bold uppercase" style={{ fontSize: '1.8cqw' }}>{client.name}</p>
                    {client.address && <p className="text-slate-600">{client.address}</p>}
                    {client.city && <p className="text-slate-600">{client.city}</p>}
                    {client.ice && <p className="text-slate-600">ICE : {client.ice}</p>}
                    {client.code && <p className="text-slate-600">Code client : {client.code}</p>}
                  </div>
                </div>

                <table className="mt-[3cqw] w-full border-collapse">
                  <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: `rgb(${issuer.color.join(',')})` }}>
                      <th className="px-[1.2cqw] py-[0.9cqw] font-bold">Article</th>
                      <th className="px-[1.2cqw] py-[0.9cqw] font-bold text-right">Quantité</th>
                      <th className="px-[1.2cqw] py-[0.9cqw] font-bold text-right">Prix unitaire (MAD)</th>
                      <th className="px-[1.2cqw] py-[0.9cqw] font-bold text-right">Total (MAD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.label + line.unitPrice} className="border-b border-slate-200 bg-white/90">
                        <td className="px-[1.2cqw] py-[0.9cqw] font-bold">{line.label}</td>
                        <td className="px-[1.2cqw] py-[0.9cqw] text-right">{line.quantity}</td>
                        <td className="px-[1.2cqw] py-[0.9cqw] text-right">{formatAmount(line.unitPrice)}</td>
                        <td className="px-[1.2cqw] py-[0.9cqw] text-right">{formatAmount(line.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-white/90">
                      <td colSpan={3} className="px-[1.2cqw] py-[1.2cqw] text-right font-bold" style={{ fontSize: '1.8cqw' }}>Montant total</td>
                      <td className="px-[1.2cqw] py-[1.2cqw] text-right font-bold whitespace-nowrap" style={{ fontSize: '1.8cqw' }}>{formatAmount(selectedTotal)} MAD</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          {lines.length > 14 && (
            <p className="mt-3 text-center text-sm text-slate-500">Aperçu de la première page : le PDF ajoute les pages suivantes.</p>
          )}
        </section>
      )}
    </div>
  );
}
