import React, { useState, useMemo } from 'react';
import { useCarburantStore } from '../../../../stores/useCarburantStore';
import { useChargeVariableStore } from '../../../../stores/useChargeVariableStore';
import { useDispatchGazStore, ComptaDocument } from '../../../../stores/useDispatchGazStore';
import { useDispatchAuthStore } from '../../../../stores/useDispatchAuthStore';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Banknote, 
  Users, 
  Flame, 
  Scale, 
  UploadCloud, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  CheckCircle2, 
  FileSpreadsheet, 
  Plus, 
  Coins, 
  Building 
} from 'lucide-react';
import { toast } from 'sonner';

export default function DispatchComptaPage() {
  const { user } = useDispatchAuthStore();
  const { tickets: carburantTickets } = useCarburantStore();
  const { charges: variableCharges } = useChargeVariableStore();
  const { 
    sales, 
    drivers, 
    paySlips, 
    commandes = [], 
    comptaDocuments = [], 
    comptoirStock = [],
    addComptaDocument, 
    deleteComptaDocument 
  } = useDispatchGazStore();

  // Filters & State
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [docSearch, setDocSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  
  // Form Visibility State
  const [visibleWidgets, setVisibleWidgets] = useState({
    ledger: false,
    sales: false,
    expenses: false,
    supply: false,
    hr: false
  });

  // Document Upload Form State
  const [formType, setFormType] = useState<ComptaDocument['type']>('facture');
  const [formRef, setFormRef] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; data?: string } | null>(null);

  // Is Dragging state
  const [isDragging, setIsDragging] = useState(false);

  // 1. FLEETOPS EXPENDITURES ANALYSIS
  const fleetExpenses = useMemo(() => {
    // Filter by selected month
    const filteredTickets = carburantTickets.filter(t => t.createdAt?.startsWith(filterMonth) || t.dateHeure?.startsWith(filterMonth));
    const filteredCharges = variableCharges.filter(c => c.date?.startsWith(filterMonth));

    const totalCarburant = filteredTickets.reduce((sum, t) => sum + (t.coutTotal || 0), 0);
    const totalVolume = filteredTickets.reduce((sum, t) => sum + (t.volume || 0), 0);
    const totalChargesVariables = filteredCharges.reduce((sum, c) => sum + (c.montant || 0), 0);

    return {
      totalCarburant,
      totalVolume,
      totalChargesVariables,
      ticketsCount: filteredTickets.length,
      chargesCount: filteredCharges.length,
      filteredTickets,
      filteredCharges
    };
  }, [carburantTickets, variableCharges, filterMonth]);

  // 2. DISPATCH DRIVER SALES & COUNTER (COMPTOIR) STOCK/SALES
  const salesAnalysis = useMemo(() => {
    const filteredSales = sales.filter(s => s.date?.startsWith(filterMonth));
    
    // Distinguish comptoir (counter desk) sales vs driver deliveries.
    // Chauffeurs have IDs matching drivers database list, while comptoir salesperson id is not there or role is vendeur.
    const driverIdsSet = new Set(drivers.map(d => d.id));

    let driverSalesTotal = 0;
    let comptoirSalesTotal = 0;
    let totalQtySold = 0;

    const paymentBreakdown = {
      espece: 0,
      cheque: 0,
      credit: 0
    };

    const driverBreakdown: Record<string, { name: string; amount: number; qty: number }> = {};

    filteredSales.forEach(s => {
      totalQtySold += s.quantity;
      if (s.paymentMethod in paymentBreakdown) {
        paymentBreakdown[s.paymentMethod as keyof typeof paymentBreakdown] += s.totalPrice;
      }

      if (driverIdsSet.has(s.driverId)) {
        driverSalesTotal += s.totalPrice;
        const driverObj = drivers.find(d => d.id === s.driverId);
        const name = driverObj ? `${driverObj.prenom} ${driverObj.nom}` : 'Chauffeur Inconnu';
        if (!driverBreakdown[s.driverId]) {
          driverBreakdown[s.driverId] = { name, amount: 0, qty: 0 };
        }
        driverBreakdown[s.driverId].amount += s.totalPrice;
        driverBreakdown[s.driverId].qty += s.quantity;
      } else {
        comptoirSalesTotal += s.totalPrice;
      }
    });

    return {
      totalSales: driverSalesTotal + comptoirSalesTotal,
      driverSalesTotal,
      comptoirSalesTotal,
      totalQtySold,
      paymentBreakdown,
      driverContributions: Object.values(driverBreakdown).sort((a,b) => b.amount - a.amount),
      filteredSales
    };
  }, [sales, drivers, filterMonth]);

  // 3. HR PAYROLL (SALARIES & COMMISSIONS)
  const salaryAnalysis = useMemo(() => {
    // paySlips is filtered by the month (stored in month format YYYY-MM)
    const filteredSlips = paySlips.filter(p => p.month === filterMonth);
    const totalPayrollPaid = filteredSlips.reduce((sum, p) => sum + (p.totalCommission || 0), 0);

    return {
      totalPayrollPaid,
      slipsCount: filteredSlips.length,
      filteredSlips
    };
  }, [paySlips, filterMonth]);

  // 4. COMMANDE GAZ PURCHASE ORDERS (APPROVISIONNEMENTS FROM VIVO ENERGY)
  const supplyOrdersAnalysis = useMemo(() => {
    const filteredCommandes = (commandes || []).filter(c => c.date?.startsWith(filterMonth));
    const totalPurchaseCost = filteredCommandes.reduce((sum, c) => sum + (c.totalPrice || 0), 0);
    const paidPurchaseCost = filteredCommandes.filter(c => c.status === 'payé').reduce((sum, c) => sum + (c.totalPrice || 0), 0);
    const unpaidPurchaseCost = filteredCommandes.filter(c => c.status !== 'payé').reduce((sum, c) => sum + (c.totalPrice || 0), 0);

    return {
      totalPurchaseCost,
      paidPurchaseCost,
      unpaidPurchaseCost,
      orderCount: filteredCommandes.length,
      filteredCommandes
    };
  }, [commandes, filterMonth]);

  // GRAND LEDGER CONSOLIDATION
  const grandLedger = useMemo(() => {
    const totalInflows = salesAnalysis.totalSales;
    const totalOutflows = 
      fleetExpenses.totalCarburant + 
      fleetExpenses.totalChargesVariables + 
      salaryAnalysis.totalPayrollPaid + 
      supplyOrdersAnalysis.totalPurchaseCost;
    
    return {
      totalInflows,
      totalOutflows,
      netBalance: totalInflows - totalOutflows
    };
  }, [fleetExpenses, salesAnalysis, salaryAnalysis, supplyOrdersAnalysis]);

  // Document management handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFile({
          name: file.name,
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFile({
          name: file.name,
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.trim() || !formAmount || !formDate) {
      toast.error('Veuillez remplir les informations obligatoires (Référence, Date et Montant).');
      return;
    }

    const doc: ComptaDocument = {
      id: 'doc_' + Math.random().toString(36).substr(2, 9),
      type: formType,
      reference: formRef,
      date: formDate,
      amount: parseFloat(formAmount),
      fileName: uploadedFile ? uploadedFile.name : 'document_simule.pdf',
      fileData: uploadedFile?.data || '',
      notes: formNotes,
      uploadedAt: new Date().toISOString()
    };

    addComptaDocument(doc);
    toast.success('Document comptable déposé avec succès.');

    // Clear form
    setFormRef('');
    setFormAmount('');
    setFormNotes('');
    setUploadedFile(null);
  };

  const simulateDownload = (doc: ComptaDocument) => {
    // Generate simple simulated download anchor trigger
    toast.success(`Téléchargement en cours : ${doc.fileName}`);
    const link = document.createElement('a');
    link.href = doc.fileData || 'data:text/plain;charset=utf-8,Simulated bookkeeping file content';
    link.setAttribute('download', doc.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocs = useMemo(() => {
    return (comptaDocuments || []).filter(doc => {
      const matchesSearch = doc.reference.toLowerCase().includes(docSearch.toLowerCase()) || 
                            (doc.notes || '').toLowerCase().includes(docSearch.toLowerCase());
      const matchesType = docTypeFilter === 'all' || doc.type === docTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [comptaDocuments, docSearch, docTypeFilter]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Premium Modular Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)]">
        <div>
          <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 shadow-sm mb-3">
            <Scale className="w-3.5 h-3.5" /> Fiduciaire Afro Negoce
          </span>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            Comptabilité & Correspondance
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-2">
            Livre comptable centralisé de l'entreprise intégrant le parc, la paie, les commandes fournisseurs et les ventes.
          </p>
        </div>

        {/* Global Period Selector */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 p-2.5 rounded-2xl shadow-sm">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Période:</span>
          <input 
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-white border text-sm font-bold border-slate-200 text-slate-900 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {/* Widget Toggles */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-wrap gap-5 items-center">
        <span className="text-sm font-semibold text-slate-700">Afficher les tableaux de bord :</span>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input 
            type="checkbox" 
            checked={visibleWidgets.ledger} 
            onChange={(e) => setVisibleWidgets(w => ({...w, ledger: e.target.checked}))} 
            className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <span className="text-sm text-slate-600 font-medium">Grand Livre</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input 
            type="checkbox" 
            checked={visibleWidgets.sales} 
            onChange={(e) => setVisibleWidgets(w => ({...w, sales: e.target.checked}))} 
            className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <span className="text-sm text-slate-600 font-medium">Recettes & Ventes</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input 
            type="checkbox" 
            checked={visibleWidgets.expenses} 
            onChange={(e) => setVisibleWidgets(w => ({...w, expenses: e.target.checked}))} 
            className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <span className="text-sm text-slate-600 font-medium">Dépenses Parc</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input 
            type="checkbox" 
            checked={visibleWidgets.supply} 
            onChange={(e) => setVisibleWidgets(w => ({...w, supply: e.target.checked}))} 
            className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <span className="text-sm text-slate-600 font-medium">Achats VIVO</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input 
            type="checkbox" 
            checked={visibleWidgets.hr} 
            onChange={(e) => setVisibleWidgets(w => ({...w, hr: e.target.checked}))} 
            className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <span className="text-sm text-slate-600 font-medium">Salaires</span>
        </label>
      </div>

      {/* Financial Core Ledger Breakdown Badges */}
      {visibleWidgets.ledger && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-emerald-200/60 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
            <TrendingUp className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Recettes Totales (Inflows)</span>
            <span className="text-4xl font-black text-emerald-600 block tracking-tight">
              {grandLedger.totalInflows.toLocaleString()} <span className="text-base text-emerald-400 font-bold">MAD</span>
            </span>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100/50 flex justify-between text-xs text-slate-500 font-medium relative z-10">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Drivers: {salesAnalysis.driverSalesTotal.toLocaleString()} MAD</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>Comptoir: {salesAnalysis.comptoirSalesTotal.toLocaleString()} MAD</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-rose-200/60 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
            <TrendingDown className="w-24 h-24 text-rose-600" />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Dépenses Totales (Outflows)</span>
            <span className="text-4xl font-black text-rose-600 block tracking-tight">
              {grandLedger.totalOutflows.toLocaleString()} <span className="text-base text-rose-400 font-bold">MAD</span>
            </span>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100/50 flex justify-between text-xs text-slate-500 font-medium relative z-10">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>Carburant: {fleetExpenses.totalCarburant.toLocaleString()} MAD</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>Vivo: {supplyOrdersAnalysis.totalPurchaseCost.toLocaleString()} MAD</span>
          </div>
        </div>

        <div className={`p-6 rounded-[2rem] border shadow-xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300 ${
          grandLedger.netBalance >= 0 ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-900 hover:shadow-slate-900/30 text-white border-slate-700/50' : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900 via-red-950 to-red-950 hover:shadow-red-900/30 text-white border-red-800/50'
        }`}>
          <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none ${grandLedger.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
             {grandLedger.netBalance >= 0 ? <TrendingUp className="w-24 h-24" /> : <TrendingDown className="w-24 h-24" />}
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Trésorerie / Net Cash Flow</span>
            <span className={`text-4xl font-black block tracking-tight ${grandLedger.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {grandLedger.netBalance.toLocaleString()} <span className="text-base opacity-70 font-bold">MAD</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-6 pt-4 border-t border-slate-700/50 relative z-10">
            Le résultat d'exploitation consolidé prend en compte l'ensemble des flux du parc FleetOps, fiches de paie et ventes gaz.
          </p>
        </div>
      </div>
      )}

      {/* Bespoke Grid breakdown for different streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Stream 1: Fleetops Expenditures Analysis */}
        {visibleWidgets.expenses && (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] p-6 space-y-6 flex flex-col hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between border-b border-slate-100/50 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <span className="p-2 bg-sky-50 text-sky-600 rounded-xl"><Coins className="w-5 h-5" /></span>
              Dépenses de Fonctionnement Flotte
            </h2>
            <span className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-full text-slate-600">
              FleetOps
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Carburant</span>
              <span className="text-2xl font-black text-slate-900 mt-2 block tracking-tight">
                {fleetExpenses.totalCarburant.toLocaleString()} <span className="text-sm text-slate-500 font-bold">MAD</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-2 block">
                {fleetExpenses.totalVolume.toLocaleString()} Litres ({fleetExpenses.ticketsCount} Bons)
              </span>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Charges Variables</span>
              <span className="text-2xl font-black text-slate-900 mt-2 block tracking-tight">
                {fleetExpenses.totalChargesVariables.toLocaleString()} <span className="text-sm text-slate-500 font-bold">MAD</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-2 block">
                {fleetExpenses.chargesCount} Opérations déclarées
              </span>
            </div>
          </div>

          {/* Inline detailed transactions */}
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historique Récent Flotte</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {fleetExpenses.filteredTickets.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3.5 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20"></span>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{t.reference || `Ticket ${t.id.slice(0,5)}`}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Véhicule: {t.vehiculeId} • Vol: {t.volume}L</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900">{t.coutTotal.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">MAD</span></span>
                </div>
              ))}
              
              {fleetExpenses.filteredCharges.map(c => (
                <div key={c.id} className="flex justify-between items-center p-3.5 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/20"></span>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{c.description || 'Charge Variable'}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Véhicule: {c.vehiculeId}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900">{c.montant.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">MAD</span></span>
                </div>
              ))}

              {fleetExpenses.ticketsCount === 0 && fleetExpenses.chargesCount === 0 && (
                <p className="text-center text-slate-400 py-6 italic text-xs font-medium">Aucune dépense de flotte enregistrée ce mois-ci.</p>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Stream 2: Driver Sales & Comptoir Stock */}
        {visibleWidgets.sales && (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] p-6 space-y-6 flex flex-col hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between border-b border-slate-100/50 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Flame className="w-5 h-5" /></span>
              Ventes & Trésorerie Ventes Gaz
            </h2>
            <span className="text-xs font-bold bg-amber-100 px-3 py-1.5 rounded-full text-amber-800">
              Chiffre d'Affaires
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Ventes Chauffeurs</span>
              <span className="text-2xl font-black text-slate-900 mt-2 block tracking-tight">
                {salesAnalysis.driverSalesTotal.toLocaleString()} <span className="text-sm text-slate-500 font-bold">MAD</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-2 block">
                Livraisons en tournée active
              </span>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Ventes Comptoir</span>
                <span className="text-2xl font-black text-slate-900 mt-2 block tracking-tight">
                  {salesAnalysis.comptoirSalesTotal.toLocaleString()} <span className="text-sm text-slate-500 font-bold">MAD</span>
                </span>
              </div>
              
              {/* Comptoir Stock levels progress widget */}
              <div className="mt-4 border-t border-slate-200/60 pt-3">
                <span className="block text-[9px] font-bold text-slate-400 uppercase mb-2">Cylindres en Comptoir</span>
                <div className="flex gap-2">
                  <div className="flex-1 bg-emerald-50 px-2 py-1.5 rounded-xl text-center border border-emerald-100/50 shadow-sm">
                    <span className="block text-[9px] font-bold text-emerald-800 uppercase">Pleins</span>
                    <span className="text-sm font-black text-emerald-600 mt-0.5 block">
                      {comptoirStock.reduce((acc, c) => acc + (c.full || 0), 0)}
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-100 px-2 py-1.5 rounded-xl text-center border border-slate-200/50 shadow-sm">
                    <span className="block text-[9px] font-bold text-slate-800 uppercase">Vides</span>
                    <span className="text-sm font-black text-slate-600 mt-0.5 block">
                      {comptoirStock.reduce((acc, c) => acc + (c.empty || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modes de Règlement Collectés</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-500/5 hover:bg-emerald-50 transition-colors">
                <span className="block text-[10px] font-bold text-emerald-700 uppercase">Espèces</span>
                <span className="text-base font-black text-emerald-800 block mt-1 tracking-tight">
                  {salesAnalysis.paymentBreakdown.espece.toLocaleString()}
                </span>
              </div>
              <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-100 shadow-sm shadow-sky-500/5 hover:bg-sky-50 transition-colors">
                <span className="block text-[10px] font-bold text-sky-700 uppercase">Chèque</span>
                <span className="text-base font-black text-sky-800 block mt-1 tracking-tight">
                  {salesAnalysis.paymentBreakdown.cheque.toLocaleString()}
                </span>
              </div>
              <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-100 shadow-sm shadow-amber-500/5 hover:bg-amber-50 transition-colors">
                <span className="block text-[10px] font-bold text-amber-700 uppercase">Crédit Client</span>
                <span className="text-base font-black text-amber-800 block mt-1 tracking-tight">
                  {salesAnalysis.paymentBreakdown.credit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        )}

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Stream 3: HR Salaries & Commission payouts */}
        {visibleWidgets.hr && (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] p-6 space-y-6 flex flex-col hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between border-b border-slate-100/50 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Users className="w-5 h-5" /></span>
              Médiation Payroll & Charges Sociales
            </h2>
            <span className="text-xs font-bold bg-emerald-100 px-3 py-1.5 rounded-full text-emerald-800">
              Ressources Humaines
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Commissions versées ce mois
              </span>
              <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                {salaryAnalysis.totalPayrollPaid.toLocaleString()} <span className="text-sm text-slate-500 font-bold">MAD</span>
              </p>
            </div>
            <div className="text-right">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold border border-indigo-200/50">
                {salaryAnalysis.slipsCount} Fiches enregistrées
              </span>
            </div>
          </div>

          {/* List of driver payroll items */}
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fiches individuelles calculées</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {salaryAnalysis.filteredSlips.map(slip => {
                const drv = drivers.find(d => d.id === slip.driverId);
                const completeName = drv ? `${drv.prenom} ${drv.nom}` : 'Utilisateur';
                return (
                  <div key={slip.id} className="flex justify-between items-center p-3.5 bg-slate-50/50 rounded-2xl hover:bg-slate-50 border border-slate-100/50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{completeName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Générée le: {new Date(slip.generatedAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-extrabold text-emerald-600">+{slip.totalCommission.toLocaleString()} <span className="text-[10px] font-bold text-emerald-500/70">MAD</span></span>
                  </div>
                );
              })}
              {salaryAnalysis.slipsCount === 0 && (
                <p className="text-center text-slate-400 py-6 italic text-xs font-medium">Aucune fiche de paie clôturée pour ce mois.</p>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Stream 4: Commande gaz (Purchase supply cost) */}
        {visibleWidgets.supply && (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] p-6 space-y-6 flex flex-col hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between border-b border-slate-100/50 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><ShoppingCart className="w-5 h-5" /></span>
              Achats Bruts Vivo Energy
            </h2>
            <span className="text-xs font-bold bg-purple-100 px-3 py-1.5 rounded-full text-purple-800">
              Commande Gaz
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Facturé Vivo</span>
              <span className="text-2xl font-black text-slate-900 mt-2 block tracking-tight">
                {supplyOrdersAnalysis.totalPurchaseCost.toLocaleString()} <span className="text-sm text-slate-500 font-bold">MAD</span>
              </span>
              <span className="text-xs text-slate-400 font-medium block mt-2">
                {supplyOrdersAnalysis.orderCount} Approvisionnements
              </span>
            </div>

            <div className="bg-[#090E17] text-white p-5 rounded-2xl border border-slate-800/50 hover:bg-[#0B1120] transition-colors flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Reste À Payer</span>
                <span className="text-2xl font-black text-amber-500 mt-2 block tracking-tight">
                  {supplyOrdersAnalysis.unpaidPurchaseCost.toLocaleString()} <span className="text-sm text-amber-500/70 font-bold">MAD</span>
                </span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 mt-3 select-none">
                Vivo Energy Direct Invoices
              </div>
            </div>
          </div>

          {/* List of orders */}
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bons de Commande Vivo Recueillis</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {supplyOrdersAnalysis.filteredCommandes.map(cmd => (
                <div key={cmd.id} className="flex justify-between items-center p-3.5 bg-slate-50/50 rounded-2xl hover:bg-slate-50 border border-slate-100/50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-700 text-sm">Fournisseur: {cmd.supplierId || 'Vivo Energy'}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Date: {new Date(cmd.date).toLocaleDateString()} • Qty: {cmd.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-900 text-sm">{cmd.totalPrice.toLocaleString()} MAD</p>
                    <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-md mt-1 border ${
                      cmd.status === 'payé' ? 'bg-emerald-100 text-emerald-800 border-emerald-200/50' : 'bg-red-100 text-red-800 border-red-200/50'
                    }`}>
                      {cmd.status === 'payé' ? 'RÉGLÉ' : 'À PAYER'}
                    </span>
                  </div>
                </div>
              ))}
              {supplyOrdersAnalysis.orderCount === 0 && (
                <p className="text-center text-slate-400 py-6 italic text-xs font-medium">Aucun bon d'approvisionnement détecté.</p>
              )}
            </div>
          </div>
        </div>
        )}

      </div>

      {/* COMPTABILITÉ CORRESPONDENCE UPLOAD & ARCHIVES (Admin + accountant) */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100/60 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FileSpreadsheet className="w-6 h-6" /></span>
              Archives & Correspondances Comptables
            </h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Plateforme d'échange de pièces justificatives (Factures, bons de commande, bons de livraison) partagé directement avec le comptable.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-700 shadow-sm">
              Accès: {user?.role === 'comptable' ? 'Cabinet Comptable (Lecture/Dépôt)' : 'Trésorerie Administrateur (Master)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Document Upload Form */}
          <div className="bg-slate-50/50 border border-slate-200/60 p-6 rounded-3xl space-y-6 h-fit hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-2.5 border-b border-slate-200/60 pb-4">
              <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><Plus className="w-4 h-4" /></span>
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">Déposer une Pièce</h3>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-5 text-sm">
              
              <div>
                <label className="block font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">Type de document *</label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-200/40 p-2 rounded-2xl">
                  {(['facture', 'bon_commande', 'bon_livraison', 'declaration_tva', 'declaration_cnss'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={`py-2 px-1 text-[10px] font-black rounded-xl transition-all uppercase tracking-wide ${
                        formType === t 
                          ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                      }`}
                    >
                      {t === 'facture' ? 'Facture' : t === 'bon_commande' ? 'B. Commande' : t === 'bon_livraison' ? 'B. Livraison' : t === 'declaration_tva' ? 'D. TVA' : 'D. CNSS'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">Numéro / Référence *</label>
                <input
                  type="text"
                  required
                  value={formRef}
                  onChange={(e) => setFormRef(e.target.value)}
                  placeholder="ex: FACT-2026-641"
                  className="w-full px-4 py-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">Date d'édition *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">Montant (MAD) *</label>
                  <input
                    type="number"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="Montant net"
                    className="w-full px-4 py-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">Notes & Observations (Facultatif)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Mentionnez le fournisseur, chauffeur ou projet..."
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm text-sm resize-none custom-scrollbar"
                />
              </div>

              {/* Real Drag & Drop simulated selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">Joindre le Fichier Numerisé *</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative group ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' 
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    {uploadedFile ? (
                      <div className="text-slate-700 font-bold max-w-full truncate text-[11px] bg-white px-3 py-1.5 rounded-full shadow-sm">
                        Fichier sélectionné : <span className="text-indigo-600 block truncate mt-0.5">{uploadedFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-700 font-bold text-[11px]">Glissez-déposez le document scanner ici</p>
                        <p className="text-slate-400 text-[10px] mt-1.5">ou cliquez pour parcourir les dossiers (PDF, PNG, JPG)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all uppercase tracking-wider text-[11px] transform active:scale-[0.98]"
              >
                Transmettre au Cabinet
              </button>

            </form>
          </div>

          {/* Column 2 & 3: Uploaded Archive Table / Viewer */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search & filters tools */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Rechercher par référence ou notes..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm text-slate-800 transition-all shadow-sm"
                />
              </div>

              <div className="flex items-center gap-3 bg-white border border-slate-200/80 px-4 py-2 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filtrer:</span>
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">Tous les types</option>
                  <option value="facture">Factures uniquement</option>
                  <option value="bon_commande">Bons de Commande</option>
                  <option value="bon_livraison">Bons de Livraison</option>
                </select>
              </div>
            </div>

            {/* Document List */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200/80">
                    <tr>
                      <th className="px-6 py-4">Type & Réf</th>
                      <th className="px-6 py-4">Date Pièce</th>
                      <th className="px-6 py-4 text-right">Montant</th>
                      <th className="px-6 py-4">Nom de fichier</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-wider ${
                              doc.type === 'facture' 
                                ? 'bg-red-50 text-red-700 border border-red-100/50' 
                                : doc.type === 'bon_commande' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100/50' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100/50'
                            }`}>
                              {doc.type === 'facture' ? 'Facture' : doc.type === 'bon_commande' ? 'Commande' : 'Livraison'}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800 tracking-tight">{doc.reference}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px] mt-0.5" title={doc.notes}>
                                {doc.notes || 'Sans description'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                          {new Date(doc.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900 tracking-tight">
                          {doc.amount.toLocaleString()} <span className="text-[10px] text-slate-400 ml-0.5">MAD</span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px] max-w-[150px] truncate" title={doc.fileName}>
                          {doc.fileName}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex gap-2 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => simulateDownload(doc)}
                              className="p-2 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl transition-all shadow-sm cursor-pointer"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => {
                                  deleteComptaDocument(doc.id);
                                  toast.success('Document supprimé des archives.');
                                }}
                                className="p-2 bg-slate-50 hover:bg-red-50 border border-transparent hover:border-red-100 text-slate-400 hover:text-red-600 rounded-xl transition-all shadow-sm cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredDocs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-16">
                          <div className="flex flex-col items-center justify-center">
                            <FileSpreadsheet className="w-12 h-12 text-slate-200 mb-3" />
                            <p className="text-slate-500 font-medium">Aucune pièce justificative déposée correspondant aux critères.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Helpful accounting notice */}
            <div className="bg-blue-50/80 rounded-2xl border border-blue-100/50 p-5 mt-6 flex gap-3 shadow-sm shadow-blue-500/5">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold">Transmission Sécurisée Directe</span> : Tous les documents déposés ci-dessus sont immédiatement synchronisés avec l'espace de consultation de l'expert-comptable. Ces pièces consolident le bilan d'exploitation périodique de Afro Negoce.
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
