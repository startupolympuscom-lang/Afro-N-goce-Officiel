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
  
  // Document Upload Form State
  const [formType, setFormType] = useState<'facture' | 'bon_commande' | 'bon_livraison'>('facture');
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide inline-flex items-center gap-1.5 shadow-2xs mb-2">
            <Scale className="w-3.5 h-3.5" /> Fiduciaire Afro Negoce
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Comptabilité & Correspondance
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Livre comptable centralisé de l'entreprise intégrant le parc, la paie, les commandes fournisseurs et les ventes.
          </p>
        </div>

        {/* Global Period Selector */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 p-2 rounded-2xl shadow-2xs">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Période:</span>
          <input 
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-white border border-slate-200 text-slate-900 px-3 py-1.5 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Financial Core Ledger Breakdown Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-5 -translate-y-5 w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center opacity-50">
            <TrendingUp className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Recettes Totales (Inflows)</span>
            <span className="text-3xl font-black text-emerald-600 block mt-2">
              {grandLedger.totalInflows.toLocaleString()} MAD
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Ventes Drivers: {salesAnalysis.driverSalesTotal.toLocaleString()} MAD</span>
            <span className="font-semibold text-slate-700">Comptoir: {salesAnalysis.comptoirSalesTotal.toLocaleString()} MAD</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-5 -translate-y-5 w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center opacity-50">
            <TrendingDown className="w-10 h-10 text-rose-500" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Dépenses Totales (Outflows)</span>
            <span className="text-3xl font-black text-rose-600 block mt-2">
              {grandLedger.totalOutflows.toLocaleString()} MAD
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Carburant: {fleetExpenses.totalCarburant.toLocaleString()} MAD</span>
            <span>Vivo Orders: {supplyOrdersAnalysis.totalPurchaseCost.toLocaleString()} MAD</span>
          </div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between ${
          grandLedger.netBalance >= 0 ? 'bg-[#0B1120] text-white border-slate-800' : 'bg-red-950 text-white border-red-900'
        }`}>
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Trésorerie / Net Cash Flow</span>
            <span className={`text-3xl font-black block mt-2 ${grandLedger.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {grandLedger.netBalance.toLocaleString()} MAD
            </span>
          </div>
          <p className="text-[10px] text-slate-400 italic mt-4 leading-relaxed pt-3 border-t border-slate-800">
            Le résultat d'exploitation consolidé prend en compte l'ensemble des flux du parc FleetOps, fiches de paie et ventes gaz.
          </p>
        </div>
      </div>

      {/* Bespoke Grid breakdown for different streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Stream 1: Fleetops Expenditures Analysis */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg"><Coins className="w-4 h-4" /></span>
              Dépenses de Fonctionnement Flotte
            </h2>
            <span className="text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">
              FleetOps
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Carburant</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {fleetExpenses.totalCarburant.toLocaleString()} MAD
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-2 block">
                {fleetExpenses.totalVolume.toLocaleString()} Litres ({fleetExpenses.ticketsCount} Bons)
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Charges Variables</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {fleetExpenses.totalChargesVariables.toLocaleString()} MAD
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-2 block">
                {fleetExpenses.chargesCount} Opérations déclarées
              </span>
            </div>
          </div>

          {/* Inline detailed transactions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historique Récent Flotte</h3>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
              {fleetExpenses.filteredTickets.map(t => (
                <div key={t.id} className="flex justify-between items-center p-2.5 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-all border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <div>
                      <p className="font-bold text-slate-700">{t.reference || `Ticket ${t.id.slice(0,5)}`}</p>
                      <p className="text-[9px] text-slate-400 font-mono">Véhicule: {t.vehiculeId} • Vol: {t.volume}L</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900">{t.coutTotal.toLocaleString()} MAD</span>
                </div>
              ))}
              
              {fleetExpenses.filteredCharges.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2.5 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-all border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <div>
                      <p className="font-bold text-slate-700">{c.description || 'Charge Variable'}</p>
                      <p className="text-[9px] text-slate-400 font-mono">Véhicule: {c.vehiculeId}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900">{c.montant.toLocaleString()} MAD</span>
                </div>
              ))}

              {fleetExpenses.ticketsCount === 0 && fleetExpenses.chargesCount === 0 && (
                <p className="text-center text-slate-400 py-6 italic text-[11px]">Aucune dépense de flotte enregistrée ce mois-ci.</p>
              )}
            </div>
          </div>
        </div>

        {/* Stream 2: Driver Sales & Comptoir Stock */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Flame className="w-4 h-4" /></span>
              Ventes & Trésorerie Ventes Gaz
            </h2>
            <span className="text-xs font-bold bg-amber-100 px-2.5 py-1 rounded-full text-amber-800">
              Chiffre d'Affaires
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Ventes Chauffeurs</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {salesAnalysis.driverSalesTotal.toLocaleString()} MAD
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-2 block">
                Livraisons en tournée active
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Ventes Comptoir</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {salesAnalysis.comptoirSalesTotal.toLocaleString()} MAD
                </span>
              </div>
              
              {/* Comptoir Stock levels progress widget */}
              <div className="mt-3 border-t border-slate-200 pt-2">
                <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Cylindres en Comptoir</span>
                <div className="flex gap-1.5">
                  <div className="flex-1 bg-emerald-50 px-1.5 py-1 rounded-lg text-center">
                    <span className="block text-[8px] font-bold text-emerald-800 uppercase">Pleins</span>
                    <span className="text-xs font-black text-emerald-600">
                      {comptoirStock.reduce((acc, c) => acc + (c.full || 0), 0)}
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-100 px-1.5 py-1 rounded-lg text-center">
                    <span className="block text-[8px] font-bold text-slate-800 uppercase">Vides</span>
                    <span className="text-xs font-black text-slate-600">
                      {comptoirStock.reduce((acc, c) => acc + (c.empty || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modes de Règlement Collectés</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/50">
                <span className="block text-[9px] font-bold text-emerald-700 uppercase">Espèces</span>
                <span className="text-sm font-black text-emerald-800 block mt-1">
                  {salesAnalysis.paymentBreakdown.espece.toLocaleString()} MAD
                </span>
              </div>
              <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100/50">
                <span className="block text-[9px] font-bold text-sky-700 uppercase">Chèque</span>
                <span className="text-sm font-black text-sky-800 block mt-1">
                  {salesAnalysis.paymentBreakdown.cheque.toLocaleString()} MAD
                </span>
              </div>
              <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/50">
                <span className="block text-[9px] font-bold text-amber-700 uppercase">Crédit Client</span>
                <span className="text-sm font-black text-amber-800 block mt-1">
                  {salesAnalysis.paymentBreakdown.credit.toLocaleString()} MAD
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Stream 3: HR Salaries & Commission payouts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Users className="w-4 h-4" /></span>
              Médiation Payroll & Charges Sociales
            </h2>
            <span className="text-xs font-bold bg-emerald-100 px-2.5 py-1 rounded-full text-emerald-800">
              Ressources Humaines
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Commissions versées ce mois
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {salaryAnalysis.totalPayrollPaid.toLocaleString()} MAD
              </p>
            </div>
            <div className="text-right">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                {salaryAnalysis.slipsCount} Fiches enregistrées
              </span>
            </div>
          </div>

          {/* List of driver payroll items */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fiches individuelles calculées</h3>
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1 text-xs">
              {salaryAnalysis.filteredSlips.map(slip => {
                const drv = drivers.find(d => d.id === slip.driverId);
                const completeName = drv ? `${drv.prenom} ${drv.nom}` : 'Utilisateur';
                return (
                  <div key={slip.id} className="flex justify-between items-center p-2.5 bg-slate-50/50 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">{completeName}</p>
                      <p className="text-[9px] text-slate-400 font-mono">Générée le: {new Date(slip.generatedAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-extrabold text-emerald-600">+{slip.totalCommission.toLocaleString()} MAD</span>
                  </div>
                );
              })}
              {salaryAnalysis.slipsCount === 0 && (
                <p className="text-center text-slate-400 py-6 italic text-[11px]">Aucune fiche de paie clôturée pour ce mois.</p>
              )}
            </div>
          </div>
        </div>

        {/* Stream 4: Commande gaz (Purchase supply cost) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><ShoppingCart className="w-4 h-4" /></span>
              Achats Bruts Vivo Energy
            </h2>
            <span className="text-xs font-bold bg-purple-100 px-2.5 py-1 rounded-full text-purple-800">
              Commande Gaz
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Facturé Vivo</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {supplyOrdersAnalysis.totalPurchaseCost.toLocaleString()} MAD
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-1">
                {supplyOrdersAnalysis.orderCount} Approvisionnements
              </span>
            </div>

            <div className="bg-[#0B1120] text-white p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Reste À Payer</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">
                  {supplyOrdersAnalysis.unpaidPurchaseCost.toLocaleString()} MAD
                </span>
              </div>
              <div className="text-[9px] text-slate-400 mt-2 select-none">
                Vivo Energy Direct Invoices
              </div>
            </div>
          </div>

          {/* List of orders */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bons de Commande Vivo Recueillis</h3>
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1 text-xs">
              {supplyOrdersAnalysis.filteredCommandes.map(cmd => (
                <div key={cmd.id} className="flex justify-between items-center p-2.5 bg-slate-50/50 rounded-xl hover:bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-700">Fournisseur: {cmd.supplierId || 'Vivo Energy'}</p>
                    <p className="text-[9px] text-slate-400 font-mono">Date: {new Date(cmd.date).toLocaleDateString()} • Qty: {cmd.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-900">{cmd.totalPrice.toLocaleString()} MAD</p>
                    <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded-md mt-1 ${
                      cmd.status === 'payé' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {cmd.status === 'payé' ? 'RÉGLÉ' : 'À PAYER'}
                    </span>
                  </div>
                </div>
              ))}
              {supplyOrdersAnalysis.orderCount === 0 && (
                <p className="text-center text-slate-400 py-6 italic text-[11px]">Aucun bon d'approvisionnement détecté.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* COMPTABILITÉ CORRESPONDENCE UPLOAD & ARCHIVES (Admin + accountant) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              Archives & Correspondances Comptables
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Plateforme d'échange de pièces justificatives (Factures, bons de commande, bons de livraison) partagé directement avec le comptable.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700">
              Accès: {user?.role === 'comptable' ? 'Cabinet Comptable (Lecture/Dépôt)' : 'Trésorerie Administrateur (Master)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Document Upload Form */}
          <div className="bg-slate-50/60 border border-slate-200/60 p-6 rounded-3xl space-y-6 h-fit">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Plus className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase">Déposer une Pièce</h3>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Type de document *</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-200/60 p-1.5 rounded-xl">
                  {(['facture', 'bon_commande', 'bon_livraison'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormType(t)}
                      className={`py-2 text-[10px] font-black rounded-lg transition-all uppercase ${
                        formType === t 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
                      }`}
                    >
                      {t === 'facture' ? 'Facture' : t === 'bon_commande' ? 'B. Commande' : 'B. Livraison'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">Numéro / Référence *</label>
                <input
                  type="text"
                  required
                  value={formRef}
                  onChange={(e) => setFormRef(e.target.value)}
                  placeholder="ex: FACT-2026-641"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">Date d'édition *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">Montant (MAD) *</label>
                  <input
                    type="number"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="Montant net"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">Notes & Observations (Facultatif)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Mentionnez le fournisseur, chauffeur ou projet..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              {/* Real Drag & Drop simulated selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Joindre le Fichier Numerisé *</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer relative group ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/10'
                  }`}
                >
                  <input 
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                    {uploadedFile ? (
                      <div className="text-slate-700 font-bold max-w-full truncate text-[10px]">
                        Fichier sélectionné : <span className="text-indigo-600 block truncate">{uploadedFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-600 font-bold text-[10px]">Glissez-déposez le document scanner ici</p>
                        <p className="text-slate-400 text-[9px] mt-1">ou cliquez pour parcourir les dossiers (PDF, PNG, JPG)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all uppercase tracking-wider text-xs"
              >
                Transmettre au Cabinet
              </button>

            </form>
          </div>

          {/* Column 2 & 3: Uploaded Archive Table / Viewer */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Search & filters tools */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher par référence ou notes..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Filtrer:</span>
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Tous les types</option>
                  <option value="facture">Factures uniquement</option>
                  <option value="bon_commande">Bons de Commande</option>
                  <option value="bon_livraison">Bons de Livraison</option>
                </select>
              </div>
            </div>

            {/* Document List */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[9px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Type & Réf</th>
                      <th className="px-6 py-3.5">Date Pièce</th>
                      <th className="px-6 py-3.5 text-right">Montant</th>
                      <th className="px-6 py-3.5">Nom de fichier</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[8px] uppercase ${
                              doc.type === 'facture' 
                                ? 'bg-red-50 text-red-700 border border-red-100' 
                                : doc.type === 'bon_commande' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {doc.type === 'facture' ? 'Facture' : doc.type === 'bon_commande' ? 'Commande' : 'Livraison'}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800">{doc.reference}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[120px]" title={doc.notes}>
                                {doc.notes || 'Sans description'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {new Date(doc.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                          {doc.amount.toLocaleString()} MAD
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-[11px] max-w-[150px] truncate" title={doc.fileName}>
                          {doc.fileName}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex gap-1.5 justify-end">
                            <button
                              onClick={() => simulateDownload(doc)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="Télécharger"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => {
                                  deleteComptaDocument(doc.id);
                                  toast.success('Document supprimé des archives.');
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-450 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredDocs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400 italic font-medium">
                          Aucune pièce justificative déposée correspondant aux critères.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Helpful accounting notice */}
            <div className="bg-blue-50/50 rounded-2xl border border-blue-100/50 p-4 leading-relaxed text-xs text-blue-800 flex gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
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
