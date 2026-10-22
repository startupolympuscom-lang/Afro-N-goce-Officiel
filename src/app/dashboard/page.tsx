import { useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useVehiculeStore } from '../../stores/useVehiculeStore';
import { useCarburantStore } from '../../stores/useCarburantStore';
import { useMaintenanceStore } from '../../stores/useMaintenanceStore';
import { useInfractionStore } from '../../stores/useInfractionStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import React from 'react';
import { 
  Truck, 
  MapPin, 
  Wrench, 
  AlertTriangle, 
  Fuel, 
  Plus,
  AlertCircle,
  FileText,
  ChevronRight,
  type LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatMAD } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

type Tone = 'primary' | 'info' | 'warning' | 'danger' | 'success';

const TONES: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  success: 'bg-success/10 text-success',
};

function StatCard({ label, value, hint, icon: Icon, tone }: { label: string; value: React.ReactNode; hint?: string; icon: LucideIcon; tone: Tone }) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-xs p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <span className={cn('p-2 rounded-lg', TONES[tone])}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-text-primary tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

function Panel({ title, subtitle, action, children, className }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('bg-surface rounded-xl border border-border shadow-xs p-5 lg:p-6', className)}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AlertBanner({ tone, icon: Icon, title, message, links }: {
  tone: 'warning' | 'danger';
  icon: LucideIcon;
  title: string;
  message: React.ReactNode;
  links: { key: string; label: string; to: string }[];
}) {
  const toneClass = tone === 'warning' ? 'border-warning/30 bg-warning/5 text-warning' : 'border-danger/30 bg-danger/5 text-danger';
  return (
    <div className={cn('rounded-xl border p-4 space-y-3', toneClass)}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-sm text-text-secondary">{message}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-8">
        {links.map(link => (
          <Link
            key={link.key}
            to={link.to}
            className="whitespace-nowrap px-2.5 py-1 bg-surface border border-border rounded-md text-xs font-medium text-text-primary hover:border-border-strong transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const tooltipStyle = { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', boxShadow: 'var(--shadow-md)', fontSize: 12 };

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const vehicules = useVehiculeStore(s => s.vehicules);
  const { tickets, stationInterne } = useCarburantStore();
  const maintenances = useMaintenanceStore(s => s.maintenances);
  const infractions = useInfractionStore(s => s.infractions);
  const budgets = useBudgetStore(s => s.budgets);
  const documents = useDocumentStore(s => s.documents);
  
  const [date] = useState(new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  const [trendMonths, setTrendMonths] = useState<6 | 12>(6);
  const canSeeReports = user?.role === 'super_admin' || user?.role === 'admin';

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

  const shareOfFleet = (count: number) =>
    vehicules.length > 0 ? `${Math.round((count / vehicules.length) * 100)} % du parc` : undefined;
  const enMission = vehicules.filter(v => v.status === 'en_mission').length;
  const enMaintenance = vehicules.filter(v => v.status === 'en_maintenance').length;
  const immobilises = vehicules.filter(v => v.status === 'immobilise').length;

  const stats: { label: string; value: React.ReactNode; hint?: string; icon: LucideIcon; tone: Tone }[] = [
    { label: 'Véhicules', value: vehicules.length, hint: 'Total du parc', icon: Truck, tone: 'primary' },
    { label: 'En mission', value: enMission, hint: shareOfFleet(enMission), icon: MapPin, tone: 'info' },
    { label: 'En maintenance', value: enMaintenance, hint: shareOfFleet(enMaintenance), icon: Wrench, tone: 'warning' },
    { label: 'Immobilisés', value: immobilises, hint: shareOfFleet(immobilises), icon: AlertTriangle, tone: 'danger' },
  ];

  const financialStats: typeof stats = [
    { label: 'Carburant', value: formatMAD(totalCarburantCost), hint: `${currentMonthTickets.length} plein(s) ce mois`, icon: Fuel, tone: 'primary' },
    { label: 'Maintenance', value: formatMAD(totalMaintenanceCost), hint: `${currentMonthMaintenances.length} intervention(s) ce mois`, icon: Wrench, tone: 'warning' },
    { label: 'Amendes impayées', value: formatMAD(totalUnpaidInfractions), hint: `${unpaidInfractions.length} amende(s) en attente`, icon: AlertTriangle, tone: 'danger' },
    { label: 'Stock station', value: `${stationInterne.stockActuel.toLocaleString('fr-FR')} L`, hint: `${Math.round(pctStock)} % de la capacité`, icon: Fuel, tone: 'success' },
  ];

  // Quick Actions
  const quickActions = [
    { name: 'Ajouter un véhicule', path: '/vehicules', icon: Plus },
    { name: 'Saisir un plein', path: '/flotte/carburant', icon: Fuel },
    { name: 'Planifier une maintenance', path: '/flotte/maintenance', icon: Wrench },
    { name: 'Créer une mission', path: '/flotte/missions', icon: MapPin },
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

  // Calculate real trend data (last 6 or 12 months)
  const realTrendData = useMemo(() => {
    const months = [];
    for (let i = trendMonths - 1; i >= 0; i--) {
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
  }, [tickets, maintenances, currentMonth, currentYear, trendMonths]);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tableau de bord</h1>
          <p className="text-text-secondary mt-1">
            {user?.prenom ? `Bonjour ${user.prenom}, ` : ''}<span className="first-letter:uppercase inline-block">{date}</span>
          </p>
        </div>
        {canSeeReports && (
          <Link
            to="/rapports"
            className="self-start sm:self-auto inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-surface text-sm font-medium text-text-primary hover:bg-surface-2 transition-colors"
          >
            <FileText className="w-4 h-4 text-text-muted" />
            Rapports
          </Link>
        )}
      </div>

      {(cdcAlerts.length > 0 || fuelAlerts.length > 0) && (
        <div className="space-y-3">
          {cdcAlerts.length > 0 && (
            <AlertBanner
              tone="warning"
              icon={AlertCircle}
              title="Certificat de circulation (CDC) expiré"
              message={<>Le CDC est expiré pour {cdcAlerts.length} véhicule(s). Ajoutez la carte grise définitive.</>}
              links={cdcAlerts.map((v: any) => ({ key: v.id, label: `${v.immatriculation} · ${v.marque}`, to: '/vehicules' }))}
            />
          )}
          {fuelAlerts.length > 0 && (
            <AlertBanner
              tone="danger"
              icon={Fuel}
              title="Surconsommation de carburant"
              message={<>Consommation en hausse de plus de 50 % par rapport au mois dernier pour {fuelAlerts.length} véhicule(s).</>}
              links={fuelAlerts.map((v: any) => ({ key: v.id, label: `${v.immatriculation} · +${v.diffPct.toFixed(0)} %`, to: '/flotte/carburant' }))}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Dépenses du mois</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialStats.map(stat => <StatCard key={stat.label} {...stat} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Panel
            title="Évolution des coûts"
            subtitle="Carburant et maintenance par mois"
            action={
              <div className="flex bg-surface-2 p-1 rounded-lg border border-border" role="group" aria-label="Période">
                {([6, 12] as const).map(months => (
                  <button
                    key={months}
                    onClick={() => setTrendMonths(months)}
                    aria-pressed={trendMonths === months}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                      trendMonths === months ? 'bg-surface text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'
                    )}
                  >
                    {months} mois
                  </button>
                ))}
              </div>
            }
          >
            <div className="flex items-center gap-5 mb-4 text-xs text-text-secondary">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-primary" />Carburant</span>
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-warning" />Maintenance</span>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realTrendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCarburant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.18}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.18}/>
                      <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [formatMAD(value), name]} />
                  <Area type="monotone" dataKey="carburant" name="Carburant" stroke="var(--color-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCarburant)" />
                  <Area type="monotone" dataKey="maintenance" name="Maintenance" stroke="var(--color-warning)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMaintenance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Budget du mois" subtitle="Alloué et dépensé par poste">
              <div className="flex items-center gap-5 mb-3 text-xs text-text-secondary">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-border-strong" />Alloué</span>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-primary" />Dépensé</span>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={realBudgetData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'var(--color-surface-2)' }} contentStyle={tooltipStyle} formatter={(value: number, name: string) => [formatMAD(value), name]} />
                    <Bar dataKey="budget" name="Alloué" fill="var(--color-border-strong)" radius={[4, 4, 0, 0]} barSize={14} />
                    <Bar dataKey="reel" name="Dépensé" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Consommation par véhicule" subtitle="Top 5, en L/100 km">
              {displayConsoData.length > 0 ? (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayConsoData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} width={90} />
                      <Tooltip cursor={{ fill: 'var(--color-surface-2)' }} contentStyle={tooltipStyle} formatter={(value: number) => [`${value} L/100 km`, 'Consommation']} />
                      <Bar dataKey="conso" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[240px] flex flex-col items-center justify-center text-center">
                  <Fuel className="w-8 h-8 text-border-strong mb-3" />
                  <p className="text-sm font-medium text-text-primary">Pas encore de données</p>
                  <p className="text-xs text-text-muted mt-1 max-w-[220px]">La consommation apparaît après deux pleins consécutifs d'un même véhicule.</p>
                </div>
              )}
            </Panel>
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-primary rounded-xl p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold">Station interne</h2>
                <p className="text-sm text-white/70">Stock de gasoil</p>
              </div>
              <Fuel className="w-5 h-5 text-white/60" />
            </div>
            <div className="relative flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="9" />
                  <motion.circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="white"
                    strokeWidth="9"
                    strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * Math.min(pctStock, 100)) / 100 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold">{Math.round(pctStock)}%</div>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-white/70">Disponible</dt>
                  <dd className="text-xl font-semibold tabular-nums">{stationInterne.stockActuel.toLocaleString('fr-FR')} L</dd>
                </div>
                <div>
                  <dt className="text-white/70">Capacité</dt>
                  <dd className="font-medium tabular-nums">{stationInterne.capacite.toLocaleString('fr-FR')} L</dd>
                </div>
              </dl>
            </div>
            {pctStock < 20 && (
              <div className="relative mt-5 bg-black/20 p-3 rounded-lg flex items-center gap-3 border border-white/10">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                <p className="text-xs font-medium">Stock sous le seuil critique : approvisionnement requis.</p>
              </div>
            )}
          </section>

          <Panel title="État de la flotte">
            <div className="space-y-4">
              {fleetStatusData.map(item => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-text-secondary">{item.name}</span>
                    <span className="font-medium text-text-primary tabular-nums">{item.value} véhicule{item.value > 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${vehicules.length > 0 ? (item.value / vehicules.length) * 100 : 0}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Accès rapides">
            <ul className="-mx-2">
              {quickActions.map(action => (
                <li key={action.path}>
                  <Link
                    to={action.path}
                    className="flex items-center gap-3 px-2 h-11 rounded-lg text-sm font-medium text-text-primary hover:bg-surface-2 transition-colors group"
                  >
                    <span className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <action.icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1">{action.name}</span>
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Activité récente">
            <ul className="max-h-[380px] overflow-y-auto custom-scrollbar -mr-2 pr-2">
              {recentActivity.map((activity, i) => (
                <li key={i} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <span className={`w-8 h-8 rounded-lg ${activity.bg} ${activity.color} flex items-center justify-center shrink-0 z-10`}>
                      <activity.icon className="w-4 h-4" />
                    </span>
                    {i !== recentActivity.length - 1 && <span className="absolute top-8 w-px h-full bg-border" />}
                  </div>
                  <div className="pb-5 min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-3">
                      <span className="text-sm font-medium text-text-primary truncate">{activity.title}</span>
                      <span className="text-xs text-text-muted whitespace-nowrap">{activity.time}</span>
                    </div>
                    <div className="text-xs text-text-secondary">{activity.desc}</div>
                  </div>
                </li>
              ))}
              {recentActivity.length === 0 && (
                <li className="text-center py-10 text-text-secondary text-sm">Aucune activité récente.</li>
              )}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
