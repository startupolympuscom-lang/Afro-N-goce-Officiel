import React, { useMemo, useState } from 'react';
import { useDispatchGazStore, DashboardWidget } from '../../../../stores/useDispatchGazStore';
import { 
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Award, 
  Calendar, Layout, Plus, X, GripVertical, Settings2, Save, Info
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
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Wallet className="w-5 h-5" /></div>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3 h-3" /> +12%
                </span>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{widget.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.dailySales.toLocaleString()} MAD</h3>
              </div>
            </div>
          );
        case 'stat-total':
          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><TrendingUp className="w-5 h-5" /></div>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{widget.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.totalSales.toLocaleString()} MAD</h3>
              </div>
            </div>
          );
        case 'stat-expenses':
          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-red-50 rounded-lg text-red-600"><ArrowDownRight className="w-5 h-5" /></div>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{widget.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.totalExpenses.toLocaleString()} MAD</h3>
              </div>
            </div>
          );
        case 'stat-profit':
          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Award className="w-5 h-5" /></div>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{widget.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.netProfit.toLocaleString()} MAD</h3>
              </div>
            </div>
          );
        case 'chart-evolution':
          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
              <h3 className="font-bold text-slate-900 mb-6">{widget.title}</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="sales" name="Ventes" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        case 'ranking-drivers':
          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
              <h3 className="font-bold text-slate-900 mb-6">{widget.title}</h3>
              <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                {driverRanking.map((driver, index) => (
                  <div key={driver.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                      index === 1 ? 'bg-slate-100 text-slate-700' : 
                      index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{driver.prenom} {driver.nom}</p>
                      <p className="text-xs text-slate-500">{driver.qty} bouteilles</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{driver.revenue.toLocaleString()} MAD</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'chart-profit-exp':
          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
              <h3 className="font-bold text-slate-900 mb-6">{widget.title}</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Bar dataKey="profit" name="Bénéfice" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        case 'chart-exp-evolution':
          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
              <h3 className="font-bold text-slate-900 mb-6">{widget.title}</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Line type="monotone" dataKey="expenses" name="Dépenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layout className="w-6 h-6 text-blue-600" />
            Tableau de Bord
          </h1>
          <p className="text-slate-500 text-sm mt-1">Analyse des performances et pilotage stratégique</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setPeriod('week')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'week' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Semaine
            </button>
            <button 
              onClick={() => setPeriod('month')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'month' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Mois
            </button>
          </div>

          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
              isEditMode 
                ? 'bg-emerald-600 border-emerald-700 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isEditMode ? <Save className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
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
