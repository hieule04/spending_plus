import { useState, useEffect } from "react";
import { getBudgetReport, upsertBudget, listCategories, deleteBudget } from "../service/api";
import ConfirmModal from "./ConfirmModal";
import FancySelect from "./FancySelect";
import CurrencyInput from "./CurrencyInput";
import { useLanguage } from "../context/LanguageContext";

export default function BudgetsTab() {
  const { t, language, formatAmount } = useLanguage();
  
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
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    try {
      const [data, cats] = await Promise.all([getBudgetReport(month, year), listCategories()]);
      setReports(data || []);
      if (cats) {
        // Only expense categories for budgets
        setCategories(cats.filter((c: any) => c.type === 'expense'));
      }
    } catch (err: any) {
      setMessage({ text: err.message || t('bg.msg.load_error'), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (budget?: any) => {
    if (budget) {
      setEditingBudget(budget);
      setSelectedCategory(budget.category_id);
      setAmountLimit(budget.amount_limit.toString());
    } else {
      setEditingBudget(null);
      // Pre-select the first category if available
      setSelectedCategory(categories.length > 0 ? categories[0].id : "");
      setAmountLimit("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !amountLimit) {
      setMessage({ text: t('bg.msg.please_select'), type: "error" }); // Assuming this translation key exists or I'll add a default
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await upsertBudget({
        amount_limit: parseFloat(amountLimit),
        month,
        year,
        category_id: selectedCategory
      });
      if (res) {
        setMessage({ text: editingBudget ? t('bg.msg.update_success') : t('bg.msg.create_success'), type: "success" });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || t('bg.msg.save_error');
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const confirmDeleteBudget = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteBudget(confirmDeleteId);
      setMessage({ text: t('bg.msg.delete_success'), type: "success" });
      fetchData();
    } catch (err: any) {
      const errorMsg = err.message || t('common.error_load');
      setMessage({ text: `${t('bg.msg.delete_error')}: ${errorMsg}`, type: "error" });
    } finally {
      setConfirmDeleteId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };
  const gridCardClass = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl";
  
  const textTitleClass = "text-slate-900 dark:text-white";
  const textSubClass = "text-slate-500 dark:text-slate-400";
  const progressBgClass = "bg-slate-100 dark:bg-slate-900";
  const cardTitleClass = "text-slate-900 dark:text-white"; // Added for consistency with diff

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
            <FancySelect 
              value={month} 
              onChange={(val) => setMonth(Number(val))}
              options={Array.from({length: 12}, (_, i) => ({ label: `${t('common.month')} ${i + 1}`, value: i + 1 }))}
            />
          </div>
          <div className="w-28">
            <FancySelect 
              value={year} 
              onChange={(val) => setYear(Number(val))}
              options={[year-1, year, year+1].map(y => ({ label: String(y), value: y }))}
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl text-sm font-bold animate-fade-in ${
          message.type === "success" 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className={`text-center py-20 font-bold ${textSubClass}`}>{t('common.loading')}</div>
      ) : reports.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl flex flex-col items-center justify-center ${gridCardClass}`}>
          <p className={`text-lg font-bold mb-4 ${textTitleClass}`}>{t('bg.no_budgets')}</p>
          <button 
            onClick={handleOpenModal}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-500 text-white shadow-lg`}
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
            let textAlertClass = "text-emerald-500";
            
            if (pct >= 100) {
              progressColor = "bg-red-500";
              glowClass = "shadow-lg shadow-red-500/50";
              textAlertClass = "text-red-500 font-bold";
            } else if (pct >= 50) {
              progressColor = "bg-amber-400/80";
              textAlertClass = "text-amber-500";
            }
            
            const displayPercentage = pct > 0 && pct < 1 ? "< 1" : Math.min(pct, 100).toFixed(0);
            const exceedLimit = pct > 100;

            return (
              <div key={report.category_id} className={`${gridCardClass} group`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col truncate">
                    <h3 className={`font-black text-xl truncate ${textTitleClass}`}>{report.category_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(report)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                      </button>
                      <button onClick={() => setConfirmDeleteId(report.budget_id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.347-9Zm5.485.058a.75.75 0 0 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                    <div className={`text-sm tracking-widest uppercase font-bold px-2 py-1 rounded-lg bg-opacity-20 ${textAlertClass} bg-slate-100 dark:bg-slate-900`}>
                      {displayPercentage}%
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-2">
                  <div className={`font-semibold ${textSubClass} text-sm`}>
                    <span className={`text-lg ${cardTitleClass}`}>
                      {formatAmount(report.total_spent)}
                    </span> / {formatAmount(report.amount_limit)}
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
                    ? `${t('bg.over')} ${formatAmount(Math.abs(report.remaining))}` 
                    : `${t('bg.remaining')} ${formatAmount(report.remaining)}`}
                </div>
              </div>
            );
          })}

          {/* Add New Budget Card (Grid Item) */}
          <button 
            onClick={handleOpenModal}
            className={`bg-transparent border-dashed border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-3xl flex flex-col items-center justify-center min-h-[220px] transition-all group`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:rotate-90 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
            <span className={`font-bold tracking-wide text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400`}>
              {t('bg.add_new')}
            </span>
          </button>

        </div>
      )}

      {/* Setup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={`relative w-full max-w-sm rounded-[2rem] p-8 animate-slide-up shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
            <h3 className={`text-2xl font-black mb-6 ${textTitleClass}`}>
              {editingBudget ? t('bg.edit_title') : t('bg.setup_title')}
            </h3>
            <p className={`text-sm mb-6 ${textSubClass}`}>{t('bg.for_month')} {month}/{year}</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('bg.form.select_cat')}</label>
                <FancySelect 
                  value={selectedCategory} 
                  onChange={(val) => setSelectedCategory(val)}
                  options={categories.map((c) => ({ label: c.name, value: c.id }))}
                  placeholder={t('bg.form.placeholder.select_cat')}
                />
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('bg.form.limit')}</label>
                <CurrencyInput
                  value={amountLimit}
                  onChange={setAmountLimit}
                  required
                  className="w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder={t('bg.form.placeholder.limit')}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300`}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  } bg-blue-600 hover:bg-blue-500 shadow-blue-500/25`}
                >
                  {isSubmitting ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title={t('bg.delete_confirm_title')}
        message={t('bg.delete_confirm_msg')}
        onConfirm={confirmDeleteBudget}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
