import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatchGazStore } from '../../../../../stores/useDispatchGazStore';
import { useDispatchAuthStore } from '../../../../../stores/useDispatchAuthStore';
import { ShoppingCart, CheckCircle2, MapPin, Navigation, Banknote, CreditCard, Receipt, AlertTriangle, QrCode, Plus, Trash2, ShieldCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

export default function DispatchDriverSalePage() {
  const navigate = useNavigate();
  const { user } = useDispatchAuthStore();
  const { clients, brands, prices, addSale, updateClient, gpsStatus, gpsError, hasPointageToday, gplConfig, stockDispatches } = useDispatchGazStore();
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearchStr, setClientSearchStr] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState('');

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setIsClientDropdownOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const filteredClients = useMemo(() => {
    if (!clientSearchStr.trim()) return clients.slice(0, 50); // limit empty search to 50
    const str = clientSearchStr.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(str) || 
      (c.code && c.code.toLowerCase().includes(str))
    ).slice(0, 50);
  }, [clients, clientSearchStr]);
  const [items, setItems] = useState([{ category: '', quantity: 1, isConsignment: false }]);
  const [paymentMethod, setPaymentMethod] = useState<'espece' | 'cheque' | 'credit'>('espece');
  const [success, setSuccess] = useState(false);
  const [whatsappInfo, setWhatsappInfo] = useState<{
    phone: string;
    clientName: string;
    message: string;
    whatsappUrl: string;
  } | null>(null);
  const [editingPhone, setEditingPhone] = useState('');
  const [isSimulatingSend, setIsSimulatingSend] = useState(false);
  const [simulatedSent, setSimulatedSent] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const driverStockToday = useMemo(() => {
    if (!user) return [];
    return (stockDispatches || []).filter(sd => sd.driverId === user.id && !sd.isValidated);
  }, [stockDispatches, user]);

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
    
    // Check for special price first
    if (selectedClient.hasSpecialPrice && selectedClient.specialPrices) {
      const specialPrice = selectedClient.specialPrices.find(
        p => p.brandId === selectedBrandId && p.category === category
      );
      if (specialPrice && specialPrice.price > 0) {
        return specialPrice.price;
      }
    }

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

      validItems.forEach((item) => {
        const basePrice = getItemPrice(item.category);
        const consignmentPrice = item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0;
        
        addSale({
          id: nanoid(),
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
      
      // Prepare WhatsApp Details for customer
      const itemsDetail = validItems.map(item => {
        const basePrice = getItemPrice(item.category);
        const consignmentPrice = item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0;
        return `- ${item.category} (x${item.quantity}) : ${(basePrice + consignmentPrice) * item.quantity} MAD${item.isConsignment ? ' [Avec Consignation]' : ''}`;
      }).join('\n');

      const clientPhone = selectedClient?.phone || '';
      const clientName = selectedClient?.name || 'Client';
      const driverName = `${user.prenom} ${user.nom}`;
      const totalAmount = totalPrice;
      const payMethodLabel = paymentMethod === 'espece' ? 'Espèces' : paymentMethod === 'cheque' ? 'Chèque' : 'Crédit';

      const textMsg = `Bonjour *${clientName}*,\n\nVotre livraison de gaz a été effectuée avec succès par notre chauffeur *${driverName}*.\n\n*Détails de la livraison :*\nMarque : *${selectedBrand?.name || ''}*\n${itemsDetail}\n\n*Total à payer :* *${totalAmount} MAD*\n*Mode de paiement :* ${payMethodLabel}\n\nMerci pour votre confiance ! 🙏\n_Afro Dispatch_`;

      const cleanPhone = clientPhone ? clientPhone.replace(/\D/g, '') : '';
      let formattedPhone = cleanPhone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '212' + formattedPhone.substring(1);
      } else if (formattedPhone && !formattedPhone.startsWith('212')) {
        formattedPhone = '212' + formattedPhone;
      }

      const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(textMsg)}`;

      setWhatsappInfo({
        phone: clientPhone,
        clientName,
        message: textMsg,
        whatsappUrl
      });
      setEditingPhone(clientPhone || '');
      setSimulatedSent(false);
      setIsSimulatingSend(false);
      
      setSuccess(true);
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
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 mb-6 border border-amber-100">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pointage requis</h1>
        <p className="text-slate-500">Vous devez enregistrer votre présence (pointage) aujourd'hui pour pouvoir enregistrer des ventes.</p>
        
        <div className="pt-8">
          <button 
            onClick={() => navigate('/dispatch/gaz/driver/pointage?scan=true')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2.5 mx-auto transition-colors shadow-sm"
          >
            <QrCode className="w-5 h-5" />
            Scanner mon QR code
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

      {/* Visual Cargo Stock Dashboard for Driver */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 bottom-0 translate-y-1/3 translate-x-1/12 opacity-10 pointer-events-none">
          <Truck className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
              <Truck className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200/60 leading-none mb-1">Session Active</p>
              <h2 className="font-extrabold text-lg text-white">Mon Stock en Camion</h2>
            </div>
          </div>
          <span className="text-[10px] uppercase font-black bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            {driverStockToday.length} Produit(s)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {driverStockToday.map(sd => {
            const brand = brands.find(b => b.id === sd.brandId);
            const remaining = sd.quantity - (sd.sold + (sd.soldConsigned || 0));
            const percentAvailable = sd.quantity > 0 ? (remaining / sd.quantity) * 100 : 0;
            return (
              <div key={sd.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-all duration-300">
                <div>
                  <p className="text-xs font-bold text-blue-200 truncate">{brand?.name || sd.brandId}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/50">{sd.category}</p>
                </div>
                <div className="mt-3.5 flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-black">{remaining}</span>
                    <span className="text-[10px] font-semibold text-white/50 ml-1">bte</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-white/30">{sd.quantity} initial</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-400 h-full rounded-full transition-all duration-300" style={{ width: `${percentAvailable}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {gpsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
          <MapPin className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{gpsError}</p>
        </div>
      )}

      {success ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Vente Enregistrée !</h2>
          <p className="text-slate-500 font-medium text-sm">La transaction a été ajoutée avec succès et votre stock a été actualisé.</p>
          
          {whatsappInfo && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  Notification WhatsApp
                </span>
                {whatsappInfo.phone ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full font-mono">
                    {whatsappInfo.phone}
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full font-mono">
                    Aucun numéro
                  </span>
                )}
              </div>

              {/* Optional Telephone Input and Database Synced Save Panel */}
              <div className="space-y-1.5 bg-white/70 p-3 rounded-xl border border-slate-100/50">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">N° Téléphone Client (Base de Données)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ex: +2126XXXXXXXX"
                    value={editingPhone}
                    onChange={(e) => setEditingPhone(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none font-medium bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingPhone.trim()) {
                        toast.error("Veuillez saisir un numéro valide");
                        return;
                      }
                      
                      // Persist back to local database store
                      updateClient(selectedClientId, { phone: editingPhone });

                      const cleanPhone = editingPhone.replace(/\D/g, '');
                      let formattedPhone = cleanPhone;
                      if (formattedPhone.startsWith('0')) {
                        formattedPhone = '212' + formattedPhone.substring(1);
                      } else if (formattedPhone && !formattedPhone.startsWith('212')) {
                        formattedPhone = '212' + formattedPhone;
                      }
                      
                      const newUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(whatsappInfo.message)}`;
                      setWhatsappInfo(prev => prev ? { ...prev, phone: editingPhone, whatsappUrl: newUrl } : null);
                      toast.success("Numéro du client mis à jour dans la base de données !");
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
              
              <div className="text-xs bg-white border border-slate-100 text-slate-700 p-3.5 rounded-xl font-mono whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                {whatsappInfo.message}
              </div>

              {/* Message Status indicator */}
              {simulatedSent && (
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-800 text-xs font-bold text-center border border-emerald-200 animate-pulse">
                  ✓ Message WhatsApp de confirmation simulé et envoyé au {editingPhone || whatsappInfo.phone} !
                </div>
              )}

              {/* Activating real or simulated send action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {editingPhone || whatsappInfo.phone ? (
                  <a
                    href={whatsappInfo.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      toast.success("Redirection vers WhatsApp...");
                    }}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 transition-colors uppercase outline-none text-center"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.03 14.113.999 11.99.999c-5.45 0-9.88 4.372-9.884 9.802-.001 1.778.475 3.51 1.378 5.042l-.946 3.461 3.555-.931zm10.963-7.53c-.31-.155-1.829-.9-2.114-1.002-.285-.102-.492-.153-.7.154-.207.307-.8.1-.98.153-.182-.205-.363-.102-.49-.153-.131-.051-.55-.227-.8-.5-.25-.213-.6-.826-.74-.9-.12-.089-1.127-1.492-1.127-2.85 0-1.357.7-1.423.95-1.68.25-.257.545-.308.72-.308.18 0 .36 0 .52.008.167.008.388-.063.59.395.207.47.7 1.71.76 1.83.06.12.1.25.02.41-.08.16-.16.355-.26.47-.1.115-.22.256-.31.37-.11.139-.23.29-.1.52.13.23.59.97 1.26 1.57.86.77 1.58 1.01 1.8 1.13.23.116.36.1.5-.06.14-.16.59-.7.75-.95.16-.25.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.57-.15.78s-1.22 1.2-1.7 1.2c-.48 0-1.1-.31-1.85-.62zm0 0"/>
                    </svg>
                    Envoyer Direct
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="py-2.5 bg-slate-100 text-slate-400 rounded-xl font-bold text-xs uppercase cursor-not-allowed"
                  >
                    Aucun Numéro Configuré
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSimulatingSend || !editingPhone.trim()}
                  onClick={() => {
                    setIsSimulatingSend(true);
                    setTimeout(() => {
                      setIsSimulatingSend(false);
                      setSimulatedSent(true);
                      toast.success(`Message WhatsApp simulé avec succès !`);
                    }, 1200);
                  }}
                  className="py-2.5 bg-indigo-50 hover:bg-slate-100 text-indigo-700 disabled:opacity-40 rounded-xl font-bold text-xs uppercase tracking-wide transition-all"
                >
                  {isSimulatingSend ? 'Envoi en cours...' : 'Simuler un Envoi'}
                </button>
              </div>

            </div>
          )}

          <button 
            onClick={() => {
              setSuccess(false);
              setSelectedClientId('');
              setSelectedBrandId('');
              setItems([{ category: '', quantity: 1, isConsignment: false }]);
              setPaymentMethod('espece');
              setWhatsappInfo(null);
              setEditingPhone('');
              setSimulatedSent(false);
              setIsSimulatingSend(false);
            }}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-md shadow-slate-900/10"
          >
            Nouvelle Vente
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm text-left">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Choisir un Client</label>
              <div 
                className={`flex items-center w-full px-4 py-3 border rounded-xl bg-slate-50 transition-all ${
                  isClientDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300'
                }`}
              >
                <div className="flex-1 flex items-center">
                  {selectedClient ? (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate pr-2">
                        {selectedClient.name} {selectedClient.code ? `(${selectedClient.code})` : ''} - {selectedClient.city}
                      </span>
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedClientId('');
                          setClientSearchStr('');
                          setIsClientDropdownOpen(true);
                        }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="w-full bg-transparent outline-none font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                      placeholder="Chercher par nom ou code..."
                      value={clientSearchStr}
                      onChange={e => {
                        setClientSearchStr(e.target.value);
                        setIsClientDropdownOpen(true);
                      }}
                      onClick={() => setIsClientDropdownOpen(true)}
                    />
                  )}
                </div>
              </div>

              {isClientDropdownOpen && !selectedClient && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedClientId(c.id);
                          setClientSearchStr('');
                          setIsClientDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className="font-bold truncate">{c.name}</div>
                        <div className="text-[10px] uppercase text-slate-500 flex items-center gap-2 mt-0.5">
                          {c.code && <span className="text-blue-600 font-mono font-bold tracking-wider">{c.code}</span>}
                          <span>•</span>
                          <span>{c.city}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-center text-sm text-slate-500">Aucun client trouvé.</div>
                  )}
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="px-4 py-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-400 uppercase tracking-wider font-bold mb-0.5">Zone</p>
                  <p className="text-sm font-black text-blue-900">{selectedClient.zoneId}</p>
                </div>
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
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedBrand.categories.map(cat => {
                          const remaining = getRemainingStock(selectedBrandId, cat);
                          const isSelected = item.category === cat;
                          const hasImage = !!selectedBrand.productImages?.[cat];
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
                              className={`py-4 px-3 text-sm rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600 shadow-lg text-white ring-2 ring-blue-600 ring-offset-2' 
                                  : remaining === 0
                                    ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-50 grayscale'
                                    : 'bg-white border-transparent shadow-md hover:border-blue-300 hover:shadow-lg'
                              }`}
                            >
                              {hasImage ? (
                                <img src={selectedBrand.productImages![cat]} alt={cat} className="w-16 h-16 object-contain drop-shadow-sm" />
                              ) : (
                                <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  <Truck className="w-7 h-7 opacity-50" />
                                </div>
                              )}
                              <span className={`font-black text-base ${isSelected ? 'text-white' : 'text-slate-800'}`}>{cat}</span>
                              <span className={`text-[11px] font-black w-full text-center px-1.5 py-1 rounded ${
                                isSelected ? 'bg-blue-700/50 text-blue-100' : remaining === 0 ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {remaining} dispo
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {item.category && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                            <div className="w-full sm:flex-1">
                              <label className="block text-sm font-bold text-slate-700 mb-2">Quantité</label>
                              <div className="flex items-center" dir="ltr">
                                <button 
                                  type="button" 
                                  onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))} 
                                  className="w-14 h-14 rounded-l-xl border-2 border-r-0 border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 font-black text-2xl flex items-center justify-center transition-colors focus:ring-2 focus:ring-blue-500 relative z-10"
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
                                  className="w-full h-14 border-y-2 border-slate-300 text-center font-black text-2xl text-blue-900 bg-white focus:outline-none shadow-inner"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const maxVal = getRemainingStock(selectedBrandId, item.category);
                                    updateItem(index, 'quantity', Math.min(maxVal, item.quantity + 1));
                                  }} 
                                  className="w-14 h-14 rounded-r-xl border-2 border-l-0 border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 font-black text-2xl flex items-center justify-center transition-colors focus:ring-2 focus:ring-blue-500 relative z-10"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="w-full sm:flex-1">
                              <label className="block text-sm font-bold text-slate-700 mb-2">Prix / Total</label>
                              <div className="h-14 px-4 border-2 border-slate-200 bg-slate-50 tracking-tight rounded-xl flex items-center justify-between" dir="ltr">
                                <span className="text-slate-500 font-bold text-sm">{itemPrice > 0 ? `${itemPrice + (item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0)} MAD` : '--'}</span>
                                <span className="font-black text-blue-900 text-xl">{itemPrice > 0 ? `${(itemPrice + (item.isConsignment ? getItemConsignmentPrice(selectedBrandId, item.category) : 0)) * item.quantity} MAD` : '--'}</span>
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
