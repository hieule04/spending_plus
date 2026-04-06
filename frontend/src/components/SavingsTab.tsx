import { useState, useEffect } from "react";
import { 
  getSavings, createSaving, updateSaving, deleteSaving,
  listAccounts, createTransaction
} from "../service/api";
import FancySelect from "./FancySelect";
import ConfirmModal from "./ConfirmModal";
import CurrencyInput from "./CurrencyInput";
import MobilePageHeader from "./MobilePageHeader";
import { useLanguage } from "../context/LanguageContext";

type SavingsGoal = {
  id: string;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  is_completed?: boolean;
};

const toNumber = (value: number | string | null | undefined): number => {
  const normalized = typeof value === "string" ? Number(value) : value;
  return typeof normalized === "number" && Number.isFinite(normalized) ? normalized : 0;
};

interface SavingsTabProps {
  onOpenMobileMenu?: () => void;
}

export default function SavingsTab({ onOpenMobileMenu }: SavingsTabProps) {
  const { t, formatAmount } = useLanguage();
  
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  // Create/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  
  // Action Modal state (Deposit/Withdraw)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, accs] = await Promise.all([getSavings(), listAccounts()]);
      setGoals(data || []);
      setAccounts(accs || []);
    } catch (err: any) {
      setMessage({ text: err.message || t('common.loading'), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("refresh_transactions", fetchData);
    return () => window.removeEventListener("refresh_transactions", fetchData);
  }, [t]);

  const handleOpenModal = (goal: SavingsGoal | null = null) => {
    setEditingGoal(goal);
    setName(goal ? goal.name : "");
    setTargetAmount(goal ? goal.target_amount.toString() : "");
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    setIsSubmitting(true);
    
    const data = {
      name,
      target_amount: parseFloat(targetAmount)
    };

    try {
      if (editingGoal) {
        await updateSaving(editingGoal.id, data);
        setMessage({ text: t('sv.msg.update_success'), type: "success" });
      } else {
        await createSaving(data);
        setMessage({ text: t('sv.msg.create_success'), type: "success" });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setMessage({ text: editingGoal ? t('sv.msg.update_error') : t('sv.msg.create_error'), type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const openActionModal = (goal: SavingsGoal, type: 'deposit' | 'withdraw') => {
    setSelectedGoal(goal);
    setActionType(type);
    setAmount("");
    setSelectedAccount(accounts.length > 0 ? accounts[0].id : "");
    setIsActionModalOpen(true);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedAccount || !selectedGoal) return;
    setIsSubmitting(true);

    try {
      await createTransaction({
        amount: parseFloat(amount),
        type: actionType === 'deposit' ? 'expense' : 'income',
        date: new Date().toISOString(),
        note: `${actionType === 'deposit' ? t('sv.deposit_note') : t('sv.withdraw_note')}: ${selectedGoal.name}`,
        account_id: selectedAccount,
        savings_goal_id: selectedGoal.id
      });
      setIsActionModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent("refresh_accounts"));
    } catch (err: any) {
      setMessage({ text: t('common.error_load') || "Error", type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const confirmDeleteGoal = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteSaving(confirmDeleteId);
      setMessage({ text: t('sv.msg.delete_success'), type: "success" });
      fetchData();
    } catch (err: any) {
      setMessage({ text: t('sv.msg.delete_error'), type: "error" });
    } finally {
      setConfirmDeleteId(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const gridCardClass = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl";
  const textTitleClass = "text-slate-900 dark:text-white";
  const textSubClass = "text-slate-500 dark:text-slate-400";

  return (
    <div className="h-full flex flex-col relative w-full h-full p-2">
      <MobilePageHeader onOpenMobileMenu={onOpenMobileMenu} className="mb-4" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className={`text-4xl font-extrabold tracking-tight ${textTitleClass}`}>{t('sv.title')}</h2>
          <p className={`mt-2 ${textSubClass}`}>{t('sv.subtitle')}</p>
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
      ) : goals.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl flex flex-col items-center justify-center ${gridCardClass}`}>
          <p className={`text-lg font-bold mb-4 ${textTitleClass}`}>{t('sv.no_goals')}</p>
          <button 
            onClick={() => handleOpenModal()}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-xl font-bold transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-500 text-white shadow-lg md:h-auto md:w-auto md:px-6 md:py-3`}
            aria-label={t('sv.start')}
          >
            <span className="md:hidden">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className="hidden md:inline">{t('sv.start')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {goals.map((goal) => {
            const currentAmount = toNumber(goal.current_amount);
            const targetAmountValue = toNumber(goal.target_amount);
            const pct = targetAmountValue > 0 ? (currentAmount / targetAmountValue) * 100 : 0;
            const isCompleted = goal.is_completed ?? currentAmount >= targetAmountValue;
            const goldCardClass = isCompleted ? "bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800/50 shadow-amber-200/50" : "";
            const cardTitleClass = isCompleted ? "text-amber-900 dark:text-amber-400" : textTitleClass;
            const cardSubClass = isCompleted ? "text-amber-700 dark:text-amber-600" : textSubClass;

            return (
              <div key={goal.id} className={`${gridCardClass} ${goldCardClass} relative overflow-hidden group`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`font-black text-xl truncate ${cardTitleClass}`}>{goal.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? 'text-amber-600 dark:text-amber-400' : 'text-blue-500'}`}>
                        {isCompleted ? t('sv.completed') : t('sv.in_progress')}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(goal)} className="p-1.5 rounded-lg hover:bg-white/10 text-blue-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => setConfirmDeleteId(goal.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.347-9Zm5.485.058a.75.75 0 0 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
 
                <div className="flex justify-between items-end mb-2">
                  <div className={`font-semibold ${cardSubClass} text-sm`}>
                    <span className={`text-lg ${cardTitleClass}`}>
                      {formatAmount(currentAmount)}
                    </span> / {formatAmount(targetAmountValue)}
                  </div>
                  <div className={`text-xs font-black ${isCompleted ? 'text-amber-600' : 'text-blue-500'}`}>
                    {Math.min(pct, 100).toFixed(0)}%
                  </div>
                </div>

                <div className={`w-full h-3 rounded-full overflow-hidden mb-6 relative bg-slate-100 dark:bg-slate-900`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-in-out ${isCompleted ? 'bg-gradient-to-r from-amber-400 to-yellow-600' : 'bg-gradient-to-r from-blue-400 to-indigo-600'}`} 
                    style={{ width: `${Math.min(pct, 100)}%` }} 
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => openActionModal(goal, 'deposit')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-all active:scale-95`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    {t('sv.deposit')}
                  </button>
                  <button onClick={() => openActionModal(goal, 'withdraw')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-all active:scale-95`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                    {t('sv.withdraw')}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add New Savings Goal Card */}
          <button 
            onClick={() => handleOpenModal()}
            className={`bg-transparent border-dashed border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-3xl flex flex-col items-center justify-center min-h-[120px] md:min-h-[220px] transition-all group`}
            aria-label={t('sv.add_new')}
          >
            <div className={`hidden md:flex w-14 h-14 rounded-full items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:rotate-90 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
            <span className={`hidden md:inline font-black tracking-wide text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400`}>
              {t('sv.add_new')}
            </span>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 md:hidden">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={`relative w-full max-w-sm rounded-[2rem] p-8 animate-slide-up shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
            <h3 className={`text-2xl font-black mb-6 ${textTitleClass}`}>{editingGoal ? t('sv.edit') : t('sv.add_new')}</h3>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('sv.goal_name')}</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" placeholder={t('sv.goal_placeholder')} />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('sv.target_amount')}</label>
                <CurrencyInput
                  value={targetAmount}
                  onChange={setTargetAmount}
                  required
                  className="w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="20 000 000"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{t('common.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsActionModalOpen(false)}></div>
          <div className={`relative w-full max-w-sm rounded-[2rem] p-8 animate-slide-up shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
            <h3 className={`text-2xl font-black mb-2 ${textTitleClass}`}>{actionType === 'deposit' ? t('sv.deposit') : t('sv.withdraw')}</h3>
            <p className={`text-sm mb-6 ${textSubClass}`}>{t('sv.goal_name')}: <span className={textTitleClass}>{selectedGoal?.name}</span></p>
            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('sv.action_select_wallet')}</label>
                <FancySelect 
                  value={selectedAccount} 
                  onChange={(val) => setSelectedAccount(val)}
                  options={accounts.map((a) => ({ label: `${a.name} (${formatAmount(a.balance)})`, value: a.id }))}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('sv.action_amount')}</label>
                <CurrencyInput
                  value={amount}
                  onChange={setAmount}
                  required
                  className="w-full px-4 py-3 rounded-2xl outline-none font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="100 000"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsActionModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{t('common.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500">{t('common.confirm')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={confirmDeleteId !== null} title={t('sv.delete_confirm_title')} message={t('sv.delete_confirm_msg')} onConfirm={confirmDeleteGoal} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
}
