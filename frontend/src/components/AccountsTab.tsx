import { useState, useEffect, useCallback } from "react";
import { listAccounts, createAccount, updateAccount, deleteAccount } from "../service/api";
import ConfirmModal from "./ConfirmModal";
import FancySelect from "./FancySelect";
import CurrencyInput from "./CurrencyInput";
import { useLanguage } from "../context/LanguageContext";

interface Account { id: string; name: string; type: string; balance: number; created_at: string; }

export default function AccountsTab() {
  const { t, formatAmount } = useLanguage();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("cash");
  const [formBalance, setFormBalance] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try { 
      setLoading(true); 
      const data = await listAccounts(); 
      setAccounts(data || []); 
    } catch (err: any) { 
      setMessage({ text: err.message, type: "error" }); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const resetForm = () => { setFormName(""); setFormType("cash"); setFormBalance("0"); setEditingId(null); setShowForm(false); };
  const openEditForm = (acc: Account) => { setFormName(acc.name); setFormType(acc.type); setFormBalance(String(acc.balance)); setEditingId(acc.id); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setMessage(null);
    setIsSubmitting(true);
    try {
      if (editingId) { 
        await updateAccount(editingId, { name: formName, type: formType, balance: parseFloat(formBalance) }); 
        setMessage({ text: t('acc.msg.update_success'), type: "success" }); 
      }
      else { 
        await createAccount({ name: formName, type: formType, balance: parseFloat(formBalance) }); 
        setMessage({ text: t('acc.msg.create_success'), type: "success" }); 
      }
      resetForm(); 
      fetchAccounts();
    } catch (err: any) { 
      setMessage({ text: err.message, type: "error" }); 
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return; 
    setMessage(null);
    try { 
      await deleteAccount(confirmDelete); 
      setMessage({ text: t('acc.msg.delete_success'), type: "success" }); 
      fetchAccounts(); 
    } catch (err: any) { 
      setMessage({ text: err.message, type: "error" }); 
    } finally { 
      setConfirmDelete(null); 
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const typeLabel: Record<string, string> = { 
    cash: t('acc.type.cash').replace(/💵 /g, ''), 
    bank: t('acc.type.bank').replace(/🏦 /g, ''), 
    credit: t('acc.type.credit').replace(/💳 /g, ''), 
    saving: t('acc.type.savings').replace(/🐖 /g, ''), 
    "e-wallet": t('acc.type.ewallet').replace(/📱 /g, '') 
  };

  const typeIcon: Record<string, string> = {
    cash: "💵",
    bank: "🏦",
    credit: "💳",
    saving: "🐖",
    "e-wallet": "📱"
  };

  // Consistent UI Class names
  const gridCardClass = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl";
  const textTitleClass = "text-slate-900 dark:text-white";
  const textSubClass = "text-slate-500 dark:text-slate-400";
  const inputClass = 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 transition-all';

  return (
    <div className="h-full flex flex-col relative w-full p-2">
      {/* Header Area */}
      <div className="mb-8">
        <h2 className={`text-4xl font-extrabold tracking-tight ${textTitleClass}`}>{t('acc.title')}</h2>
        <p className={`mt-2 ${textSubClass}`}>{t('acc.subtitle') || 'Quản lý các nguồn tiền của bạn'}</p>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {accounts.map((acc) => (
            <div key={acc.id} className={`${gridCardClass} group relative`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                    {typeIcon[acc.type] || "💰"}
                  </div>
                  <div className="truncate">
                    <h3 className={`font-black text-xl truncate ${textTitleClass}`}>{acc.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-wider ${textSubClass}`}>{typeLabel[acc.type] || acc.type}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditForm(acc)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                  </button>
                  <button onClick={() => setConfirmDelete(acc.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.347-9Zm5.485.058a.75.75 0 0 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <p className={`text-xs font-bold uppercase tracking-widest ${textSubClass} mb-1`}>{t('acc.form.balance')}</p>
                <div className={`text-2xl font-black font-mono ${Number(acc.balance) >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                  {formatAmount(acc.balance)}
                </div>
              </div>
            </div>
          ))}

          {/* Add New Account Card */}
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className={`bg-transparent border-dashed border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-3xl flex flex-col items-center justify-center min-h-[160px] transition-all group`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all group-hover:scale-110 group-hover:rotate-90 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
            <span className={`font-black tracking-wide text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400`}>
              {t('acc.add_new')}
            </span>
          </button>
        </div>
      )}

      {/* Account Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm}></div>
          <div className={`relative w-full max-w-sm rounded-[2rem] p-8 animate-slide-up shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
            <h3 className={`text-2xl font-black mb-6 ${textTitleClass}`}>{editingId ? t('acc.action.edit') : t('acc.add_new')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-1 ${textSubClass}`}>{t('acc.form.name')}</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className={`w-full px-4 py-3 ${inputClass}`} placeholder={t('acc.form.placeholder.name')} />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1 ${textSubClass}`}>{t('acc.form.type')}</label>
                <FancySelect 
                  value={formType} 
                  onChange={(val) => setFormType(val)}
                  options={[
                    { label: t('acc.type.cash').replace(/💵 /g, ''), value: "cash" },
                    { label: t('acc.type.bank').replace(/🏦 /g, ''), value: "bank" },
                    { label: t('acc.type.ewallet').replace(/📱 /g, ''), value: "e-wallet" },
                    { label: t('acc.type.credit').replace(/💳 /g, ''), value: "credit" },
                    { label: t('acc.type.savings').replace(/🐖 /g, ''), value: "saving" }
                  ]}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1 ${textSubClass}`}>{t('acc.form.balance')}</label>
                <CurrencyInput
                  value={formBalance}
                  onChange={setFormBalance}
                  className={`w-full px-4 py-3 ${inputClass}`}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={resetForm} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300`}>{t('common.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg">
                  {isSubmitting ? t('common.saving') : (editingId ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} title={t('acc.delete_confirm_title')} message={t('acc.delete_confirm_msg')} onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
