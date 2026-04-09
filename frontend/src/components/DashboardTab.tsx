import { useState, useEffect } from "react";
import FancySelect from "./FancySelect";
import MobilePageHeader from "./MobilePageHeader";
import { getSummaryStats } from "../service/api";
import { 
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, 
  XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip,
  AreaChart, Area
} from "recharts";
import { useLanguage } from "../context/LanguageContext";

interface CategoryExpense { category_name: string; color: string; amount: number; }
interface ColumnData { name: string; income: number; expense: number; }
interface LineData { date: string; income: number; expense: number; }
interface SummaryStats { balance: number; total_income: number; total_expense: number; pie_data: CategoryExpense[]; column_data: ColumnData[]; line_data: LineData[]; }

interface DashboardTabProps {
  onOpenMobileMenu?: () => void;
}

export default function DashboardTab({ onOpenMobileMenu }: DashboardTabProps) {
  const { t, language, formatAmount } = useLanguage();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("month");
  const [refDate, setRefDate] = useState<Date>(new Date());
  const [activeChart, setActiveChart] = useState<"ratio" | "trend">("ratio");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());

  const periodOptions = [
    { value: 'all', label: t('db.period.all') },
    { value: 'day', label: t('db.period.day') },
    { value: 'week', label: language === 'vi' ? 'Tuần' : t('db.period.week') },
    { value: 'month', label: language === 'vi' ? 'Tháng' : t('db.period.month') },
    { value: 'year', label: language === 'vi' ? 'Năm' : t('db.period.year') },
  ];

  const fetchStats = async (selectedPeriod: string, dateObj: Date) => {
    try { 
      setLoading(true); 
      // Send date in ISO format (YYYY-MM-DD or full ISO)
      const dateStr = dateObj.toISOString();
      const data = await getSummaryStats(selectedPeriod, dateStr); 
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
    fetchStats(period, refDate);
    const handleRefresh = () => fetchStats(period, refDate);
    window.addEventListener("refresh_transactions", handleRefresh);
    return () => window.removeEventListener("refresh_transactions", handleRefresh);
  }, [period, refDate]);

  useEffect(() => {
    setShowDatePicker(false);
  }, [period]);

  // const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', { 
  //   style: 'currency', 
  //   currency: 'VND' 
  // }).format(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-xl shadow-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
          <p className="text-slate-900 dark:text-white font-bold mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="text-sm font-medium flex items-center justify-between gap-4">
              <span>{entry.name}:</span>
              <span>{formatAmount(Number(entry.value))}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handlePrev = () => {
    const newDate = new Date(refDate);
    if (period === "day") newDate.setDate(newDate.getDate() - 1);
    else if (period === "week") newDate.setDate(newDate.getDate() - 7);
    else if (period === "month") newDate.setMonth(newDate.getMonth() - 1);
    else if (period === "year") newDate.setFullYear(newDate.getFullYear() - 1);
    setRefDate(newDate);
    setPickerYear(newDate.getFullYear());
  };

  const handleNext = () => {
    const newDate = new Date(refDate);
    if (period === "day") newDate.setDate(newDate.getDate() + 1);
    else if (period === "week") newDate.setDate(newDate.getDate() + 7);
    else if (period === "month") newDate.setMonth(newDate.getMonth() + 1);
    else if (period === "year") newDate.setFullYear(newDate.getFullYear() + 1);
    setRefDate(newDate);
    setPickerYear(newDate.getFullYear());
  };

  const handleSelectMonth = (monthIndex: number) => {
    const nextDate = new Date(refDate);
    nextDate.setFullYear(pickerYear, monthIndex, 1);
    setRefDate(nextDate);
    setShowDatePicker(false);
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const getWeekStart = (value: Date) => {
    const date = new Date(value);
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diffToMonday);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const isSameWeek = (a: Date, b: Date) => isSameDay(getWeekStart(a), getWeekStart(b));

  const handleSelectDay = (value: Date) => {
    const nextDate = new Date(value);
    nextDate.setHours(0, 0, 0, 0);
    setRefDate(nextDate);
    setPickerYear(nextDate.getFullYear());
    setPickerMonth(nextDate.getMonth());
    setShowDatePicker(false);
  };

  const handleSelectWeek = (value: Date) => {
    const nextDate = getWeekStart(value);
    setRefDate(nextDate);
    setPickerYear(nextDate.getFullYear());
    setPickerMonth(nextDate.getMonth());
    setShowDatePicker(false);
  };

  const handleSelectYear = (year: number) => {
    const nextDate = new Date(year, 0, 1);
    setRefDate(nextDate);
    setPickerYear(year);
    setPickerMonth(0);
    setShowDatePicker(false);
  };

  const getCalendarWeeks = (year: number, month: number) => {
    const firstOfMonth = new Date(year, month, 1);
    const start = getWeekStart(firstOfMonth);
    return Array.from({ length: 6 }, (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(start);
        date.setDate(start.getDate() + weekIndex * 7 + dayIndex);
        return date;
      })
    );
  };

  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(pickerYear, index, 1);
    return {
      index,
      label: monthDate.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { month: "long" }),
    };
  });

  const calendarWeeks = getCalendarWeeks(pickerYear, pickerMonth);
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    const baseDate = new Date(2024, 0, 1 + index);
    return baseDate.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { weekday: "short" });
  });
  const yearOptions = Array.from({ length: 12 }, (_, index) => pickerYear - 4 + index);

  const renderDatePicker = () => {
    if (!showDatePicker || period === "all") return null;

    if (period === "day") {
      return (
        <div className="md:hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => {
              const next = new Date(pickerYear, pickerMonth - 1, 1);
              setPickerYear(next.getFullYear());
              setPickerMonth(next.getMonth());
            }} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all" aria-label="Previous month">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {new Date(pickerYear, pickerMonth, 1).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { month: "long", year: "numeric" })}
            </p>
            <button type="button" onClick={() => {
              const next = new Date(pickerYear, pickerMonth + 1, 1);
              setPickerYear(next.getFullYear());
              setPickerMonth(next.getMonth());
            }} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all" aria-label="Next month">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <span key={label} className="text-center text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarWeeks.flat().map((date) => {
              const isCurrentMonth = date.getMonth() === pickerMonth;
              const isSelected = isSameDay(date, refDate);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handleSelectDay(date)}
                  className={`flex aspect-square items-center justify-center rounded-2xl text-sm font-bold transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : isCurrentMonth
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900"
                        : "bg-slate-50 text-slate-400 dark:bg-slate-900/30 dark:text-slate-600"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (period === "week") {
      return (
        <div className="md:hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => {
              const next = new Date(pickerYear, pickerMonth - 1, 1);
              setPickerYear(next.getFullYear());
              setPickerMonth(next.getMonth());
            }} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all" aria-label="Previous month">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {new Date(pickerYear, pickerMonth, 1).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { month: "long", year: "numeric" })}
            </p>
            <button type="button" onClick={() => {
              const next = new Date(pickerYear, pickerMonth + 1, 1);
              setPickerYear(next.getFullYear());
              setPickerMonth(next.getMonth());
            }} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all" aria-label="Next month">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <span key={label} className="text-center text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">{label}</span>
            ))}
          </div>
          <div className="space-y-2">
            {calendarWeeks.map((week) => {
              const isSelected = week.some((date) => isSameWeek(date, refDate));
              return (
                <button
                  key={week[0].toISOString()}
                  type="button"
                  onClick={() => handleSelectWeek(week[0])}
                  className={`grid w-full grid-cols-7 gap-2 rounded-2xl p-2 text-sm font-bold transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  {week.map((date) => {
                    const isCurrentMonth = date.getMonth() === pickerMonth;
                    return (
                      <span key={date.toISOString()} className={`flex aspect-square items-center justify-center rounded-xl ${!isSelected && !isCurrentMonth ? "text-slate-400 dark:text-slate-600" : ""}`}>
                        {date.getDate()}
                      </span>
                    );
                  })}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (period === "month") {
      return (
        <div className="md:hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPickerYear((year) => year - 1)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
              aria-label="Previous year"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <p className="text-sm font-black text-slate-900 dark:text-white">{pickerYear}</p>
            <button
              type="button"
              onClick={() => setPickerYear((year) => year + 1)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
              aria-label="Next year"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {monthOptions.map((month) => {
              const isSelected = refDate.getFullYear() === pickerYear && refDate.getMonth() === month.index;
              return (
                <button
                  key={month.index}
                  type="button"
                  onClick={() => handleSelectMonth(month.index)}
                  className={`rounded-2xl px-3 py-3 text-sm font-bold capitalize transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  {month.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="md:hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => setPickerYear((year) => year - 12)} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all" aria-label="Previous years">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <p className="text-sm font-black text-slate-900 dark:text-white">{yearOptions[0]} - {yearOptions[yearOptions.length - 1]}</p>
          <button type="button" onClick={() => setPickerYear((year) => year + 12)} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all" aria-label="Next years">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {yearOptions.map((year) => {
            const isSelected = refDate.getFullYear() === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => handleSelectYear(year)}
                className={`rounded-2xl px-3 py-3 text-sm font-bold transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const formatCurrentPeriod = () => {
    if (period === "day") {
      return `${t('db.period.day')} ${refDate.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    }
    if (period === "week") {
      // Simple week calculation
      const firstDayOfYear = new Date(refDate.getFullYear(), 0, 1);
      const pastDaysOfYear = (refDate.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${language === 'vi' ? 'Tuần' : 'Week'} ${weekNum}, ${refDate.getFullYear()}`;
    }
    if (period === "month") {
      return `${language === 'vi' ? 'Tháng' : 'Month'} ${refDate.getMonth() + 1}, ${refDate.getFullYear()}`;
    }
    if (period === "year") {
      return `${t('db.period.year')} ${refDate.getFullYear()}`;
    }
    return t('db.period.all');
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`p-3 rounded-xl shadow-xl flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.fill }}></div>
          <span className="text-slate-600 dark:text-slate-300 font-medium">{data.name}:</span>
          <span className="text-slate-900 dark:text-white font-bold">{formatAmount(Number(data.value))}</span>
        </div>
      );
    }
    return null;
  };

  // Shared styles
  const cardClass = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl';
  const headingClass = 'text-slate-900 dark:text-white font-bold';
  const subTextClass = 'text-slate-500 dark:text-slate-400 font-bold';
  const gridColor = '#cbd5e1'; 
  const axisColor = '#475569'; 

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden animate-fade-in space-y-4 sm:space-y-6">
      <div className="flex-none md:hidden">
        <MobilePageHeader
          onOpenMobileMenu={onOpenMobileMenu}
          rightSlot={
            <FancySelect
              value={period}
              onChange={setPeriod}
              options={periodOptions}
              className="w-fit"
              buttonClassName="ml-auto inline-flex w-auto justify-end gap-2 border-none bg-transparent px-0 py-0 text-right shadow-none hover:border-transparent dark:bg-transparent"
              dropdownClassName="right-0 w-max min-w-[7.25rem] origin-top-right z-[70]"
              showCheckmark={false}
            />
          }
        />
      </div>
      
      {/* Time Filter Bar */}
      <div className={`hidden md:grid md:grid-cols-[auto_minmax(0,1fr)] md:items-center gap-4 rounded-2xl p-2 sm:p-2.5 shadow-sm ${cardClass}`}>
        <h2 className={`font-bold px-3 hidden sm:block ${headingClass}`}>{t('db.title')}</h2>
        <div className={`flex w-full justify-start overflow-x-auto rounded-xl bg-slate-100 p-1 hide-scrollbar dark:bg-slate-900/50 md:ml-auto md:w-auto`}>
          {periodOptions.map(p => (
            <button
              key={String(p.value)}
              onClick={() => setPeriod(String(p.value))}
              className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                period === p.value 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Date Navigator */}
      {period !== 'all' && (
        <>
          <div className="md:hidden flex items-center justify-between px-2">
            <button 
              onClick={handlePrev} 
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  setPickerYear(refDate.getFullYear());
                  setPickerMonth(refDate.getMonth());
                  setShowDatePicker((open) => !open);
                }}
                className="inline-flex items-center gap-1 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white"
              >
                <span>{formatCurrentPeriod()}</span>
                <svg className={`h-4 w-4 transition-transform ${showDatePicker ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7"></path></svg>
              </button>
            </div>

            <button 
              onClick={handleNext} 
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          {renderDatePicker()}
        </>
      )}

      <div className="mobile-scroll-region flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-2 hide-scrollbar md:overflow-hidden">
      {loading && !stats ? (
        <div className={`flex justify-center items-center h-48 p-6 rounded-2xl ${cardClass}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-900/30 text-center font-medium">⚠️ {error}</div>
      ) : stats ? (
        <div className="space-y-4 sm:space-y-6 md:flex md:h-full md:min-h-0 md:flex-col md:space-y-4">
          {/* 3 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-4 md:flex-none">
            <div className={`col-span-2 sm:col-span-1 py-5 px-6 sm:p-6 md:px-6 md:py-5 rounded-2xl shadow-sm relative overflow-hidden group bg-white dark:bg-slate-800 border border-slate-200 dark:border-blue-500/30 shadow-blue-500/5`}>
              <div className={`absolute -right-6 -top-6 w-24 h-24 sm:w-32 sm:h-32 md:w-28 md:h-28 rounded-full blur-2xl transition-all bg-blue-50 dark:bg-blue-500/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20`}></div>
              <h3 className={`text-sm md:text-sm font-bold mb-1 uppercase tracking-wide ${subTextClass}`}>{t('db.kpi.balance')}</h3>
              <p className={`text-3xl md:text-[1.7rem] font-extrabold leading-tight ${headingClass}`}>{formatAmount(stats.balance)}</p>
            </div>
            <div className={`col-span-1 py-5 px-5 sm:p-6 md:px-5 md:py-5 rounded-2xl shadow-sm relative overflow-hidden group bg-white dark:bg-slate-800 border border-slate-200 dark:border-emerald-500/30 shadow-emerald-500/5`}>
              <div className={`absolute -right-6 -top-6 w-24 h-24 sm:w-32 sm:h-32 md:w-28 md:h-28 rounded-full blur-2xl transition-all bg-emerald-50 dark:bg-emerald-500/10 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20`}></div>
              <h3 className={`text-[11px] sm:text-sm md:text-sm font-bold mb-1 uppercase tracking-wide ${subTextClass}`}>{t('db.kpi.income')}</h3>
              <p className="text-xl sm:text-2xl md:text-[1.35rem] font-bold leading-tight text-emerald-600 dark:text-emerald-400">+{formatAmount(stats.total_income)}</p>
            </div>
            <div className={`col-span-1 py-5 px-5 sm:p-6 md:px-5 md:py-5 rounded-2xl shadow-sm relative overflow-hidden group bg-white dark:bg-slate-800 border border-slate-200 dark:border-rose-500/30 shadow-rose-500/5`}>
              <div className={`absolute -right-6 -top-6 w-24 h-24 sm:w-32 sm:h-32 md:w-28 md:h-28 rounded-full blur-2xl transition-all bg-rose-50 dark:bg-rose-500/10 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20`}></div>
              <h3 className={`text-[11px] sm:text-sm md:text-sm font-bold mb-1 uppercase tracking-wide ${subTextClass}`}>{t('db.kpi.expense')}</h3>
              <p className="text-xl sm:text-2xl md:text-[1.35rem] font-bold leading-tight text-rose-600 dark:text-rose-400">-{formatAmount(stats.total_expense)}</p>
            </div>
          </div>

          <div className="md:hidden flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900/50 w-full">
            <button
              onClick={() => setActiveChart("ratio")}
              className={`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeChart === "ratio"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {t("db.chart.ratio")}
            </button>
            <button
              onClick={() => setActiveChart("trend")}
              className={`flex-1 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeChart === "trend"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {t("db.chart.trend")}
            </button>
          </div>

          <div className={`md:hidden rounded-3xl p-4 shadow-sm ${cardClass}`}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h3 className={`text-lg font-bold ${headingClass}`}>
                {activeChart === "ratio" ? t("db.chart.ratio") : t("db.chart.trend")}
              </h3>
            </div>

            {activeChart === "ratio" ? (
              <>
                {stats.pie_data && stats.pie_data.length > 0 ? (
                  <div className="chart-surface mx-auto h-72 w-full max-w-[32rem] animate-fade-in">
                    <PieChart responsive style={{ width: "100%", height: "100%" }}>
                      <Pie data={stats.pie_data} dataKey="amount" nameKey="category_name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3}>
                        {stats.pie_data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="none" />))}
                      </Pie>
                      <PieTooltip content={<CustomPieTooltip />} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    </PieChart>
                  </div>
                ) : (
                  <div className={`flex h-72 w-full max-w-[32rem] flex-col items-center justify-center animate-fade-in ${subTextClass}`}>
                    <p className="font-medium text-sm">{t('db.no_data')}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {stats.line_data && stats.line_data.length > 0 ? (
                  <div className="chart-surface relative mx-auto h-72 w-full max-w-[32rem] animate-fade-in">
                    <svg style={{ height: 0 }}>
                      <defs>
                        <linearGradient id="colorIncomeMobile" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorExpenseMobile" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                      </defs>
                    </svg>
                    <AreaChart responsive style={{ width: "100%", height: "100%" }} data={stats.line_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.2} />
                      <XAxis dataKey="date" stroke={axisColor} tick={{fill: axisColor, fontSize: 10}} axisLine={false} tickLine={false} tickMargin={10} minTickGap={20} />
                      <YAxis stroke={axisColor} tick={{fill: axisColor, fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(value) => { if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `${(value / 1000).toFixed(0)}k`; return value; }} width={35} />
                      <BarTooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="income" name={t('db.chart.income')} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncomeMobile)" />
                      <Area type="monotone" dataKey="expense" name={t('db.chart.expense')} stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenseMobile)" />
                    </AreaChart>
                  </div>
                ) : (
                  <div className={`flex h-72 w-full max-w-[32rem] flex-col items-center justify-center animate-fade-in ${subTextClass}`}>
                    <p className="font-medium">{t('db.no_transactions_period')}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden grid-cols-1 gap-4 md:grid md:min-h-0 md:flex-1 xl:grid-cols-2">
            <div className={`rounded-3xl p-4 shadow-sm sm:p-8 md:flex md:min-h-0 md:flex-col md:p-6 ${cardClass}`}>
              <div className="mb-5 flex items-center justify-between gap-4 md:flex-none">
                <h3 className={`text-lg md:text-base font-bold ${headingClass}`}>{t("db.chart.ratio")}</h3>
              </div>

              {stats.pie_data && stats.pie_data.length > 0 ? (
                <div className="chart-surface mx-auto h-64 w-full max-w-[42rem] animate-fade-in md:h-full md:min-h-0 md:flex-1 xl:h-72">
                  <PieChart responsive style={{ width: "100%", height: "100%" }}>
                    <Pie data={stats.pie_data} dataKey="amount" nameKey="category_name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3}>
                      {stats.pie_data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="none" />))}
                    </Pie>
                    <PieTooltip content={<CustomPieTooltip />} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  </PieChart>
                </div>
              ) : (
                <div className={`flex h-64 w-full max-w-[42rem] flex-col items-center justify-center animate-fade-in ${subTextClass} md:h-full md:min-h-0 md:flex-1 xl:h-72`}>
                  <p className="font-medium text-sm">{t('db.no_data')}</p>
                </div>
              )}
            </div>

            <div className={`rounded-3xl p-4 shadow-sm sm:p-8 md:flex md:min-h-0 md:flex-col md:p-6 ${cardClass}`}>
              <div className="mb-5 flex items-center justify-between gap-4 md:flex-none">
                <h3 className={`text-lg md:text-base font-bold ${headingClass}`}>{t("db.chart.trend")}</h3>
              </div>

              {stats.line_data && stats.line_data.length > 0 ? (
                <div className="chart-surface relative mx-auto h-64 w-full max-w-[42rem] animate-fade-in md:h-full md:min-h-0 md:flex-1 xl:h-72">
                  <svg style={{ height: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                    </defs>
                  </svg>
                  <AreaChart responsive style={{ width: "100%", height: "100%" }} data={stats.line_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} opacity={0.2} />
                    <XAxis dataKey="date" stroke={axisColor} tick={{fill: axisColor, fontSize: 10}} axisLine={false} tickLine={false} tickMargin={10} minTickGap={20} />
                    <YAxis stroke={axisColor} tick={{fill: axisColor, fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(value) => { if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `${(value / 1000).toFixed(0)}k`; return value; }} width={35} />
                    <BarTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="income" name={t('db.chart.income')} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" name={t('db.chart.expense')} stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </div>
              ) : (
                <div className={`flex h-64 w-full max-w-[42rem] flex-col items-center justify-center animate-fade-in ${subTextClass} md:h-full md:min-h-0 md:flex-1 xl:h-72`}>
                  <p className="font-medium">{t('db.no_transactions_period')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
