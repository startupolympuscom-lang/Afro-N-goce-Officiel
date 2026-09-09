import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Truck, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowLeft,
  Clock,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  Info,
  Trophy,
  Medal,
  Star,
  Fuel,
  Wrench,
  Navigation,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Import all stores
import { useVehiculeStore } from '../../stores/useVehiculeStore';
import { useChauffeurStore } from '../../stores/useChauffeurStore';
import { useMaintenanceStore } from '../../stores/useMaintenanceStore';
import { useCarburantStore } from '../../stores/useCarburantStore';
import { useDispatchGazStore } from '../../stores/useDispatchGazStore';
import { useInfractionStore } from '../../stores/useInfractionStore';
import { useMissionStore } from '../../stores/useMissionStore';

import { PasswordGate } from '../../components/PasswordGate';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export default function MasterTrackerPage() {
  // DF Data (FleetOps)
  const { vehicules } = useVehiculeStore();
  const { chauffeurs } = useChauffeurStore();
  const { maintenances } = useMaintenanceStore();
  const { tickets } = useCarburantStore();
  const { infractions } = useInfractionStore();
  const { missions } = useMissionStore();

  // DD Data (Afro Dispatch)
  const { sales, drivers: dispatchDrivers, stockDispatches, alerts: dispatchAlerts, brands } = useDispatchGazStore();

  // MT Logic - Aggregation and Processing
  const mtStats = useMemo(() => {
    // Fleet Performance (DF)
    const activeVehicules = vehicules.filter(v => v.status === 'en_mission' || v.status === 'disponible').length;
    const maintenanceAlerts = maintenances.filter(m => m.status === 'planifiee' || m.status === 'en_cours').length;
    const totalFuelCost = tickets.reduce((sum, c) => sum + (c.volume * c.prixParLitre), 0);
    const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + (m.coutReel || m.coutEstime || 0), 0);
    
    const avgConsumption = tickets.length > 0
      ? tickets.reduce((sum, t) => sum + (t.lPour100km || 0), 0) / tickets.length
      : 0;

    const missionCompletionRate = missions.length > 0
      ? (missions.filter(m => m.status === 'terminee').length / missions.length) * 100
      : 0;

    // Dispatch Performance (DD)
    const totalSalesValue = sales.reduce((sum, s) => sum + s.totalPrice, 0);

    const activeDispatchDrivers = dispatchDrivers.filter(d => d.status === 'actif').length;
    const stockEfficiency = stockDispatches.length > 0 
      ? (stockDispatches.reduce((sum, sd) => sum + (sd.sold / sd.quantity), 0) / stockDispatches.length) * 100 
      : 0;

    // Driver Ranking Logic
    const driverRankings = dispatchDrivers.map(d => {
      const driverSales = sales.filter(s => s.driverId === d.id).reduce((sum, s) => sum + s.quantity, 0);
      const driverInfractions = infractions.filter(i => i.chauffeurId === d.id).length;
      
      // Score calculation: 70% Sales, 30% Safety
      const salesScore = Math.min((driverSales / 500) * 70, 70); // Normalized to 500 units
      const safetyScore = Math.max(30 - (driverInfractions * 10), 0);
      
      return {
        id: d.id,
        name: `${d.prenom} ${d.nom}`,
        sales: driverSales,
        infractions: driverInfractions,
        score: Math.round(salesScore + safetyScore),
        status: d.status
      };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    // Global Alarms
    const alarms = [
      ...maintenances.filter(m => m.status === 'planifiee').map((m, mIdx) => ({
        id: `maint-${m.id || mIdx}-${mIdx}`,
        source: 'DF',
        type: 'warning',
        message: `Maintenance prévue pour ${m.vehiculeId}`,
        time: m.datePrevue
      })),
      ...dispatchAlerts.map((a, aIdx) => ({
        id: `disp-${a.id || aIdx}-${aIdx}`,
        source: 'DD',
        type: a.type,
        message: a.message,
        time: a.timestamp
      })),
      ...infractions.slice(0, 5).map((i, iIdx) => ({
        id: `inf-${i.id || iIdx}-${iIdx}`,
        source: 'DF',
        type: 'error',
        message: `Infraction détectée: ${i.type} (${i.vehiculeId})`,
        time: i.date
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return {
      activeVehicules,
      maintenanceAlerts,
      totalFuelCost,
      totalMaintenanceCost,
      avgConsumption,
      missionCompletionRate,
      totalSalesValue,
      activeDispatchDrivers,
      stockEfficiency,
      driverRankings,
      alarms: alarms.slice(0, 10)
    };
  }, [vehicules, maintenances, tickets, sales, dispatchDrivers, stockDispatches, dispatchAlerts, brands, infractions, missions]);

  // Clarified Chart Data: Revenue vs Operational Costs
  const financialData = [
    { name: 'Lun', revenue: 12000, costs: 4500 },
    { name: 'Mar', revenue: 15000, costs: 5200 },
    { name: 'Mer', revenue: 11000, costs: 4800 },
    { name: 'Jeu', revenue: 18000, costs: 6100 },
    { name: 'Ven', revenue: 22000, costs: 7500 },
    { name: 'Sam', revenue: 14000, costs: 3200 },
    { name: 'Dim', revenue: 9000, costs: 2100 },
  ];

  return (
    <PasswordGate unlockKey="tracker_unlocked" expectedPassword="aziz123">
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/afro-digital" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Zap className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Master Tracker <span className="text-amber-500">MT-1</span></h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Control Room Intelligence Engine</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase">DF: FLEETOPS ONLINE</span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase">DD: DISPATCH ONLINE</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <p className="text-lg font-mono font-bold text-amber-500 leading-none mt-1">
                <Clock className="w-4 h-4 inline mr-2 -mt-1" />
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Top KPIs - Instruments de Mesure */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Disponibilité Flotte" 
            value={`${((mtStats.activeVehicules / (vehicules.length || 1)) * 100).toFixed(0)}%`} 
            subtitle={`${mtStats.activeVehicules} véhicules en service`}
            icon={<Truck className="w-5 h-5" />}
            color="blue"
            trend="+2.4%"
          />
          <KPICard 
            title="Chiffre d'Affaires (DD)" 
            value={`${mtStats.totalSalesValue.toLocaleString()} MAD`} 
            subtitle="Revenu brut estimé"
            icon={<DollarSign className="w-5 h-5" />}
            color="emerald"
            trend="+14.2%"
          />
          <KPICard 
            title="Consommation Moyenne" 
            value={`${mtStats.avgConsumption.toFixed(1)} L/100`} 
            subtitle="Efficacité énergétique DF"
            icon={<Fuel className="w-5 h-5" />}
            color="amber"
            trend="-0.5%"
          />
          <KPICard 
            title="Taux de Complétion" 
            value={`${mtStats.missionCompletionRate.toFixed(1)}%`} 
            subtitle="Missions terminées avec succès"
            icon={<Target className="w-5 h-5" />}
            color="indigo"
            trend="+5.1%"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Financial Chart */}
          <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp className="w-64 h-64 text-emerald-500" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Rentabilité Opérationnelle</h3>
                <p className="text-sm text-slate-500 mt-1">Comparaison des Revenus (DD) vs Coûts Opérationnels (DF: Carburant + Maintenance)</p>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs font-bold text-slate-400">Revenus (DD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <span className="text-xs font-bold text-slate-400">Coûts (DF)</span>
                </div>
              </div>
            </div>
            
            <div className="h-[400px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    cursor={{ stroke: '#334155', strokeWidth: 2 }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area name="Revenus (MAD)" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  <Area name="Coûts (MAD)" type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Marge Brut Moyenne</p>
                <p className="text-xl font-black text-emerald-500">64.2%</p>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Coût/KM Moyen</p>
                <p className="text-xl font-black text-blue-500">2.85 MAD</p>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ROI Flotte</p>
                <p className="text-xl font-black text-amber-500">x3.4</p>
              </div>
            </div>
          </div>

          {/* Alarms Panel */}
          <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Centre d'Alarmes MT
              </h3>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-rose-500 text-[10px] font-black uppercase tracking-widest">Live Monitoring</span>
              </div>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar">
              {mtStats.alarms.map((alarm) => (
                <div key={alarm.id} className={`p-4 rounded-2xl border transition-all group ${
                  alarm.type === 'error' ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                      alarm.source === 'DF' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {alarm.source}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">{new Date(alarm.time).toLocaleTimeString()}</span>
                  </div>
                  <p className={`text-sm font-medium transition-colors ${
                    alarm.type === 'error' ? 'text-rose-200 group-hover:text-white' : 'text-slate-300 group-hover:text-white'
                  }`}>{alarm.message}</p>
                </div>
              ))}
              {mtStats.alarms.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                  <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-bold">Système Nominal - Aucune Alerte</p>
                </div>
              )}
            </div>
            <button className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl transition-colors border border-slate-700">
              Journal d'Audit Complet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Driver Rankings - Leaderboard */}
          <div className="lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  Classement Chauffeurs MT
                </h3>
                <p className="text-xs text-slate-500 mt-1">Performance Ventes (70%) + Sécurité Routière (30%)</p>
              </div>
            </div>

            <div className="space-y-4">
              {mtStats.driverRankings.map((driver, index) => (
                <div key={`driver-rank-${driver.id || index}-${index}`} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 hover:bg-slate-800/50 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center relative">
                    {index === 0 ? (
                      <Medal className="w-8 h-8 text-amber-500" />
                    ) : index === 1 ? (
                      <Medal className="w-8 h-8 text-slate-300" />
                    ) : index === 2 ? (
                      <Medal className="w-8 h-8 text-amber-700" />
                    ) : (
                      <span className="text-lg font-black text-slate-600">#{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-white">{driver.name}</h4>
                      <span className="text-xs font-black text-amber-500">{driver.score} pts</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${driver.score}%` }}
                        className={`h-full rounded-full ${
                          index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-300' : 'bg-blue-500'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{driver.sales} ventes</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${driver.infractions > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {driver.infractions} infractions
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module Boxes */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DF Box */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Truck className="w-32 h-32 text-blue-500" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <h4 className="text-blue-400 text-xs font-black uppercase tracking-widest">Module DF - FleetOps</h4>
              </div>
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Maintenances en cours</span>
                  <span className="text-white font-black">{mtStats.maintenanceAlerts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Coût Carburant (Mois)</span>
                  <span className="text-white font-black">{mtStats.totalFuelCost.toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Coût Maintenance Total</span>
                  <span className="text-white font-black">{mtStats.totalMaintenanceCost.toLocaleString()} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Disponibilité Flotte</span>
                  <span className="text-emerald-500 font-black">94%</span>
                </div>
              </div>
              <Link to="/login" className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-black rounded-2xl transition-all border border-blue-500/20 uppercase tracking-[0.2em]">
                Détails FleetOps <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>

            {/* DD Box */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Package className="w-32 h-32 text-amber-500" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
                  <Navigation className="w-5 h-5" />
                </div>
                <h4 className="text-amber-400 text-xs font-black uppercase tracking-widest">Module DD - Dispatch</h4>
              </div>
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Vendeurs Actifs</span>
                  <span className="text-white font-black">{mtStats.activeDispatchDrivers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Objectif Ventes</span>
                  <span className="text-white font-black">82%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Efficacité Stock</span>
                  <span className="text-white font-black">{mtStats.stockEfficiency.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Alertes Stock</span>
                  <span className="text-rose-500 font-black">{dispatchAlerts.length}</span>
                </div>
              </div>
              <Link to="/dispatch/login" className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-black rounded-2xl transition-all border border-amber-500/20 uppercase tracking-[0.2em]">
                Détails Dispatch <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </div>

        {/* Intelligence Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[100px] -mr-48 -mt-48" />
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight">Intelligence MT - Analyse Prédictive</h4>
                  <p className="text-xs text-slate-500">Moteur de corrélation IA en temps réel</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800 italic text-slate-300 leading-relaxed relative">
                  <span className="absolute -top-3 left-6 px-2 bg-slate-900 text-[10px] font-black text-amber-500 uppercase tracking-widest border border-slate-800">Observation MT</span>
                  "Les performances de vente (DD) montrent une corrélation de 87% avec la disponibilité de la flotte (DF). 
                  Actuellement, 2 véhicules en maintenance prolongée pourraient impacter les livraisons de demain en zone Nord. 
                  Le coût du carburant a augmenté de 5% cette semaine, réduisant la marge nette de 1.2%."
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                  <Info className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                  <p className="text-sm text-slate-400">
                    <strong>Note de la Control Room :</strong> Pour des informations granulaires (ex: détails d'une maintenance spécifique, 
                    historique complet d'un chauffeur ou fiches clients), veuillez vous référer directement aux modules 
                    <strong> FleetOps (DF)</strong> ou <strong> Afro Dispatch (DD)</strong>. Le Master Tracker est un outil de pilotage stratégique.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-80 space-y-4">
              <div className="p-6 bg-slate-800/20 rounded-3xl border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">Santé Globale</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * 85) / 100} className="text-emerald-500" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-black text-white">85%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">Système Stable</p>
                    <p className="text-[10px] text-slate-500 mt-1">Flux de données synchronisés</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-800/20 rounded-3xl border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">Latence MT</span>
                </div>
                <p className="text-2xl font-black text-white">1.2s</p>
                <p className="text-[10px] text-slate-500 mt-1">Temps de réponse du moteur</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-[1600px] mx-auto px-6 py-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-600">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em]">
            <span>MT Engine v2.5.1</span>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
            <span>Control Room Optimized</span>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
            <span>Secure Data Link</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-xs font-bold hover:text-white transition-colors cursor-help">
            <LayoutDashboard className="w-4 h-4" />
            Master Tracker Dashboard
          </div>
          <div className="flex items-center gap-2 text-xs font-bold hover:text-white transition-colors cursor-pointer">
            <ShieldCheck className="w-4 h-4" />
            Système Sécurisé
          </div>
        </div>
      </footer>
    </div>
    </PasswordGate>
  );
}

function KPICard({ title, value, subtitle, icon, color, trend }: any) {
  const colorClasses: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2rem] hover:border-slate-600 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.02] -mr-8 -mt-8 rounded-full group-hover:opacity-[0.05] transition-opacity" />
      
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl border transition-transform group-hover:scale-110 duration-500 ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black ${
          trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
          trend.startsWith('-') ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
          'bg-amber-500/10 text-amber-500 border-amber-500/20'
        }`}>
          {trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
          {trend}
        </div>
      </div>
      
      <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</h3>
      <div className="flex flex-col">
        <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
        <span className="text-xs font-bold text-slate-600 mt-1">{subtitle}</span>
      </div>
    </div>
  );
}
