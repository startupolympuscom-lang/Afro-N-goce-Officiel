import React, { useState, useMemo } from 'react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Wallet, 
  Building2, 
  Calendar, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  ShoppingBag, 
  FileCheck2, 
  Plus, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  XCircle,
  Truck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';

export default function DispatchRapportsPage() {
  const { 
    sales, 
    expenses, 
    drivers, 
    clients, 
    pointages, 
    brands,
    caisseSecuritaire,
    caisseNoir,
    caisseTransfers = [],
    caisseAlimentations = []
  } = useDispatchGazStore();

  const [activeTab, setActiveTab] = useState<'global' | 'sales' | 'rh' | 'caisse' | 'clients'>('global');
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('30days');

  // Filter helper based on selected time range
  const filterByTimeRange = (items: any[]): any[] => {
    if (timeRange === 'all') return items;
    const days = timeRange === '7days' ? 7 : 30;
    const limitDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return items.filter(item => item && item.date && new Date(item.date) >= limitDate);
  };

  // Dynamic Sales Metrics & Visuals
  const salesMetrics = useMemo(() => {
    const filteredSales = filterByTimeRange(sales);
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalQty = filteredSales.reduce((sum, s) => sum + s.quantity, 0);
    const avgBasket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
    const transactionsCount = filteredSales.length;

    // Daily Sales chart data
    const dailyDataMap: Record<string, { date: string; Afro: number; Chakirine: number; Total: number }> = {};
    filteredSales.forEach(s => {
      const dateStr = new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (!dailyDataMap[dateStr]) {
        dailyDataMap[dateStr] = { date: dateStr, Afro: 0, Chakirine: 0, Total: 0 };
      }
      const isAfro = !s.company || s.company === 'afro_negoce';
      if (isAfro) {
        dailyDataMap[dateStr].Afro += s.totalPrice;
      } else {
        dailyDataMap[dateStr].Chakirine += s.totalPrice;
      }
      dailyDataMap[dateStr].Total += s.totalPrice;
    });

    const salesTrend = Object.values(dailyDataMap).sort((a, b) => {
      // Simple string date sorting helper since they are DD/MM format
      const [dayA, monthA] = a.date.split('/');
      const [dayB, monthB] = b.date.split('/');
      return new Date(2026, parseInt(monthA) - 1, parseInt(dayA)).getTime() - 
             new Date(2026, parseInt(monthB) - 1, parseInt(dayB)).getTime();
    });

    // Product breakdown data
    const productMap: Record<string, { name: string; Qty: number; Revenue: number }> = {};
    filteredSales.forEach(s => {
      const brand = brands.find(b => b.id === s.brandId);
      const brandName = brand ? brand.name : s.brandId;
      const key = `${brandName} (${s.category})`;
      if (!productMap[key]) {
        productMap[key] = { name: key, Qty: 0, Revenue: 0 };
      }
      productMap[key].Qty += s.quantity;
      productMap[key].Revenue += s.totalPrice;
    });
    const productBreakdown = Object.values(productMap).sort((a, b) => b.Revenue - a.Revenue);

    // Company breakdown
    let companyAfroRevenue = 0;
    let companyChakirineRevenue = 0;
    let companyAfroQty = 0;
    let companyChakirineQty = 0;

    filteredSales.forEach(s => {
      const isAfro = !s.company || s.company === 'afro_negoce';
      if (isAfro) {
        companyAfroRevenue += s.totalPrice;
        companyAfroQty += s.quantity;
      } else {
        companyChakirineRevenue += s.totalPrice;
        companyChakirineQty += s.quantity;
      }
    });

    return {
      totalRevenue,
      totalQty,
      avgBasket,
      transactionsCount,
      salesTrend,
      productBreakdown,
      companies: [
        { name: 'Afro Négoce', revenue: companyAfroRevenue, qty: companyAfroQty },
        { name: 'Chakirine Gaz', revenue: companyChakirineRevenue, qty: companyChakirineQty }
      ]
    };
  }, [sales, brands, filterByTimeRange]);

  // Dynamic HR & Employee Performance Metrics
  const rhMetrics = useMemo(() => {
    const filteredSales = filterByTimeRange(sales);
    const filteredPointages = filterByTimeRange(pointages);

    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.status === 'actif').length;
    const totalPointagesCount = filteredPointages.length;

    // Performance per driver
    const driverPerformance = drivers.map(d => {
      const driverSales = filteredSales.filter(s => s.driverId === d.id);
      const revenue = driverSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const qty = driverSales.reduce((sum, s) => sum + s.quantity, 0);
      const salesCount = driverSales.length;
      const pointagesCount = filteredPointages.filter(p => p.driverId === d.id).length;

      return {
        id: d.id,
        name: `${d.prenom} ${d.nom}`,
        company: d.company === 'afro_negoce' ? 'Afro' : 'Chakirine',
        revenue,
        qty,
        salesCount,
        pointagesCount
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const topDriver = driverPerformance.length > 0 ? driverPerformance[0] : null;

    return {
      totalDrivers,
      activeDrivers,
      totalPointagesCount,
      topDriver,
      driverPerformance
    };
  }, [drivers, sales, pointages, filterByTimeRange]);

  // Dynamic Cash & Treasury Metrics
  const caisseMetrics = useMemo(() => {
    const filteredSales = filterByTimeRange(sales);
    const filteredExpenses = filterByTimeRange(expenses);
    const filteredAlimentations = filterByTimeRange(caisseAlimentations);
    const filteredTransfers = filterByTimeRange(caisseTransfers);

    const cashSales = filteredSales.filter(s => s.paymentMethod === 'espece');
    const chequeSales = filteredSales.filter(s => s.paymentMethod === 'cheque');
    const creditPaidSales = filteredSales.filter(s => s.paymentMethod === 'credit' && s.status === 'payé');

    const totalInflowSales = cashSales.reduce((sum, s) => sum + s.totalPrice, 0) + 
                             chequeSales.reduce((sum, s) => sum + s.totalPrice, 0) + 
                             creditPaidSales.reduce((sum, s) => sum + s.totalPrice, 0);

    const totalInflowAlimentations = filteredAlimentations.reduce((sum, a) => sum + a.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTransfers = filteredTransfers.reduce((sum, t) => sum + t.amount, 0);

    const totalInflows = totalInflowSales + totalInflowAlimentations;
    const totalOutflows = totalExpenses + totalTransfers;
    const netCashFlow = totalInflows - totalOutflows;

    // Inflows vs Outflows chart data
    const flowMap: Record<string, { date: string; Entrées: number; Sorties: number }> = {};
    
    // Add sales inflows
    filteredSales.forEach(s => {
      const dateStr = new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (!flowMap[dateStr]) flowMap[dateStr] = { date: dateStr, Entrées: 0, Sorties: 0 };
      if (s.paymentMethod === 'espece' || s.paymentMethod === 'cheque' || (s.paymentMethod === 'credit' && s.status === 'payé')) {
        flowMap[dateStr].Entrées += s.totalPrice;
      }
    });

    // Add alimentations
    filteredAlimentations.forEach(a => {
      const dateStr = new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (!flowMap[dateStr]) flowMap[dateStr] = { date: dateStr, Entrées: 0, Sorties: 0 };
      flowMap[dateStr].Entrées += a.amount;
    });

    // Add expenses
    filteredExpenses.forEach(e => {
      const dateStr = new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (!flowMap[dateStr]) flowMap[dateStr] = { date: dateStr, Entrées: 0, Sorties: 0 };
      flowMap[dateStr].Sorties += e.amount;
    });

    // Add transfers
    filteredTransfers.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (!flowMap[dateStr]) flowMap[dateStr] = { date: dateStr, Entrées: 0, Sorties: 0 };
      flowMap[dateStr].Sorties += t.amount;
    });

    const flowData = Object.values(flowMap).sort((a, b) => {
      const [dayA, monthA] = a.date.split('/');
      const [dayB, monthB] = b.date.split('/');
      return new Date(2026, parseInt(monthA) - 1, parseInt(dayA)).getTime() - 
             new Date(2026, parseInt(monthB) - 1, parseInt(dayB)).getTime();
    });

    // Expense breakdown by reason / category
    const expenseBreakdownMap: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const key = e.reason || 'Dépense Diverse';
      expenseBreakdownMap[key] = (expenseBreakdownMap[key] || 0) + e.amount;
    });
    const expenseBreakdown = Object.entries(expenseBreakdownMap).map(([name, value]) => ({
      name,
      Montant: value
    })).sort((a, b) => b.Montant - a.Montant);

    return {
      caisseSecuritaire,
      caisseNoir,
      totalInflows,
      totalOutflows,
      netCashFlow,
      flowData,
      expenseBreakdown
    };
  }, [sales, expenses, caisseAlimentations, caisseTransfers, caisseSecuritaire, caisseNoir, filterByTimeRange]);

  // Dynamic Clients & Credit Metrics
  const clientsMetrics = useMemo(() => {
    const filteredSales = filterByTimeRange(sales);
    const totalClientsCount = clients.length;

    let totalGlobalCredit = 0;
    let totalGlobalPaid = 0;
    let totalGlobalInvoiced = 0;

    // Client situation table
    const clientPerformance = clients.map(c => {
      const clientSales = filteredSales.filter(s => s.clientId === c.id);
      const totalSales = clientSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const totalQty = clientSales.reduce((sum, s) => sum + s.quantity, 0);
      
      const paidSales = clientSales.filter(s => s.paymentMethod !== 'credit' || s.status === 'payé');
      const creditSales = clientSales.filter(s => s.paymentMethod === 'credit' && s.status !== 'payé');
      const invoicedSales = clientSales.filter(s => s.isFactured);

      const paidAmount = paidSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const creditAmount = creditSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const invoicedAmount = invoicedSales.reduce((sum, s) => sum + s.totalPrice, 0);

      totalGlobalCredit += creditAmount;
      totalGlobalPaid += paidAmount;
      totalGlobalInvoiced += invoicedAmount;

      return {
        id: c.id,
        name: c.name,
        totalSales,
        totalQty,
        paidAmount,
        creditAmount,
        invoicedAmount
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    // Filter top clients with credit for histograms
    const topCreditClients = [...clientPerformance]
      .filter(c => c.creditAmount > 0)
      .sort((a, b) => b.creditAmount - a.creditAmount)
      .slice(0, 10);

    const topSalesClients = [...clientPerformance]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);

    return {
      totalClientsCount,
      totalGlobalCredit,
      totalGlobalPaid,
      totalGlobalInvoiced,
      clientPerformance,
      topCreditClients,
      topSalesClients
    };
  }, [clients, sales, filterByTimeRange]);

  // Global consolidated dashboard metrics
  const globalMetrics = useMemo(() => {
    const salesTotal = salesMetrics.totalRevenue;
    const expensesTotal = caisseMetrics.totalOutflows;
    const netResult = salesTotal - expensesTotal;
    const outstandingCredit = clientsMetrics.totalGlobalCredit;
    
    // Performance comparison Afro vs Chakirine
    const comparisonData = [
      {
        name: 'AFRO NÉGOCE',
        Ventes: salesMetrics.companies[0].revenue,
        Crédit: clientsMetrics.clientPerformance.reduce((sum, c) => {
          // simple approximation: credit belongs to corporate source if client is linked to that company's sales
          const clientSales = sales.filter(s => s.clientId === c.id && (!s.company || s.company === 'afro_negoce'));
          return sum + clientSales.filter(s => s.paymentMethod === 'credit' && s.status !== 'payé').reduce((total, s) => total + s.totalPrice, 0);
        }, 0),
        Volume: salesMetrics.companies[0].qty * 10 // scale for visual representation
      },
      {
        name: 'CHAKIRINE GAZ',
        Ventes: salesMetrics.companies[1].revenue,
        Crédit: clientsMetrics.clientPerformance.reduce((sum, c) => {
          const clientSales = sales.filter(s => s.clientId === c.id && s.company === 'chakirine_gaz');
          return sum + clientSales.filter(s => s.paymentMethod === 'credit' && s.status !== 'payé').reduce((total, s) => total + s.totalPrice, 0);
        }, 0),
        Volume: salesMetrics.companies[1].qty * 10
      }
    ];

    return {
      salesTotal,
      expensesTotal,
      netResult,
      outstandingCredit,
      comparisonData
    };
  }, [salesMetrics, caisseMetrics, clientsMetrics, sales]);

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100 flex flex-col gap-6" id="dispatch-reports-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl" id="reports-header-section">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            Rapports Analytiques & KPIs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Visualisez les performances commerciales, la comptabilité, les RH et la situation client de Afro Négoce & Chakirine.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800" id="reports-time-filters">
          <button
            onClick={() => setTimeRange('7days')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              timeRange === '7days' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            7 Jours
          </button>
          <button
            onClick={() => setTimeRange('30days')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              timeRange === '30days' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            30 Jours
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              timeRange === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      {/* Tabs / Sub pages */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3" id="reports-subpages-tabs">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition-all ${
            activeTab === 'global' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Layers className="w-4 h-4" />
          Rapport Global
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition-all ${
            activeTab === 'sales' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Rapport de Vente
        </button>
        <button
          onClick={() => setActiveTab('rh')}
          className={`px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition-all ${
            activeTab === 'rh' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          Rapport RH
        </button>
        <button
          onClick={() => setActiveTab('caisse')}
          className={`px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition-all ${
            activeTab === 'caisse' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Rapport Caisse
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition-all ${
            activeTab === 'clients' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Rapport Clients
        </button>
      </div>

      {/* ==================== 1. GLOBAL SYNTHESIS REPORT ==================== */}
      {activeTab === 'global' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200" id="global-report-tab">
          {/* Global KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="global-kpis-grid">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Chiffre d'Affaires</span>
                <span className="text-xl font-black text-white block mt-1">{globalMetrics.salesTotal.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-green-400 font-bold flex items-center gap-0.5 mt-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Activité Commerciale
                </span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 border border-red-500/20">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dépenses & Flux Sortants</span>
                <span className="text-xl font-black text-white block mt-1">{globalMetrics.expensesTotal.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Frais et virements caisse</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Résultat Net Restant</span>
                <span className={`text-xl font-black block mt-1 ${globalMetrics.netResult >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {globalMetrics.netResult.toLocaleString('fr-FR')} MAD
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Rentabilité théorique</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 border border-orange-500/20">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Crédits Clients Actuels</span>
                <span className="text-xl font-black text-white block mt-1">{globalMetrics.outstandingCredit.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-orange-400 font-bold block mt-0.5">
                  Reste à recouvrer ({((globalMetrics.outstandingCredit / (globalMetrics.salesTotal || 1)) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Visual Histogram comparison: AFRO vs CHAKIRINE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="global-charts-grid">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    Comparatif Corporate: AFRO vs CHAKIRINE
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Situation des ventes, crédit et volume comparés</p>
                </div>
              </div>
              
              <div className="h-80" id="global-corporate-comparison-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={globalMetrics.comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Ventes" name="Chiffre d'Affaires (MAD)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Crédit" name="Crédit Client (MAD)" fill="#f97316" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Volume" name="Volume d'activité (x10)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Department Summary Cards */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-500" />
                  Performances par Département
                </h3>
                <div className="space-y-4">
                  {/* Sales summary line */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Commercial / Vente</span>
                        <span className="text-[10px] text-slate-400">{salesMetrics.transactionsCount} transactions enregistrées</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-white block">{salesMetrics.totalQty} bouteilles</span>
                      <span className="text-[10px] font-bold text-blue-400">{salesMetrics.totalRevenue.toLocaleString('fr-FR')} MAD</span>
                    </div>
                  </div>

                  {/* HR summary line */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Equipes & RH</span>
                        <span className="text-[10px] text-slate-400">{rhMetrics.activeDrivers} chauffeurs actifs</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-white block">Top: {rhMetrics.topDriver?.name || 'N/A'}</span>
                      <span className="text-[10px] text-purple-400 font-bold">{rhMetrics.topDriver?.revenue.toLocaleString('fr-FR') || '0'} MAD</span>
                    </div>
                  </div>

                  {/* Treasury summary line */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Caisse & Trésorerie</span>
                        <span className="text-[10px] text-slate-400">Total entrées caisse</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-white block">Solde: {(caisseSecuritaire + caisseNoir).toLocaleString('fr-FR')} MAD</span>
                      <span className="text-[10px] text-emerald-400 font-bold">+{caisseMetrics.totalInflows.toLocaleString('fr-FR')} MAD</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium">Situation consolidée pour les derniers {timeRange === '7days' ? '7 jours' : timeRange === '30days' ? '30 jours' : 'enregistrements'}</span>
                <span className="text-xs text-blue-400 font-bold cursor-pointer hover:underline" onClick={() => setActiveTab('sales')}>Voir détails →</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. SALES REPORT ==================== */}
      {activeTab === 'sales' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200" id="sales-report-tab">
          {/* Sales KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="sales-kpis-grid">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Chiffre d'Affaires</span>
                <span className="text-xl font-black text-white block mt-1">{salesMetrics.totalRevenue.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Revenu cumulé</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Volume de Bouteilles</span>
                <span className="text-xl font-black text-white block mt-1">{salesMetrics.totalQty} Unités</span>
                <span className="text-[10px] text-indigo-400 font-bold mt-0.5 block">Ventes de gaz</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Panier Moyen</span>
                <span className="text-xl font-black text-white block mt-1">{salesMetrics.avgBasket.toFixed(2)} MAD</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Par transaction</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transactions</span>
                <span className="text-xl font-black text-white block mt-1">{salesMetrics.transactionsCount} Ventes</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Bons émis</span>
              </div>
            </div>
          </div>

          {/* Charts Histogram */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="sales-charts-grid">
            {/* Sales Trend Histogram */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Évolution Temporelle des Ventes
              </h3>
              <div className="h-80" id="sales-trend-recharts">
                {salesMetrics.salesTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">Aucune donnée disponible</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesMetrics.salesTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Afro" name="Afro Négoce (MAD)" fill="#f97316" stackId="a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Chakirine" name="Chakirine Gaz (MAD)" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Product breakdown chart */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                Ventes par Marque & Catégorie de Bouteille
              </h3>
              <div className="h-80" id="sales-product-recharts">
                {salesMetrics.productBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">Aucune donnée disponible</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesMetrics.productBreakdown} layout="vertical" margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#64748b" fontSize={10} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Revenue" name="Chiffre d'Affaires (MAD)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 3. HR REPORT ==================== */}
      {activeTab === 'rh' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200" id="rh-report-tab">
          {/* HR KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="rh-kpis-grid">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Chauffeurs Enregistrés</span>
                <span className="text-xl font-black text-white block mt-1">{rhMetrics.totalDrivers} Drivers</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Effectif total</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400 border border-green-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Effectif Actif</span>
                <span className="text-xl font-black text-white block mt-1">{rhMetrics.activeDrivers} Actifs</span>
                <span className="text-[10px] text-green-400 font-bold block mt-0.5">En service</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pointages Enregistrés</span>
                <span className="text-xl font-black text-white block mt-1">{rhMetrics.totalPointagesCount} Présences</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Sur la période</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Meilleur Performeur</span>
                <span className="text-xl font-black text-white truncate max-w-[150px] block mt-1">{rhMetrics.topDriver?.name || 'N/A'}</span>
                <span className="text-[10px] text-amber-400 font-bold block mt-0.5">Chauffeur</span>
              </div>
            </div>
          </div>

          {/* Driver performance graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="rh-charts-grid">
            {/* Revenue Generated Per Driver */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Chiffre d'Affaires Généré par Chauffeur
              </h3>
              <div className="h-80" id="rh-revenue-driver-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rhMetrics.driverPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="revenue" name="Ventes Générées (MAD)" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {rhMetrics.driverPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.company === 'Afro' ? '#f97316' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quantity of bottles sold per Driver */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                Volumes Livrés (Bouteilles vendues) par Chauffeur
              </h3>
              <div className="h-80" id="rh-qty-driver-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rhMetrics.driverPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="qty" name="Quantité Vendue (Bouteilles)" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                      {rhMetrics.driverPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.company === 'Afro' ? '#fdba74' : '#6ee7b7'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Attendance and Sales summary table */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800" id="rh-summary-table-section">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              Tableau d'activité des Chauffeurs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase">Chauffeur</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase">Société</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-center">Présences</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-center">Transactions</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-right">Bouteilles Vendues</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-right">C.A. Généré</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rhMetrics.driverPerformance.map((d, index) => (
                    <tr key={d.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 text-sm font-semibold text-white">{d.name}</td>
                      <td className="py-3 px-4 text-xs">
                        {d.company === 'Afro' ? (
                          <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase">AFRO</span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase">CHAKIRINE</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-center font-bold text-indigo-400">{d.pointagesCount} jours</td>
                      <td className="py-3 px-4 text-sm text-center text-slate-300">{d.salesCount} ventes</td>
                      <td className="py-3 px-4 text-sm text-right font-black text-slate-100">{d.qty}</td>
                      <td className="py-3 px-4 text-sm text-right font-bold text-emerald-400">{d.revenue.toLocaleString('fr-FR')} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. CAISSE / TREASURY REPORT ==================== */}
      {activeTab === 'caisse' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200" id="caisse-report-tab">
          {/* Caisse KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="caisse-kpis-grid">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Caisse Sécuritaire</span>
                <span className="text-xl font-black text-white block mt-1">{caisseMetrics.caisseSecuritaire.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Solde officiel</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Caisse Interne / Noir</span>
                <span className="text-xl font-black text-white block mt-1">{caisseMetrics.caisseNoir.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Solde d'exploitation</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400 border border-green-500/20">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Flux Entrants Totaux</span>
                <span className="text-xl font-black text-white block mt-1">+{caisseMetrics.totalInflows.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-green-400 font-bold block mt-0.5">Ventes encaissées & alim.</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 border border-red-500/20">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Flux Sortants Totaux</span>
                <span className="text-xl font-black text-white block mt-1">-{caisseMetrics.totalOutflows.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Dépenses et virements</span>
              </div>
            </div>
          </div>

          {/* Cashflow visual graph */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="caisse-charts-grid">
            {/* Entrées vs Sorties Temporelles */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Flux Financiers: Entrées vs Sorties
              </h3>
              <div className="h-80" id="caisse-flow-trend-chart">
                {caisseMetrics.flowData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">Aucun flux sur cette période</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={caisseMetrics.flowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Entrées" name="Entrées de Caisse (MAD)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Sorties" name="Sorties / Dépenses (MAD)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Expenses Breakdown */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-red-400" />
                Répartition des Charges & Dépenses
              </h3>
              <div className="h-80" id="caisse-expenses-recharts">
                {caisseMetrics.expenseBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">Aucune dépense enregistrée</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={caisseMetrics.expenseBreakdown} layout="vertical" margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#64748b" fontSize={10} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={120} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Montant" name="Charges en MAD" fill="#f87171" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 5. CLIENTS SITUATION REPORT ==================== */}
      {activeTab === 'clients' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200" id="clients-report-tab">
          {/* Clients KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="clients-kpis-grid">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Clients Enregistrés</span>
                <span className="text-xl font-black text-white block mt-1">{clientsMetrics.totalClientsCount} Clients</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Portefeuille client</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 border border-red-500/20">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Crédit Client Global</span>
                <span className="text-xl font-black text-white block mt-1">{clientsMetrics.totalGlobalCredit.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-red-400 font-bold block mt-0.5">Reste à recouvrer</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400 border border-green-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Paiements Reçus</span>
                <span className="text-xl font-black text-white block mt-1">{clientsMetrics.totalGlobalPaid.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-green-400 font-bold block mt-0.5">Encaissé</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Chiffre Facturé</span>
                <span className="text-xl font-black text-white block mt-1">{clientsMetrics.totalGlobalInvoiced.toLocaleString('fr-FR')} MAD</span>
                <span className="text-[10px] text-indigo-400 font-bold block mt-0.5">
                  ({((clientsMetrics.totalGlobalInvoiced / (clientsMetrics.clientPerformance.reduce((s,c)=>s+c.totalSales,0) || 1)) * 100).toFixed(1)}% du total)
                </span>
              </div>
            </div>
          </div>

          {/* Charts Histogram */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="clients-charts-grid">
            {/* Top Creditor Clients Histogram */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-red-400" />
                Top 10 Clients Débiteurs (Crédit en MAD)
              </h3>
              <div className="h-80" id="clients-credit-histogram">
                {clientsMetrics.topCreditClients.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">Aucun crédit client actuellement</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientsMetrics.topCreditClients} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="creditAmount" name="Crédit restant à recouvrer (MAD)" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top Buyer Clients Histogram */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Top 10 Clients Acheteurs (Volume & CA)
              </h3>
              <div className="h-80" id="clients-sales-histogram">
                {clientsMetrics.topSalesClients.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500">Aucune vente enregistrée</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientsMetrics.topSalesClients} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="totalSales" name="Chiffre d'Affaires (MAD)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="paidAmount" name="Montant Encaissé (MAD)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Client Situation Table */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800" id="clients-table-section">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Situation Complète des Comptes Clients
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase">Client</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-center">Bouteilles Achetées</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-right">Chiffre d'Affaires</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-right">Total Encaissé</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-right">Crédit Débiteur</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase text-right">Montant Facturé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {clientsMetrics.clientPerformance.map((c, index) => (
                    <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 text-sm font-semibold text-white">{c.name}</td>
                      <td className="py-3 px-4 text-sm text-center text-slate-300 font-bold">{c.totalQty}</td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-white">{c.totalSales.toLocaleString('fr-FR')} MAD</td>
                      <td className="py-3 px-4 text-sm text-right text-emerald-400 font-medium">{c.paidAmount.toLocaleString('fr-FR')} MAD</td>
                      <td className={`py-3 px-4 text-sm text-right font-black ${c.creditAmount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {c.creditAmount > 0 ? `${c.creditAmount.toLocaleString('fr-FR')} MAD` : 'Aucun'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-indigo-400 font-medium">{c.invoicedAmount.toLocaleString('fr-FR')} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
