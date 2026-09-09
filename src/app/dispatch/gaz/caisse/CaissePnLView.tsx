import React, { useState, useMemo } from 'react';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Calendar, 
  Filter, 
  Printer, 
  Download, 
  Users, 
  Building2, 
  PieChart, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { formatMAD } from '../../../../lib/formatters';

interface CaissePnLViewProps {
  initialCompany?: 'afro_negoce' | 'chakirine_gaz';
}

export function CaissePnLView({ initialCompany = 'afro_negoce' }: CaissePnLViewProps) {
  const { 
    sales = [], 
    expenses = [], 
    drivers = [], 
    caisseAlimentations = [], 
    brands = [] 
  } = useDispatchGazStore();

  const [companyFilter, setCompanyFilter] = useState<'all' | 'afro_negoce' | 'chakirine_gaz'>(initialCompany);
  const [periodFilter, setPeriodFilter] = useState<'today' | 'month' | 'year' | 'all' | 'custom'>('month');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM
  const currentYearStr = todayStr.slice(0, 4);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [customStart, setCustomStart] = useState(todayStr);
  const [customEnd, setCustomEnd] = useState(todayStr);
  const [activeSubTab, setActiveSubTab] = useState<'table' | 'drivers' | 'expenses'>('table');

  // Filter functions
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const itemDate = dateStr.slice(0, 10);
    if (periodFilter === 'today') return itemDate === todayStr;
    if (periodFilter === 'month') return itemDate.startsWith(selectedMonth);
    if (periodFilter === 'year') return itemDate.startsWith(currentYearStr);
    if (periodFilter === 'all') return true;
    if (periodFilter === 'custom') {
      return itemDate >= customStart && itemDate <= customEnd;
    }
    return true;
  };

  const getCompanyForSale = (sale: any) => {
    if (sale.company) return sale.company;
    const d = drivers.find(drv => drv.id === sale.driverId);
    return d?.company || 'afro_negoce';
  };

  const getCompanyForExpense = (exp: any) => {
    if (exp.company) return exp.company;
    const d = drivers.find(drv => drv.id === exp.driverId);
    return d?.company || 'afro_negoce';
  };

  const getCompanyForAlimentation = (alim: any) => {
    return alim.company || 'afro_negoce';
  };

  // Filtered collections
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (!isDateInRange(s.date)) return false;
      if (companyFilter !== 'all' && getCompanyForSale(s) !== companyFilter) return false;
      return true;
    });
  }, [sales, periodFilter, selectedMonth, customStart, customEnd, companyFilter, drivers]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!isDateInRange(e.date)) return false;
      if (companyFilter !== 'all' && getCompanyForExpense(e) !== companyFilter) return false;
      return true;
    });
  }, [expenses, periodFilter, selectedMonth, customStart, customEnd, companyFilter, drivers]);

  const filteredAlimentations = useMemo(() => {
    return (caisseAlimentations || []).filter(a => {
      if (!isDateInRange(a.date)) return false;
      if (companyFilter !== 'all' && getCompanyForAlimentation(a) !== companyFilter) return false;
      return true;
    });
  }, [caisseAlimentations, periodFilter, selectedMonth, customStart, customEnd, companyFilter]);

  // Calculations for Sales (Revenue)
  const salesByCategory = useMemo(() => {
    const map: Record<string, { qty: number; total: number; count: number }> = {
      '12Kg': { qty: 0, total: 0, count: 0 },
      '3Kg': { qty: 0, total: 0, count: 0 },
      '34Kg': { qty: 0, total: 0, count: 0 },
      'Autres': { qty: 0, total: 0, count: 0 }
    };

    filteredSales.forEach(s => {
      const cat = s.category === '12Kg' || s.category === '3Kg' || s.category === '34Kg' ? s.category : 'Autres';
      map[cat].qty += s.quantity || 0;
      map[cat].total += s.totalPrice || 0;
      map[cat].count += 1;
    });

    return map;
  }, [filteredSales]);

  const totalSalesRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.totalPrice || 0), 0);
  }, [filteredSales]);

  const totalBottlesSold = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.quantity || 0), 0);
  }, [filteredSales]);

  // Calculations for Alimentations
  const totalAlimentationsNormale = useMemo(() => {
    return filteredAlimentations
      .filter(a => a.type !== 'pret')
      .reduce((acc, a) => acc + (a.amount || 0), 0);
  }, [filteredAlimentations]);

  const totalPretsRecus = useMemo(() => {
    return filteredAlimentations
      .filter(a => a.type === 'pret')
      .reduce((acc, a) => acc + (a.amount || 0), 0);
  }, [filteredAlimentations]);

  const totalProduitsEtEntrees = totalSalesRevenue + totalAlimentationsNormale + totalPretsRecus;

  // Calculations for Expenses (Charges d'Exploitation)
  const expensesByCategory = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {
      'Carburant': { total: 0, count: 0 },
      'Entretien / Réparation': { total: 0, count: 0 },
      'Avance sur salaire': { total: 0, count: 0 },
      'Autres charges': { total: 0, count: 0 }
    };

    filteredExpenses.forEach(e => {
      const reason = e.reason || '';
      if (reason.toLowerCase().includes('carburant') || reason.toLowerCase().includes('gasoil')) {
        map['Carburant'].total += e.amount || 0;
        map['Carburant'].count += 1;
      } else if (reason.toLowerCase().includes('entretien') || reason.toLowerCase().includes('répar') || reason.toLowerCase().includes('repar') || reason.toLowerCase().includes('vidange') || reason.toLowerCase().includes('pneu')) {
        map['Entretien / Réparation'].total += e.amount || 0;
        map['Entretien / Réparation'].count += 1;
      } else if (reason.toLowerCase().includes('avance') || reason.toLowerCase().includes('salaire')) {
        map['Avance sur salaire'].total += e.amount || 0;
        map['Avance sur salaire'].count += 1;
      } else {
        map['Autres charges'].total += e.amount || 0;
        map['Autres charges'].count += 1;
      }
    });

    return map;
  }, [filteredExpenses]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [filteredExpenses]);

  // Financial Results (P&L)
  const margeBruteExploitation = totalSalesRevenue - totalExpenses;
  const tauxMargeBrute = totalSalesRevenue > 0 ? (margeBruteExploitation / totalSalesRevenue) * 100 : 0;

  const resultatNetGlobal = totalProduitsEtEntrees - totalExpenses;
  const tauxMargeNette = totalProduitsEtEntrees > 0 ? (resultatNetGlobal / totalProduitsEtEntrees) * 100 : 0;

  // Performance by Driver Breakdown
  const driverPerformance = useMemo(() => {
    const map: Record<string, {
      driver: any;
      salesCount: number;
      bottlesSold: number;
      revenue: number;
      expenses: number;
      netContribution: number;
    }> = {};

    drivers.forEach((d, idx) => {
      if (companyFilter !== 'all' && d.company !== companyFilter) return;
      const dKey = d.id || `driver_${idx}`;
      map[dKey] = {
        driver: d,
        salesCount: 0,
        bottlesSold: 0,
        revenue: 0,
        expenses: 0,
        netContribution: 0
      };
    });

    filteredSales.forEach((s, sIdx) => {
      const dKey = s.driverId || `sales_driver_${sIdx}`;
      if (!map[dKey]) {
        const found = drivers.find(d => d.id === s.driverId);
        map[dKey] = {
          driver: found || { id: dKey, nom: 'Chauffeur', prenom: `#${dKey}` },
          salesCount: 0,
          bottlesSold: 0,
          revenue: 0,
          expenses: 0,
          netContribution: 0
        };
      }
      map[dKey].salesCount += 1;
      map[dKey].bottlesSold += s.quantity || 0;
      map[dKey].revenue += s.totalPrice || 0;
    });

    filteredExpenses.forEach((e, eIdx) => {
      const dKey = e.driverId || `exp_driver_${eIdx}`;
      if (map[dKey]) {
        map[dKey].expenses += e.amount || 0;
      }
    });

    return Object.values(map)
      .map(item => ({
        ...item,
        netContribution: item.revenue - item.expenses,
        marginRate: item.revenue > 0 ? ((item.revenue - item.expenses) / item.revenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [drivers, filteredSales, filteredExpenses, companyFilter]);

  // Export CSV
  const handleExportCSV = () => {
    let csv = "POSTE COMPTABLE;CATEGORIE;QUANTITE / VOLUME;MONTANT (MAD);PART DU CA (%)\n";
    csv += `Ventes Gaz 12Kg;Revenus;${salesByCategory['12Kg'].qty};${salesByCategory['12Kg'].total};${totalSalesRevenue > 0 ? ((salesByCategory['12Kg'].total / totalSalesRevenue) * 100).toFixed(1) : '0'}%\n`;
    csv += `Ventes Gaz 3Kg;Revenus;${salesByCategory['3Kg'].qty};${salesByCategory['3Kg'].total};${totalSalesRevenue > 0 ? ((salesByCategory['3Kg'].total / totalSalesRevenue) * 100).toFixed(1) : '0'}%\n`;
    csv += `Ventes Gaz 34Kg;Revenus;${salesByCategory['34Kg'].qty};${salesByCategory['34Kg'].total};${totalSalesRevenue > 0 ? ((salesByCategory['34Kg'].total / totalSalesRevenue) * 100).toFixed(1) : '0'}%\n`;
    csv += `Autres Ventes Gaz;Revenus;${salesByCategory['Autres'].qty};${salesByCategory['Autres'].total};${totalSalesRevenue > 0 ? ((salesByCategory['Autres'].total / totalSalesRevenue) * 100).toFixed(1) : '0'}%\n`;
    csv += `TOTAL CHIFFRE AFFAIRES GAZ;;${totalBottlesSold};${totalSalesRevenue};100.0%\n`;
    csv += `Alimentations de Caisse;Produits;;${totalAlimentationsNormale};-\n`;
    csv += `Prêts et Emprunts reçus;Produits;;${totalPretsRecus};-\n`;
    csv += `TOTAL PRODUITS ET ENTREES (A);;;${totalProduitsEtEntrees};-\n`;
    csv += `Carburant & Lubrifiants;Charges;;${expensesByCategory['Carburant'].total};${totalSalesRevenue > 0 ? ((expensesByCategory['Carburant'].total / totalSalesRevenue) * 100).toFixed(1) : '0'}%\n`;
    csv += `Entretien & Réparations;Charges;;${expensesByCategory['Entretien / Réparation'].total};${totalSalesRevenue > 0 ? ((expensesByCategory['Entretien / Réparation'].total / totalSalesRevenue) * 100).toFixed(1) : '0'}%\n`;
    csv += `Avances sur salaires;Charges;;${expensesByCategory['Avance sur salaire'].total};${totalSalesRevenue > 0 ? ((expensesByCategory['Avance sur salaire'].total / totalSalesRevenue) * 100).toFixed(1) : '0'}%\n`;
    csv += `Autres Dépenses de Caisse;Charges;;${expensesByCategory['Autres charges'].total};${totalSalesRevenue > 0 ? ((expensesByCategory['Autres charges'].total / totalSalesRevenue) * 100).toFixed(1) : '0'}%\n`;
    csv += `TOTAL CHARGES ET SORTIES (B);;;${totalExpenses};${totalSalesRevenue > 0 ? ((totalExpenses / totalSalesRevenue) * 100).toFixed(1) : '0'}%\n`;
    csv += `MARGE BRUTE EXPLOITATION (CA - B);;;${margeBruteExploitation};${tauxMargeBrute.toFixed(1)}%\n`;
    csv += `RESULTAT NET GLOBAL (A - B);;;${resultatNetGlobal};${tauxMargeNette.toFixed(1)}%\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `P_and_L_${companyFilter}_${periodFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPeriodLabel = () => {
    if (periodFilter === 'today') return `Aujourd'hui (${todayStr})`;
    if (periodFilter === 'month') return `Mois de ${selectedMonth}`;
    if (periodFilter === 'year') return `Année ${currentYearStr}`;
    if (periodFilter === 'all') return 'Historique complet';
    return `Du ${customStart} au ${customEnd}`;
  };

  const getCompanyLabel = () => {
    if (companyFilter === 'afro_negoce') return 'Sté. Afro Négoce';
    if (companyFilter === 'chakirine_gaz') return 'Chakirine Gaz';
    return 'Consolidé (Afro Négoce & Chakirine Gaz)';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 print:hidden">
        
        {/* Left: Scope filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Company filter */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setCompanyFilter('afro_negoce')}
              className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                companyFilter === 'afro_negoce'
                  ? 'bg-blue-650 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Afro Négoce
            </button>
            <button
              type="button"
              onClick={() => setCompanyFilter('chakirine_gaz')}
              className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                companyFilter === 'chakirine_gaz'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chakirine Gaz
            </button>
            <button
              type="button"
              onClick={() => setCompanyFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                companyFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toutes (Global)
            </button>
          </div>

          {/* Period selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPeriodFilter('today')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                periodFilter === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                periodFilter === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Mois
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('year')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                periodFilter === 'year' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Année
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                periodFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tout
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('custom')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                periodFilter === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Personnalisé
            </button>
          </div>

          {/* Month picker when period is 'month' */}
          {periodFilter === 'month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {/* Custom Date Pickers */}
          {periodFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              />
              <span className="text-xs text-slate-400">à</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              />
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 w-full xl:w-auto justify-end">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            Imprimer P&L
          </button>
        </div>
      </div>

      {/* KPI Executive Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenues */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Chiffre d'Affaires Brut</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {totalSalesRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-400">MAD</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2 border-t border-slate-100 mt-2">
            <span>Volume vendu :</span>
            <span className="font-bold text-slate-800">{totalBottlesSold.toLocaleString()} bouteilles</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Charges & Sorties Caisse</span>
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-650 mb-1">
            {totalExpenses.toLocaleString()} <span className="text-xs font-bold text-slate-400">MAD</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2 border-t border-slate-100 mt-2">
            <span>Taux de charge :</span>
            <span className="font-bold text-red-600">
              {totalSalesRevenue > 0 ? ((totalExpenses / totalSalesRevenue) * 100).toFixed(1) : '0'}% du CA
            </span>
          </div>
        </div>

        {/* Marge Brute Opérationnelle */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Marge Brute (EBITDA)</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black mb-1 ${margeBruteExploitation >= 0 ? 'text-indigo-900' : 'text-red-600'}`}>
            {margeBruteExploitation.toLocaleString()} <span className="text-xs font-bold text-slate-400">MAD</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2 border-t border-slate-100 mt-2">
            <span>Taux de Marge Brute :</span>
            <span className={`font-bold ${tauxMargeBrute >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {tauxMargeBrute.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Résultat Net P&L */}
        <div className={`p-5 rounded-3xl border shadow-sm relative overflow-hidden group transition-all ${
          resultatNetGlobal >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-black tracking-widest uppercase ${
              resultatNetGlobal >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              Résultat Net Caisse (P&L)
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
              resultatNetGlobal >= 0 ? 'bg-emerald-200/80 text-emerald-900' : 'bg-red-200/80 text-red-900'
            }`}>
              {resultatNetGlobal >= 0 ? 'Bénéfice Net' : 'Perte Nette'}
            </span>
          </div>
          <div className={`text-2xl font-black mb-1 ${
            resultatNetGlobal >= 0 ? 'text-emerald-900' : 'text-red-900'
          }`}>
            {resultatNetGlobal.toLocaleString()} <span className="text-xs font-bold opacity-70">MAD</span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-200/60 mt-2">
            <span className="text-slate-600">Marge Nette :</span>
            <span className={resultatNetGlobal >= 0 ? 'text-emerald-700' : 'text-red-700'}>
              {tauxMargeNette.toFixed(1)}% du total
            </span>
          </div>
        </div>

      </div>

      {/* Sub tabs: Table principale vs Rentabilité par chauffeur vs Analyse des dépenses */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          type="button"
          onClick={() => setActiveSubTab('table')}
          className={`pb-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'table'
              ? 'border-blue-650 text-blue-650'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Tableau de Compte de Résultat (P&L)
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('drivers')}
          className={`pb-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'drivers'
              ? 'border-blue-650 text-blue-650'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Ventilation par Chauffeur ({driverPerformance.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('expenses')}
          className={`pb-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'expenses'
              ? 'border-blue-650 text-blue-650'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Structure des Coûts
        </button>
      </div>

      {/* Main Table View */}
      {activeSubTab === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 printable-pnl-sheet">
          
          {/* Official Document Header (Visible in print and screen) */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base">
                  PL
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    COMPTE DE RÉSULTAT DE CAISSE (P&L STATEMENT)
                  </h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    {getCompanyLabel()} • {getPeriodLabel()}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg font-mono font-bold text-slate-700">
                DEVISE: MAD (DIRHAM MAROCAIN)
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Généré le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 rounded-l-xl">Poste Comptable & Libellé</th>
                  <th className="p-3.5">Nature / Rubrique</th>
                  <th className="p-3.5 text-center">Quantité / Base</th>
                  <th className="p-3.5 text-right">Montant (MAD)</th>
                  <th className="p-3.5 text-right rounded-r-xl">Part du CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                
                {/* SECTION 1: REVENUS / PRODUITS */}
                <tr className="bg-blue-50/70">
                  <td colSpan={5} className="p-3 font-black text-blue-950 uppercase tracking-wider text-[11px]">
                    I. PRODUITS D'EXPLOITATION & REVENUS (FLUX ENTRANT)
                  </td>
                </tr>
                
                <tr>
                  <td className="p-3 pl-6 font-bold text-slate-800">
                    Ventes Gaz Bouteilles 12 Kg (Usage Domestique)
                  </td>
                  <td className="p-3 text-slate-500">Chiffre d'Affaires Gaz</td>
                  <td className="p-3 text-center font-bold text-slate-700">{salesByCategory['12Kg'].qty} Btl</td>
                  <td className="p-3 text-right font-black text-slate-900">{salesByCategory['12Kg'].total.toLocaleString()} MAD</td>
                  <td className="p-3 text-right font-semibold text-slate-500">
                    {totalSalesRevenue > 0 ? ((salesByCategory['12Kg'].total / totalSalesRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                <tr>
                  <td className="p-3 pl-6 font-bold text-slate-800">
                    Ventes Gaz Bouteilles 3 Kg (Petites Bouteilles)
                  </td>
                  <td className="p-3 text-slate-500">Chiffre d'Affaires Gaz</td>
                  <td className="p-3 text-center font-bold text-slate-700">{salesByCategory['3Kg'].qty} Btl</td>
                  <td className="p-3 text-right font-black text-slate-900">{salesByCategory['3Kg'].total.toLocaleString()} MAD</td>
                  <td className="p-3 text-right font-semibold text-slate-500">
                    {totalSalesRevenue > 0 ? ((salesByCategory['3Kg'].total / totalSalesRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                <tr>
                  <td className="p-3 pl-6 font-bold text-slate-800">
                    Ventes Gaz Bouteilles 34 Kg (Industrielles / Pro)
                  </td>
                  <td className="p-3 text-slate-500">Chiffre d'Affaires Gaz</td>
                  <td className="p-3 text-center font-bold text-slate-700">{salesByCategory['34Kg'].qty} Btl</td>
                  <td className="p-3 text-right font-black text-slate-900">{salesByCategory['34Kg'].total.toLocaleString()} MAD</td>
                  <td className="p-3 text-right font-semibold text-slate-500">
                    {totalSalesRevenue > 0 ? ((salesByCategory['34Kg'].total / totalSalesRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                {salesByCategory['Autres'].qty > 0 && (
                  <tr>
                    <td className="p-3 pl-6 font-bold text-slate-800">
                      Autres Ventes de Gaz & Produits Dérivés
                    </td>
                    <td className="p-3 text-slate-500">Chiffre d'Affaires Gaz</td>
                    <td className="p-3 text-center font-bold text-slate-700">{salesByCategory['Autres'].qty} Btl</td>
                    <td className="p-3 text-right font-black text-slate-900">{salesByCategory['Autres'].total.toLocaleString()} MAD</td>
                    <td className="p-3 text-right font-semibold text-slate-500">
                      {totalSalesRevenue > 0 ? ((salesByCategory['Autres'].total / totalSalesRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                )}

                {/* Subtotal Sales */}
                <tr className="bg-slate-100 font-black text-slate-900 border-t border-b border-slate-300">
                  <td className="p-3 pl-6 uppercase">SOUS-TOTAL CHIFFRE D'AFFAIRES GAZ (A1)</td>
                  <td className="p-3">Ventes chauffeurs & comptoir</td>
                  <td className="p-3 text-center">{totalBottlesSold} Btl</td>
                  <td className="p-3 text-right text-blue-700">{totalSalesRevenue.toLocaleString()} MAD</td>
                  <td className="p-3 text-right">100.0%</td>
                </tr>

                <tr>
                  <td className="p-3 pl-6 font-medium text-slate-700">
                    Alimentations ordinaires de Caisse (Hors-vente)
                  </td>
                  <td className="p-3 text-slate-500">Fonds propres / Apports</td>
                  <td className="p-3 text-center font-bold text-slate-700">{filteredAlimentations.filter(a => a.type !== 'pret').length} op.</td>
                  <td className="p-3 text-right font-bold text-emerald-700">+{totalAlimentationsNormale.toLocaleString()} MAD</td>
                  <td className="p-3 text-right text-slate-400">-</td>
                </tr>

                <tr>
                  <td className="p-3 pl-6 font-medium text-slate-700">
                    Prêts & Emprunts reçus en Caisse
                  </td>
                  <td className="p-3 text-slate-500">Financement court terme</td>
                  <td className="p-3 text-center font-bold text-slate-700">{filteredAlimentations.filter(a => a.type === 'pret').length} op.</td>
                  <td className="p-3 text-right font-bold text-amber-700">+{totalPretsRecus.toLocaleString()} MAD</td>
                  <td className="p-3 text-right text-slate-400">-</td>
                </tr>

                {/* TOTAL PRODUITS */}
                <tr className="bg-emerald-100/70 font-black text-emerald-950 border-t-2 border-emerald-400 text-xs">
                  <td className="p-3 pl-6 uppercase">TOTAL PRODUITS & ENTRÉES DE CAISSE (A)</td>
                  <td className="p-3">Ensemble des encaissements</td>
                  <td className="p-3 text-center">{filteredSales.length + filteredAlimentations.length} op.</td>
                  <td className="p-3 text-right text-emerald-900">{totalProduitsEtEntrees.toLocaleString()} MAD</td>
                  <td className="p-3 text-right">-</td>
                </tr>

                {/* SECTION 2: CHARGES / SORTIES */}
                <tr className="bg-red-50/70">
                  <td colSpan={5} className="p-3 font-black text-red-950 uppercase tracking-wider text-[11px]">
                    II. CHARGES DIRECTES & SORTIES DE CAISSE (FLUX SORTANT)
                  </td>
                </tr>

                <tr>
                  <td className="p-3 pl-6 font-bold text-slate-800">
                    Dépenses Carburant & Lubrifiants
                  </td>
                  <td className="p-3 text-slate-500">Énergie & Transport</td>
                  <td className="p-3 text-center text-slate-700">{expensesByCategory['Carburant'].count} bons</td>
                  <td className="p-3 text-right font-black text-red-650">-{expensesByCategory['Carburant'].total.toLocaleString()} MAD</td>
                  <td className="p-3 text-right font-semibold text-slate-500">
                    {totalSalesRevenue > 0 ? ((expensesByCategory['Carburant'].total / totalSalesRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                <tr>
                  <td className="p-3 pl-6 font-bold text-slate-800">
                    Entretien, Dépannages & Réparations Véhicules
                  </td>
                  <td className="p-3 text-slate-500">Maintenance Flotte</td>
                  <td className="p-3 text-center text-slate-700">{expensesByCategory['Entretien / Réparation'].count} bons</td>
                  <td className="p-3 text-right font-black text-red-650">-{expensesByCategory['Entretien / Réparation'].total.toLocaleString()} MAD</td>
                  <td className="p-3 text-right font-semibold text-slate-500">
                    {totalSalesRevenue > 0 ? ((expensesByCategory['Entretien / Réparation'].total / totalSalesRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                <tr>
                  <td className="p-3 pl-6 font-bold text-slate-800">
                    Avances sur Salaires & Frais Chauffeurs
                  </td>
                  <td className="p-3 text-slate-500">Personnel & Chauffeurs</td>
                  <td className="p-3 text-center text-slate-700">{expensesByCategory['Avance sur salaire'].count} bons</td>
                  <td className="p-3 text-right font-black text-red-650">-{expensesByCategory['Avance sur salaire'].total.toLocaleString()} MAD</td>
                  <td className="p-3 text-right font-semibold text-slate-500">
                    {totalSalesRevenue > 0 ? ((expensesByCategory['Avance sur salaire'].total / totalSalesRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                <tr>
                  <td className="p-3 pl-6 font-bold text-slate-800">
                    Autres Frais d'Exploitation & Décaissements Divers
                  </td>
                  <td className="p-3 text-slate-500">Frais Généraux / Divers</td>
                  <td className="p-3 text-center text-slate-700">{expensesByCategory['Autres charges'].count} bons</td>
                  <td className="p-3 text-right font-black text-red-650">-{expensesByCategory['Autres charges'].total.toLocaleString()} MAD</td>
                  <td className="p-3 text-right font-semibold text-slate-500">
                    {totalSalesRevenue > 0 ? ((expensesByCategory['Autres charges'].total / totalSalesRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                {/* TOTAL CHARGES */}
                <tr className="bg-red-100/70 font-black text-red-950 border-t-2 border-red-400 text-xs">
                  <td className="p-3 pl-6 uppercase">TOTAL CHARGES & DÉPENSES DE CAISSE (B)</td>
                  <td className="p-3">Total des décaissements</td>
                  <td className="p-3 text-center">{filteredExpenses.length} bons</td>
                  <td className="p-3 text-right text-red-900">-{totalExpenses.toLocaleString()} MAD</td>
                  <td className="p-3 text-right">
                    {totalSalesRevenue > 0 ? ((totalExpenses / totalSalesRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                {/* SECTION 3: SOLDES INTERMEDIAIRES ET RESULTATS */}
                <tr className="bg-slate-800 text-white">
                  <td colSpan={5} className="p-3 font-black uppercase tracking-wider text-[11px]">
                    III. SOLDES INTERMÉDIAIRES DE GESTION & SYNTHÈSE P&L
                  </td>
                </tr>

                <tr className="bg-indigo-50/80 font-bold text-slate-900">
                  <td className="p-3 pl-6 font-black uppercase">MARGE BRUTE D'EXPLOITATION (A1 - B)</td>
                  <td className="p-3 text-slate-600">Chiffre d'Affaires - Charges</td>
                  <td className="p-3 text-center">-</td>
                  <td className={`p-3 text-right font-black text-sm ${margeBruteExploitation >= 0 ? 'text-indigo-900' : 'text-red-700'}`}>
                    {margeBruteExploitation.toLocaleString()} MAD
                  </td>
                  <td className={`p-3 text-right font-black ${tauxMargeBrute >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                    {tauxMargeBrute.toFixed(1)}%
                  </td>
                </tr>

                {/* FINAL RESULTAT NET */}
                <tr className={`border-t-2 border-b-2 text-sm font-black ${
                  resultatNetGlobal >= 0 ? 'bg-emerald-200/90 text-emerald-950 border-emerald-500' : 'bg-red-200/90 text-red-950 border-red-500'
                }`}>
                  <td className="p-4 pl-6 uppercase tracking-wider flex items-center gap-2">
                    {resultatNetGlobal >= 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-700" />
                    )}
                    RÉSULTAT NET GLOBAL DE CAISSE (P&L = A - B)
                  </td>
                  <td className="p-4 font-bold text-xs uppercase">
                    {resultatNetGlobal >= 0 ? 'Bénéfice Net Comptable' : 'Déficit Net Comptable'}
                  </td>
                  <td className="p-4 text-center text-xs">-</td>
                  <td className="p-4 text-right text-base font-black">
                    {resultatNetGlobal.toLocaleString()} MAD
                  </td>
                  <td className="p-4 text-right font-black text-xs">
                    {tauxMargeNette.toFixed(1)}%
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Signatures for Print and Formal Record */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-slate-200 text-xs">
            <div className="border border-slate-300 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
              <div>
                <p className="font-bold text-slate-900 uppercase">Visa du Caissier Responsable</p>
                <p className="text-[10px] text-slate-500 italic">Arrêté des comptes de caisse certifié conforme</p>
              </div>
              <div className="border-b border-dashed border-slate-300 pt-6"></div>
            </div>
            <div className="border border-slate-300 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
              <div>
                <p className="font-bold text-slate-900 uppercase">Visa Direction Financière / Comptabilité</p>
                <p className="text-[10px] text-slate-500 italic">Contrôle de conformité et validation du P&L</p>
              </div>
              <div className="border-b border-dashed border-slate-300 pt-6"></div>
            </div>
          </div>
        </div>
      )}

      {/* Driver Performance View */}
      {activeSubTab === 'drivers' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-slate-900 uppercase text-sm tracking-wide">
                Rentabilité & Performance P&L par Chauffeur
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chiffre d'affaires collecté, avances & charges imputées, et marge nette générée
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
              {driverPerformance.length} Chauffeur(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Chauffeur</th>
                  <th className="p-3">Société</th>
                  <th className="p-3 text-center">Bouteilles</th>
                  <th className="p-3 text-right">CA Collecté (MAD)</th>
                  <th className="p-3 text-right">Avances & Dépenses (MAD)</th>
                  <th className="p-3 text-right">Solde Net Chauffeur (MAD)</th>
                  <th className="p-3 text-center">Rentabilité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {driverPerformance.length > 0 ? (
                  driverPerformance.map((item, idx) => (
                    <tr key={`driver-perf-${item.driver?.id || item.driver?.nom || idx}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{item.driver.nom} {item.driver.prenom}</span>
                        <span className="text-[10px] text-slate-400">{item.driver.phone || item.driver.telephone || 'Sans tel'}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.driver.company === 'chakirine_gaz' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.driver.company === 'chakirine_gaz' ? 'Chakirine' : 'Afro Négoce'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {item.bottlesSold.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        {item.revenue.toLocaleString()} MAD
                      </td>
                      <td className="p-3 text-right font-bold text-red-600">
                        {item.expenses > 0 ? `-${item.expenses.toLocaleString()} MAD` : '0 MAD'}
                      </td>
                      <td className={`p-3 text-right font-black ${
                        item.netContribution >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {item.netContribution.toLocaleString()} MAD
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          item.netContribution >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.marginRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      Aucune donnée enregistrée pour les chauffeurs sur cette période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Breakdown View */}
      {activeSubTab === 'expenses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <h3 className="font-black text-slate-900 uppercase text-sm tracking-wide">
              Répartition des Charges d'Exploitation
            </h3>
            
            <div className="space-y-4">
              {Object.entries(expensesByCategory).map(([cat, val], cIdx) => {
                const pct = totalExpenses > 0 ? (val.total / totalExpenses) * 100 : 0;
                return (
                  <div key={`exp-cat-${cat}-${cIdx}`} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">{cat} ({val.count} op.)</span>
                      <span className="text-slate-900">{val.total.toLocaleString()} MAD ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          cat === 'Carburant' ? 'bg-blue-600' :
                          cat === 'Entretien / Réparation' ? 'bg-amber-500' :
                          cat === 'Avance sur salaire' ? 'bg-purple-600' : 'bg-slate-700'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-black text-slate-900 uppercase text-sm tracking-wide mb-2">
                Ratios Clés de Gestion Caisse
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Indicateurs financiers calculés sur la période sélectionnée
              </p>
              
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Coefficient de couverture des charges :</span>
                  <span className="font-black text-slate-900">
                    {totalExpenses > 0 ? (totalSalesRevenue / totalExpenses).toFixed(2) : 'N/A'}x
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Revenu moyen par bouteille :</span>
                  <span className="font-black text-slate-900">
                    {totalBottlesSold > 0 ? (totalSalesRevenue / totalBottlesSold).toFixed(2) : '0'} MAD/Btl
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Charge moyenne par bouteille :</span>
                  <span className="font-black text-red-650">
                    {totalBottlesSold > 0 ? (totalExpenses / totalBottlesSold).toFixed(2) : '0'} MAD/Btl
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl flex justify-between items-center">
                  <span className="font-bold text-emerald-800">Marge brute unitaire par bouteille :</span>
                  <span className="font-black text-emerald-900">
                    {totalBottlesSold > 0 ? (margeBruteExploitation / totalBottlesSold).toFixed(2) : '0'} MAD/Btl
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center pt-4 border-t border-slate-100 mt-4">
              Calculé à partir des données de caisse en temps réel
            </div>
          </div>
        </div>
      )}

      {/* Embedded print styling for P&L */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-pnl-sheet,
          .printable-pnl-sheet * {
            visibility: visible !important;
          }
          .printable-pnl-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 8mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

    </div>
  );
}
