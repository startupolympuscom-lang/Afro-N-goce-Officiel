import React, { useMemo, useState } from 'react';
import { useDispatchGazStore, DashboardWidget } from '../../../../stores/useDispatchGazStore';
import { 
  Wallet, TrendingUp, ArrowDownRight, Award, 
  Plus, X, GripVertical, Settings2, Save, Info, Users, type LucideIcon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line 
} from 'recharts';
import GridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// @ts-ignore - Handle potential Vite/CJS export issues
const RGLResponsive = Responsive || GridLayout.Responsive;
// @ts-ignore
const RGLWidthProvider = WidthProvider || GridLayout.WidthProvider;

const ResponsiveGridLayout = RGLWidthProvider(RGLResponsive);

const cardClass = 'bg-white rounded-xl border border-slate-200 shadow-xs h-full';
const axisTick = { fontSize: 12, fill: '#94a3b8' };
const tooltipStyle = { backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(15 23 42 / 0.08)', fontSize: 12 };

// Compact on purpose: KPI widgets are two grid rows (130 px) high, including in layouts users have saved.
function StatWidget({ title, value, icon: Icon, tone }: { title: string; value: number; icon: LucideIcon; tone: string }) {
  return (
    <div className={`${cardClass} p-5 flex flex-col justify-between`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <span className={`p-2 rounded-lg ${tone}`}><Icon className="w-4 h-4" /></span>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-900 truncate tabular-nums">
        {value.toLocaleString('fr-FR')} <span className="text-sm font-medium text-slate-400">MAD</span>
      </div>
    </div>
  );
}

export default function DispatchDashboardPage() {
  const { sales, expenses, drivers, dashboardWidgets, updateDashboardWidgets } = useDispatchGazStore();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [isEditMode, setIsEditMode] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    
    const dailySales = sales
      .filter(s => new Date(s.date).toDateString() === today)
      .reduce((sum, s) => sum + s.totalPrice, 0);
    
    const totalSales = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSales - totalExpenses;

    return { dailySales, totalSales, totalExpenses, netProfit };
  }, [sales, expenses]);

  // Chart data calculation
  const chartData = useMemo(() => {
    const days = period === 'week' ? 7 : 30;
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      const daySales = sales
        .filter(s => new Date(s.date).toDateString() === d.toDateString())
        .reduce((sum, s) => sum + s.totalPrice, 0);
      
      const dayExpenses = expenses
        .filter(e => new Date(e.date).toDateString() === d.toDateString())
        .reduce((sum, e) => sum + e.amount, 0);

      data.push({
        name: dateStr,
        sales: daySales,
        expenses: dayExpenses,
        profit: daySales - dayExpenses
      });
    }
    return data;
  }, [sales, expenses, period]);

  // Driver ranking
  const driverRanking = useMemo(() => {
    return drivers.map(driver => {
      const driverSales = sales.filter(s => s.driverId === driver.id);
      const revenue = driverSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const qty = driverSales.reduce((sum, s) => sum + s.quantity, 0);
      return { ...driver, revenue, qty };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [drivers, sales]);

  const onLayoutChange = (currentLayout: any) => {
    if (!isEditMode) return;
    const updatedWidgets = dashboardWidgets.map(widget => {
      const layoutItem = currentLayout.find((item: any) => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          layout: { x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h }
        };
      }
      return widget;
    });
    updateDashboardWidgets(updatedWidgets);
  };

  const toggleWidgetVisibility = (id: string) => {
    const updatedWidgets = dashboardWidgets.map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    updateDashboardWidgets(updatedWidgets);
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.visible && !isEditMode) return null;

    const content = () => {
      switch (widget.id) {
        case 'stat-daily':
          return <StatWidget title={widget.title} value={stats.dailySales} icon={Wallet} tone="bg-blue-50 text-blue-600" />;
        case 'stat-total':
          return <StatWidget title={widget.title} value={stats.totalSales} icon={TrendingUp} tone="bg-blue-50 text-blue-600" />;
        case 'stat-expenses':
          return <StatWidget title={widget.title} value={stats.totalExpenses} icon={ArrowDownRight} tone="bg-red-50 text-red-600" />;
        case 'stat-profit':
          return <StatWidget title={widget.title} value={stats.netProfit} icon={Award} tone="bg-emerald-50 text-emerald-600" />;
        case 'chart-evolution':
          return (
            <div className={`${cardClass} p-5 lg:p-6 flex flex-col`}>
              <h3 className="font-semibold text-slate-900 text-base mb-5">{widget.title}</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.18}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} dx={-10} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="sales" name="Ventes" stroke="var(--color-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        case 'ranking-drivers':
          return (
            <div className={`${cardClass} p-5 lg:p-6 flex flex-col`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900 text-base">{widget.title}</h3>
                <span className="p-2 bg-slate-100 rounded-lg text-slate-500"><Users className="w-4 h-4" /></span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {driverRanking.map((driver, index) => (
                  <div key={driver.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm ${
                      index === 0 ? 'bg-amber-100 text-amber-800' : 
                      index === 1 ? 'bg-slate-200 text-slate-700' : 
                      index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-white text-slate-400 border border-slate-200'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{driver.prenom} {driver.nom}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{driver.qty} bouteilles</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">{driver.revenue.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">MAD</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'chart-profit-exp':
          return (
            <div className={`${cardClass} p-5 lg:p-6 flex flex-col`}>
              <h3 className="font-semibold text-slate-900 text-base mb-5">{widget.title}</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} dx={-10} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                    <Bar dataKey="profit" name="Bénéfice" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expenses" name="Dépenses" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        case 'chart-exp-evolution':
          return (
            <div className={`${cardClass} p-5 lg:p-6 flex flex-col`}>
              <h3 className="font-semibold text-slate-900 text-base mb-5">{widget.title}</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} dx={-10} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="expenses" name="Dépenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div key={widget.id} className={`relative group h-full ${!widget.visible ? 'opacity-40 grayscale' : ''}`}>
        {isEditMode && (
          <div className="absolute -top-2 -right-2 z-50 flex gap-1">
            <button 
              onClick={() => toggleWidgetVisibility(widget.id)}
              className={`p-1.5 rounded-full shadow-lg border transition-all ${widget.visible ? 'bg-white text-slate-400 hover:text-red-500' : 'bg-blue-500 text-white'}`}
            >
              {widget.visible ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </button>
            <div className="p-1.5 bg-white rounded-full shadow-lg border text-slate-400 cursor-grab active:cursor-grabbing">
              <GripVertical className="w-3 h-3" />
            </div>
          </div>
        )}
        {content()}
      </div>
    );
  };

  const layout = useMemo(() => {
    return dashboardWidgets.map(w => ({
      i: w.id,
      x: w.layout.x,
      y: w.layout.y,
      w: w.layout.w,
      h: w.layout.h
    }));
  }, [dashboardWidgets]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Performances commerciales et pilotage de l'activité gaz</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200" role="group" aria-label="Période">
            {([['week', 'Semaine'], ['month', 'Mois']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                aria-pressed={period === value}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${period === value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 h-10 px-4 rounded-lg font-medium text-sm transition-colors border ${
              isEditMode 
                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isEditMode ? <Save className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
            {isEditMode ? 'Enregistrer' : 'Personnaliser'}
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-sm flex items-center gap-3">
          <Info className="w-5 h-5" />
          <p>Mode édition actif : Vous pouvez <strong>déplacer</strong>, <strong>redimensionner</strong> ou <strong>masquer</strong> les éléments de votre tableau de bord.</p>
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={60}
        draggableHandle=".cursor-grab"
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={onLayoutChange}
      >
        {dashboardWidgets.map(widget => renderWidget(widget))}
      </ResponsiveGridLayout>
    </div>
  );
}
