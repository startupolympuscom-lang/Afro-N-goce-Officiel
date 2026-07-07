import React, { useState, useMemo } from 'react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { Calendar, Building2, FileText, Printer, CheckSquare, Square, ArrowLeft, Plus, Trash2, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

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

  const handlePrint = () => {
    window.print();
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
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Imprimer la facture
            </button>
          </div>

          <div className="print-area">
            {/* INVOICE CONTENT */}
            <div className="mx-auto bg-white" style={{ minHeight: '297mm', padding: '0', display: 'flex', flexDirection: 'column' }}>
              {/* Header space for letterhead (adjust margin in CSS below) */}
              <div className="print-header-space" style={{ height: '3.5cm' }}></div>
              
              <div className="flex-1 px-8 pb-8">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase">FACTURE</h2>
                    <p className="text-slate-500">Mois: <span className="font-bold text-slate-900">{format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: fr }).toUpperCase()}</span></p>
                    <p className="text-slate-500">Date d'édition: <span className="font-bold text-slate-900">{format(new Date(), 'dd/MM/yyyy')}</span></p>
                  </div>
                  
                  <div className="text-right border border-slate-200 p-4 rounded-xl min-w-[300px]">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Facturé à</p>
                    <h3 className="text-xl font-bold text-slate-900 uppercase">{selectedClient.name}</h3>
                    {selectedClient.address && <p className="text-slate-600 font-medium">{selectedClient.address}</p>}
                    <p className="text-slate-600 font-medium">{selectedClient.city}</p>
                    {selectedClient.ice && <p className="text-slate-500 text-sm mt-1">ICE: <span className="font-medium text-slate-800">{selectedClient.ice}</span></p>}
                    {selectedClient.code && <p className="text-slate-500 text-sm">Code Client: <span className="font-medium text-slate-800">{selectedClient.code}</span></p>}
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Résumé des consommations</h4>
                  <table className="w-full text-left font-medium text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-3 px-2">Article</th>
                        <th className="py-3 px-2 text-right">Quantité</th>
                        <th className="py-3 px-2 text-right">Prix Unitaire</th>
                        <th className="py-3 px-2 text-right">Total (MAD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item, idx) => {
                        const brand = brands.find(b => b.id === item.brandId);
                        return (
                          <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            <td className="py-3 px-2 font-bold text-slate-900">{brand?.name || item.brandId} - {item.category}</td>
                            <td className="py-3 px-2 text-right">{item.quantity}</td>
                            <td className="py-3 px-2 text-right">{item.unitPrice.toFixed(2)}</td>
                            <td className="py-3 px-2 text-right font-bold text-slate-900">{item.totalPrice.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900">
                        <td colSpan={3} className="py-4 px-2 text-right font-black uppercase text-slate-500 tracking-widest">Montant Total :</td>
                        <td className="py-4 px-2 text-right font-black text-2xl text-slate-900">{invoiceData.totalAmount.toFixed(2)} MAD</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Removed Détail des bons de livraison as requested */}
              </div>
              
              {/* Footer space for letterhead */}
              <div className="print-footer-space" style={{ height: '3.5cm' }}></div>
            </div>
          </div>
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

      {/* Embedded print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0; /* Remove default browser margins so letterhead space acts as exact margin */
          }
        }
      `}} />
    </div>
  );
}
