import { useState, useMemo } from 'react';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { 
  PieChart, 
  ChevronLeft, 
  ChevronRight, 
  Fuel, 
  Wrench, 
  CircleDot, 
  AlertTriangle, 
  MoreHorizontal,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatMAD } from '../../lib/formatters';
import { CategorieBudget } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function BudgetPage() {
  const budgets = useBudgetStore(s => s.budgets);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthBudgets = budgets.filter(b => b.mois === currentMonth);

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const realYearlyData = useMemo(() => {
    const data = [];
    const [year, month] = currentMonth.split('-').map(Number);
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('fr-FR', { month: 'short' });
      
      const mBudgets = budgets.filter(b => b.mois === mStr);
      const totalBudget = mBudgets.reduce((sum, b) => sum + b.montantAlloue, 0);
      const totalReel = mBudgets.reduce((sum, b) => sum + b.montantDepense, 0);
      
      data.push({
        name: monthName,
        budget: totalBudget,
        reel: totalReel
      });
    }
    return data;
  }, [budgets, currentMonth]);

  const getCategoryIcon = (category: CategorieBudget) => {
    switch (category) {
      case 'carburant': return <Fuel className="w-5 h-5" />;
      case 'maintenance': return <Wrench className="w-5 h-5" />;
      case 'pneus': return <CircleDot className="w-5 h-5" />;
      case 'infractions': return <AlertTriangle className="w-5 h-5" />;
      default: return <MoreHorizontal className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: CategorieBudget) => {
    switch (category) {
      case 'carburant': return 'bg-primary/10 text-primary';
      case 'maintenance': return 'bg-warning/10 text-warning';
      case 'pneus': return 'bg-info/10 text-info';
      case 'infractions': return 'bg-danger/10 text-danger';
      default: return 'bg-surface-2 text-text-secondary';
    }
  };

  const getCategoryName = (category: CategorieBudget) => {
    switch (category) {
      case 'carburant': return 'Carburant';
      case 'maintenance': return 'Maintenance';
      case 'pneus': return 'Pneus';
      case 'infractions': return 'Infractions';
      default: return 'Autre';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Budget
          </h1>
          <p className="text-text-secondary mt-1">Suivi des dépenses et allocations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface border border-border rounded-lg shadow-sm">
            <button onClick={handlePrevMonth} className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-l-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 font-medium text-text-primary min-w-[140px] text-center capitalize">
              {formatMonthYear(currentMonth)}
            </div>
            <button onClick={handleNextMonth} className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-r-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Définir les budgets</span>
            <span className="sm:hidden">Définir</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {monthBudgets.map((b) => {
          const pct = b.montantAlloue > 0 ? (b.montantDepense / b.montantAlloue) * 100 : 0;
          const remaining = b.montantAlloue - b.montantDepense;
          
          let progressColor = 'bg-success';
          if (pct > 90) progressColor = 'bg-danger';
          else if (pct > 75) progressColor = 'bg-warning';

          return (
            <motion.div 
              key={b.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-lg ${getCategoryColor(b.categorie)}`}>
                  {getCategoryIcon(b.categorie)}
                </div>
                <h3 className="text-lg font-bold text-text-primary">{getCategoryName(b.categorie)}</h3>
              </div>
              
              <dl className="flex flex-wrap gap-x-8 gap-y-3 mb-6">
                <div>
                  <dt className="text-sm text-text-secondary mb-1">Alloué</dt>
                  <dd className="text-lg font-bold text-text-primary tabular-nums whitespace-nowrap">{formatMAD(b.montantAlloue)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-text-secondary mb-1">Dépensé</dt>
                  <dd className="text-lg font-bold text-text-primary tabular-nums whitespace-nowrap">{formatMAD(b.montantDepense)}</dd>
                </div>
              </dl>

              <div className="mt-auto">
                <div className="flex justify-between text-sm mb-2">
                  <span className={remaining < 0 ? 'text-danger font-medium' : 'text-text-secondary'}>
                    {remaining < 0 ? 'Dépassement de ' : 'Reste '}
                    {formatMAD(Math.abs(remaining))}
                  </span>
                  <span className="font-medium text-text-primary">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${progressColor}`} 
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm h-[400px] flex flex-col">
        <h3 className="text-lg font-bold text-text-primary mb-4">Budget vs Réel (12 derniers mois)</h3>
        <div className="flex-1 w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={realYearlyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} dx={-10} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip 
                cursor={{ fill: 'var(--color-surface-2)' }}
                contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                formatter={(value: number) => [formatMAD(value), '']}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="budget" name="Budget Alloué" fill="var(--color-border-strong)" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="reel" name="Dépenses Réelles" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
