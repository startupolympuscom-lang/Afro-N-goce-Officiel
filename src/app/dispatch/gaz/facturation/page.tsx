import React, { useState } from 'react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { FileText, Plus, Trash2, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { InvoiceGenerator } from './InvoiceGenerator';

export default function DispatchFacturationPage() {
  const { factureRequests, addFactureRequest, deleteFactureRequest } = useDispatchGazStore();
  const [activeTab, setActiveTab] = useState<'generer' | 'demander'>('generer');

  // Demander Facture State
  const [requestForm, setRequestForm] = useState({
    fournisseur: '',
    description: '',
    montant: ''
  });

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
          <p className="text-slate-500 mt-2">Générer les factures par société ou demander des factures à la comptabilité.</p>
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

      {activeTab === 'generer' && <InvoiceGenerator />}

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
