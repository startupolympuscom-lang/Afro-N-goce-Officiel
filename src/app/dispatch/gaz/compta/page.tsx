import React, { useMemo, useState } from 'react';
import { Download, Trash2, UploadCloud, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useCarburantStore } from '../../../../stores/useCarburantStore';
import { useChargeVariableStore } from '../../../../stores/useChargeVariableStore';
import { useVehiculeStore } from '../../../../stores/useVehiculeStore';
import { useDispatchGazStore, type ComptaDocument } from '../../../../stores/useDispatchGazStore';
import { useDispatchAuthStore } from '../../../../stores/useDispatchAuthStore';
import { DISPATCH_COMPANIES, DEFAULT_COMPANY, companyName, type CompanyId } from '../../../../lib/dispatchCompanies';
import { Card, EmptyState, PageHeader, Segmented, Stat, Tabs, buttonPrimary, inputClass } from '../../../../components/dispatch/DispatchUI';

type Tab = 'synthese' | 'pieces' | 'factures';
type Detail = 'ventes' | 'achats' | 'flotte' | 'paie';
type DocType = ComptaDocument['type'];

const DOC_TYPES: { id: DocType; label: string }[] = [
  { id: 'facture', label: 'Facture' },
  { id: 'bon_commande', label: 'Bon de commande' },
  { id: 'bon_livraison', label: 'Bon de livraison' },
  { id: 'declaration_tva', label: 'Déclaration TVA' },
  { id: 'declaration_cnss', label: 'Déclaration CNSS' },
];
const docLabel = (t: DocType) => DOC_TYPES.find((d) => d.id === t)?.label || t;
const money = (v: number) => `${(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MAD`;
const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
const monthLabel = (m: string) => new Date(`${m}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

function ShareBar({ value, total, color }: { value: number; total: number; color: string }) {
  const p = pct(value, total);
  return (
    <span className="flex items-center justify-end gap-2">
      <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 sm:block"><span className="block h-full rounded-full" style={{ width: `${Math.min(100, p)}%`, backgroundColor: color }} /></span>
      <span className="w-12 whitespace-nowrap text-right tabular-nums text-slate-500">{p} %</span>
    </span>
  );
}

export default function DispatchComptaPage() {
  const { user } = useDispatchAuthStore();
  const { tickets: carburantTickets } = useCarburantStore();
  const { charges: variableCharges } = useChargeVariableStore();
  const vehicules = useVehiculeStore((s) => s.vehicules);
  const {
    sales, drivers, brands, paySlips, commandes = [], comptaDocuments = [], factureRequests = [],
    addComptaDocument, deleteComptaDocument, updateFactureRequestStatus,
  } = useDispatchGazStore();

  const [company, setCompany] = useState<CompanyId>(DEFAULT_COMPANY);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tab, setTab] = useState<Tab>('synthese');
  const [detail, setDetail] = useState<Detail>('ventes');

  const driverCompany = (id: string) => drivers.find((d) => d.id === id)?.company || DEFAULT_COMPANY;
  const driverLabel = (id: string) => { const d = drivers.find((x) => x.id === id); return d ? `${d.prenom} ${d.nom}` : 'Chauffeur inconnu'; };
  const vehicleLabel = (id: string) => vehicules.find((v) => v.id === id)?.immatriculation || id || '—';
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name || id;

  // ---- Same figures as before, grouped for the monthly summary ----
  const fleet = useMemo(() => {
    const tickets = carburantTickets.filter((t) => {
      const driver = drivers.find((d) => d.id === t.chauffeurId);
      const companyMatches = driver ? (driver.company || DEFAULT_COMPANY) === company : true;
      return (t.createdAt?.startsWith(month) || t.dateHeure?.startsWith(month)) && companyMatches;
    });
    const charges = variableCharges.filter((c) => c.date?.startsWith(month));
    return {
      tickets, charges,
      fuel: tickets.reduce((s, t) => s + (t.coutTotal || 0), 0),
      liters: tickets.reduce((s, t) => s + (t.volume || 0), 0),
      variable: charges.reduce((s, c) => s + (c.montant || 0), 0),
    };
  }, [carburantTickets, variableCharges, month, company, drivers]);

  const salesData = useMemo(() => {
    const list = sales.filter((s) => s.date?.startsWith(month) && (s.company || driverCompany(s.driverId)) === company);
    const driverIds = new Set(drivers.map((d) => d.id));
    const byDriver: Record<string, { id: string; amount: number; qty: number }> = {};
    const payment = { espece: 0, cheque: 0, credit: 0 };
    let driverTotal = 0; let counterTotal = 0; let qty = 0;
    list.forEach((s) => {
      qty += s.quantity;
      if (s.paymentMethod in payment) payment[s.paymentMethod] += s.totalPrice;
      if (driverIds.has(s.driverId)) {
        driverTotal += s.totalPrice;
        byDriver[s.driverId] = byDriver[s.driverId] || { id: s.driverId, amount: 0, qty: 0 };
        byDriver[s.driverId].amount += s.totalPrice;
        byDriver[s.driverId].qty += s.quantity;
      } else counterTotal += s.totalPrice;
    });
    return { total: driverTotal + counterTotal, driverTotal, counterTotal, qty, payment, byDriver: Object.values(byDriver).sort((a, b) => b.amount - a.amount) };
  }, [sales, drivers, month, company]);

  const payroll = useMemo(() => {
    const slips = paySlips.filter((p) => p.month === month && drivers.some((d) => d.id === p.driverId && (d.company || DEFAULT_COMPANY) === company));
    return { slips, total: slips.reduce((s, p) => s + (p.totalCommission || 0), 0) };
  }, [paySlips, month, company, drivers]);

  const supply = useMemo(() => {
    const orders = (commandes || []).filter((c) => c.date?.startsWith(month) && (c.company === company || !c.company));
    return {
      orders: [...orders].sort((a, b) => b.date.localeCompare(a.date)),
      total: orders.reduce((s, c) => s + (c.totalPrice || 0), 0),
      unpaid: orders.filter((c) => c.status !== 'payé').reduce((s, c) => s + (c.totalPrice || 0), 0),
    };
  }, [commandes, month, company]);

  const expenses = supply.total + fleet.fuel + fleet.variable + payroll.total;
  const result = salesData.total - expenses;
  const pendingRequests = (factureRequests || []).filter((r) => r.status === 'pending').length;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
      <PageHeader title="Comptabilité" subtitle={`Recettes, dépenses et pièces justificatives de ${companyName(company)}, partagées avec le cabinet comptable.`}
        actions={<input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Mois" className={inputClass} />} />
      <Segmented<CompanyId> label="Société" value={company} onChange={setCompany} options={DISPATCH_COMPANIES.map((c) => ({ id: c.id, label: c.name }))} />
      <Tabs<Tab> label="Sections de la comptabilité" value={tab} onChange={setTab} tabs={[
        { id: 'synthese', label: 'Synthèse du mois' },
        { id: 'pieces', label: 'Pièces comptables' },
        { id: 'factures', label: 'Factures à demander', count: pendingRequests },
      ]} />

      {tab === 'synthese' && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={`Recettes · ${monthLabel(month)}`} value={money(salesData.total)} sub={`${salesData.qty.toLocaleString('fr-FR')} bouteille(s) vendue(s)`} />
            <Stat label="Dépenses" value={money(expenses)} sub={supply.unpaid > 0 ? `dont ${money(supply.unpaid)} de gaz encore à payer` : 'achats de gaz réglés'} tone={supply.unpaid > 0 ? 'warning' : undefined} />
            <Stat label="Résultat (recettes − dépenses)" value={money(result)} sub={result >= 0 ? 'bénéficiaire' : 'déficitaire'} tone={result >= 0 ? 'good' : 'critical'} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Card title="Compte de résultat simplifié" subtitle="Ventes de gaz moins achats, flotte et commissions du mois.">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/60"><td colSpan={3} className="px-5 py-2 text-xs font-semibold text-slate-500">Recettes</td></tr>
                  {[['Ventes des chauffeurs', salesData.driverTotal, 'livraisons en tournée'], ['Ventes au comptoir', salesData.counterTotal, 'vente directe']].map(([l, v, s]) => (
                    <tr key={l as string}>
                      <td className="px-5 py-2.5 text-slate-800">{l}<span className="ml-2 text-xs text-slate-400">{s}</span></td>
                      <td className="px-3 py-2.5"><ShareBar value={v as number} total={salesData.total} color="#2a78d6" /></td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-900">{money(v as number)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold"><td className="px-5 py-2.5 text-slate-900">Total recettes</td><td /><td className="px-5 py-2.5 text-right tabular-nums">{money(salesData.total)}</td></tr>

                  <tr className="bg-slate-50/60"><td colSpan={3} className="px-5 py-2 text-xs font-semibold text-slate-500">Dépenses</td></tr>
                  {[
                    ['Achats de gaz', supply.total, `${supply.orders.length} commande(s)`],
                    ['Carburant', fleet.fuel, `${fleet.liters.toLocaleString('fr-FR')} L · ${fleet.tickets.length} bon(s)`],
                    ['Charges variables flotte', fleet.variable, `${fleet.charges.length} opération(s)`],
                    ['Commissions chauffeurs', payroll.total, `${payroll.slips.length} fiche(s) de paie`],
                  ].map(([l, v, s]) => (
                    <tr key={l as string}>
                      <td className="px-5 py-2.5 text-slate-800">{l}<span className="ml-2 text-xs text-slate-400">{s}</span></td>
                      <td className="px-3 py-2.5"><ShareBar value={v as number} total={expenses} color="#eb6834" /></td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-900">{money(v as number)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold"><td className="px-5 py-2.5 text-slate-900">Total dépenses</td><td /><td className="px-5 py-2.5 text-right tabular-nums">{money(expenses)}</td></tr>
                  <tr className="border-t-2 border-slate-200 text-base font-bold">
                    <td className="px-5 py-3 text-slate-900">Résultat</td><td />
                    <td className={`px-5 py-3 text-right tabular-nums ${result >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{money(result)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>

            <Card title="Encaissements par mode" subtitle="Le crédit client reste à encaisser.">
              <ul className="divide-y divide-slate-100">
                {([['espece', 'Espèces'], ['cheque', 'Chèques'], ['credit', 'Crédit client']] as const).map(([k, l]) => (
                  <li key={k} className="px-5 py-3">
                    <div className="flex items-baseline justify-between text-sm"><span className="text-slate-700">{l}</span><span className="font-semibold tabular-nums text-slate-900">{money(salesData.payment[k])}</span></div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${pct(salesData.payment[k], salesData.total)}%`, backgroundColor: k === 'credit' ? '#eda100' : '#2a78d6' }} /></div>
                    <p className="mt-1 text-xs text-slate-500">{pct(salesData.payment[k], salesData.total)} % des ventes</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card title="Détail du mois" actions={<Segmented<Detail> label="Détail" value={detail} onChange={setDetail} options={[
            { id: 'ventes', label: 'Ventes par chauffeur' }, { id: 'achats', label: 'Achats de gaz' }, { id: 'flotte', label: 'Flotte' }, { id: 'paie', label: 'Paie' },
          ]} />}>
            <div className="overflow-x-auto">
              {detail === 'ventes' && (salesData.byDriver.length === 0 ? <EmptyState>Aucune vente chauffeur ce mois-ci.</EmptyState> : (
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-slate-50/60 text-xs text-slate-500"><tr><th className="px-5 py-2.5 text-left font-semibold">Chauffeur</th><th className="px-3 py-2.5 text-right font-semibold">Bouteilles</th><th className="px-3 py-2.5 text-right font-semibold">Part</th><th className="px-5 py-2.5 text-right font-semibold">Montant</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesData.byDriver.map((d) => (
                      <tr key={d.id}><td className="px-5 py-2.5 text-slate-900">{driverLabel(d.id)}</td><td className="px-3 py-2.5 text-right tabular-nums">{d.qty.toLocaleString('fr-FR')}</td><td className="px-3 py-2.5"><ShareBar value={d.amount} total={salesData.driverTotal} color="#2a78d6" /></td><td className="px-5 py-2.5 text-right tabular-nums">{money(d.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              ))}
              {detail === 'achats' && (supply.orders.length === 0 ? <EmptyState>Aucune commande de gaz ce mois-ci.</EmptyState> : (
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-slate-50/60 text-xs text-slate-500"><tr><th className="px-5 py-2.5 text-left font-semibold">Date</th><th className="px-3 py-2.5 text-left font-semibold">Produit</th><th className="px-3 py-2.5 text-right font-semibold">Quantité</th><th className="px-3 py-2.5 text-right font-semibold">Montant</th><th className="px-5 py-2.5 text-left font-semibold">Statut</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {supply.orders.map((c) => (
                      <tr key={c.id}>
                        <td className="px-5 py-2.5 tabular-nums text-slate-500">{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-3 py-2.5 text-slate-900">{brandName(c.brandId)} {c.category}<span className="ml-2 text-xs text-slate-400">{c.supplierId || 'Vivo Energy'}</span></td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{c.quantity.toLocaleString('fr-FR')}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{money(c.totalPrice)}</td>
                        <td className="px-5 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.status === 'payé' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{c.status === 'payé' ? 'Réglée' : 'À payer'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
              {detail === 'flotte' && (fleet.tickets.length + fleet.charges.length === 0 ? <EmptyState>Aucune dépense de flotte ce mois-ci.</EmptyState> : (
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-slate-50/60 text-xs text-slate-500"><tr><th className="px-5 py-2.5 text-left font-semibold">Date</th><th className="px-3 py-2.5 text-left font-semibold">Dépense</th><th className="px-3 py-2.5 text-left font-semibold">Véhicule</th><th className="px-5 py-2.5 text-right font-semibold">Montant</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ...fleet.tickets.map((t) => ({ id: t.id, date: t.dateHeure || t.createdAt, label: `Carburant ${t.reference || ''} · ${t.volume} L`, vehicle: t.vehiculeId, amount: t.coutTotal || 0 })),
                      ...fleet.charges.map((c) => ({ id: c.id, date: c.date, label: c.description || 'Charge variable', vehicle: c.vehiculeId, amount: c.montant || 0 })),
                    ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((r) => (
                      <tr key={r.id}><td className="px-5 py-2.5 tabular-nums text-slate-500">{r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '—'}</td><td className="px-3 py-2.5 text-slate-900">{r.label}</td><td className="px-3 py-2.5 text-slate-600">{vehicleLabel(r.vehicle)}</td><td className="px-5 py-2.5 text-right tabular-nums">{money(r.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              ))}
              {detail === 'paie' && (payroll.slips.length === 0 ? <EmptyState>Aucune fiche de paie pour ce mois.</EmptyState> : (
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-slate-50/60 text-xs text-slate-500"><tr><th className="px-5 py-2.5 text-left font-semibold">Chauffeur</th><th className="px-3 py-2.5 text-left font-semibold">Fiche générée le</th><th className="px-5 py-2.5 text-right font-semibold">Commission</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {payroll.slips.map((s) => (
                      <tr key={s.id}><td className="px-5 py-2.5 text-slate-900">{driverLabel(s.driverId)}</td><td className="px-3 py-2.5 tabular-nums text-slate-500">{new Date(s.generatedAt).toLocaleDateString('fr-FR')}</td><td className="px-5 py-2.5 text-right tabular-nums">{money(s.totalCommission)}</td></tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'pieces' && <DocumentsTab company={company} month={month} isAdmin={user?.role === 'admin'} isAccountant={user?.role === 'comptable'}
        documents={comptaDocuments || []} onAdd={addComptaDocument} onDelete={deleteComptaDocument} />}

      {tab === 'factures' && <FactureRequestsTab requests={factureRequests || []} onStatus={updateFactureRequestStatus} />}
    </div>
  );
}

function DocumentsTab({ company, month, isAdmin, isAccountant, documents, onAdd, onDelete }: {
  company: CompanyId; month: string; isAdmin: boolean; isAccountant: boolean; documents: ComptaDocument[];
  onAdd: (d: ComptaDocument) => void; onDelete: (id: string) => void;
}) {
  const [type, setType] = useState<DocType>('facture');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<{ name: string; data: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DocType>('all');
  const [onlyMonth, setOnlyMonth] = useState(false);

  const readFile = (f?: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onloadend = () => setFile({ name: f.name, data: reader.result as string });
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!reference.trim() || !date || !Number.isFinite(value)) { toast.error('Renseignez la référence, la date et le montant.'); return; }
    onAdd({
      id: `doc_${Math.random().toString(36).slice(2, 11)}`, type, reference: reference.trim(), date, amount: value,
      fileName: file?.name || '', fileData: file?.data || '', notes, uploadedAt: new Date().toISOString(), company,
    });
    toast.success(`${docLabel(type)} ${reference.trim()} transmis au cabinet.`);
    setReference(''); setAmount(''); setNotes(''); setFile(null);
  };

  const download = (d: ComptaDocument) => {
    if (!d.fileData) return;
    const link = document.createElement('a');
    link.href = d.fileData;
    link.setAttribute('download', d.fileName || `${d.reference}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const list = useMemo(() => documents
    .filter((d) => (d.company ? d.company === company : true))
    .filter((d) => typeFilter === 'all' || d.type === typeFilter)
    .filter((d) => !onlyMonth || d.date?.startsWith(month))
    .filter((d) => { const q = search.trim().toLowerCase(); return !q || d.reference.toLowerCase().includes(q) || (d.notes || '').toLowerCase().includes(q); })
    .sort((a, b) => (b.date || '').localeCompare(a.date || '')), [documents, company, typeFilter, onlyMonth, month, search]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card title="Déposer une pièce" subtitle={`Pour ${companyName(company)}`} bodyClass="p-5">
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-xs font-medium text-slate-500">Type
            <select value={type} onChange={(e) => setType(e.target.value as DocType)} className={`${inputClass} mt-1 block w-full`}>
              {DOC_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-500">Numéro / référence
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="ex : FACT-2026-641" className={`${inputClass} mt-1 block w-full`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-500">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} mt-1 block w-full`} /></label>
            <label className="block text-xs font-medium text-slate-500">Montant (MAD)<input type="number" inputMode="decimal" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputClass} mt-1 block w-full text-right`} /></label>
          </div>
          <label className="block text-xs font-medium text-slate-500">Notes (facultatif)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Fournisseur, chauffeur, objet…" className="mt-1 block w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15" />
          </label>
          <label onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files?.[0]); }}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center text-sm ${dragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}>
            <UploadCloud className="h-5 w-5 text-slate-400" />
            {file ? <span className="font-medium text-slate-900">{file.name}</span> : <><span className="font-medium text-slate-700">Joindre le fichier scanné</span><span className="text-xs text-slate-500">PDF ou image, glisser-déposer ou cliquer</span></>}
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => readFile(e.target.files?.[0])} />
          </label>
          <button type="submit" className={`${buttonPrimary} w-full`}>Transmettre au cabinet</button>
        </form>
      </Card>

      <Card title="Archives" subtitle={isAccountant ? 'Accès cabinet comptable : consultation et dépôt.' : 'Pièces visibles par le cabinet comptable dès leur dépôt.'}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
          <span className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Référence ou notes" aria-label="Rechercher une pièce" className={`${inputClass} w-56 pl-8`} />
          </span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | DocType)} aria-label="Type de pièce" className={inputClass}>
            <option value="all">Tous les types</option>
            {DOC_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={onlyMonth} onChange={(e) => setOnlyMonth(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />{monthLabel(month)} uniquement</label>
        </div>
        {list.length === 0 ? <EmptyState>Aucune pièce ne correspond.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-slate-50/60 text-xs text-slate-500">
                <tr><th className="px-5 py-2.5 text-left font-semibold">Pièce</th><th className="px-3 py-2.5 text-left font-semibold">Date</th><th className="px-3 py-2.5 text-right font-semibold">Montant</th><th className="px-3 py-2.5 text-left font-semibold">Fichier</th><th className="px-5 py-2.5" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-2.5">
                      <p className="font-medium text-slate-900">{d.reference} <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{docLabel(d.type)}</span></p>
                      {d.notes && <p className="max-w-xs truncate text-xs text-slate-500" title={d.notes}>{d.notes}</p>}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-500">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">{money(d.amount)}</td>
                    <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-600" title={d.fileName}>{d.fileData ? d.fileName : <span className="text-slate-400">Aucun fichier</span>}</td>
                    <td className="px-5 py-2.5">
                      <span className="flex justify-end gap-1">
                        <button type="button" onClick={() => download(d)} disabled={!d.fileData} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30" aria-label={`Télécharger ${d.reference}`} title="Télécharger"><Download className="h-4 w-4" /></button>
                        {isAdmin && (
                          <button type="button" onClick={() => { if (window.confirm(`Supprimer la pièce ${d.reference} des archives ?`)) { onDelete(d.id); toast.success('Pièce supprimée des archives.'); } }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Supprimer ${d.reference}`} title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </span>
                    </td>
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

function FactureRequestsTab({ requests, onStatus }: { requests: { id: string; date: string; fournisseur: string; montant?: number; description: string; status: 'pending' | 'completed' }[]; onStatus: (id: string, s: 'pending' | 'completed') => void }) {
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const list = [...requests].filter((r) => filter === 'all' || r.status === filter).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <Card title="Factures à demander" subtitle="Dépenses payées dont la facture doit encore être récupérée auprès du fournisseur."
      actions={<Segmented<"pending" | "completed" | "all"> label="Statut" value={filter} onChange={setFilter} options={[{ id: 'pending', label: 'À réclamer' }, { id: 'completed', label: 'Déposées' }, { id: 'all', label: 'Toutes' }]} />}>
      {list.length === 0 ? <EmptyState>{filter === 'pending' ? 'Aucune facture à réclamer.' : 'Aucune facture.'}</EmptyState> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50/60 text-xs text-slate-500">
              <tr><th className="px-5 py-2.5 text-left font-semibold">Date</th><th className="px-3 py-2.5 text-left font-semibold">Fournisseur / client</th><th className="px-3 py-2.5 text-left font-semibold">Description</th><th className="px-3 py-2.5 text-right font-semibold">Montant</th><th className="px-3 py-2.5 text-left font-semibold">Statut</th><th className="px-5 py-2.5" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-2.5 tabular-nums text-slate-500">{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-900">{r.fournisseur}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.description}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.montant ? money(r.montant) : '—'}</td>
                  <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{r.status === 'completed' ? 'Déposée' : 'À réclamer'}</span></td>
                  <td className="px-5 py-2.5 text-right">
                    {r.status === 'pending'
                      ? <button type="button" onClick={() => { onStatus(r.id, 'completed'); toast.success('Facture marquée comme déposée.'); }} className="text-sm font-medium text-blue-600 hover:text-blue-700">Marquer déposée</button>
                      : <button type="button" onClick={() => onStatus(r.id, 'pending')} className="text-sm font-medium text-slate-500 hover:text-slate-700">Remettre à réclamer</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
