import React, { useState, useMemo } from 'react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Sliders, 
  Info,
  CalendarDays,
  FileSpreadsheet,
  Layers,
  Banknote
} from 'lucide-react';
import { toast } from 'sonner';

export default function DispatchCommandePage() {
  const { 
    sales, 
    expenses, 
    caisseTransfers, 
    caisseAlimentations = [],
    brands, 
    commandes = [], 
    commandePrices = [],
    setCommandePrice,
    addCommande,
    deleteCommande,
    updateCommandeStatus
  } = useDispatchGazStore();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // High-performance state for multi-category input
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quantities, setQuantities] = useState<Record<string, string>>({
    '3Kg': '',
    '12Kg': '',
    '34Kg': ''
  });

  // Price configuration state
  const [editingPrice, setEditingPrice] = useState({
    brandId: 'b1',
    category: '12Kg',
    price: ''
  });

  // Calculate Cash Disponible exactly like page Caisse, excluding PRÊT (loans)
  const today = new Date().toISOString().split('T')[0];

  const salesToday = useMemo(() => {
    return sales.filter(s => s.date.startsWith(today));
  }, [sales, today]);

  const expensesToday = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(today));
  }, [expenses, today]);

  const totalSalesEntreesToday = salesToday.reduce((sum, s) => {
    if (s.status === 'non payé') return sum;
    return sum + s.totalPrice;
  }, 0);

  // Exclude loans/pret from entrees for today's operational money calculation
  const totalAlimentationsNormalToday = useMemo(() => {
    return (caisseAlimentations || [])
      .filter(a => (a.date.startsWith(today) || a.date === today) && a.type !== 'pret')
      .reduce((sum, a) => sum + a.amount, 0);
  }, [caisseAlimentations, today]);

  const totalPretsToday = useMemo(() => {
    return (caisseAlimentations || [])
      .filter(a => (a.date.startsWith(today) || a.date === today) && a.type === 'pret')
      .reduce((sum, a) => sum + a.amount, 0);
  }, [caisseAlimentations, today]);

  const totalSortiesToday = expensesToday.reduce((sum, e) => sum + e.amount, 0);
  
  // Operational incoming solde (excluding loans)
  const soldeToday = totalSalesEntreesToday + totalAlimentationsNormalToday - totalSortiesToday;

  const transfersToday = useMemo(() => {
    return (caisseTransfers || []).filter(t => t.date.startsWith(today));
  }, [caisseTransfers, today]);

  const totalTransferredToday = transfersToday.reduce((sum, t) => sum + t.amount, 0);
  const soldeDisponibleToday = soldeToday - totalTransferredToday;

  // Let's also calculate the global historical values excluding PRET loans!
  const totalAlimentationsNormalGlobal = useMemo(() => {
    return (caisseAlimentations || [])
      .filter(a => a.type !== 'pret')
      .reduce((sum, a) => sum + a.amount, 0);
  }, [caisseAlimentations]);

  const totalPretsGlobal = useMemo(() => {
    return (caisseAlimentations || [])
      .filter(a => a.type === 'pret')
      .reduce((sum, a) => sum + a.amount, 0);
  }, [caisseAlimentations]);

  const globalCashDisponible = useMemo(() => {
    const totalSalesPaid = sales.filter(s => s.status !== 'non payé').reduce((sum, s) => sum + s.totalPrice, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTransfers = (caisseTransfers || []).reduce((sum, t) => sum + t.amount, 0);
    return Math.max(0, totalSalesPaid + totalAlimentationsNormalGlobal - totalExpenses - totalTransfers);
  }, [sales, expenses, caisseTransfers, totalAlimentationsNormalGlobal]);

  // We use global cash available as the real treasury resource
  const realCashDisponible = globalCashDisponible > 0 ? globalCashDisponible : soldeDisponibleToday;

  // Helper to fetch the preconfigured unit price of a category
  const getCategoryPrice = (cat: string) => {
    const match = commandePrices.find(p => p.brandId === 'b1' && p.category === cat);
    return match ? match.price : (cat === '3Kg' ? 15 : cat === '12Kg' ? 40 : 120);
  };

  // Next supplier payment day calculations (Monday/Thursday)
  const nextPaymentInfo = useMemo(() => {
    const current = new Date();
    let daysToAdd = 0;
    let found = false;
    let checkDate = new Date(current);

    while (!found) {
      const day = checkDate.getDay();
      if ((day === 1 || day === 4) && daysToAdd > 0) {
        found = true;
      } else {
        checkDate.setDate(checkDate.getDate() + 1);
        daysToAdd++;
      }
    }

    const formatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return {
      dateString: formatter.format(checkDate),
      dayName: checkDate.getDay() === 1 ? 'Lundi' : 'Jeudi',
      rawDate: checkDate
    };
  }, []);

  // Multi-category submit handler
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter active quantity inputs
    const activeInputs = Object.entries(quantities).filter(([_, qty]) => {
      const q = parseInt(qty);
      return !isNaN(q) && q > 0;
    });

    if (activeInputs.length === 0) {
      toast.error("Veuillez saisir une quantité supérieure à 0 pour au moins une des catégories ci-dessous.");
      return;
    }

    let addedEntries = 0;
    activeInputs.forEach(([category, qty]) => {
      const parsedQty = parseInt(qty);
      const price = getCategoryPrice(category);

      const newOrder = {
        id: 'cmd-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        date: orderDate,
        brandId: 'b1', // default brand ID
        category,
        quantity: parsedQty,
        unitPrice: price,
        totalPrice: parsedQty * price,
        status: 'non payé' as const,
        supplierId: 'Vivo Energy'
      };

      addCommande(newOrder);
      addedEntries++;
    });

    // Reset quantity states
    setQuantities({
      '3Kg': '',
      '12Kg': '',
      '34Kg': ''
    });

    toast.success(`Écriture enregistrée ! ${addedEntries} catégorie(s) d'approvisionnement ajoutée(s).`);
  };

  const handleUpdatePriceConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseFloat(editingPrice.price);
    if (isNaN(priceVal) || priceVal < 0) {
      toast.error("Veuillez saisir un prix valide.");
      return;
    }

    setCommandePrice(editingPrice.brandId, editingPrice.category, priceVal);
    toast.success(`Le tarif est passé à ${priceVal} MAD pour la catégorie d'achat ${editingPrice.category}`);
  };

  // Live draft total computation
  const liveDraftTotal = useMemo(() => {
    return Object.entries(quantities).reduce((sum, [cat, val]) => {
      const q = parseInt(val);
      if (isNaN(q) || q <= 0) return sum;
      return sum + (q * getCategoryPrice(cat));
    }, 0);
  }, [quantities, commandePrices]);

  // Calculations for Vivo Energy coverage
  const pendingOrdersTotal = useMemo(() => {
    return commandes
      .filter(c => c.status === 'non payé')
      .reduce((sum, c) => sum + c.totalPrice, 0);
  }, [commandes]);

  // Coverage tracker calculations
  const coveragePercentage = useMemo(() => {
    if (pendingOrdersTotal === 0) return 100;
    return Math.min(100, Math.round((realCashDisponible / pendingOrdersTotal) * 100));
  }, [realCashDisponible, pendingOrdersTotal]);

  const missingAmount = useMemo(() => {
    return Math.max(0, pendingOrdersTotal - realCashDisponible);
  }, [pendingOrdersTotal, realCashDisponible]);

  // Breakdown for selected date
  const ordersOnSelectedDate = useMemo(() => {
    return commandes.filter(c => c.date === selectedDate);
  }, [commandes, selectedDate]);

  const selectedDateTotalAmount = useMemo(() => {
    return ordersOnSelectedDate.reduce((sum, o) => sum + o.totalPrice, 0);
  }, [ordersOnSelectedDate]);

  const selectedDateCategoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { quantity: number; total: number }> = {};
    ordersOnSelectedDate.forEach(order => {
      const key = order.category;
      if (!breakdown[key]) {
        breakdown[key] = { quantity: 0, total: 0 };
      }
      breakdown[key].quantity += order.quantity;
      breakdown[key].total += order.totalPrice;
    });
    return Object.entries(breakdown);
  }, [ordersOnSelectedDate]);

  // Bulk pay all pending orders
  const handleSettleSupplierPayment = () => {
    const pending = commandes.filter(c => c.status === 'non payé');
    if (pending.length === 0) {
      toast.info("Aucun paiement en attente pour Vivo Energy.");
      return;
    }
    
    if (realCashDisponible < pendingOrdersTotal) {
      toast.error("Votre cash disponible est insuffisant pour solder ce paiement.");
      return;
    }

    pending.forEach(order => {
      updateCommandeStatus(order.id, 'payé');
    });

    toast.success(`Paiement global de ${pendingOrdersTotal.toLocaleString()} MAD réglé auprès de Vivo Energy (déduit fictivement du grand livre de Trésorerie).`);
  };

  // Detailed treasury components for user transparency
  const totalSalesPaid = useMemo(() => {
    return sales.filter(s => s.status !== 'non payé').reduce((sum, s) => sum + s.totalPrice, 0);
  }, [sales]);

  const totalExpensesComputed = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalTransfersComputed = useMemo(() => {
    return (caisseTransfers || []).reduce((sum, t) => sum + t.amount, 0);
  }, [caisseTransfers]);

  const [showCashDetail, setShowCashDetail] = useState(false);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Commande & Approvisionnement Gaz</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 font-bold" /> Gestion Directe Fournisseur <span className="text-indigo-600">Vivo Energy (Butagaz)</span>
          </p>
        </div>
        
        <div className="relative flex flex-col items-end">
          <button 
            type="button"
            onClick={() => setShowCashDetail(!showCashDetail)}
            className="flex items-center gap-3 bg-slate-100 p-1 pr-3 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group shadow-xs"
          >
            <div className="bg-white px-4 py-2 rounded-xl text-slate-900 border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-sm">{realCashDisponible.toLocaleString()} MAD</span>
            </div>
            <div className="text-left select-none">
              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Trésorerie Actuelle</span>
              <span className="block text-[10px] font-bold text-indigo-600 uppercase group-hover:text-indigo-700">
                {showCashDetail ? 'Masquer Calculs ▲' : 'Consulter Détails ▼'}
              </span>
            </div>
          </button>

          {showCashDetail && (
            <div className="absolute top-14 right-0 z-50 w-80 bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl p-5 mt-2 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Provenance du Solde</span>
                <Info className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">1. Encaissé Ventes (+) :</span>
                  <span className="font-bold text-emerald-400">+{totalSalesPaid.toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">2. Sortie Caisse Op. (-) :</span>
                  <span className="font-bold text-rose-400">-{totalExpensesComputed.toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">3. Versé Coffres (-) :</span>
                  <span className="font-bold text-amber-400">-{totalTransfersComputed.toLocaleString()} MAD</span>
                </div>
                <div className="border-t border-slate-800 my-2 pt-2 flex justify-between items-center font-bold">
                  <span className="text-white">Solde Net Disponible :</span>
                  <span className="text-emerald-400 font-extrabold text-sm">
                    {Math.max(0, totalSalesPaid - totalExpensesComputed - totalTransfersComputed).toLocaleString()} MAD
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-3 leading-relaxed border-t border-slate-900 pt-2 font-mono">
                Ce calcul d'encaisse globale consolide les ventes enregistrées moins les dépenses et les virements vers coffre de manière continue.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout with Proportional Sizing and Spacious Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* WIDTH COLUMN (2/3): NEW MULTI-CATEGORY FORM & COMPLETE REGISTER HISTORY */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card: Nouvelle Commande Multi-Categories */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300/80 transition-all">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Nouvel Approvisionnement Multi-Catégories</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Entrez les quantités de bouteilles requises à charger auprès de Butagaz</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
              
              {/* Row 1: Shared header fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fournisseur d'énergie</label>
                  <input 
                    type="text" 
                    readOnly 
                    value="Vivo Energy (Butagaz)" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-100/80 text-slate-650 font-bold text-xs" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date du Bon de Commande</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      required
                      value={orderDate}
                      onChange={e => setOrderDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-5 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-semibold text-xs text-slate-800" 
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Row 2: Categories Multi-Input grid */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Saisir les Quantités par Bouteilles (Dépend des tarifs configurés)
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['3Kg', '12Kg', '34Kg'].map((cat) => {
                    const price = getCategoryPrice(cat);
                    const qtyVal = quantities[cat];
                    const subtotal = (parseInt(qtyVal) || 0) * price;

                    return (
                      <div 
                        key={cat} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          qtyVal 
                            ? 'bg-indigo-50/40 border-indigo-200 shadow-2xs' 
                            : 'bg-slate-50/50 border-slate-200/80'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-black text-slate-905">{cat === '3Kg' ? 'Bouteille 3 Kg' : cat === '12Kg' ? 'Bouteille 12 Kg' : 'Bouteille 34 Kg'}</span>
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[9px] font-black text-slate-600">
                              {price} MAD / u
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-450 italic">Cylindre Butagaz d'approvisionnement</p>
                        </div>

                        <div className="mt-4 space-y-2">
                          <label className="block text-[9px] font-black text-slate-450 uppercase">Quantité à commander</label>
                          <input 
                            type="number" 
                            min="0"
                            placeholder="ex: 100"
                            value={qtyVal}
                            onChange={e => setQuantities({ ...quantities, [cat]: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-extrabold text-xs text-slate-900 placeholder:font-normal placeholder:text-slate-400"
                          />
                        </div>

                        {subtotal > 0 && (
                          <div className="mt-3 pt-2 border-t border-indigo-100/50 flex justify-between text-[10px] font-bold text-indigo-700">
                            <span>Sous-total:</span>
                            <span>{subtotal.toLocaleString()} MAD</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total estimation panel with dynamic update */}
              <div className="bg-slate-900 text-white p-5 rounded-2.5xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Estimation de la facturation brute</span>
                  <p className="text-xs text-slate-300 mt-1">Calculé en temps réel selon les tarifs appliqués à <span className="font-bold text-white">Butagaz</span>.</p>
                </div>

                <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end">
                  <div className="text-right">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase font-mono">DRAFT TOTAL :</span>
                    <span className="text-2xl font-black text-indigo-400">{liveDraftTotal.toLocaleString()} MAD</span>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider font-mono self-center shrink-0"
                  >
                    Valider l'Approvisionnement
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Card: Global Register Ledger Table */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Grand Livre des Approvisionnements</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Registre officiel de toutes les fiches d'achat</p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full font-mono">
                {commandes.length} BON(S) ENREGISTRÉ(S)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-6">Réf Bon</th>
                    <th className="py-4 px-6">Date d'Émission</th>
                    <th className="py-4 px-6">Catégorie</th>
                    <th className="py-4 px-6 text-right">Quantité</th>
                    <th className="py-4 px-6 text-right">Tarif Unitaire</th>
                    <th className="py-4 px-6 text-right">Total Facturé</th>
                    <th className="py-4 px-6">Statut de Règlement</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {commandes.slice().reverse().map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-450">{order.id}</td>
                      <td className="py-4 px-6 text-slate-900 font-bold">{order.date}</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-black uppercase">
                          {order.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-slate-900">{order.quantity}</td>
                      <td className="py-4 px-6 text-right text-slate-500 font-mono">{order.unitPrice} MAD</td>
                      <td className="py-4 px-6 text-right font-black text-indigo-600">{order.totalPrice.toLocaleString()} MAD</td>
                      <td className="py-4 px-6">
                        {order.status === 'payé' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            PROCHE PAYÉ
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              updateCommandeStatus(order.id, 'payé');
                              toast.success("Règlement validé.");
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors uppercase tracking-wide"
                          >
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            Attente Règlements
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => {
                            deleteCommande(order.id);
                            toast.success("Commande supprimée.");
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {commandes.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 bg-white">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-10" />
                        <p className="font-bold text-sm">Aucun bon d'approvisionnement Butagaz.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SIDEBAR COLUMN (1/3): FINANCIAL COVERAGE, TARIF CHECKLIST & DATE SYNTHESIS */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Tracker Card */}
          <div className="bg-slate-950 text-white rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden relative p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[9px] font-bold px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full uppercase tracking-wider font-mono">
                  Vivo Energy Tracker
                </span>
                <h3 className="text-xl font-bold mt-2">Couverture Financière</h3>
              </div>
              <div className="bg-indigo-600/30 p-3 rounded-2xl border border-indigo-500/25">
                <ShoppingCart className="w-5 h-5 text-indigo-400" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 font-semibold">Prochaine Échéance de Règlement</p>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
                  <p className="text-sm font-black capitalize text-indigo-200">
                    {nextPaymentInfo.dateString} ({nextPaymentInfo.dayName})
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                  <span>Charges Butagaz en attente :</span>
                  <span className="font-bold text-slate-200">{pendingOrdersTotal.toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-semibold mt-1.5 pt-1.5 border-t border-slate-900">
                  <span>Trésorerie d'Encaisse disponible :</span>
                  <span className="font-bold text-emerald-400">{realCashDisponible.toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-amber-500 font-semibold mt-1">
                  <span>Prêts exclus de la trésorerie :</span>
                  <span className="font-bold">{(globalCashDisponible > 0 ? totalPretsGlobal : totalPretsToday).toLocaleString()} MAD</span>
                </div>
              </div>

              {(globalCashDisponible > 0 ? totalPretsGlobal : totalPretsToday) > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[10px] text-amber-300 leading-normal mt-2">
                  <span className="font-bold uppercase block mb-0.5">⚠️ Attention Prêts Exclus :</span>
                  Les fonds issus d'emprunts (<span className="text-white font-bold">{(globalCashDisponible > 0 ? totalPretsGlobal : totalPretsToday).toLocaleString()} MAD</span>) sont exclus de la couverture financière car cet argent n'appartient pas à l'entreprise et doit retourner à son propriétaire.
                </div>
              )}

              {/* Progress and coverage section */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400 font-semibold">Taux de couverture :</span>
                  <span className="text-sm font-black text-indigo-400">{coveragePercentage}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      coveragePercentage >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`} 
                    style={{ width: `${coveragePercentage}%` }}
                  />
                </div>
              </div>

              {coveragePercentage < 100 ? (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 mt-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-400">Trésorerie Insuffisante</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Il manque <span className="text-white font-bold">{missingAmount.toLocaleString()} MAD</span> dans votre solde caisse pour honorer les approvisionnements de Butagaz à l'échéance.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3 mt-4">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-400">Trésorerie Solvable</p>
                    <p className="text-[11px] text-slate-450 leading-relaxed mt-0.5">
                      Fonds de caisse suffisants pour régler Butagaz au montant cumulé de {pendingOrdersTotal.toLocaleString()} MAD.
                    </p>
                  </div>
                </div>
              )}

              {pendingOrdersTotal > 0 && (
                <button
                  type="button"
                  onClick={handleSettleSupplierPayment}
                  disabled={realCashDisponible < pendingOrdersTotal}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold h-12 rounded-xl transition-all font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 mt-4 cursor-pointer"
                >
                  <Banknote className="w-4 h-4" />
                  Régler l'Échéance Globalement
                </button>
              )}
            </div>
          </div>

          {/* Category Reference Tariffs Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Tarifs de Référence</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Ajustement du barème Butagaz</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="space-y-2">
                {['3Kg', '12Kg', '34Kg'].map(cat => {
                  const price = getCategoryPrice(cat);
                  return (
                    <div key={cat} className="flex justify-between items-center py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-black text-slate-705">{cat} Butagaz</span>
                      <span className="text-xs font-extrabold text-indigo-600">{price} MAD / unité</span>
                    </div>
                  );
                })}
              </div>

              {/* Price configuration form */}
              <form onSubmit={handleUpdatePriceConfig} className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Modifier un Tarif d'Achat :</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Catégorie</label>
                    <select 
                      value={editingPrice.category}
                      onChange={e => {
                        const cat = e.target.value;
                        setEditingPrice({
                          ...editingPrice,
                          category: cat,
                          price: getCategoryPrice(cat).toString()
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold cursor-pointer"
                    >
                      <option value="3Kg">3Kg</option>
                      <option value="12Kg">12Kg</option>
                      <option value="34Kg">34Kg</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tarif (MAD)</label>
                    <input 
                      type="number" 
                      required 
                      min="0" 
                      placeholder="Montant"
                      value={editingPrice.price}
                      onChange={e => setEditingPrice({...editingPrice, price: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-900 focus:bg-white" 
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 text-white font-black text-[10px] rounded-xl hover:bg-slate-800 transition-colors uppercase tracking-widest font-mono cursor-pointer"
                >
                  Mettre à jour le prix
                </button>
              </form>

            </div>
          </div>

          {/* Daily synthesis tracker card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Aperçu par Jour</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Bilan quotidien</p>
                </div>
              </div>
              
              <input 
                type="date" 
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-xs text-slate-800 shadow-xs" 
              />
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center">
                <div>
                  <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Total Commandes ({selectedDate})</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{selectedDateTotalAmount.toLocaleString()} MAD</p>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                  {ordersOnSelectedDate.length} BON(S)
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Détail par Bouteille :</h4>
                {selectedDateCategoryBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">Aucune commande formulée sur ce jour.</p>
                ) : (
                  selectedDateCategoryBreakdown.map(([cat, info]) => (
                    <div key={cat} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800">{cat}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase">{info.quantity} unités de gaz</span>
                      </div>
                      <span className="font-black text-slate-900">{info.total.toLocaleString()} MAD</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
