import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatchGazStore } from '../../../../../stores/useDispatchGazStore';
import { useDispatchAuthStore } from '../../../../../stores/useDispatchAuthStore';
import { ShoppingCart, CheckCircle2, MapPin, Navigation, Banknote, CreditCard, Receipt, AlertTriangle, QrCode, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function DispatchDriverSalePage() {
  const navigate = useNavigate();
  const { user } = useDispatchAuthStore();
  const { clients, brands, prices, addSale, gpsStatus, gpsError, hasPointageToday, gplConfig, stockDispatches } = useDispatchGazStore();
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [items, setItems] = useState([{ category: '', quantity: 1, isConsignment: false }]);
  const [paymentMethod, setPaymentMethod] = useState<'espece' | 'cheque' | 'credit'>('espece');
  const [success, setSuccess] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const driverStockToday = useMemo(() => {
    if (!user) return [];
    return (stockDispatches || []).filter(sd => sd.driverId === user.id && sd.date.startsWith(todayStr));
  }, [stockDispatches, user, todayStr]);

  const getRemainingStock = (brandId: string, category: string) => {
    const sd = driverStockToday.find(sd => sd.brandId === brandId && sd.category === category);
    if (!sd) return 0;
    const soldCount = sd.sold + (sd.soldConsigned || 0);
    return Math.max(0, sd.quantity - soldCount);
  };

  const isCheckedIn = useMemo(() => {
    if (!user) return false;
    return hasPointageToday(user.id);
  }, [user, hasPointageToday]);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedBrand = brands.find(b => b.id === selectedBrandId);
  
  const getItemPrice = (category: string) => {
    if (!selectedClient || !selectedBrandId || !category) return 0;
    return prices.find(p => p.brandId === selectedBrandId && p.category === category && p.zoneId === selectedClient.zoneId)?.price || 0;
  };

  const getItemConsignmentPrice = (brandId: string, category: string) => {
    return gplConfig?.consignationPrices?.[brandId]?.[category] || 0;
  };

  const totalPrice = items.reduce((acc, item) => {
    const basePrice = getItemPrice(item.category);
    const consignmentPrice = item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0;
    return acc + ((basePrice + consignmentPrice) * item.quantity);
  }, 0);

  const isAnyPriceMissing = items.some(item => item.category && getItemPrice(item.category) === 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCheckedIn) return;

    if (user && selectedClientId && selectedBrandId && items.length > 0) {
      const validItems = items.filter(i => i.category && i.quantity > 0 && getItemPrice(i.category) > 0);
      
      if (validItems.length === 0) {
        toast.error("Données de vente invalides. Vérifiez les catégories et les prix.");
        return;
      }

      // Check remaining stock limits before making the sale
      const totalsByCat: { [cat: string]: number } = {};
      for (const item of validItems) {
        totalsByCat[item.category] = (totalsByCat[item.category] || 0) + item.quantity;
      }

      for (const cat of Object.keys(totalsByCat)) {
        const remaining = getRemainingStock(selectedBrandId, cat);
        if (totalsByCat[cat] > remaining) {
          toast.error(`Stock insuffisant pour la catégorie ${cat}. Restant dans votre camion : ${remaining} bouteilles.`);
          return;
        }
      }

      validItems.forEach((item, idx) => {
        const basePrice = getItemPrice(item.category);
        const consignmentPrice = item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0;
        
        addSale({
          id: Date.now().toString() + idx.toString(),
          date: new Date().toISOString(),
          driverId: user.id,
          clientId: selectedClientId,
          brandId: selectedBrandId,
          category: item.category,
          quantity: item.quantity,
          unitPrice: basePrice + consignmentPrice,
          totalPrice: (basePrice + consignmentPrice) * item.quantity,
          paymentMethod,
          isConsignment: item.isConsignment
        });
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedClientId('');
        setSelectedBrandId('');
        setItems([{ category: '', quantity: 1, isConsignment: false }]);
        setPaymentMethod('espece');
      }, 3000);
    }
  };

  const addItem = () => setItems([...items, { category: '', quantity: 1, isConsignment: false }]);
  
  const updateItem = (index: number, field: 'category' | 'quantity' | 'isConsignment', value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };
  
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  if (!isCheckedIn) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-12 pb-24 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto text-red-500 mb-6 border border-red-100">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Accès Restreint</h1>
        <p className="text-slate-500 font-medium">Vous devez enregistrer votre présence (pointage) aujourd'hui pour pouvoir enregistrer des ventes.</p>
        
        <div className="pt-8">
          <button 
            onClick={() => navigate('/dispatch/gaz/driver/pointage?scan=true')}
            className="px-8 py-4 bg-slate-950 text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 mx-auto hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10"
          >
            <QrCode className="w-6 h-6" />
            Scanner mon QR Code
          </button>
        </div>
      </div>
    );
  }

  if (driverStockToday.length === 0) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-12 pb-24 text-center">
        <div className="w-20 h-20 bg-amber-50 border border-amber-200 rounded-[32px] flex items-center justify-center mx-auto text-amber-500 mb-6 shadow-sm">
          <AlertTriangle className="w-10 h-10 animate-bounce" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Stock Non Alloué</h1>
        <p className="text-slate-500 font-medium">Vous n'avez pas de stock de bouteilles alloué aujourd'hui. Veuillez contacter le répartiteur pour recevoir votre chargement avant d'enregistrer des ventes.</p>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto text-xs font-semibold text-slate-500">
          Date de session : {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle Vente</h1>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
          gpsStatus === 'tracking' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
          gpsStatus === 'error' ? 'bg-red-50 border-red-200 text-red-600' :
          'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <Navigation className={`w-3.5 h-3.5 ${gpsStatus === 'tracking' ? 'animate-pulse' : ''}`} />
          {gpsStatus === 'tracking' ? 'GPS Actif' : gpsStatus === 'error' ? 'Erreur GPS' : 'GPS Inactif'}
        </div>
      </div>

      {gpsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
          <MapPin className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{gpsError}</p>
        </div>
      )}

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-emerald-900 mb-2">Vente Enregistrée !</h2>
          <p className="text-emerald-700">La transaction a été ajoutée avec succès.</p>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm text-left">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Client</label>
              <select 
                required 
                value={selectedClientId} 
                onChange={e => setSelectedClientId(e.target.value)} 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 text-left"
              >
                <option value="">Sélectionner le Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
              </select>
            </div>

            {selectedClient && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-800">Zone Géographique: <span className="font-bold">{selectedClient.zoneId}</span></p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marque</label>
              <select 
                required 
                value={selectedBrandId} 
                onChange={e => {
                  setSelectedBrandId(e.target.value);
                  setItems([{ category: '', quantity: 1, isConsignment: false }]);
                }} 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900 text-left"
              >
                <option value="">Sélectionner la Marque</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {selectedBrand && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">Produits Vendus</label>
                  <button type="button" onClick={addItem} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100">
                    <Plus className="w-3 h-3" /> Ajouter un produit
                  </button>
                </div>
                
                {items.map((item, index) => {
                  const itemPrice = getItemPrice(item.category);
                  return (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      {items.length > 1 && (
                        <div className="flex justify-end">
                          <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-3 gap-3">
                        {selectedBrand.categories.map(cat => {
                          const remaining = getRemainingStock(selectedBrandId, cat);
                          const isSelected = item.category === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                if (remaining === 0) {
                                  toast.error(`Vous n'avez pas de stock de bouteilles pour la catégorie ${cat}.`);
                                  return;
                                }
                                updateItem(index, 'category', cat);
                              }}
                              className={`py-2.5 px-3 text-xs rounded-xl border font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                  : remaining === 0
                                    ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                              }`}
                            >
                              <span className="font-extrabold">{cat}</span>
                              <span className={`text-[9px] font-black ${isSelected ? 'text-blue-100' : remaining === 0 ? 'text-slate-300' : 'text-slate-500 font-mono'}`}>
                                {remaining} dispo
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {item.category && (
                        <div className="space-y-4">
                          <div className="flex gap-4 items-end">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-500 mb-1">Quantité</label>
                              <div className="flex items-center" dir="ltr">
                                <button 
                                  type="button" 
                                  onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))} 
                                  className="w-10 h-10 rounded-l-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-bold text-lg"
                                >
                                  -
                                </button>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max={getRemainingStock(selectedBrandId, item.category)}
                                  value={item.quantity} 
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 1;
                                    const maxVal = getRemainingStock(selectedBrandId, item.category);
                                    updateItem(index, 'quantity', Math.min(maxVal, Math.max(1, val)));
                                  }} 
                                  className="w-full h-10 border-y border-slate-300 text-center font-bold text-base focus:outline-none"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const maxVal = getRemainingStock(selectedBrandId, item.category);
                                    updateItem(index, 'quantity', Math.min(maxVal, item.quantity + 1));
                                  }} 
                                  className="w-10 h-10 rounded-r-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-bold text-lg"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-500 mb-1">Prix / Total</label>
                              <div className="h-10 px-3 border border-slate-200 bg-white rounded-lg flex items-center justify-between text-sm" dir="ltr">
                                <span className="text-slate-500 font-bold">{itemPrice > 0 ? `${itemPrice + (item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0)} MAD` : '--'}</span>
                                <span className="font-black text-slate-900">{itemPrice > 0 ? `${(itemPrice + (item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0)) * item.quantity} MAD` : '--'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 transition-all">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className={`w-5 h-5 ${item.isConsignment ? 'text-blue-600' : 'text-slate-400'}`} />
                              <div>
                                <div className="text-[11px] font-black uppercase tracking-tight text-slate-900 leading-tight">Consignations</div>
                                <div className="text-[10px] text-slate-500 leading-tight">Achat d'une nouvelle bouteille (+{getItemConsignmentPrice(selectedBrandId, item.category)} MAD)</div>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => updateItem(index, 'isConsignment', !item.isConsignment)}
                              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                item.isConsignment 
                                  ? 'bg-blue-600 text-white shadow-md' 
                                  : 'bg-white border border-slate-200 text-slate-600'
                              }`}
                            >
                              {item.isConsignment ? 'Appliqué' : 'Appliquer'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="space-y-3 pt-4 border-t border-slate-100 text-left">
                  <label className="block text-sm font-medium text-slate-700">Mode de Paiement</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('espece')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'espece' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-100 text-slate-500'
                      }`}
                    >
                      <Banknote className="w-5 h-5" />
                      <span className="text-[10px] font-black tracking-widest">ESPÈCES</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cheque')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'cheque' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-slate-100 text-slate-500'
                      }`}
                    >
                      <Receipt className="w-5 h-5" />
                      <span className="text-[10px] font-black tracking-widest">CHÈQUE</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'credit' ? 'bg-amber-50 border-amber-600 text-amber-700' : 'bg-white border-slate-100 text-slate-500'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[10px] font-black tracking-widest">CRÉDIT</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6" dir="ltr">
                <span className="text-3xl font-bold text-slate-900">{totalPrice} <span className="text-xl text-slate-500">MAD</span></span>
                <span className="text-lg font-medium text-slate-700">Montant Total à Payer</span>
              </div>
              
              <button
                type="submit"
                disabled={totalPrice === 0 || isAnyPriceMissing || items.some(i => !i.category)}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                <ShoppingCart className="w-6 h-6" />
                Confirmer la Vente
              </button>
              {isAnyPriceMissing && (
                <p className="text-red-500 text-sm text-center mt-3">Le prix de vente n'est pas configuré pour cette catégorie dans la zone du client.</p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
