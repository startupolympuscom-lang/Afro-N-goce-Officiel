import React, { useState, useMemo } from 'react';
import { useDispatchGazStore, GlobalStockItem } from '../../../../stores/useDispatchGazStore';
import { Package, Plus, Truck, Calendar, AlertTriangle, CheckCircle2, QrCode, Trash2, Settings, ShieldCheck, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function DispatchStockPage() {
  const { drivers, brands, stockDispatches, dispatchStock, pointages, globalStock, setGlobalStock, validateStockDispatch, dispatchToComptoir } = useDispatchGazStore();
  const [isDispatching, setIsDispatching] = useState(false);
  const [isDispatchingComptoir, setIsDispatchingComptoir] = useState(false);
  const [isSettingGlobal, setIsSettingGlobal] = useState(false);
  const [globalStockForm, setGlobalStockForm] = useState<GlobalStockItem[]>(globalStock);
  const [formData, setFormData] = useState({
    driverId: '',
    brandId: '',
    items: [{ category: '', quantity: 0 }]
  });

  const [comptoirFormData, setComptoirFormData] = useState({
    brandId: '',
    items: [{ category: '', quantity: 0 }]
  });

  const [validationForm, setValidationForm] = useState<{ [key: string]: { returnedFull: number, returnedEmpty: number } }>({});

  // Ensure we get today's date in local date consistently to match pointage
  const getLocalDateStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const todayStr = getLocalDateStr();
  const todaysDispatches = stockDispatches.filter(sd => sd.date.includes(todayStr) || sd.date.includes(new Date().toISOString().split('T')[0]));

  const pendingValidations = todaysDispatches.filter(sd => !sd.isValidated);

  const isDriverCheckedIn = (driverId: string) => {
    return pointages.some(p => {
      if (p.driverId !== driverId) return false;
      const pointageDate = new Date(p.timestamp || p.date);
      const now = new Date();
      // Check if pointage was within the last 16 hours OR matches today's string
      const diffHours = (now.getTime() - pointageDate.getTime()) / (1000 * 60 * 60);
      const isTodayStr = p.date === new Date().toISOString().split('T')[0] || p.date === todayStr;
      
      return diffHours < 16 || isTodayStr;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isDriverCheckedIn(formData.driverId)) {
      toast.error("Impossible d'affecter du stock : Le chauffeur n'a pas effectué son pointage aujourd'hui.");
      return;
    }

    if (formData.driverId && formData.brandId) {
      const validItems = formData.items.filter(i => i.category && i.quantity > 0);
      if (validItems.length === 0) {
        toast.error("Veuillez ajouter au moins une catégorie avec une quantité valide.");
        return;
      }

      // Check global stock availability
      let insufficient = false;
      validItems.forEach(item => {
        const gs = globalStock.find(g => g.brandId === formData.brandId && g.category === item.category);
        if (!gs || gs.full < item.quantity) {
          insufficient = true;
          toast.error(`Stock global insuffisant pour ${item.category}`);
        }
      });

      if (insufficient) return;

      validItems.forEach((item, idx) => {
        dispatchStock({
          id: Date.now().toString() + idx.toString(),
          date: new Date().toISOString(),
          driverId: formData.driverId,
          brandId: formData.brandId,
          category: item.category,
          quantity: item.quantity,
          sold: 0,
          soldConsigned: 0,
          isValidated: false
        });
      });
      setIsDispatching(false);
      setFormData({ driverId: '', brandId: '', items: [{ category: '', quantity: 0 }] });
      toast.success("Stock affecté avec succès.");
    }
  };

  const handleComptoirSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comptoirFormData.brandId) {
      const validItems = comptoirFormData.items.filter(i => i.category && i.quantity > 0);
      if (validItems.length === 0) {
        toast.error("Veuillez ajouter au moins une catégorie avec une quantité valide.");
        return;
      }

      // Check global stock availability
      let insufficient = false;
      validItems.forEach(item => {
        const gs = globalStock.find(g => g.brandId === comptoirFormData.brandId && g.category === item.category);
        if (!gs || gs.full < item.quantity) {
          insufficient = true;
          toast.error(`Stock global insuffisant pour ${item.category}`);
        }
      });

      if (insufficient) return;

      validItems.forEach((item) => {
        dispatchToComptoir(comptoirFormData.brandId, item.category, item.quantity);
      });
      setIsDispatchingComptoir(false);
      setComptoirFormData({ brandId: '', items: [{ category: '', quantity: 0 }] });
      toast.success("Stock affecté au comptoir avec succès.");
    }
  };

  const handleGlobalStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalStock(globalStockForm);
    setIsSettingGlobal(false);
    toast.success("Stock global mis à jour.");
  };

  const handleValidation = (dispatchId: string) => {
    const data = validationForm[dispatchId];
    if (!data) {
      toast.error("Veuillez remplir les champs de retour.");
      return;
    }
    validateStockDispatch(dispatchId, data.returnedFull, data.returnedEmpty);
    toast.success("Validation effectuée.");
  };

  const selectedBrand = brands.find(b => b.id === formData.brandId);
  const selectedComptoirBrand = brands.find(b => b.id === comptoirFormData.brandId);

  const addItem = () => {
    setFormData(prev => ({...prev, items: [...prev.items, { category: '', quantity: 0 }]}));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev, 
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: 'category' | 'quantity', value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const addComptoirItem = () => {
    setComptoirFormData(prev => ({...prev, items: [...prev.items, { category: '', quantity: 0 }]}));
  };

  const removeComptoirItem = (index: number) => {
    setComptoirFormData(prev => ({
      ...prev, 
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateComptoirItem = (index: number, field: 'category' | 'quantity', value: string | number) => {
    setComptoirFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Gestion des Stocks GPL
        </h1>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setGlobalStockForm(globalStock);
              setIsSettingGlobal(true);
            }}
            className="bg-slate-800 text-white px-4 py-2 rounded-xl font-medium hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Database className="w-5 h-5" />
            Définir Stock Global
          </button>
          <button 
            onClick={() => setIsDispatching(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Affectation
          </button>
          <button 
            onClick={() => setIsDispatchingComptoir(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            Affecter Comptoir
          </button>
        </div>
      </div>

      {/* Global Stock Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {globalStock.map((item, idx) => {
          const brand = brands.find(b => b.id === item.brandId);
          return (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-md uppercase">
                  {brand?.name}
                </div>
                <div className="text-xl font-black text-slate-900">{item.category}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-green-50 p-2 rounded-xl border border-green-100">
                  <div className="text-[10px] font-bold text-green-600 uppercase">Pleines</div>
                  <div className="text-lg font-black text-green-700">{item.full}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Vides</div>
                  <div className="text-lg font-black text-slate-700">{item.empty}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden text-white mt-6">
        <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Stock Comptoir
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {useDispatchGazStore.getState().comptoirStock?.map((item, idx) => {
              const brand = brands.find(b => b.id === item.brandId);
              return (
                <div key={idx} className="bg-slate-700 p-4 rounded-xl border border-slate-600 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black rounded-md uppercase">
                      {brand?.name}
                    </div>
                    <div className="text-xl font-black">{item.category}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-green-500/10 p-2 rounded-xl border border-green-500/20">
                      <div className="text-[10px] font-bold text-green-400 uppercase">Pleines</div>
                      <div className="text-lg font-black text-green-300">{item.full}</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-xl border border-slate-600">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Vides</div>
                      <div className="text-lg font-black text-slate-300">{item.empty}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {(!useDispatchGazStore.getState().comptoirStock || useDispatchGazStore.getState().comptoirStock.length === 0) && (
              <div className="col-span-full py-4 text-center text-slate-400 text-sm">
                Aucun stock au comptoir. Pour affecter, utilisez une nouvelle affectation classique ou un formulaire dédié (à implémenter en bas).
              </div>
            )}
          </div>
        </div>
      </div>

      {isSettingGlobal && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Mise à jour du Stock Global de la Société
            </h2>
            <button onClick={() => setIsSettingGlobal(false)} className="text-slate-400 hover:text-slate-600">
              Fermer
            </button>
          </div>
          
          <form onSubmit={handleGlobalStockSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalStockForm.map((item, idx) => {
                const brand = brands.find(b => b.id === item.brandId);
                return (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <div className="font-bold text-slate-900">{brand?.name} - {item.category}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pleines</label>
                        <input 
                          type="number"
                          value={item.full}
                          onChange={e => {
                            const newForm = [...globalStockForm];
                            newForm[idx] = { ...newForm[idx], full: parseInt(e.target.value) || 0 };
                            setGlobalStockForm(newForm);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vides (Consignées)</label>
                        <input 
                          type="number"
                          value={item.empty}
                          onChange={e => {
                            const newForm = [...globalStockForm];
                            newForm[idx] = { ...newForm[idx], empty: parseInt(e.target.value) || 0 };
                            setGlobalStockForm(newForm);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsSettingGlobal(false)} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Annuler</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">Enregistrer le Stock</button>
            </div>
          </form>
        </div>
      )}

      {isDispatching && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Affecter du stock à un chauffeur</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chauffeur</label>
              <select 
                required
                value={formData.driverId}
                onChange={e => setFormData({...formData, driverId: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg transition-all"
              >
                <option value="">Sélectionner...</option>
                {drivers.map(d => {
                  return (
                    <option key={d.id} value={d.id}>
                      {d.prenom} {d.nom}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marque</label>
              <select 
                required
                value={formData.brandId}
                onChange={e => {
                  setFormData({...formData, brandId: e.target.value, items: [{ category: '', quantity: 0 }]});
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Sélectionner...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Produits (Catégories et Quantités)</label>
                <button type="button" onClick={addItem} disabled={!selectedBrand} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus className="w-3 h-3" /> Ajouter Produit
                </button>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <select 
                      required
                      value={item.category}
                      onChange={e => updateItem(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      disabled={!selectedBrand}
                    >
                      <option value="">Catégorie...</option>
                      {selectedBrand?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-32">
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Qté"
                      required 
                      value={item.quantity || ''} 
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="md:col-span-4 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsDispatching(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Affecter le stock
              </button>
            </div>
          </form>
        </div>
      )}

      {isDispatchingComptoir && (
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <h2 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Affecter du stock au Comptoir
          </h2>
          <form onSubmit={handleComptoirSubmit} className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-indigo-900 mb-1">Marque</label>
              <select 
                required
                value={comptoirFormData.brandId}
                onChange={e => {
                  setComptoirFormData({...comptoirFormData, brandId: e.target.value, items: [{ category: '', quantity: 0 }]});
                }}
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Sélectionner une marque...</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-indigo-900">Produits pour le comptoir</label>
                <button type="button" onClick={addComptoirItem} disabled={!selectedComptoirBrand} className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus className="w-3 h-3" /> Ajouter Produit
                </button>
              </div>
              
              {comptoirFormData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100">
                  <div className="flex-1">
                    <select 
                      required
                      value={item.category}
                      onChange={e => updateComptoirItem(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm"
                      disabled={!selectedComptoirBrand}
                    >
                      <option value="">Catégorie...</option>
                      {selectedComptoirBrand?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="w-32">
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Qté"
                      required 
                      value={item.quantity || ''} 
                      onChange={e => updateComptoirItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm" 
                    />
                  </div>
                  {comptoirFormData.items.length > 1 && (
                    <button type="button" onClick={() => removeComptoirItem(index)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsDispatchingComptoir(false)} className="px-4 py-2 text-indigo-600 font-bold hover:bg-indigo-100 rounded-lg">Annuler</button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-indigo-600 font-bold text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200"
              >
                Transférer au Stock Comptoir
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            Stock en circulation (Aujourd'hui)
          </h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-medium text-slate-600 border-r border-slate-200">Chauffeur</th>
              <th className="p-4 font-medium text-slate-600 border-r border-slate-200">Produit</th>
              <th className="p-4 font-medium text-slate-600 text-center border-r border-slate-200">Session</th>
              <th className="p-4 font-medium text-slate-600 text-center border-r border-slate-200">Progression</th>
              <th className="p-4 font-medium text-slate-600 text-right">Statut</th>
            </tr>
          </thead>
          <tbody>
            {todaysDispatches.map(dispatch => {
              const driver = drivers.find(d => d.id === dispatch.driverId);
              const brand = brands.find(b => b.id === dispatch.brandId);
              const totalSold = dispatch.sold + (dispatch.soldConsigned || 0);
              const remaining = dispatch.quantity - totalSold;
              const percentage = dispatch.quantity > 0 ? (totalSold / dispatch.quantity) * 100 : 0;
              const isLow = remaining <= dispatch.quantity * 0.2;

              return (
                <tr key={dispatch.id} className={`border-b border-slate-100 hover:bg-slate-50 ${dispatch.isValidated ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <td className="p-4 border-r border-slate-200">
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" />
                      {driver?.prenom} {driver?.nom}
                    </div>
                  </td>
                  <td className="p-4 border-r border-slate-200">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {brand?.name} - {dispatch.category}
                    </span>
                  </td>
                  <td className="p-4 border-r border-slate-200">
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div>
                        <div className="text-slate-500 font-bold uppercase">Initial</div>
                        <div className="text-sm font-black text-slate-900">{dispatch.quantity}</div>
                      </div>
                      <div>
                        <div className="text-green-600 font-bold uppercase">Vendus</div>
                        <div className="text-sm font-black text-green-700">{dispatch.sold}</div>
                      </div>
                      <div>
                        <div className="text-orange-600 font-bold uppercase">Consignes</div>
                        <div className="text-sm font-black text-orange-700">{dispatch.soldConsigned || 0}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 border-r border-slate-200">
                    <div className="w-full max-w-[120px] mx-auto bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-blue-500'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-center text-[10px] text-slate-500 mt-1">{Math.round(percentage)}% chargé</div>
                  </td>
                  <td className="p-4 text-right">
                    {dispatch.isValidated ? (
                      <div className="flex items-center justify-end gap-1 text-green-600 font-black text-xs uppercase">
                        <CheckCircle2 className="w-4 h-4" /> Validé
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 text-orange-600 font-black text-xs uppercase">
                         En Cours
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Validation Journalière Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-900 flex justify-between items-center text-white">
          <h2 className="font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            Validation Journalière des Retours Chauffeurs
          </h2>
          <span className="text-xs px-3 py-1 bg-white/10 rounded-full font-bold uppercase tracking-widest text-white/70">
            {pendingValidations.length} Attentes
          </span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Chauffeur / Produit</th>
              <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Logiciel (Attendu)</th>
              <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Réel (Retourné)</th>
              <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right font-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingValidations.map(dispatch => {
              const driver = drivers.find(d => d.id === dispatch.driverId);
              const brand = brands.find(b => b.id === dispatch.brandId);
              
              // Expected logic:
              // Returned Full = Initial - Sold(Exchange) - Sold(Consignment)
              // Returned Empty = Sold(Exchange)
              const expectedFull = dispatch.quantity - dispatch.sold - (dispatch.soldConsigned || 0);
              const expectedEmpty = dispatch.sold;

              return (
                <tr key={dispatch.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{driver?.prenom} {driver?.nom}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{brand?.name} - {dispatch.category}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-6">
                      <div className="text-center">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Pleines</div>
                        <div className="text-sm font-black text-slate-700">{expectedFull}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Vides</div>
                        <div className="text-sm font-black text-slate-700">{expectedEmpty}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-4">
                      <div>
                        <input 
                          type="number"
                          placeholder="F"
                          className="w-16 px-2 py-1 text-center border border-slate-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-blue-500"
                          value={validationForm[dispatch.id]?.returnedFull ?? expectedFull}
                          onChange={e => setValidationForm({...validationForm, [dispatch.id]: { ...validationForm[dispatch.id], returnedFull: parseInt(e.target.value) || 0, returnedEmpty: validationForm[dispatch.id]?.returnedEmpty ?? expectedEmpty }})}
                        />
                      </div>
                      <div>
                        <input 
                          type="number"
                          placeholder="E"
                          className="w-16 px-2 py-1 text-center border border-slate-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-blue-500"
                          value={validationForm[dispatch.id]?.returnedEmpty ?? expectedEmpty}
                          onChange={e => setValidationForm({...validationForm, [dispatch.id]: { ...validationForm[dispatch.id], returnedEmpty: parseInt(e.target.value) || 0, returnedFull: validationForm[dispatch.id]?.returnedFull ?? expectedFull }})}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        const data = validationForm[dispatch.id] || { returnedFull: expectedFull, returnedEmpty: expectedEmpty };
                        validateStockDispatch(dispatch.id, data.returnedFull, data.returnedEmpty);
                        toast.success("Retour validé et stock global mis à jour.");
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight hover:bg-green-700 transition-colors shadow-sm"
                    >
                      Valider Retours
                    </button>
                  </td>
                </tr>
              );
            })}
            {pendingValidations.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-500 bg-slate-50 font-medium">Tous les retours ont été validés.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
