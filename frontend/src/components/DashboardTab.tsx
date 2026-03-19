import { useState, useEffect } from "react";
import { getSummaryStats } from "../service/api";
import { 
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { useLanguage } from "../context/LanguageContext";

interface CategoryExpense { category_name: string; color: string; amount: number; }
interface ColumnData { name: string; income: number; expense: number; }
interface LineData { date: string; income: number; expense: number; }
interface SummaryStats { balance: number; total_income: number; total_expense: number; pie_data: CategoryExpense[]; column_data: ColumnData[]; line_data: LineData[]; }

export default function DashboardTab() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("month");
  const [isGlass, setIsGlass] = useState(false);

  useEffect(() => {
    const check = () => setIsGlass(localStorage.getItem("app-theme") === "glass");
    check();
    window.addEventListener("theme_changed", check);
    return () => window.removeEventListener("theme_changed", check);
  }, []);

  const fetchStats = async (selectedPeriod: string) => {
    try { 
      setLoading(true); 
      const data = await getSummaryStats(selectedPeriod); 
      if (data) { 
        setStats(data); 
        setError(null); 
      } 
    } catch (err: any) { 
      setError(err.message || t('db.error_load')); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchStats(period);
    const handleRefresh = () => fetchStats(period);
    window.addEventListener("refresh_transactions", handleRefresh);
    return () => window.removeEventListener("refresh_transactions", handleRefresh);
  }, [period]);

  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-xl shadow-xl ${isGlass ? 'glass-tooltip' : 'bg-slate-800 border border-slate-700'}`}>
          <p className="text-white font-bold mb-2 pb-2 border-b border-slate-700">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="text-sm font-medium flex items-center justify-between gap-4">
              <span>{entry.name}:</span>
              <span>{formatCurrency(Number(entry.value))}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`p-3 rounded-xl shadow-xl flex items-center gap-3 ${isGlass ? 'glass-tooltip' : 'bg-slate-800 border border-slate-700'}`}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.fill }}></div>
          <span className="text-white font-medium">{data.name}:</span>
          <span className="text-white font-bold">{formatCurrency(Number(data.value))}</span>
        </div>
      );
    }
    return null;
  };

  // Shared styles
  const cardClass = isGlass ? 'glass-card' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm';
  const headingClass = isGlass ? 'text-white drop-shadow-md' : 'text-slate-900 dark:text-white font-bold';
  const subTextClass = isGlass ? 'text-white drop-shadow-md' : 'text-slate-600 dark:text-slate-400 font-bold';
  const gridColor = isGlass ? 'rgba(255,255,255,0.06)' : '#cbd5e1'; 
  const axisColor = isGlass ? 'rgba(255,255,255,0.4)' : '#475569'; 

  return (
    <div className="space-y-6 animate-fade-in mb-6">
      
      {/* Time Filter Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-2 sm:p-2.5 rounded-2xl shadow-sm ${cardClass}`}>
        <h2 className={`font-bold px-3 hidden sm:block ${headingClass}`}>{t('db.title')}</h2>
        <div className={`flex p-1 rounded-xl w-full sm:w-auto overflow-x-auto hide-scrollbar ${
          isGlass ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-900/50'
        }`}>
          {[
            { id: 'all', label: t('db.period.all') },
            { id: 'day', label: t('db.period.day') },
            { id: 'week', label: t('db.period.week') },
            { id: 'month', label: t('db.period.month') },
            { id: 'year', label: t('db.period.year') }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                isGlass
                  ? (period === p.id ? 'bg-white/10 text-white shadow-sm' : 'text-white hover:text-white')
                  : (period === p.id 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200')
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !stats ? (
        <div className={`flex justify-center items-center h-48 p-6 rounded-2xl ${cardClass}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 text-center font-medium">⚠️ {error}</div>
      ) : stats ? (
        <>
          {/* 3 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl shadow-sm relative overflow-hidden group ${
              isGlass ? 'glass-card' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-blue-500/30 shadow-blue-500/5'
            }`}>
              <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl transition-all ${
                isGlass ? 'bg-blue-500/10 group-hover:bg-blue-500/20' : 'bg-blue-50 dark:bg-blue-500/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20'
              }`}></div>
              <h3 className={`text-sm font-bold mb-2 uppercase tracking-wide ${subTextClass}`}>{t('db.kpi.balance')}</h3>
              <p className={`text-3xl font-extrabold ${headingClass}`}>{formatCurrency(stats.balance)}</p>
            </div>
            <div className={`p-6 rounded-2xl shadow-sm relative overflow-hidden group ${
              isGlass ? 'glass-card' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-emerald-500/30 shadow-emerald-500/5'
            }`}>
              <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl transition-all ${
                isGlass ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20'
              }`}></div>
              <h3 className={`text-sm font-bold mb-2 uppercase tracking-wide ${subTextClass}`}>{t('db.kpi.income')}</h3>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(stats.total_income)}</p>
            </div>
            <div className={`p-6 rounded-2xl shadow-sm relative overflow-hidden group ${
              isGlass ? 'glass-card' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-rose-500/30 shadow-rose-500/5'
            }`}>
              <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl transition-all ${
                isGlass ? 'bg-rose-500/10 group-hover:bg-rose-500/20' : 'bg-rose-50 dark:bg-rose-500/10 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20'
              }`}></div>
              <h3 className={`text-sm font-bold mb-2 uppercase tracking-wide ${subTextClass}`}>{t('db.kpi.expense')}</h3>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">-{formatCurrency(stats.total_expense)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 sm:p-8 rounded-3xl shadow-sm ${cardClass}`}>
              <h3 className={`text-lg font-bold mb-6 ${headingClass}`}>{t('db.chart.ratio')}</h3>
              {stats.pie_data && stats.pie_data.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.pie_data} dataKey="amount" nameKey="category_name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3}>
                        {stats.pie_data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="none" />))}
                      </Pie>
                      <PieTooltip content={<CustomPieTooltip />} />
                      <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: '10px', color: isGlass ? 'rgba(255,255,255,0.7)' : undefined }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-48 ${subTextClass}`}>
                  <p className="font-medium text-sm">{t('db.no_data')}</p>
                </div>
              )}
            </div>

            <div className={`p-6 sm:p-8 rounded-3xl shadow-sm ${cardClass}`}>
              <h3 className={`text-lg font-bold mb-6 ${headingClass}`}>{t('db.chart.compare')}</h3>
              {stats.column_data && (stats.column_data[0].income > 0 || stats.column_data[0].expense > 0) ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.column_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.2} />
                      <XAxis dataKey="name" stroke={axisColor} tick={{fill: axisColor, fontWeight: 600}} axisLine={false} tickLine={false} />
                      <BarTooltip content={<CustomTooltip />} cursor={{fill: isGlass ? 'rgba(255,255,255,0.03)' : 'rgba(51, 65, 85, 0.1)'}} />
                      <Legend wrapperStyle={{ paddingTop: '20px', color: isGlass ? 'rgba(255,255,255,0.7)' : undefined }} />
                      <Bar dataKey="income" name={t('db.chart.income')} fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={80} />
                      <Bar dataKey="expense" name={t('db.chart.expense')} fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={80} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-48 ${subTextClass}`}><p className="font-medium text-sm">{t('db.no_data')}</p></div>
              )}
            </div>
          </div>

          <div className={`p-6 sm:p-8 rounded-3xl shadow-sm mt-6 ${cardClass}`}>
            <h3 className={`text-lg font-bold mb-6 ${headingClass}`}>{t('db.chart.trend')}</h3>
            {stats.line_data && stats.line_data.length > 0 ? (
              <div className="h-80 w-full relative">
                <svg style={{ height: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                  </defs>
                </svg>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.line_data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.2} />
                    <XAxis dataKey="date" stroke={axisColor} tick={{fill: axisColor, fontSize: 12}} axisLine={false} tickLine={false} tickMargin={10} minTickGap={20} />
                    <YAxis stroke={axisColor} tick={{fill: axisColor, fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(value) => { if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `${(value / 1000).toFixed(0)}k`; return value; }} />
                    <BarTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px', color: isGlass ? 'rgba(255,255,255,0.7)' : undefined }} />
                    <Area type="monotone" dataKey="income" name={t('db.chart.income')} stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" name={t('db.chart.expense')} stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center h-64 ${subTextClass}`}>
                <p className="font-medium">{t('db.no_transactions_period')}</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
