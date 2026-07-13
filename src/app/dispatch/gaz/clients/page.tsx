import React, { useState, useMemo } from 'react';
import { useDispatchGazStore, GazClient, GazSale } from '../../../../stores/useDispatchGazStore';
import { Plus, Trash2, MapPin, Edit2, Search, X, RefreshCw, History, Calendar, Truck, Coins, DollarSign, CheckCircle2, XCircle, FileCheck2, Building2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position} />;
}

export default function DispatchClientsPage() {
  const { clients, addClient, updateClient, deleteClient, zones, reloadInitialClients, setClients, brands, sales, drivers, updateSaleStatus, updateSaleFactured } = useDispatchGazStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Deduplicate clients if corrupted localStorage exists
  React.useEffect(() => {
    const uniqueClients = Array.from(new Map(clients.map(c => [c.id, c])).values());
    if (uniqueClients.length !== clients.length) {
      setClients(uniqueClients);
    }
  }, [clients, setClients]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);
  
  const handleReload = () => {
    setShowReloadConfirm(true);
  };
  
  const confirmReload = () => {
    reloadInitialClients();
    setShowReloadConfirm(false);
  };
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteClient(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };
  
  const [formData, setFormData] = useState<Partial<GazClient>>({
    name: '', type: 'entreprise', zoneId: '', city: 'Meknès', address: '', code: '', ice: '', patente: '', phone: '', secteur: '', lat: 33.8935, lng: -5.5473, hasSpecialPrice: false, specialPrices: []
  });

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.zoneId) {
      if (editingId) {
        updateClient(editingId, formData);
      } else {
        addClient({
          id: formData.code || Date.now().toString(),
          name: formData.name,
          type: formData.type as any,
          zoneId: formData.zoneId,
          city: formData.city || 'Meknès',
          address: formData.address || '',
          code: formData.code,
          ice: formData.ice,
          patente: formData.patente,
          phone: formData.phone,
          secteur: formData.secteur,
          lat: formData.lat || 33.8935,
          lng: formData.lng || -5.5473,
          hasSpecialPrice: formData.hasSpecialPrice,
          specialPrices: formData.specialPrices || [],
        });
      }
      resetForm();
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', type: 'entreprise', zoneId: '', city: 'Meknès', address: '', code: '', ice: '', patente: '', phone: '', secteur: '', lat: 33.8935, lng: -5.5473, hasSpecialPrice: false, specialPrices: [] });
  };

  const handleEdit = (client: GazClient) => {
    setEditingId(client.id);
    setFormData(client);
    setIsFormOpen(true);
  };

  const clientSituation = useMemo(() => {
    if (!historyClientId) return null;
    
    const clientSales = sales.filter(s => s.clientId === historyClientId);
    
    let totalAfro = 0;
    let totalChakirine = 0;
    let paidAfro = 0;
    let paidChakirine = 0;
    let creditAfro = 0;
    let creditChakirine = 0;
    let invoicedTotal = 0;
    let nonInvoicedTotal = 0;
    let totalQty = 0;

    clientSales.forEach(s => {
      totalQty += s.quantity;
      const isAfro = !s.company || s.company === 'afro_negoce';
      const isPaid = s.paymentMethod !== 'credit' || s.status === 'payé';
      const amount = s.totalPrice;

      if (isAfro) {
        totalAfro += amount;
        if (isPaid) {
          paidAfro += amount;
        } else {
          creditAfro += amount;
        }
      } else {
        totalChakirine += amount;
        if (isPaid) {
          paidChakirine += amount;
        } else {
          creditChakirine += amount;
        }
      }

      if (s.isFactured) {
        invoicedTotal += amount;
      } else {
        nonInvoicedTotal += amount;
      }
    });

    const grandTotal = totalAfro + totalChakirine;
    const grandPaid = paidAfro + paidChakirine;
    const grandCredit = creditAfro + creditChakirine;

    return {
      totalAfro,
      totalChakirine,
      paidAfro,
      paidChakirine,
      creditAfro,
      creditChakirine,
      invoicedTotal,
      nonInvoicedTotal,
      grandTotal,
      grandPaid,
      grandCredit,
      totalQty,
      count: clientSales.length
    };
  }, [sales, historyClientId]);

  const clientHistory = useMemo(() => {
    if (!historyClientId) return [];
    
    let filtered = sales.filter(s => s.clientId === historyClientId);
    
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      filtered = filtered.filter(s => new Date(s.date).getTime() >= from);
    }
    
    if (dateTo) {
      // Add one day to include the whole "To" date
      const to = new Date(dateTo).getTime() + 86400000;
      filtered = filtered.filter(s => new Date(s.date).getTime() <= to);
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, historyClientId, dateFrom, dateTo]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Base de Données Clients</h1>
          <p className="text-sm text-slate-500">{clients.length} clients enregistrés</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, code..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button 
            onClick={handleReload}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Charger les clients par défaut"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-900/10"
          >
            <Plus className="w-5 h-5" />
            Nouveau Client
          </button>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Supprimer le client ?</h3>
            <p className="text-slate-500 mb-6 font-medium">
              Voulez-vous vraiment supprimer ce client ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-900/20"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showReloadConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin-slow" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Recharger la liste ?</h3>
              <p className="text-slate-500 mb-6 font-medium">
                Cette action va réinitialiser votre base de données avec la liste officielle des 300+ clients. 
                <span className="block mt-2 text-red-500 font-bold">Cela écrasera vos modifications locales.</span>
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowReloadConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmReload}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Modifier le Client' : 'Nouveau Client'}</h2>
            <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Code Client</label>
                <input type="text" placeholder="ex: C00001" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nom / Raison Sociale</label>
                <input type="text" required placeholder="Nom complet" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none">
                  <option value="entreprise">Entreprise</option>
                  <option value="particulier">Particulier</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="POS">Point de Vente (POS)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Zone Tarifaire</label>
                <select required value={formData.zoneId} onChange={e => setFormData({...formData, zoneId: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none">
                  <option value="">Sélectionner une zone</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Ville</label>
                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Téléphone</label>
                <input type="text" placeholder="ex: +212612345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">ICE</label>
                <input type="text" value={formData.ice} onChange={e => setFormData({...formData, ice: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">N° Patente</label>
                <input type="text" value={formData.patente} onChange={e => setFormData({...formData, patente: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Adresse / Secteur</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none" />
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Position Géographique (Optionnel)
                </div>
              </h3>
              <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-slate-200 relative z-0">
                <MapContainer center={[formData.lat || 33.8935, formData.lng || -5.5473]} zoom={13} style={{ width: '100%', height: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker 
                    position={[formData.lat || 33.8935, formData.lng || -5.5473]} 
                    setPosition={(pos) => setFormData({ ...formData, lat: pos[0], lng: pos[1] })} 
                  />
                </MapContainer>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Prix Spécial (Optionnel)
                </h3>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={formData.hasSpecialPrice || false}
                      onChange={(e) => setFormData({...formData, hasSpecialPrice: e.target.checked})}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.hasSpecialPrice ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.hasSpecialPrice ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-xs font-bold text-slate-600 uppercase">Activer</span>
                </label>
              </div>
              
              {formData.hasSpecialPrice && (
                <div className="space-y-6 mt-4">
                  {brands.map(brand => (
                    <div key={brand.id} className="bg-white p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-800 mb-3">{brand.name}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {brand.categories.map(cat => {
                          const existingPrice = formData.specialPrices?.find(p => p.brandId === brand.id && p.category === cat);
                          return (
                            <div key={cat}>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{cat}</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  placeholder="Prix" 
                                  value={existingPrice?.price || ''}
                                  onChange={e => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const currentPrices = formData.specialPrices || [];
                                    const filteredPrices = currentPrices.filter(p => !(p.brandId === brand.id && p.category === cat));
                                    setFormData({
                                      ...formData, 
                                      specialPrices: [
                                        ...filteredPrices,
                                        { brandId: brand.id, category: cat, price: val }
                                      ]
                                    });
                                  }}
                                  className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DH</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={resetForm} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">Annuler</button>
              <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10">
                {editingId ? 'Mettre à jour' : 'Enregistrer le client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {historyClientId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <History className="w-6 h-6 text-indigo-600" />
                  Situation Globale & Historique Client
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Client: <span className="font-bold text-slate-700">{clients.find(c => c.id === historyClientId)?.name}</span>
                </p>
              </div>
              <button 
                onClick={() => setHistoryClientId(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Situation overview cards */}
            {clientSituation && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200 shrink-0">
                {/* Global Situation Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Situation Globale</span>
                    <span className="text-lg font-black text-slate-900 block mt-1">{clientSituation.grandTotal.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[9px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {clientSituation.grandPaid.toFixed(0)} Payé
                    </span>
                    <span className="text-[9px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200 flex items-center gap-1">
                      <XCircle className="w-2.5 h-2.5" /> {clientSituation.grandCredit.toFixed(0)} Crédit
                    </span>
                  </div>
                </div>

                {/* Afro Negoce Card */}
                <div className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider block">AFRO NÉGOCE</span>
                    <span className="text-lg font-black text-slate-950 block mt-1">{clientSituation.totalAfro.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-1 border-t border-orange-100/50">
                    <span className="text-[10px] font-medium text-slate-500">Payé: <strong className="text-slate-700">{clientSituation.paidAfro.toFixed(0)}</strong></span>
                    <span className="text-[10px] font-bold text-red-700">Crédit: {clientSituation.creditAfro.toFixed(0)}</span>
                  </div>
                </div>

                {/* Chakirine Gaz Card */}
                <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">CHAKIRINE GAZ</span>
                    <span className="text-lg font-black text-slate-950 block mt-1">{clientSituation.totalChakirine.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-1 border-t border-emerald-100/50">
                    <span className="text-[10px] font-medium text-slate-500">Payé: <strong className="text-slate-700">{clientSituation.paidChakirine.toFixed(0)}</strong></span>
                    <span className="text-[10px] font-bold text-red-700">Crédit: {clientSituation.creditChakirine.toFixed(0)}</span>
                  </div>
                </div>

                {/* Billing Card */}
                <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">STATUT FACTURATION</span>
                    <span className="text-lg font-black text-indigo-950 block mt-1">{clientSituation.invoicedTotal.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-1 border-t border-indigo-100/50">
                    <span className="text-[10px] font-medium text-slate-500">Facturé: <strong className="text-slate-700">{clientSituation.invoicedTotal.toFixed(0)}</strong></span>
                    <span className="text-[10px] font-semibold text-slate-500">Non: {clientSituation.nonInvoicedTotal.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 shrink-0 bg-white border-b border-slate-100">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> De</label>
                  <input 
                    type="date" 
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> À</label>
                  <input 
                    type="date" 
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none"
                  />
                </div>
                <div className="pt-5 sm:w-auto w-full">
                   <button 
                      onClick={() => { setDateFrom(''); setDateTo(''); }}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                   >
                     Réinitialiser
                   </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto p-0 flex-1">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                  <tr className="border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Société</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Chauffeur</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Article</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Règlement</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Facturé</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Qté</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Aucun historique trouvé pour cette période.
                      </td>
                    </tr>
                  ) : (
                    clientHistory.map(sale => {
                      const driver = drivers.find(d => d.id === sale.driverId);
                      const brand = brands.find(b => b.id === sale.brandId);
                      const saleCompany = sale.company || driver?.company || 'afro_negoce';
                      const isPaid = sale.paymentMethod !== 'credit' || sale.status === 'payé';

                      return (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-slate-700">{new Date(sale.date).toLocaleDateString('fr-FR')}</span>
                            <span className="block text-[10px] text-slate-400">{new Date(sale.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td className="p-4">
                            {saleCompany === 'afro_negoce' ? (
                              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                                AFRO
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                                CHAKIRINE
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                              <Truck className="w-4 h-4 text-slate-400" />
                              {driver ? `${driver.prenom} ${driver.nom}` : 'Inconnu'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{brand?.name || sale.brandId}</div>
                            <div className="text-xs text-slate-500">{sale.category}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                sale.paymentMethod === 'espece' ? 'bg-slate-100 text-slate-800' :
                                sale.paymentMethod === 'cheque' ? 'bg-blue-50 text-blue-800' :
                                'bg-purple-50 text-purple-800'
                              }`}>
                                {sale.paymentMethod === 'espece' ? 'Espèce' : sale.paymentMethod === 'cheque' ? 'Chèque' : 'Crédit'}
                              </span>
                              
                              {sale.paymentMethod === 'credit' && (
                                <button
                                  onClick={() => {
                                    const nextStatus = sale.status === 'payé' ? 'non payé' : 'payé';
                                    updateSaleStatus(sale.id, nextStatus);
                                  }}
                                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                                    isPaid 
                                      ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                      : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                                  }`}
                                  title="Cliquer pour changer le statut de paiement"
                                >
                                  {isPaid ? (
                                    <>
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Payé
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-2.5 h-2.5" /> Non Payé
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => updateSaleFactured(sale.id, !sale.isFactured)}
                              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                                sale.isFactured 
                                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                              }`}
                              title="Cliquer pour basculer le statut de facturation"
                            >
                              <FileCheck2 className={`w-3.5 h-3.5 ${sale.isFactured ? 'text-indigo-600' : 'text-slate-400'}`} />
                              {sale.isFactured ? 'Facturé' : 'À Facturer'}
                            </button>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-700">
                            {sale.quantity}
                          </td>
                          <td className="p-4 text-right font-black text-slate-900">
                            {sale.totalPrice} MAD
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Code</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Client</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Zone</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Contact / Adresse</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">ICE / Patente</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => {
              const zone = zones.find(z => z.id === client.zoneId);
              return (
                <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{client.code || 'N/A'}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{client.name}</div>
                    <div className="text-xs text-slate-400">{client.city}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      client.type === 'entreprise' ? 'bg-blue-100 text-blue-700' : 
                      client.type === 'restaurant' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {client.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {zone?.name || 'Inconnue'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-600 font-medium">{client.phone || 'Pas de tél.'}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 uppercase">
                      <MapPin className="w-2.5 h-2.5" /> {client.address || client.secteur}
                    </div>
                  </td>
                  <td className="p-4">
                    {client.ice && <div className="text-[10px] text-slate-500 font-bold">ICE: {client.ice}</div>}
                    {client.patente && <div className="text-[10px] text-slate-500">Patente: {client.patente}</div>}
                    {!client.ice && !client.patente && <span className="text-slate-300 text-xs">-</span>}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setHistoryClientId(client.id)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Historique">
                        <History className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(client)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(client.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-10" />
                  <p className="font-bold">Aucun client ne correspond à votre recherche.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
