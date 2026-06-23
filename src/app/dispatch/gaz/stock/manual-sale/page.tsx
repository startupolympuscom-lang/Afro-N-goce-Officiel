import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatchGazStore } from '../../../../../stores/useDispatchGazStore';
import { ShoppingCart, CheckCircle2, User, Banknote, CreditCard, Receipt, Plus, Trash2, ShieldCheck, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface SaleItem {
  category: string;
  quantity: number;
  isConsignment: boolean;
  unitPrice: number | '';
}

export default function DispatchManualSalePage() {
  const navigate = useNavigate();
  const { clients, brands, prices, drivers, stockDispatches, pointages, addSale, gplConfig } = useDispatchGazStore();
  
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [items, setItems] = useState<SaleItem[]>([{ category: '', quantity: 1, isConsignment: false, unitPrice: '' }]);
  const [paymentMethod, setPaymentMethod] = useState<'espece' | 'cheque' | 'credit'>('espece');
  const [success, setSuccess] = useState(false);

  const getLocalDateStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const todayStr = getLocalDateStr();

  const isDriverCheckedIn = (driverId: string) => {
    return pointages.some(p => {
      if (p.driverId !== driverId) return false;
      const pointageDate = new Date(p.timestamp || p.date);
      const now = new Date();
      const diffHours = (now.getTime() - pointageDate.getTime()) / (1000 * 60 * 60);
      const isTodayStr = p.date === new Date().toISOString().split('T')[0] || p.date === todayStr;
      
      return diffHours < 16 || isTodayStr;
    });
  };

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const driverDispatches = useMemo(() => {
    if (!selectedDriverId) return [];
    return stockDispatches.filter(sd => sd.driverId === selectedDriverId && !sd.isValidated);
  }, [stockDispatches, selectedDriverId]);

  const availableCategoriesForBrand = useMemo(() => {
    if (!selectedBrandId) return [];
    
    // Group remaining quantities by category
    const categoryTotals = new Map<string, number>();
    const brandDispatches = driverDispatches.filter(sd => sd.brandId === selectedBrandId);
    
    brandDispatches.forEach(sd => {
      const remaining = sd.quantity - sd.sold - (sd.soldConsigned || 0);
      if (remaining > 0) {
        categoryTotals.set(sd.category, (categoryTotals.get(sd.category) || 0) + remaining);
      }
    });

    return Array.from(categoryTotals.entries()).map(([category, remaining]) => ({
      category,
      remaining
    }));
  }, [driverDispatches, selectedBrandId]);

  const getItemPrice = (category: string) => {
    if (!selectedClient || !selectedBrandId || !category) return 0;
    return prices.find(p => p.brandId === selectedBrandId && p.category === category && p.zoneId === selectedClient.zoneId)?.price || 0;
  };

  const getItemConsignmentPrice = (brandId: string, category: string) => {
    return gplConfig?.consignationPrices?.[brandId]?.[category] || 0;
  };

  const totalPrice = items.reduce((acc, item) => {
    const basePrice = Number(item.unitPrice) || 0;
    const consignmentPrice = item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0;
    return acc + ((basePrice + consignmentPrice) * item.quantity);
  }, 0);

  // Validate that all selected items have a price > 0
  const isAnyPriceMissingOrZero = items.some(item => item.category && (Number(item.unitPrice) || 0) <= 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDriverId || !isDriverCheckedIn(selectedDriverId)) {
      toast.error("Veuillez sélectionner un chauffeur qui a pointé aujourd'hui.");
      return;
    }

    if (selectedClientId && selectedBrandId && items.length > 0) {
      const validItems = items.filter(i => i.category && i.quantity > 0 && (Number(i.unitPrice) || 0) > 0);
      
      if (validItems.length === 0) {
        toast.error("Données de vente invalides. Vérifiez les catégories et les prix.");
        return;
      }

      // Check cumulative stock limit for each valid item against availableCategoriesForBrand
      const itemTotals = new Map<string, number>();
      for (const item of validItems) {
        itemTotals.set(item.category, (itemTotals.get(item.category) || 0) + item.quantity);
      }
      
      for (const [category, qty] of itemTotals.entries()) {
        const matchingCat = availableCategoriesForBrand.find(c => c.category === category);
        if (!matchingCat || qty > matchingCat.remaining) {
           toast.error(`Quantité insuffisante pour ${category}. Total demandé : ${qty}, Restant en stock : ${matchingCat?.remaining || 0}`);
           return;
        }
      }

      validItems.forEach((item) => {
        const basePrice = Number(item.unitPrice) || 0;
        const consignmentPrice = item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0;
        
        addSale({
          id: nanoid(),
          date: new Date().toISOString(),
          driverId: selectedDriverId,
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
        setItems([{ category: '', quantity: 1, isConsignment: false, unitPrice: '' }]);
      }, 3000);
    }
  };

  const addItem = () => setItems([...items, { category: '', quantity: 1, isConsignment: false, unitPrice: '' }]);
  
  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const updateItemFields = (index: number, fields: Partial<SaleItem>) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], ...fields };
      return newItems;
    });
  };
  
  const removeItem = (index: number) => {
    setItems(prevItems => {
      const newItems = prevItems.filter((_, i) => i !== index);
      return newItems.length > 0 ? newItems : [{ category: '', quantity: 1, isConsignment: false, unitPrice: '' }];
    });
  };

  // Only show drivers who checked in today
  const activeDrivers = drivers.filter(d => isDriverCheckedIn(d.id));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            Vente Manuelle
          </h1>
          <p className="text-slate-500 text-sm mt-1">Enregistrer une vente sur le stock d'un chauffeur</p>
        </div>
      </div>

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-emerald-900 mb-2">Vente enregistrée !</h2>
          <p className="text-emerald-700">La transaction a été ajoutée avec succès et le stock du chauffeur a été mis à jour.</p>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                Sélection du Chauffeur
              </h3>
              <select 
                required 
                value={selectedDriverId} 
                onChange={e => {
                  setSelectedDriverId(e.target.value);
                  setSelectedBrandId('');
                  setItems([{ category: '', quantity: 1, isConsignment: false, unitPrice: '' }]);
                }} 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              >
                <option value="">Sélectionner un chauffeur actif</option>
                {activeDrivers.map(d => <option key={d.id} value={d.id}>{d.prenom} {d.nom} (CIN: {d.cin})</option>)}
              </select>
              
              {selectedDriver && driverDispatches.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  Ce chauffeur n'a pas de stock affecté pour aujourd'hui.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Client</label>
              <select 
                required 
                value={selectedClientId} 
                onChange={e => {
                  setSelectedClientId(e.target.value);
                  // Refresh prices if client changes
                  const newItems = items.map(it => {
                    const price = prices.find(p => p.brandId === selectedBrandId && p.category === it.category && p.zoneId === clients.find(c=>c.id===e.target.value)?.zoneId)?.price || 0;
                    return { ...it, unitPrice: price > 0 ? price : it.unitPrice };
                  });
                  setItems(newItems);
                }} 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
              </select>
            </div>

            {selectedClient && (
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-sm text-indigo-800">Zone tarifaire : <span className="font-bold">{selectedClient.zoneId}</span></p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marque</label>
              <select 
                required 
                value={selectedBrandId} 
                disabled={!selectedDriverId || driverDispatches.length === 0}
                onChange={e => {
                  setSelectedBrandId(e.target.value);
                  setItems([{ category: '', quantity: 1, isConsignment: false, unitPrice: '' }]);
                }} 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Sélectionner une marque</option>
                {/* Only show brands the driver actually has stock for */}
                {Array.from(new Set(driverDispatches.map(sd => sd.brandId))).map(bId => {
                  const b = brands.find(brand => brand.id === bId);
                  if (!b) return null;
                  return <option key={b.id} value={b.id}>{b.name}</option>;
                })}
              </select>
            </div>

            {selectedBrand && availableCategoriesForBrand.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">Produits Vendus</label>
                  <button type="button" onClick={addItem} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100">
                    <Plus className="w-3 h-3" /> Ajouter un produit
                  </button>
                </div>
                
                {items.map((item, index) => {
                  // Calculate how much of this category is available
                  const maxAllowed = availableCategoriesForBrand.find(c => c.category === item.category)?.remaining || 0;
                  
                  // Calculate how much of this category we've already selected in OTHER items
                  const alreadySelected = items.reduce((sum, it, i) => (i !== index && it.category === item.category) ? sum + it.quantity : sum, 0);
                  const currentlyAvailableForThisRow = Math.max(0, maxAllowed - alreadySelected);

                  return (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      {item.category && (
                        <div className="flex justify-end">
                          <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availableCategoriesForBrand.map(catItem => {
                          const catAlreadySelected = items.reduce((sum, it, i) => (i !== index && it.category === catItem.category) ? sum + it.quantity : sum, 0);
                          const remainingForNewSelection = Math.max(0, catItem.remaining - catAlreadySelected);
                          const isSelected = item.category === catItem.category;

                          return (
                            <button
                              key={catItem.category}
                              type="button"
                              disabled={!isSelected && remainingForNewSelection <= 0}
                              onClick={() => {
                                const defaultPrice = getItemPrice(catItem.category);
                                updateItemFields(index, {
                                  category: catItem.category,
                                  quantity: 1,
                                  unitPrice: defaultPrice > 0 ? defaultPrice : ''
                                });
                              }}
                              className={`py-2 px-3 text-sm rounded-lg border font-medium transition-all ${
                                isSelected 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                  : remainingForNewSelection <= 0 
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                              }`}
                            >
                              <div className="font-bold">{catItem.category}</div>
                              <div className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>Max dispo: {isSelected ? currentlyAvailableForThisRow : remainingForNewSelection}</div>
                            </button>
                          );
                        })}
                      </div>

                      {item.category && (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                              <label className="block text-xs font-medium text-slate-500 mb-1">
                                Quantité (Max: {currentlyAvailableForThisRow})
                              </label>
                              <div className="flex items-center">
                                <button type="button" onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))} className="w-10 h-10 rounded-l-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-bold text-lg">-</button>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max={currentlyAvailableForThisRow}
                                  value={item.quantity} 
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 1;
                                    updateItem(index, 'quantity', Math.min(val, currentlyAvailableForThisRow));
                                  }} 
                                  className="w-full h-10 border-y border-slate-300 text-center font-bold text-base focus:outline-none"
                                />
                                <button disabled={item.quantity >= currentlyAvailableForThisRow} type="button" onClick={() => updateItem(index, 'quantity', Math.min(currentlyAvailableForThisRow, item.quantity + 1))} className="w-10 h-10 rounded-r-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed">+</button>
                              </div>
                            </div>
                            <div className="flex-1 w-full">
                              <label className="block text-xs font-medium text-slate-500 mb-1">Prix U. (DH) <span className="text-[10px] text-slate-400 font-normal italic">Modifiable</span></label>
                              <input 
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="0.00"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, 'unitPrice', e.target.value !== '' ? Number(e.target.value) : '')}
                                className="h-10 w-full px-3 border border-slate-300 bg-white rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div className="flex-1 w-full">
                              <label className="block text-xs font-medium text-slate-500 mb-1">Total Ligne (DH)</label>
                              <div className="h-10 px-3 border border-slate-200 bg-slate-100 rounded-lg flex items-center justify-between text-sm">
                                <span className="font-bold text-slate-900">{((Number(item.unitPrice) || 0) + (item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0)) * item.quantity} DH</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 transition-all">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className={`w-5 h-5 ${item.isConsignment ? 'text-indigo-600' : 'text-slate-400'}`} />
                              <div>
                                <div className="text-[11px] font-black uppercase tracking-tight text-slate-900 leading-tight">Consignation</div>
                                <div className="text-[10px] text-slate-500 leading-tight">Client achète la bouteille (+{getItemConsignmentPrice(selectedBrandId, item.category)} DH)</div>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => updateItem(index, 'isConsignment', !item.isConsignment)}
                              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                item.isConsignment 
                                  ? 'bg-indigo-600 text-white shadow-md' 
                                  : 'bg-white border border-slate-200 text-slate-600'
                              }`}
                            >
                              {item.isConsignment ? 'Appliquée' : 'Appliquer'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="space-y-3 pt-4 border-t border-slate-100">
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
                      <span className="text-[10px] font-black uppercase tracking-widest">Espèce</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cheque')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'cheque' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-100 text-slate-500'
                      }`}
                    >
                      <Receipt className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Chèque</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'credit' ? 'bg-teal-50 border-teal-600 text-teal-700' : 'bg-white border-slate-100 text-slate-500'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Crédit</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-medium text-slate-700">Total à payer</span>
                <span className="text-3xl font-bold text-slate-900">{totalPrice} <span className="text-xl text-slate-500">MAD</span></span>
              </div>
              
              <button
                type="submit"
                disabled={!selectedDriverId || !selectedBrandId || totalPrice === 0 || isAnyPriceMissingOrZero || items.some(i => !i.category)}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
              >
                <ShoppingCart className="w-6 h-6" />
                Valider la Vente Manuelle
              </button>
              {isAnyPriceMissingOrZero && (
                <p className="text-red-500 text-sm text-center mt-3">Veuillez saisir un prix unitaire valide pour tous les produits.</p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
