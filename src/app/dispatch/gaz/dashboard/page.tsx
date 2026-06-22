import React, { useMemo, useState } from 'react';
import { useDispatchGazStore, DashboardWidget } from '../../../../stores/useDispatchGazStore';
import { 
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Award, 
  Calendar, Layout, Plus, X, GripVertical, Settings2, Save, Info, Users
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
          return (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between hover:shadow-lg hover:border-slate-300/60 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
                <Wallet className="w-24 h-24 text-blue-600" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl text-blue-600"><Wallet className="w-6 h-6" /></div>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +12%
                </span>
              </div>
              <div className="relative z-10 mt-4">
                <p className="text-slate-500 text-sm font-semibold mb-1">{widget.title}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stats.dailySales.toLocaleString()} <span className="text-lg text-slate-400 font-bold">MAD</span></h3>
              </div>
            </div>
          );
        case 'stat-total':
          return (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between hover:shadow-lg hover:border-slate-300/60 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
                <TrendingUp className="w-24 h-24 text-indigo-600" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl text-indigo-600"><TrendingUp className="w-6 h-6" /></div>
              </div>
              <div className="relative z-10 mt-4">
                <p className="text-slate-500 text-sm font-semibold mb-1">{widget.title}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalSales.toLocaleString()} <span className="text-lg text-slate-400 font-bold">MAD</span></h3>
              </div>
            </div>
          );
        case 'stat-expenses':
          return (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between hover:shadow-lg hover:border-slate-300/60 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
                <ArrowDownRight className="w-24 h-24 text-red-600" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl text-red-600"><ArrowDownRight className="w-6 h-6" /></div>
              </div>
              <div className="relative z-10 mt-4">
                <p className="text-slate-500 text-sm font-semibold mb-1">{widget.title}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stats.totalExpenses.toLocaleString()} <span className="text-lg text-slate-400 font-bold">MAD</span></h3>
              </div>
            </div>
          );
        case 'stat-profit':
          return (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between hover:shadow-lg hover:border-slate-300/60 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
                <Award className="w-24 h-24 text-emerald-600" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl text-emerald-600"><Award className="w-6 h-6" /></div>
              </div>
              <div className="relative z-10 mt-4">
                <p className="text-slate-500 text-sm font-semibold mb-1">{widget.title}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stats.netProfit.toLocaleString()} <span className="text-lg text-slate-400 font-bold">MAD</span></h3>
              </div>
            </div>
          );
        case 'chart-evolution':
          return (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-6">{widget.title}</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="sales" name="Ventes" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        case 'ranking-drivers':
          return (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">{widget.title}</h3>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><Users className="w-5 h-5" /></div>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {driverRanking.map((driver, index) => (
                  <div key={driver.id} className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-100/50">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                      index === 0 ? 'bg-gradient-to-br from-amber-200 to-yellow-400 text-amber-900' : 
                      index === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700' : 
                      index === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-300 text-orange-900' : 'bg-white text-slate-400 border border-slate-200'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{driver.prenom} {driver.nom}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">{driver.qty} bouteilles</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900">{driver.revenue.toLocaleString()} <span className="text-xs text-slate-400">MAD</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'chart-profit-exp':
          return (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-6">{widget.title}</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: '600' }} />
                    <Bar dataKey="profit" name="Bénéfice" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expenses" name="Dépenses" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        case 'chart-exp-evolution':
          return (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)] h-full flex flex-col">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-6">{widget.title}</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="expenses" name="Dépenses" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 7 }} />
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
      <div key={widget.id} className={`relative group ${!widget.visible ? 'opacity-40 grayscale' : ''}`}>
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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Layout className="w-7 h-7" />
            </div>
            Tableau de Bord
          </h1>
          <p className="text-slate-500 font-medium mt-2">Analyse des performances et pilotage stratégique</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
            <button 
              onClick={() => setPeriod('week')}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${period === 'week' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semaine
            </button>
            <button 
              onClick={() => setPeriod('month')}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${period === 'month' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mois
            </button>
          </div>

          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border ${
              isEditMode 
                ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-sm'
            }`}
          >
            {isEditMode ? <Save className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
            {isEditMode ? 'Enregistrer' : 'Personnaliser'}
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 text-sm flex items-center gap-3">
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
