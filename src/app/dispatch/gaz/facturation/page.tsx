import React, { useState, useMemo } from 'react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { Calendar, Building2, FileText, CheckSquare, Square, ArrowLeft, Plus, Trash2, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { LETTERHEAD_URL, downloadInvoicePdf, formatAmount, printInvoicePdf, type InvoiceInput } from './invoicePdf';

export default function DispatchFacturationPage() {
  const { clients, sales, brands, factureRequests, addFactureRequest, deleteFactureRequest } = useDispatchGazStore();
  const [activeTab, setActiveTab] = useState<'generer' | 'demander'>('generer');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  // Demander Facture State
  const [requestForm, setRequestForm] = useState({
    fournisseur: '',
    description: '',
    montant: ''
  });
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set());
  const [showInvoice, setShowInvoice] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const months = useMemo(() => {
    const uniqueMonths = new Set<string>();
    sales.forEach(sale => {
      if (sale.date) {
        uniqueMonths.add(sale.date.substring(0, 7)); // yyyy-MM
      }
    });
    // Add current month if empty
    uniqueMonths.add(format(new Date(), 'yyyy-MM'));
    return Array.from(uniqueMonths).sort().reverse();
  }, [sales]);

  const clientsWithSalesInMonth = useMemo(() => {
    if (!selectedMonth) return [];
    
    const clientIds = new Set<string>();
    sales.forEach(sale => {
      if (sale.date && sale.date.startsWith(selectedMonth)) {
        clientIds.add(sale.clientId);
      }
    });
    
    return clients.filter(c => clientIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, sales, selectedMonth]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const clientSalesForMonth = useMemo(() => {
    if (!selectedClientId || !selectedMonth) return [];
    return sales
      .filter(s => s.clientId === selectedClientId && s.date && s.date.startsWith(selectedMonth))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sales, selectedClientId, selectedMonth]);

  const invoiceData = useMemo(() => {
    if (!selectedClientId || !selectedMonth || selectedSaleIds.size === 0) return null;

    const selectedSales = clientSalesForMonth.filter(s => selectedSaleIds.has(s.id));

    type SummaryItem = { brandId: string, category: string, unitPrice: number, quantity: number, totalPrice: number };
    const summary = selectedSales.reduce((acc, sale) => {
      const key = `${sale.brandId}-${sale.category}`;
      if (!acc[key]) {
        acc[key] = {
          brandId: sale.brandId,
          category: sale.category,
          unitPrice: sale.unitPrice,
          quantity: 0,
          totalPrice: 0
        };
      }
      acc[key].quantity += sale.quantity;
      acc[key].totalPrice += sale.totalPrice;
      return acc;
    }, {} as Record<string, SummaryItem>);

    const items: SummaryItem[] = Object.values(summary);
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      items,
      totalAmount,
      salesDetails: selectedSales
    };
  }, [clientSalesForMonth, selectedSaleIds, selectedClientId, selectedMonth]);

  const periodLabel = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr }).toUpperCase();

  const invoiceInput = (): InvoiceInput | null => {
    if (!invoiceData || !selectedClient) return null;
    return {
      client: {
        name: selectedClient.name,
        address: selectedClient.address,
        city: selectedClient.city,
        ice: selectedClient.ice,
        code: selectedClient.code,
      },
      periodLabel,
      issuedOn: new Date(),
      lines: invoiceData.items.map((item) => ({
        label: `${brands.find((b) => b.id === item.brandId)?.name || item.brandId} - ${item.category}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.totalPrice,
      })),
      total: invoiceData.totalAmount,
      fileName: `Facture_${selectedClient.name.replace(/[^\p{L}\p{N}]+/gu, '-')}_${selectedMonth}.pdf`,
    };
  };

  // Invoices are generated as PDF on the company letterhead
  const generate = async (action: 'download' | 'print') => {
    const input = invoiceInput();
    if (!input) return;
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

  const toggleSale = (saleId: string) => {
    const newSelected = new Set(selectedSaleIds);
    if (newSelected.has(saleId)) {
      newSelected.delete(saleId);
    } else {
      newSelected.add(saleId);
    }
    setSelectedSaleIds(newSelected);
  };

  const selectAllSales = () => {
    const allIds = new Set<string>(clientSalesForMonth.map(s => s.id));
    setSelectedSaleIds(allIds);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
    setSelectedClientId('');
    setSelectedSaleIds(new Set<string>());
    setShowInvoice(false);
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClientId(e.target.value);
    setSelectedSaleIds(new Set<string>());
    setShowInvoice(false);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.fournisseur || !requestForm.description) return;
    addFactureRequest({
      fournisseur: requestForm.fournisseur,
      description: requestForm.description,
      montant: requestForm.montant ? parseFloat(requestForm.montant) : undefined,
      status: 'pending'
    });
    setRequestForm({ fournisseur: '', description: '', montant: '' });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Facturation Client & Demandes</h1>
          <p className="text-slate-500 mt-2">Générer les factures ou demander des factures à la comptabilité.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 print:hidden">
        <button
          onClick={() => setActiveTab('generer')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'generer' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
        >
          Générer une Facture
        </button>
        <button
          onClick={() => setActiveTab('demander')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === 'demander' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
        >
          Demander une Facture
        </button>
      </div>

      {activeTab === 'generer' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:hidden">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-2">1. Sélectionnez le mois</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              {months.map(m => (
                <option key={m} value={m}>
                  {format(parseISO(`${m}-01`), 'MMMM yyyy', { locale: fr }).toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-2">2. Sélectionnez le client</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={selectedClientId}
              onChange={handleClientChange}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
              disabled={!selectedMonth || clientsWithSalesInMonth.length === 0}
            >
              <option value="">Sélectionnez un client...</option>
              {clientsWithSalesInMonth.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.city}</option>
              ))}
            </select>
          </div>
          {selectedMonth && clientsWithSalesInMonth.length === 0 && (
            <p className="text-xs text-orange-500 mt-2">Aucun client n'a de ventes pour ce mois.</p>
          )}
        </div>
      </div>

      {!showInvoice && selectedClient && clientSalesForMonth.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 print:hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Sélectionnez les ventes ({clientSalesForMonth.length})</h3>
              <p className="text-sm text-slate-500 mt-1">Choisissez les bons à inclure dans la facture.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={selectAllSales}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Sélectionner tout
              </button>
              <button
                onClick={() => setShowInvoice(true)}
                disabled={selectedSaleIds.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Créer la facture ({selectedSaleIds.size})
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {clientSalesForMonth.map(sale => {
              const brand = brands.find(b => b.id === sale.brandId);
              const isSelected = selectedSaleIds.has(sale.id);
              
              return (
                <div 
                  key={sale.id}
                  onClick={() => toggleSale(sale.id)}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="mr-4 text-blue-500">
                    {isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 text-slate-300" />}
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">Date</span>
                      <span className="font-mono text-sm font-medium text-slate-700">{format(parseISO(sale.date), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">Article</span>
                      <span className="font-bold text-slate-900">{brand?.name} {sale.category}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">Quantité</span>
                      <span className="font-medium text-slate-800">{sale.quantity}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block mb-0.5">Total</span>
                      <span className="font-bold text-slate-900">{sale.totalPrice.toFixed(2)} MAD</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showInvoice && invoiceData && selectedClient && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
          <div className="flex justify-between mb-4 print:hidden">
            <button
              onClick={() => setShowInvoice(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Modifier la sélection
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => generate('print')}
                disabled={isGenerating}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Imprimer
              </button>
              <button
                onClick={() => generate('download')}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Génération…' : 'Télécharger le PDF'}
              </button>
            </div>
          </div>

          {/* Preview on the letterhead; the PDF uses the same layout (content between the header and footer rules) */}
          <div className="mx-auto w-full max-w-[794px] shadow-lg ring-1 ring-slate-200" style={{ containerType: 'inline-size' }}>
            <div className="relative bg-white bg-cover bg-top" style={{ aspectRatio: '210 / 297', backgroundImage: `url(${LETTERHEAD_URL})` }}>
              <div className="absolute overflow-hidden text-slate-900" style={{ top: '22.2%', bottom: '11.8%', left: '8.6%', right: '8.6%', fontSize: '1.5cqw' }}>
                <div className="flex items-start justify-between gap-[3cqw]">
                  <div>
                    <h2 className="font-bold tracking-tight" style={{ fontSize: '3.6cqw', lineHeight: 1.1 }}>FACTURE</h2>
                    <p className="mt-[1.4cqw] text-slate-500">Période : <span className="font-bold text-slate-900">{periodLabel}</span></p>
                    <p className="text-slate-500">Date d'édition : <span className="font-bold text-slate-900">{format(new Date(), 'dd/MM/yyyy')}</span></p>
                  </div>
                  <div className="w-[40%] rounded-[0.6cqw] border border-slate-300 bg-white p-[1.6cqw]">
                    <p className="font-bold text-slate-500" style={{ fontSize: '1.1cqw' }}>FACTURÉ À</p>
                    <p className="font-bold uppercase" style={{ fontSize: '1.8cqw' }}>{selectedClient.name}</p>
                    {selectedClient.address && <p className="text-slate-600">{selectedClient.address}</p>}
                    {selectedClient.city && <p className="text-slate-600">{selectedClient.city}</p>}
                    {selectedClient.ice && <p className="text-slate-600">ICE : {selectedClient.ice}</p>}
                    {selectedClient.code && <p className="text-slate-600">Code client : {selectedClient.code}</p>}
                  </div>
                </div>

                <table className="mt-[3cqw] w-full border-collapse">
                  <thead>
                    <tr className="text-left text-white" style={{ backgroundColor: '#007D73' }}>
                      <th className="px-[1.2cqw] py-[0.9cqw] font-bold">Article</th>
                      <th className="px-[1.2cqw] py-[0.9cqw] font-bold text-right">Quantité</th>
                      <th className="px-[1.2cqw] py-[0.9cqw] font-bold text-right">Prix unitaire (MAD)</th>
                      <th className="px-[1.2cqw] py-[0.9cqw] font-bold text-right">Total (MAD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-200 bg-white/90">
                        <td className="px-[1.2cqw] py-[0.9cqw] font-bold">{brands.find((b) => b.id === item.brandId)?.name || item.brandId} - {item.category}</td>
                        <td className="px-[1.2cqw] py-[0.9cqw] text-right">{item.quantity}</td>
                        <td className="px-[1.2cqw] py-[0.9cqw] text-right">{formatAmount(item.unitPrice)}</td>
                        <td className="px-[1.2cqw] py-[0.9cqw] text-right">{formatAmount(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-white/90">
                      <td colSpan={3} className="px-[1.2cqw] py-[1.2cqw] text-right font-bold" style={{ fontSize: '1.8cqw' }}>Montant total</td>
                      <td className="px-[1.2cqw] py-[1.2cqw] text-right font-bold whitespace-nowrap" style={{ fontSize: '1.8cqw' }}>{formatAmount(invoiceData.totalAmount)} MAD</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          {invoiceData.items.length > 14 && (
            <p className="mt-3 text-center text-sm text-slate-500">Aperçu de la première page : le PDF ajoute les pages suivantes avec le papier en-tête.</p>
          )}
        </div>
      )}
      </>
      )}

      {activeTab === 'demander' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Nouvelle Demande de Facture
            </h2>
            <form onSubmit={handleRequestSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Fournisseur / Client</label>
                <input
                  type="text"
                  value={requestForm.fournisseur}
                  onChange={e => setRequestForm({...requestForm, fournisseur: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  placeholder="Nom du fournisseur"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Description / Motif</label>
                <input
                  type="text"
                  value={requestForm.description}
                  onChange={e => setRequestForm({...requestForm, description: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  placeholder="Description de la facture à demander..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Montant (Optionnel)</label>
                <input
                  type="number"
                  step="0.01"
                  value={requestForm.montant}
                  onChange={e => setRequestForm({...requestForm, montant: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-4 flex justify-end mt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Envoyer la Demande
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                Liste des Factures à Demander
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                    <th className="p-4">Date</th>
                    <th className="p-4">Fournisseur / Client</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4 text-center">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(factureRequests || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 bg-white font-medium">
                        Aucune demande en cours.
                      </td>
                    </tr>
                  ) : (
                    (factureRequests || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(req => (
                      <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 bg-white">
                        <td className="p-4 text-slate-500 font-mono text-xs">{format(parseISO(req.date), 'dd/MM/yyyy HH:mm')}</td>
                        <td className="p-4 font-bold text-slate-800">{req.fournisseur}</td>
                        <td className="p-4 text-slate-600">{req.description}</td>
                        <td className="p-4 font-mono font-medium text-slate-700">
                          {req.montant ? `${req.montant.toFixed(2)} MAD` : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {req.status === 'completed' ? 'Déposée' : 'En attente'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => deleteFactureRequest(req.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer la demande"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
