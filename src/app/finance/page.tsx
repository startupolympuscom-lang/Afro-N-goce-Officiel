import React, { useMemo, useState } from 'react';
import { useCarburantStore } from '../../stores/useCarburantStore';
import { useChargeVariableStore } from '../../stores/useChargeVariableStore';
import { useMaintenanceStore } from '../../stores/useMaintenanceStore';
import { usePneuStore } from '../../stores/usePneuStore';
import { useInfractionStore } from '../../stores/useInfractionStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useVehiculeStore } from '../../stores/useVehiculeStore';
import { 
  TrendingUp, 
  Car, 
  Fuel, 
  Wallet, 
  Wrench, 
  CircleDot, 
  AlertTriangle, 
  FileText,
  Search,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { formatMAD, formatDate } from '../../lib/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPieChart,
  Pie
} from 'recharts';

type ExpenditureCategory = 'carburant' | 'charge_variable' | 'maintenance' | 'pneu' | 'infraction' | 'document';

interface Expenditure {
  id: string;
  vehiculeId: string;
  category: ExpenditureCategory;
  amount: number;
  date: string;
  description: string;
}

export default function FinancePage() {
  const { tickets } = useCarburantStore();
  const { charges } = useChargeVariableStore();
  const { maintenances } = useMaintenanceStore();
  const { pneus } = usePneuStore();
  const { infractions } = useInfractionStore();
  const { documents } = useDocumentStore();
  const { vehicules } = useVehiculeStore();

  const [selectedVehiculeId, setSelectedVehiculeId] = useState<string>('all');

  // Aggregate all expenditures
  const allExpenditures = useMemo(() => {
    const exps: Expenditure[] = [];

    // Carburant
    tickets.forEach(t => {
      exps.push({
        id: t.id,
        vehiculeId: t.vehiculeId,
        category: 'carburant',
        amount: t.coutTotal,
        date: t.dateHeure,
        description: `Plein carburant - ${t.volume}L`
      });
    });

    // Charges Variables
    charges.forEach(c => {
      exps.push({
        id: c.id,
        vehiculeId: c.vehiculeId,
        category: 'charge_variable',
        amount: c.montant,
        date: c.date,
        description: c.description
      });
    });

    // Maintenances
    maintenances.forEach(m => {
      exps.push({
        id: m.id,
        vehiculeId: m.vehiculeId,
        category: 'maintenance',
        amount: m.coutReel || m.coutEstime,
        date: m.dateRealisation || m.datePrevue,
        description: `Maintenance - ${m.type}: ${m.description}`
      });
    });

    // Pneus
    pneus.forEach(p => {
      exps.push({
        id: p.id,
        vehiculeId: p.vehiculeId,
        category: 'pneu',
        amount: p.cout,
        date: p.dateMontage,
        description: `Remplacement Pneu - ${p.position} (${p.marque})`
      });
    });

    // Infractions
    infractions.forEach(i => {
      exps.push({
        id: i.id,
        vehiculeId: i.vehiculeId,
        category: 'infraction',
        amount: i.montant,
        date: i.date,
        description: `Infraction - ${i.type}: ${i.lieu}`
      });
    });

    // Documents
    documents.filter(d => d.entiteType === 'vehicule').forEach(d => {
      if (d.cout && d.cout > 0) {
        exps.push({
          id: d.id,
          vehiculeId: d.entiteId,
          category: 'document',
          amount: d.cout,
          date: d.dateEmission,
          description: `Document - ${d.type}`
        });
      }
    });

    return exps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tickets, charges, maintenances, pneus, infractions, documents]);

  // Statistics
  const stats = useMemo(() => {
    const filtered = selectedVehiculeId === 'all' 
      ? allExpenditures 
      : allExpenditures.filter(e => e.vehiculeId === selectedVehiculeId);

    const total = filtered.reduce((acc, curr) => acc + curr.amount, 0);
    
    const byCategory = filtered.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<ExpenditureCategory, number>);

    const categoryStats = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const highestCategory = categoryStats.length > 0 ? categoryStats[0] : null;

    // By Vehicle
    const byVehicle = allExpenditures.reduce((acc, curr) => {
      acc[curr.vehiculeId] = (acc[curr.vehiculeId] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const vehicleStats = Object.entries(byVehicle)
      .map(([id, value]) => {
        const v = vehicules.find(vh => vh.id === id);
        return {
          id,
          name: v ? `${v.marque} ${v.modele} (${v.immatriculation})` : 'Véhicule inconnu',
          value
        };
      })
      .sort((a, b) => b.value - a.value);

    return { 
      total, 
      categoryStats, 
      highestCategory, 
      vehicleStats,
      filteredExpenditures: filtered 
    };
  }, [allExpenditures, selectedVehiculeId, vehicules]);

  const COLORS = ['#0B5C9C', '#8CC63F', '#F59E0B', '#EF4444', '#0891B2', '#8B5CF6', '#6B7280'];

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'carburant': return 'Carburant';
      case 'charge_variable': return 'Charges Var.';
      case 'maintenance': return 'Maintenance';
      case 'pneu': return 'Pneus';
      case 'infraction': return 'Infractions';
      case 'document': return 'Documents';
      default: return cat;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'carburant': return <Fuel className="w-4 h-4 text-primary" />;
      case 'charge_variable': return <Wallet className="w-4 h-4 text-amber-500" />;
      case 'maintenance': return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'pneu': return <CircleDot className="w-4 h-4 text-purple-500" />;
      case 'infraction': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'document': return <FileText className="w-4 h-4 text-slate-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            Tableau de Bord Financier
          </h1>
          <p className="text-text-secondary text-sm mt-1">Analyse détaillée des dépenses de la flotte</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <select
              value={selectedVehiculeId}
              onChange={(e) => setSelectedVehiculeId(e.target.value)}
              className="pl-9 h-11 pr-10 rounded-xl border border-border bg-surface text-sm font-bold text-text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer"
            >
              <option value="all">Tous les véhicules</option>
              {vehicules.map(v => (
                <option key={v.id} value={v.id}>
                  {v.marque} {v.modele} ({v.immatriculation})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between group hover:border-primary transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
              <ArrowUpRight className="w-3 h-3" />
              Depense Totale
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">{formatMAD(stats.total)}</div>
            <div className="text-xs text-slate-500 font-medium">Cumul de toutes les catégories</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between group hover:border-amber-500 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
              {stats.highestCategory ? getCategoryIcon(stats.highestCategory.name) : <Wallet className="w-6 h-6 text-amber-500" />}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wider">
              Poste Majeur
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-black text-slate-900">
              {stats.highestCategory ? getCategoryLabel(stats.highestCategory.name) : 'N/A'}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {stats.highestCategory ? formatMAD(stats.highestCategory.value) : 'Aucune donnée'}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between group hover:border-indigo-500 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Car className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">
              Véhicule le plus coûteux
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-black text-slate-900 truncate max-w-full">
              {stats.vehicleStats.length > 0 ? stats.vehicleStats[0].name : 'N/A'}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {stats.vehicleStats.length > 0 ? formatMAD(stats.vehicleStats[0].value) : 'Aucune donnée'}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between group hover:border-slate-400 transition-all">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-50 rounded-xl">
              <Search className="w-6 h-6 text-slate-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">{stats.filteredExpenditures.length}</div>
            <div className="text-xs text-slate-500 font-medium">Transactions enregistrées</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenditure by Category Chart */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Dépenses par catégorie
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={stats.categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${getCategoryLabel(name)} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => formatMAD(value)}
                  labelFormatter={(name) => getCategoryLabel(name as string)}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vehicles by Expenditure */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-600" />
            Dépenses par véhicule
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.vehicleStats.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tick={{ fontSize: 10, fontWeight: 700 }}
                />
                <RechartsTooltip 
                  formatter={(value: number) => formatMAD(value)}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expenditures Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Historique des dépenses
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest bg-white border border-border px-3 py-1 rounded-full text-text-secondary">
            {stats.filteredExpenditures.length} transactions
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-text-secondary text-[10px] uppercase font-black tracking-widest border-b border-border">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Véhicule</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.filteredExpenditures.slice(0, 20).map((exp) => {
                const vehicle = vehicules.find(v => v.id === exp.vehiculeId);
                return (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-text-primary">
                        {formatDate(exp.date)}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {new Date(exp.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                          {getCategoryIcon(exp.category)}
                        </div>
                        <span className="text-sm font-bold text-text-primary">{getCategoryLabel(exp.category)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-text-primary">{vehicle?.immatriculation || 'N/A'}</div>
                      <div className="text-[10px] text-text-muted">{vehicle?.marque} {vehicle?.modele}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-secondary line-clamp-1">{exp.description}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-black text-slate-900">{formatMAD(exp.amount)}</div>
                    </td>
                  </tr>
                );
              })}
              {stats.filteredExpenditures.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted italic">
                    Aucune dépense enregistrée pour cette sélection
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {stats.filteredExpenditures.length > 20 && (
          <div className="p-4 bg-slate-50 border-t border-border text-center">
            <button className="text-sm font-bold text-primary hover:underline">
              Voir toutes les dépenses
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
