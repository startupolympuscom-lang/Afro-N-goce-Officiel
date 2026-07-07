import { useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useVehiculeStore } from '../../stores/useVehiculeStore';
import { useCarburantStore } from '../../stores/useCarburantStore';
import { useMaintenanceStore } from '../../stores/useMaintenanceStore';
import { useInfractionStore } from '../../stores/useInfractionStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { 
  Truck, 
  MapPin, 
  Wrench, 
  AlertTriangle, 
  Fuel, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Plus,
  PieChart,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatMAD } from '../../lib/formatters';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  hover: { y: -2, boxShadow: 'var(--shadow-md)' }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } }
};

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const vehicules = useVehiculeStore(s => s.vehicules);
  const { tickets, stationInterne } = useCarburantStore();
  const maintenances = useMaintenanceStore(s => s.maintenances);
  const infractions = useInfractionStore(s => s.infractions);
  const budgets = useBudgetStore(s => s.budgets);
  const documents = useDocumentStore(s => s.documents);
  
  const [date] = useState(new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  // Calculate real stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTickets = tickets.filter(t => {
    const d = new Date(t.dateHeure);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalCarburantCost = currentMonthTickets.reduce((sum, t) => sum + t.coutTotal, 0);

  const currentMonthMaintenances = maintenances.filter(m => {
    const d = new Date(m.datePrevue);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalMaintenanceCost = currentMonthMaintenances.reduce((sum, m) => sum + (m.coutReel || m.coutEstime), 0);

  const unpaidInfractions = infractions.filter(i => i.status === 'non_payee');
  const totalUnpaidInfractions = unpaidInfractions.reduce((sum, i) => sum + i.montant, 0);

  const pctStock = stationInterne.capacite > 0 ? (stationInterne.stockActuel / stationInterne.capacite) * 100 : 0;

  const stats = [
    { title: 'Total Véhicules', value: vehicules.length, icon: Truck, color: 'text-primary', bg: 'bg-primary/10', trend: { value: 0, label: 'vs mois dernier', direction: 'neutral' } },
    { title: 'En Mission', value: vehicules.filter(v => v.status === 'en_mission').length, icon: MapPin, color: 'text-info', bg: 'bg-info/10', trend: { value: 0, label: 'vs hier', direction: 'neutral' } },
    { title: 'En Maintenance', value: vehicules.filter(v => v.status === 'en_maintenance').length, icon: Wrench, color: 'text-warning', bg: 'bg-warning/10', trend: { value: 0, label: 'vs hier', direction: 'neutral' } },
    { title: 'Immobilisés', value: vehicules.filter(v => v.status === 'immobilise').length, icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', trend: { value: 0, label: 'vs mois dernier', direction: 'neutral' } },
  ];

  const financialStats = [
    { title: 'Coût Carburant (Mois)', value: formatMAD(totalCarburantCost), icon: Fuel, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Coût Maintenance (Mois)', value: formatMAD(totalMaintenanceCost), icon: Wrench, color: 'text-warning', bg: 'bg-warning/10' },
    { title: 'Amendes Impayées', value: formatMAD(totalUnpaidInfractions), icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
    { title: 'Stock Station', value: `${stationInterne.stockActuel} L`, icon: Fuel, color: 'text-success', bg: 'bg-success/10' },
  ];

  // Quick Actions
  const quickActions = [
    { name: 'Nouveau Véhicule', path: '/vehicules', icon: Plus, color: 'bg-primary' },
    { name: 'Saisie Carburant', path: '/flotte/carburant', icon: Fuel, color: 'bg-info' },
    { name: 'Maintenance', path: '/flotte/maintenance', icon: Wrench, color: 'bg-warning' },
    { name: 'Mission', path: '/flotte/missions', icon: MapPin, color: 'bg-success' },
  ];

  // Calculate real budget data
  const realBudgetData = useMemo(() => {
    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthBudgets = budgets.filter(b => b.mois === currentMonthStr);
    
    const getCategoryData = (cat: string) => {
      const b = monthBudgets.find(b => b.categorie === cat);
      return { budget: b?.montantAlloue || 0, reel: b?.montantDepense || 0 };
    };

    return [
      { name: 'Carburant', ...getCategoryData('carburant') },
      { name: 'Maintenance', ...getCategoryData('maintenance') },
      { name: 'Pneus', ...getCategoryData('pneus') },
      { name: 'Amendes', ...getCategoryData('infractions') },
    ];
  }, [budgets, currentMonth, currentYear]);

  // Calculate real conso data
  const realConsoData = useMemo(() => {
    const consoMap = new Map<string, { totalVolume: number, totalKm: number }>();
    
    tickets.forEach(t => {
      if (t.lPour100km && t.kilometragePrecedent > 0) {
        const distance = t.kilometrageAuPlein - t.kilometragePrecedent;
        if (distance > 0) {
          const current = consoMap.get(t.vehiculeId) || { totalVolume: 0, totalKm: 0 };
          consoMap.set(t.vehiculeId, {
            totalVolume: current.totalVolume + t.volume,
            totalKm: current.totalKm + distance
          });
        }
      }
    });

    return Array.from(consoMap.entries())
      .map(([vehiculeId, data]) => {
        const v = vehicules.find(v => v.id === vehiculeId);
        return {
          name: v ? v.immatriculation : 'Inconnu',
          conso: Number(((data.totalVolume / data.totalKm) * 100).toFixed(1))
        };
      })
      .sort((a, b) => b.conso - a.conso)
      .slice(0, 5);
  }, [tickets, vehicules]);

  const displayConsoData = realConsoData.length > 0 ? realConsoData : [];

  // Calculate real trend data (last 6 months)
  const realTrendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const monthName = d.toLocaleDateString('fr-FR', { month: 'short' });
      
      const monthTickets = tickets.filter(t => {
        const td = new Date(t.dateHeure);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      const carburantCost = monthTickets.reduce((sum, t) => sum + t.coutTotal, 0);

      const monthMaintenances = maintenances.filter(m => {
        const md = new Date(m.datePrevue);
        return md.getMonth() === d.getMonth() && md.getFullYear() === d.getFullYear();
      });
      const maintenanceCost = monthMaintenances.reduce((sum, m) => sum + (m.coutReel || m.coutEstime), 0);

      months.push({
        name: monthName,
        carburant: carburantCost,
        maintenance: maintenanceCost
      });
    }
    return months;
  }, [tickets, maintenances, currentMonth, currentYear]);

  // Calculate recent activity
  const recentActivity = useMemo(() => {
    const activities = [];
    
    tickets.forEach(t => {
      const v = vehicules.find(v => v.id === t.vehiculeId);
      activities.push({
        title: 'Nouveau ticket carburant',
        desc: `${v ? v.immatriculation : 'Inconnu'} • ${t.volume} L`,
        date: new Date(t.dateHeure),
        icon: Fuel,
        color: 'text-primary',
        bg: 'bg-primary/10'
      });
    });

    maintenances.forEach(m => {
      const v = vehicules.find(v => v.id === m.vehiculeId);
      activities.push({
        title: 'Maintenance',
        desc: `${v ? v.immatriculation : 'Inconnu'} • ${m.type}`,
        date: new Date(m.datePrevue),
        icon: Wrench,
        color: 'text-warning',
        bg: 'bg-warning/10'
      });
    });

    infractions.forEach(i => {
      const v = vehicules.find(v => v.id === i.vehiculeId);
      activities.push({
        title: 'Infraction',
        desc: `${i.type} • ${v ? v.immatriculation : 'Inconnu'}`,
        date: new Date(i.date),
        icon: AlertTriangle,
        color: 'text-danger',
        bg: 'bg-danger/10'
      });
    });

    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 8)
      .map(a => ({
        ...a,
        time: a.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      }));
  }, [tickets, maintenances, infractions, vehicules]);

  const fleetStatusData = useMemo(() => [
    { name: 'Opérationnels', value: vehicules.filter(v => v.status === 'disponible' || v.status === 'en_mission').length, color: 'var(--color-success)' },
    { name: 'Maintenance', value: vehicules.filter(v => v.status === 'en_maintenance').length, color: 'var(--color-warning)' },
    { name: 'Immobilisés', value: vehicules.filter(v => v.status === 'immobilise').length, color: 'var(--color-danger)' },
  ], [vehicules]);

  const cdcAlerts = useMemo(() => {
    return vehicules.filter(v => v.isCDC).map(v => {
      const doc = documents.find(d => d.entiteId === v.id && d.type === 'certificat_circulation');
      if (doc && doc.status === 'expire') {
        return {
          id: v.id,
          immatriculation: v.immatriculation,
          marque: v.marque,
          modele: v.modele
        };
      }
      return null;
    }).filter(Boolean);
  }, [vehicules, documents]);

  const fuelAlerts = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const statsMap = new Map<string, { current: number, previous: number }>();

    tickets.forEach(t => {
      const d = new Date(t.dateHeure);
      const vol = t.volume;
      const vId = t.vehiculeId;

      if (!statsMap.has(vId)) {
        statsMap.set(vId, { current: 0, previous: 0 });
      }

      const vStats = statsMap.get(vId)!;
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        vStats.current += vol;
      } else if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
        vStats.previous += vol;
      }
    });

    return Array.from(statsMap.entries()).map(([vehiculeId, data]) => {
      const v = vehicules.find(v => v.id === vehiculeId);
      let diffPct = 0;
      if (data.previous > 0) {
        diffPct = ((data.current - data.previous) / data.previous) * 100;
      } else if (data.current > 0 && data.previous === 0) {
        diffPct = 100; 
      }

      if (diffPct > 50) {
        return {
          id: vehiculeId,
          immatriculation: v ? v.immatriculation : 'Inconnu',
          diffPct
        };
      }
      return null;
    }).filter(Boolean);
  }, [tickets, vehicules]);

  return (
    <div className="space-y-8 bg-surface/30 -m-8 p-8 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <span>FLEETOPS</span>
            <span className="w-1 h-1 bg-primary rounded-full" />
            <span className="text-text-muted font-normal text-lg">Tableau de bord</span>
          </h1>
          <div className="flex items-center gap-2 text-text-secondary mt-1">
            <span className="capitalize font-medium">{date}</span>
            <span className="w-1 h-1 bg-border-strong rounded-full" />
            <span className="text-xs uppercase tracking-widest font-bold text-text-muted">Système: Actif</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="bg-[#0B1120] text-white px-5 py-2.5 rounded-xl font-bold border border-white/10 shadow-xl transition-all flex items-center gap-2 hover:bg-black">
            <TrendingUp className="w-4 h-4 text-primary" />
            Rapports Analytiques
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {cdcAlerts.length > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-top duration-500 shadow-sm shadow-warning/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/20 rounded-xl">
                <AlertCircle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="text-sm font-black text-warning uppercase tracking-widest leading-none mb-1">Alerte Certificat de Circulation (CDC)</h3>
                <p className="text-sm text-text-primary font-bold">
                  Le CDC est expiré pour {cdcAlerts.length} véhicule(s). Veuillez ajouter la <span className="underline decoration-warning/30 underline-offset-2">Carte Grise</span> définitive.
                </p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {cdcAlerts.map((v: any) => (
                <Link 
                  key={v.id} 
                  to="/vehicules" 
                  className="whitespace-nowrap px-3 py-1.5 bg-white border border-warning/30 rounded-lg text-xs font-bold text-text-primary hover:bg-warning/10 transition-colors shadow-sm"
                >
                  {v.immatriculation} ({v.marque})
                </Link>
              ))}
            </div>
          </div>
        )}

        {fuelAlerts.length > 0 && (
          <div className="bg-error/10 border border-error/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-top duration-500 shadow-sm shadow-error/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-error/20 rounded-xl">
                <Fuel className="w-6 h-6 text-error" />
              </div>
              <div>
                <h3 className="text-sm font-black text-error uppercase tracking-widest leading-none mb-1">Alerte Surconsommation Carburant</h3>
                <p className="text-sm text-text-primary font-bold">
                  Hausse {">"} 50% de consommation pour {fuelAlerts.length} véhicule(s).
                </p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {fuelAlerts.map((v: any) => (
                <Link 
                  key={v.id} 
                  to="/flotte/carburant" 
                  className="whitespace-nowrap px-3 py-1.5 bg-white border border-error/30 rounded-lg text-xs font-bold text-text-primary hover:bg-error/10 transition-colors shadow-sm flex items-center gap-2"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-error" />
                  {v.immatriculation} (+{v.diffPct.toFixed(0)}%)
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Financial Pulse Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {financialStats.map((stat, i) => (
          <div key={i} className="bg-surface p-4 rounded-2xl border border-border flex items-center gap-4 group hover:border-primary/50 transition-all">
            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">{stat.title}</div>
              <div className="text-lg font-black text-text-primary">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 units) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Fleet Stats */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                variants={cardVariants}
                className="group bg-surface p-6 rounded-2xl border border-border shadow-sm hover:ring-2 hover:ring-primary/20 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:bg-primary group-hover:text-white transition-all`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-3xl font-black text-text-primary tracking-tight mb-1">{stat.value}</div>
                <div className="text-xs font-black text-text-muted uppercase tracking-widest">{stat.title}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Chart */}
          <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm flex flex-col min-h-[450px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-text-primary tracking-tight">Analyse de Flux</h3>
                <p className="text-sm text-text-secondary">Corrélation Consommation & Entretien</p>
              </div>
              <div className="flex bg-surface-2 p-1 rounded-xl border border-border">
                <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-text-primary bg-surface border border-border shadow-sm">6 Mois</button>
                <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-text-muted hover:text-text-primary transition-colors ml-1">12 Mois</button>
              </div>
            </div>
            
            <div className="flex-1 w-full h-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={realTrendData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCarburant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 600 }} 
                    dy={15} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 600 }} 
                    tickFormatter={(value) => `${value / 1000}k`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 700 }}
                    formatter={(value: number) => [formatMAD(value), '']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="carburant" 
                    name="Gasoil" 
                    stroke="var(--color-primary)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorCarburant)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="maintenance" 
                    name="Maintenance" 
                    stroke="var(--color-warning)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorMaintenance)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0B1120] p-8 rounded-3xl border border-white/10 shadow-xl min-h-[350px] flex flex-col text-white">
              <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Dépenses vs Budget
              </h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={realBudgetData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0B1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="budget" name="Alloué" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="reel" name="Réel" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm min-h-[350px] flex flex-col">
              <h3 className="text-lg font-black tracking-tight mb-6">Consommation par Unité</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayConsoData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 600 }} width={80} />
                    <Tooltip cursor={{ fill: 'var(--color-surface-2)' }} />
                    <Bar dataKey="conso" fill="var(--color-primary)" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 units) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Internal Station Status */}
          <div className="bg-primary p-8 rounded-3xl text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase tracking-tighter">Station Interne</h3>
                <Fuel className="w-6 h-6 opacity-50" />
              </div>
              
              <div className="relative w-44 h-44 mb-6">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <motion.circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="8" 
                    strokeDasharray="283" 
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * pctStock) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round" 
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black">{Math.round(pctStock)}%</span>
                  <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest leading-none mt-1">Volume</span>
                </div>
              </div>
              
              <div className="w-full text-center">
                <div className="text-2xl font-black">{stationInterne.stockActuel.toLocaleString()} L</div>
                <div className="text-xs font-bold opacity-60 uppercase tracking-widest">Stock Disponible</div>
              </div>

              {pctStock < 20 && (
                <div className="mt-8 w-full bg-black/20 p-4 rounded-2xl flex items-center gap-3 border border-white/10">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                  <p className="text-xs font-bold leading-tight">Stock sous seuil critique. Approvisionnement requis.</p>
                </div>
              )}
            </div>
          </div>

          {/* Business Continuity / Fleet Status */}
          <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
            <h3 className="text-lg font-black tracking-tight mb-6">État de la Flotte</h3>
            <div className="space-y-4">
              {fleetStatusData.map((item, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span className="text-text-secondary">{item.name}</span>
                    <span className="text-text-primary">{item.value} unités</span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ 
                        width: `${vehicules.length > 0 ? (item.value / vehicules.length) * 100 : 0}%`,
                        backgroundColor: item.color
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
            <h1 className="text-lg font-black tracking-tight mb-6">Accès Rapides</h1>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, i) => (
                <Link 
                  key={i}
                  to={action.path}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 hover:scale-[1.02] transition-all group shadow-sm hover:shadow-md"
                >
                  <div className={`p-3 rounded-xl ${action.color} text-white mb-3 group-hover:rotate-6 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-center text-text-primary uppercase tracking-wider">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Stream */}
          <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black tracking-tight">Activité Récente</h3>
            </div>
            
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="relative flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-2xl ${activity.bg} ${activity.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform z-10`}>
                      <activity.icon className="w-5 h-5" />
                    </div>
                    {i !== recentActivity.length - 1 && (
                      <div className="absolute top-10 w-0.5 h-full bg-border" />
                    )}
                  </div>
                  <div className="pb-6 w-full">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="text-[13px] font-black text-text-primary leading-tight">{activity.title}</div>
                      <div className="text-[9px] font-black text-text-muted uppercase">{activity.time}</div>
                    </div>
                    <div className="text-xs font-medium text-text-secondary leading-normal">{activity.desc}</div>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-12 text-text-secondary text-sm">Aucune activité récente.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
