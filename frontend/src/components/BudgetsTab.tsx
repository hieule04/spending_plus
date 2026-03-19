import { useState, useEffect } from "react";
import { getBudgetReport, upsertBudget, listCategories } from "../service/api";
import GlassSelect from "./GlassSelect";
import { useGlassTheme } from "../hooks/useGlassTheme";
import { useLanguage } from "../context/LanguageContext";

export default function BudgetsTab() {
  const isGlass = useGlassTheme();
  const { t, language } = useLanguage();
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amountLimit, setAmountLimit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    window.addEventListener("refresh_budgets", fetchData);
    window.addEventListener("refresh_transactions", fetchData); // refresh if new tx happens
    return () => {
      window.removeEventListener("refresh_budgets", fetchData);
      window.removeEventListener("refresh_transactions", fetchData);
    };
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    const data = await getBudgetReport(month, year);
    if (data) setReports(data);
    
    const cats = await listCategories();
    if (cats) {
      // Only expense categories for budgets
      setCategories(cats.filter((c: any) => c.type === 'expense'));
    }
    setLoading(false);
  };

  const handleOpenModal = () => {
    setSelectedCategory("");
    setAmountLimit("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !amountLimit) return;
    setIsSubmitting(true);
    await upsertBudget({
      amount_limit: parseFloat(amountLimit),
      month,
      year,
      category_id: selectedCategory
    });
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  // Glass styling classes based on Liquid Glass iOS 26 requirements
  const gridCardClass = isGlass 
    ? "glass-card p-6" 
    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl";
  
  const textTitleClass = isGlass ? "text-white drop-shadow-md" : "text-slate-900 dark:text-white";
  const textSubClass = isGlass ? "text-white drop-shadow-md" : "text-slate-500 dark:text-slate-400";
  const progressBgClass = isGlass ? "bg-white/10 border border-white/10" : "bg-slate-100 dark:bg-slate-900";

  return (
    <div className="h-full flex flex-col relative w-full h-full p-2">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className={`text-4xl font-extrabold tracking-tight ${textTitleClass}`}>{t('bg.title')}</h2>
          <p className={`mt-2 ${textSubClass}`}>{t('bg.subtitle')}</p>
        </div>
        
        {/* Month/Year Filter */}
        <div className="flex items-center gap-3">
          <div className="w-32">
            <GlassSelect 
              value={month} 
              onChange={(val) => setMonth(Number(val))}
              options={Array.from({length: 12}, (_, i) => ({ label: `${t('common.month')} ${i + 1}`, value: i + 1 }))}
            />
          </div>
          <div className="w-28">
            <GlassSelect 
              value={year} 
              onChange={(val) => setYear(Number(val))}
              options={[year-1, year, year+1].map(y => ({ label: String(y), value: y }))}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-20 font-bold ${textSubClass}`}>{t('common.loading')}</div>
      ) : reports.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl flex flex-col items-center justify-center ${gridCardClass}`}>
          <p className={`text-lg font-bold mb-4 ${textTitleClass}`}>{t('bg.no_budgets')}</p>
          <button 
            onClick={handleOpenModal}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
              isGlass ? "bg-white/10 hover:bg-white/20 text-white border border-white/20" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            {t('bg.add_first')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {reports.map((report) => {
            const pct = report.percentage;
            // Progress logic
            let progressColor = "bg-emerald-400/80"; // < 50%
            let glowClass = "";
            let textAlertClass = isGlass ? "text-emerald-300" : "text-emerald-500";
            
            if (pct >= 100) {
              progressColor = "bg-red-500";
              glowClass = isGlass ? "shadow-[0_0_15px_rgba(239,68,68,0.6)]" : "shadow-lg shadow-red-500/50";
              textAlertClass = isGlass ? "text-red-400 font-bold" : "text-red-500 font-bold";
            } else if (pct >= 50) {
              progressColor = "bg-amber-400/80";
              textAlertClass = isGlass ? "text-amber-300" : "text-amber-500";
            }
            
            const displayPercentage = pct > 0 && pct < 1 ? "< 1" : Math.min(pct, 100).toFixed(0);
            const exceedLimit = pct > 100;

            return (
              <div key={report.category_id} className={gridCardClass}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-black text-xl truncate ${textTitleClass}`}>{report.category_name}</h3>
                  <div className={`text-sm tracking-widest uppercase font-bold px-2 py-1 rounded-lg bg-opacity-20 ${textAlertClass} ${isGlass ? "bg-white/10" : "bg-slate-100 dark:bg-slate-900"}`}>
                    {displayPercentage}%
                  </div>
                </div>

                <div className="flex justify-between items-end mb-2">
                  <div className={`font-semibold ${textSubClass} text-sm`}>
                    <span className={textTitleClass}>{report.total_spent.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</span> / {report.amount_limit.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}đ
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div className={`w-full h-3 rounded-full overflow-hidden mb-3 relative ${progressBgClass}`}>
                  {/* Progress Fill */}
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-in-out ${progressColor} ${glowClass}`} 
                    style={{ width: `${Math.min(pct, 100)}%` }} 
                  />
                </div>
                
                <div className={`text-xs font-semibold text-right ${exceedLimit ? textAlertClass : textSubClass}`}>
                  {exceedLimit 
                    ? `${t('bg.over')} ${Math.abs(report.remaining).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}đ` 
                    : `${t('bg.remaining')} ${report.remaining.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}đ`}
                </div>
              </div>
            );
          })}

          {/* Add New Budget Card (Grid Item) */}
          <button 
            onClick={handleOpenModal}
            className={`${isGlass ? "glass-card border-dashed border-2 border-white/20 hover:bg-white/15" : "bg-transparent border-dashed border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-3xl"} flex flex-col items-center justify-center min-h-[220px] transition-all group`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:rotate-90 ${isGlass ? "bg-white/10 text-white shadow-[0_4px_12px_rgba(255,255,255,0.05)]" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"}`}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
            <span className={`font-bold tracking-wide ${isGlass ? "text-white group-hover:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"}`}>
              {t('bg.add_new')}
            </span>
          </button>

        </div>
      )}

      {/* Setup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={`relative w-full max-w-sm rounded-[2rem] p-8 animate-slide-up shadow-2xl ${
            isGlass 
              ? "glass-panel bg-white/10" 
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          }`}>
            <h3 className={`text-2xl font-black mb-6 ${textTitleClass}`}>{t('bg.setup_title')}</h3>
            <p className={`text-sm mb-6 ${textSubClass}`}>{t('bg.for_month')} {month}/{year}</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('bg.form.select_cat')}</label>
                <GlassSelect 
                  value={selectedCategory} 
                  onChange={(val) => setSelectedCategory(val)}
                  options={categories.map((c) => ({ label: c.name, value: c.id }))}
                  placeholder={t('bg.form.placeholder.select_cat')}
                />
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('bg.form.limit')} (VNĐ)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="1000"
                  value={amountLimit}
                  onChange={(e) => setAmountLimit(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all ${
                    isGlass ? "glass-input" : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  }`}
                  placeholder={t('bg.form.placeholder.limit')}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                    isGlass ? "bg-white/10 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  } ${isGlass ? "bg-blue-500/80 hover:bg-blue-500 shadow-blue-500/20" : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/25"}`}
                >
                  {isSubmitting ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
