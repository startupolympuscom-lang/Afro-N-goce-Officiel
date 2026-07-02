import React, { useState, useMemo, useEffect } from 'react';
import { useDispatchGazStore, StandardCall } from '../../../../stores/useDispatchGazStore';
import { Phone, Clock, AlertTriangle, CheckCircle2, User, MapPin, Truck, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

export default function StandardPage() {
  const { standardCalls, addStandardCall, updateStandardCallStatus, deleteStandardCall, drivers } = useDispatchGazStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: '',
    phoneNumber: '',
    address: '',
    notes: '',
    driverId: ''
  });

  // Keep a local state to trigger re-renders for elapsed time
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.phoneNumber) {
      toast.error("Le nom du client et le numéro de téléphone sont obligatoires.");
      return;
    }

    const newCall: StandardCall = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      clientName: formData.clientName,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      status: 'enregistré',
      notes: formData.notes,
      driverId: formData.driverId || undefined
    };

    addStandardCall(newCall);
    toast.success("Demande enregistrée avec succès.");
    setFormData({ clientName: '', phoneNumber: '', address: '', notes: '', driverId: '' });
    setIsFormOpen(false);
  };

  const filteredCalls = useMemo(() => {
    let calls = standardCalls || [];
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      calls = calls.filter(c => 
        c.clientName.toLowerCase().includes(lower) || 
        c.phoneNumber.includes(lower) ||
        (c.address && c.address.toLowerCase().includes(lower))
      );
    }
    // Sort by timestamp desc
    return calls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [standardCalls, searchTerm]);

  const isLateDelivery = (timestamp: string, status: string) => {
    if (status === 'livré') return false;
    const callTime = new Date(timestamp).getTime();
    const diff = currentTime - callTime;
    // 1 hour = 3600000 ms
    return diff > 3600000;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Phone className="w-8 h-8 text-blue-600" />
            Standard Téléphonique
          </h1>
          <p className="text-slate-500 font-medium mt-1">Gestion des appels et livraisons clients</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
          >
            <Plus className="w-5 h-5" />
            Nouveau Appel
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Nouvel Appel Client
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nom du Client</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={formData.clientName}
                        onChange={e => setFormData({...formData, clientName: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium"
                        placeholder="Ex: Entreprise XYZ ou M. Youssef"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Numéro de Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="tel" 
                      required
                      value={formData.phoneNumber}
                      onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium"
                      placeholder="Ex: 06 00 00 00 00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Adresse de Livraison</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium"
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Chauffeur Assigné (Optionnel)</label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select 
                      value={formData.driverId}
                      onChange={e => setFormData({...formData, driverId: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium appearance-none cursor-pointer"
                    >
                      <option value="">-- Sélectionner un chauffeur --</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.prenom} {driver.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notes / Remarques (Optionnel)</label>
                  <textarea 
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium resize-none"
                    placeholder="Détails de la commande ou instructions spécifiques..."
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un appel..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <th className="p-4">Date & Heure</th>
                <th className="p-4">Client</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Chauffeur</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Notes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Aucun appel trouvé.
                  </td>
                </tr>
              ) : (
                filteredCalls.map(call => {
                  const late = isLateDelivery(call.timestamp, call.status);
                  
                  return (
                    <tr key={call.id} className={`hover:bg-slate-50 transition-colors ${late ? 'bg-red-50/30' : ''}`}>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{new Date(call.timestamp).toLocaleDateString('fr-FR')}</span>
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(call.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          {call.clientName}
                        </div>
                        {call.address && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {call.address}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-sm text-slate-700">
                        {call.phoneNumber}
                      </td>
                      <td className="p-4">
                        {call.driverId ? (
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg w-max">
                            <Truck className="w-4 h-4 text-slate-500" />
                            {drivers.find(d => d.id === call.driverId)?.prenom} {drivers.find(d => d.id === call.driverId)?.nom}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Non assigné</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <select 
                            value={call.status}
                            onChange={(e) => updateStandardCallStatus(call.id, e.target.value as StandardCall['status'])}
                            className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border outline-none cursor-pointer transition-colors ${
                              call.status === 'livré' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              call.status === 'dispatché' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <option value="enregistré">Enregistré</option>
                            <option value="dispatché">Dispatché</option>
                            <option value="livré">Livré</option>
                          </select>
                          
                          {late && (
                            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                              <AlertTriangle className="w-3 h-3" />
                              Retard ({'>'} 1h)
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 max-w-xs truncate text-sm text-slate-600">
                        {call.notes || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end">
                          <button 
                            onClick={() => {
                              if (confirm("Êtes-vous sûr de vouloir supprimer cet appel ?")) {
                                deleteStandardCall(call.id);
                                toast.success("Appel supprimé.");
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
  );
}
