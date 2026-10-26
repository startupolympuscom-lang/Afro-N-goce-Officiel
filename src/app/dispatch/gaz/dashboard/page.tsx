import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatchGazStore, DashboardWidget, DEFAULT_DASHBOARD_WIDGETS, GlobalStockItem } from '../../../../stores/useDispatchGazStore';
import {
  Wallet, TrendingUp, Receipt, Scale, ArrowUpRight, ArrowDownRight, Minus,
  Plus, X, GripVertical, Settings2, Save, Info, ChevronRight, type LucideIcon
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

const DAY = 24 * 60 * 60 * 1000;
const BRAND = '#0B5C9C';
const NAVY = '#364C6C';
const MUTED = '#CBD5E1';

const cardClass = 'bg-white rounded-xl border border-slate-200 shadow-xs h-full';
const axisTick = { fontSize: 12, fill: '#94a3b8' };
const tooltipStyle = { backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(15 23 42 / 0.08)', fontSize: 12 };
const COMPANY_LABELS: Record<string, string> = { afro_negoce: 'Afro Négoce', chakirine_gaz: 'Chakirine Gaz' };
const PAYMENT_LABELS: Record<string, string> = { espece: 'Espèces', cheque: 'Chèque', credit: 'Crédit' };
const TITLES = new Map(DEFAULT_DASHBOARD_WIDGETS.map(w => [w.id, w.title]));

const mad = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} MAD`;
const compactMad = (value: number) => (Math.abs(value) >= 1000 ? `${(value / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k` : `${value}`);
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const inRange = (date: string, from: number, to: number) => { const t = new Date(date).getTime(); return t >= from && t < to; };
// null when there is nothing to compare with (no activity in the previous period).
const change = (current: number, previous: number) => (previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / Math.abs(previous)) * 100);

function Delta({ value, label, fallback, inverse = false }: { value: number | null; label: string; fallback: string; inverse?: boolean }) {
  if (value === null) return <p className="text-xs text-slate-400 truncate">{fallback}</p>;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const favourable = inverse ? value < 0 : value > 0;
  const tone = value === 0 ? 'text-slate-500' : favourable ? 'text-emerald-700' : 'text-red-600';
  return (
    <p className="flex items-center gap-1.5 text-xs min-w-0">
      <span className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${tone}`}>
        <Icon className="w-3.5 h-3.5" />
        {Math.abs(value).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %
      </span>
      <span className="text-slate-400 truncate">{label}</span>
    </p>
  );
}

// Compact on purpose: KPI widgets are two grid rows (130 px) high, including in layouts users have saved.
function StatWidget({ title, value, icon: Icon, footer }: { title: string; value: number; icon: LucideIcon; footer: React.ReactNode }) {
  return (
    <div className={`${cardClass} p-4 lg:p-5 flex flex-col justify-between`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-slate-500 truncate">{title}</span>
        <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0"><Icon className="w-4 h-4" /></span>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-900 truncate tabular-nums">
        {Math.round(value).toLocaleString('fr-FR')} <span className="text-sm font-medium text-slate-400">MAD</span>
      </div>
      {footer}
    </div>
  );
}

function WidgetHeader({ title, subtitle, aside }: { title: string; subtitle?: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-slate-900 truncate">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

const sumStock = (items: GlobalStockItem[], category: string) => items
  .filter(i => i.category === category)
  .reduce((acc, i) => ({ full: acc.full + i.full, empty: acc.empty + i.empty }), { full: 0, empty: 0 });

export default function DispatchDashboardPage() {
  const { sales, expenses, drivers, clients, brands, globalStock, comptoirStock, dashboardWidgets, updateDashboardWidgets } = useDispatchGazStore();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [isEditMode, setIsEditMode] = useState(false);
  const days = period === 'week' ? 7 : 30;
  const periodLabel = `sur ${days} jours`;

  const widgets = useMemo(
    () => [...dashboardWidgets, ...DEFAULT_DASHBOARD_WIDGETS.filter(d => !dashboardWidgets.some(w => w.id === d.id))],
    [dashboardWidgets]
  );

  // Current period = the last `days` days including today, compared with the `days` days before it.
  const stats = useMemo(() => {
    const today = startOfToday();
    const tomorrow = today + DAY;
    const currentStart = tomorrow - days * DAY;
    const previousStart = currentStart - days * DAY;
    const revenue = (from: number, to: number) => sales.filter(s => inRange(s.date, from, to)).reduce((sum, s) => sum + s.totalPrice, 0);
    const spent = (from: number, to: number) => expenses.filter(e => inRange(e.date, from, to)).reduce((sum, e) => sum + e.amount, 0);

    const todaySales = sales.filter(s => inRange(s.date, today, tomorrow));
    const dailySales = todaySales.reduce((sum, s) => sum + s.totalPrice, 0);
    const dailyQty = todaySales.reduce((sum, s) => sum + s.quantity, 0);
    const periodSales = revenue(currentStart, tomorrow);
    const periodExpenses = spent(currentStart, tomorrow);
    const previousSales = revenue(previousStart, currentStart);
    const previousExpenses = spent(previousStart, currentStart);
    const netProfit = periodSales - periodExpenses;

    return {
      currentStart,
      dailySales,
      dailyQty,
      dailyChange: change(dailySales, revenue(today - DAY, today)),
      periodSales,
      salesChange: change(periodSales, previousSales),
      periodExpenses,
      expensesChange: change(periodExpenses, previousExpenses),
      netProfit,
      margin: periodSales > 0 ? (netProfit / periodSales) * 100 : null,
    };
  }, [sales, expenses, days]);

  const chartData = useMemo(() => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const from = startOfToday() - i * DAY;
      const daySales = sales.filter(s => inRange(s.date, from, from + DAY)).reduce((sum, s) => sum + s.totalPrice, 0);
      const dayExpenses = expenses.filter(e => inRange(e.date, from, from + DAY)).reduce((sum, e) => sum + e.amount, 0);
      data.push({
        name: new Date(from).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        sales: daySales,
        expenses: dayExpenses,
        profit: daySales - dayExpenses,
      });
    }
    return data;
  }, [sales, expenses, days]);

  const driverRanking = useMemo(() => {
    const periodSales = sales.filter(s => new Date(s.date).getTime() >= stats.currentStart);
    return drivers.map(driver => {
      const driverSales = periodSales.filter(s => s.driverId === driver.id);
      return {
        ...driver,
        revenue: driverSales.reduce((sum, s) => sum + s.totalPrice, 0),
        qty: driverSales.reduce((sum, s) => sum + s.quantity, 0),
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [drivers, sales, stats.currentStart]);

  const stockRows = useMemo(() => {
    const categories = Array.from(new Set<string>(globalStock.map(i => i.category)));
    return categories.map(category => ({ category, depot: sumStock(globalStock, category), comptoir: sumStock(comptoirStock, category) }));
  }, [globalStock, comptoirStock]);

  const recentSales = useMemo(
    () => [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6),
    [sales]
  );

  const onLayoutChange = (currentLayout: any) => {
    if (!isEditMode) return;
    const updatedWidgets = widgets.map(widget => {
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
    const updatedWidgets = widgets.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    updateDashboardWidgets(updatedWidgets);
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.visible && !isEditMode) return null;
    const title = TITLES.get(widget.id) ?? widget.title;

    const content = () => {
      switch (widget.id) {
        case 'stat-daily':
          return (
            <StatWidget
              title={title}
              value={stats.dailySales}
              icon={Wallet}
              footer={<Delta value={stats.dailyChange} label={`vs hier · ${stats.dailyQty} bouteille${stats.dailyQty > 1 ? 's' : ''}`} fallback={`${stats.dailyQty} bouteille${stats.dailyQty > 1 ? 's' : ''} vendue${stats.dailyQty > 1 ? 's' : ''} aujourd'hui`} />}
            />
          );
        case 'stat-total':
          return <StatWidget title={title} value={stats.periodSales} icon={TrendingUp} footer={<Delta value={stats.salesChange} label={`vs ${days} j précédents`} fallback={`Aucune vente les ${days} j précédents`} />} />;
        case 'stat-expenses':
          return <StatWidget title={title} value={stats.periodExpenses} icon={Receipt} footer={<Delta value={stats.expensesChange} label={`vs ${days} j précédents`} fallback={`Aucune dépense les ${days} j précédents`} inverse />} />;
        case 'stat-profit':
          return (
            <StatWidget
              title={title}
              value={stats.netProfit}
              icon={Scale}
              footer={
                <p className="text-xs text-slate-400 truncate">
                  {stats.margin === null ? 'Aucune vente sur la période' : <>Marge <span className="font-semibold text-slate-600 tabular-nums">{stats.margin.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %</span> {periodLabel}</>}
                </p>
              }
            />
          );
        case 'chart-evolution':
          return (
            <div className={`${cardClass} p-5 lg:p-6 flex flex-col`}>
              <WidgetHeader
                title={title}
                subtitle={`Ventes par jour, ${periodLabel}`}
                aside={<p className="text-lg font-semibold text-slate-900 tabular-nums whitespace-nowrap">{mad(stats.periodSales)}</p>}
              />
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -8, right: 8 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND} stopOpacity={0.16}/>
                        <stop offset="95%" stopColor={BRAND} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={10} minTickGap={16} />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={compactMad} width={48} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => mad(v)} />
                    <Area type="monotone" dataKey="sales" name="Ventes" stroke={BRAND} strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" animationDuration={600} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        case 'ranking-drivers': {
          const best = driverRanking[0]?.revenue || 0;
          return (
            <div className={`${cardClass} p-5 lg:p-6 flex flex-col`}>
              <WidgetHeader title={title} subtitle={`Chiffre d'affaires ${periodLabel}`} />
              <div className="flex-1 overflow-y-auto -mx-2 px-2 custom-scrollbar divide-y divide-slate-100">
                {driverRanking.map((driver, index) => (
                  <div key={driver.id} className="flex items-center gap-3 py-3">
                    <span className="w-5 text-sm font-medium text-slate-400 tabular-nums text-right shrink-0">{index + 1}</span>
                    <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold flex items-center justify-center shrink-0">
                      {`${driver.prenom.charAt(0)}${driver.nom.charAt(0)}`.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{driver.prenom} {driver.nom}</p>
                        <p className="text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">{mad(driver.revenue)}</p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${best > 0 ? (driver.revenue / best) * 100 : 0}%` }} />
                        </div>
                        <p className="text-xs text-slate-500 whitespace-nowrap">
                          {driver.qty} bouteille{driver.qty > 1 ? 's' : ''}{driver.company ? ` · ${COMPANY_LABELS[driver.company]}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {driverRanking.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Aucun chauffeur enregistré.</p>}
              </div>
            </div>
          );
        }
        case 'chart-profit-exp':
          return (
            <div className={`${cardClass} p-5 lg:p-6 flex flex-col`}>
              <WidgetHeader title={title} subtitle={`Par jour, ${periodLabel}`} />
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -8, right: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={10} minTickGap={16} />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={compactMad} width={48} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => mad(v)} cursor={{ fill: '#f8fafc' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} formatter={(value) => <span className="text-slate-600">{value}</span>} />
                    <Bar dataKey="profit" name="Résultat" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={600} />
                    <Bar dataKey="expenses" name="Dépenses" fill={MUTED} radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={600} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        case 'chart-exp-evolution':
          return (
            <div className={`${cardClass} p-5 lg:p-6 flex flex-col`}>
              <WidgetHeader
                title={title}
                subtitle={`Sorties de caisse par jour, ${periodLabel}`}
                aside={<p className="text-lg font-semibold text-slate-900 tabular-nums whitespace-nowrap">{mad(stats.periodExpenses)}</p>}
              />
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ left: -8, right: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={10} minTickGap={16} />
                    <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={compactMad} width={48} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => mad(v)} />
                    <Line type="monotone" dataKey="expenses" name="Dépenses" stroke={NAVY} strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={600} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        case 'stock-overview': {
          const totals = stockRows.reduce((acc, r) => ({ full: acc.full + r.depot.full, empty: acc.empty + r.depot.empty, comptoir: acc.comptoir + r.comptoir.full }), { full: 0, empty: 0, comptoir: 0 });
          return (
            <div className={`${cardClass} p-5 lg:p-6 flex flex-col`}>
              <WidgetHeader
                title={title}
                subtitle="Bouteilles pleines et vides, toutes sociétés"
                aside={
                  <Link to="/dispatch/gaz/stock" className="inline-flex items-center gap-0.5 text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap">
                    Stocks <ChevronRight className="w-4 h-4" />
                  </Link>
                }
              />
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4">
                {stockRows.map(({ category, depot, comptoir }) => {
                  const total = depot.full + depot.empty;
                  return (
                    <div key={category}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-900">Bouteille {category.replace(/kg$/i, ' kg')}</span>
                        <span className="text-slate-500 tabular-nums">
                          <span className="font-semibold text-slate-900">{depot.full}</span> pleines · {depot.empty} vides
                        </span>
                      </div>
                      <div className="mt-2 flex h-2 rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-blue-600" style={{ width: `${total > 0 ? (depot.full / total) * 100 : 0}%` }} />
                        <div className="bg-slate-300" style={{ width: `${total > 0 ? (depot.empty / total) * 100 : 0}%` }} />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400 tabular-nums">Comptoir : {comptoir.full} pleines · {comptoir.empty} vides</p>
                    </div>
                  );
                })}
                {stockRows.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Aucun stock configuré.</p>}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                {([['Pleines (dépôt)', totals.full], ['Vides (dépôt)', totals.empty], ['Pleines (comptoir)', totals.comptoir]] as const).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-lg font-semibold text-slate-900 tabular-nums">{value.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        case 'recent-sales':
          return (
            <div className={`${cardClass} p-5 lg:p-6 flex flex-col`}>
              <WidgetHeader title={title} subtitle="Six dernières ventes enregistrées" />
              <div className="flex-1 min-h-0 overflow-auto custom-scrollbar -mx-5 lg:-mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-slate-500 border-b border-slate-100">
                      <th className="font-medium py-2 pl-5 lg:pl-6 pr-3">Date</th>
                      <th className="font-medium py-2 px-3">Client</th>
                      <th className="font-medium py-2 px-3 hidden sm:table-cell">Produit</th>
                      <th className="font-medium py-2 pl-3 pr-5 lg:pr-6 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentSales.map(sale => {
                      const date = new Date(sale.date);
                      const isToday = date.getTime() >= startOfToday();
                      const client = clients.find(c => c.id === sale.clientId);
                      const driver = drivers.find(d => d.id === sale.driverId);
                      const brand = brands.find(b => b.id === sale.brandId);
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 pl-5 lg:pl-6 pr-3 text-slate-500 whitespace-nowrap tabular-nums">
                            {isToday ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px]">
                            <p className="font-medium text-slate-900 truncate">{client?.name ?? 'Client comptoir'}</p>
                            <p className="text-xs text-slate-400 truncate">{driver ? `${driver.prenom} ${driver.nom}` : 'Comptoir'}</p>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap hidden sm:table-cell">{sale.quantity} × {brand?.name ?? ''} {sale.category}</td>
                          <td className="py-2.5 pl-3 pr-5 lg:pr-6 text-right whitespace-nowrap">
                            <p className="font-semibold text-slate-900 tabular-nums">{mad(sale.totalPrice)}</p>
                            <p className={`text-xs ${sale.paymentMethod === 'credit' ? 'font-medium text-amber-700' : 'text-slate-400'}`}>
                              {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {recentSales.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Aucune vente enregistrée pour le moment.</p>}
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
              aria-label={widget.visible ? `Masquer ${title}` : `Afficher ${title}`}
              className={`p-1.5 rounded-full shadow-md border transition-colors ${widget.visible ? 'bg-white text-slate-400 hover:text-red-600 border-slate-200' : 'bg-blue-600 text-white border-blue-600'}`}
            >
              {widget.visible ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </button>
            <div className="p-1.5 bg-white rounded-full shadow-md border border-slate-200 text-slate-400 cursor-grab active:cursor-grabbing">
              <GripVertical className="w-3 h-3" />
            </div>
          </div>
        )}
        {content()}
      </div>
    );
  };

  const layout = useMemo(() => {
    return widgets.map(w => ({
      i: w.id,
      x: w.layout.x,
      y: w.layout.y,
      w: w.layout.w,
      h: w.layout.h
    }));
  }, [widgets]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">
            <span className="first-letter:uppercase inline-block">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="hidden sm:inline"> · Afro Négoce et Chakirine Gaz</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200" role="group" aria-label="Période">
            {([['week', '7 jours'], ['month', '30 jours']] as const).map(([value, label]) => (
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
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm flex items-center gap-3">
          <Info className="w-5 h-5 shrink-0" />
          <p>Mode édition : vous pouvez <strong>déplacer</strong>, <strong>redimensionner</strong> ou <strong>masquer</strong> les éléments du tableau de bord.</p>
        </div>
      )}

      <ResponsiveGridLayout
        className="layout -mx-2.5"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={60}
        draggableHandle=".cursor-grab"
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={onLayoutChange}
      >
        {widgets.map(widget => renderWidget(widget))}
      </ResponsiveGridLayout>
    </div>
  );
}
