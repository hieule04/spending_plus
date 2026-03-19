import { useState, useEffect, useCallback } from "react";
import { listAccounts, createAccount, updateAccount, deleteAccount } from "../service/api";
import ConfirmModal from "./ConfirmModal";
import GlassSelect from "./GlassSelect";
import { useGlassTheme } from "../hooks/useGlassTheme";
import { useLanguage } from "../context/LanguageContext";

interface Account { id: string; name: string; type: string; balance: number; created_at: string; }

export default function AccountsTab() {
  const { t, language } = useLanguage();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("cash");
  const [formBalance, setFormBalance] = useState("0");
  const isGlass = useGlassTheme();

  const fetchAccounts = useCallback(async () => {
    try { setLoading(true); const data = await listAccounts(); setAccounts(data || []); } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const resetForm = () => { setFormName(""); setFormType("cash"); setFormBalance("0"); setEditingId(null); setShowForm(false); };
  const openEditForm = (acc: Account) => { setFormName(acc.name); setFormType(acc.type); setFormBalance(String(acc.balance)); setEditingId(acc.id); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage(null);
    try {
      if (editingId) { await updateAccount(editingId, { name: formName, type: formType, balance: parseFloat(formBalance) }); setMessage({ text: t('acc.msg.update_success'), type: "success" }); }
      else { await createAccount({ name: formName, type: formType, balance: parseFloat(formBalance) }); setMessage({ text: t('acc.msg.create_success'), type: "success" }); }
      resetForm(); fetchAccounts();
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return; setMessage(null);
    try { await deleteAccount(confirmDelete); setMessage({ text: t('acc.msg.delete_success'), type: "success" }); fetchAccounts(); } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setConfirmDelete(null); }
  };

  const typeLabel: Record<string, string> = { 
    cash: t('acc.type.cash'), 
    bank: t('acc.type.bank'), 
    credit: t('acc.type.credit'), 
    saving: t('acc.type.savings'), 
    "e-wallet": t('acc.type.ewallet') 
  };

  // Glass-aware classes
  const cardClass = isGlass ? 'glass-card' : 'bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-600 shadow-sm';
  const headingClass = isGlass ? 'text-white drop-shadow-md' : 'text-slate-900 dark:text-white';
  const subTextClass = isGlass ? 'text-white drop-shadow-md' : 'text-slate-600 dark:text-slate-400 font-bold';
  const inputClass = isGlass ? 'glass-input rounded-lg' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500';
  const tableWrapClass = isGlass ? 'glass-card overflow-x-auto rounded-2xl' : 'overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm';
  const theadClass = isGlass ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-900/80';
  const trHoverClass = isGlass ? 'hover:scale-[1.01] transition-all duration-200' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${headingClass}`}>{t('acc.title')}</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors text-sm">{t('acc.add')}</button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>{message.text}</div>
      )}

      {showForm && (
        <div className={`p-6 rounded-2xl ${cardClass}`}>
          <h3 className={`text-lg font-semibold mb-4 ${headingClass}`}>{editingId ? t('acc.action.edit') : t('acc.add_new')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${subTextClass}`}>{t('acc.form.name')}</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className={`w-full px-4 py-2 ${inputClass}`} placeholder={t('acc.form.placeholder.name')} />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${subTextClass}`}>{t('acc.form.type')}</label>
                <GlassSelect 
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
                <label className={`block text-sm mb-1 ${subTextClass}`}>{t('acc.form.balance')}</label>
                <input type="number" step="0.01" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} className={`w-full px-4 py-2 ${inputClass}`} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors text-sm">{editingId ? t('common.update') : t('common.create')}</button>
              <button type="button" onClick={resetForm} className={`px-5 py-2 rounded-lg font-semibold transition-colors text-sm ${isGlass ? 'glass-btn' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={`text-center py-10 ${subTextClass}`}>{t('common.loading')}</div>
      ) : accounts.length === 0 ? (
        <div className={`text-center py-10 rounded-2xl ${isGlass ? 'glass-card' : 'bg-slate-900/30 border border-slate-700'} ${subTextClass}`}>{t('acc.no_accounts_short')}</div>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full text-left">
            <thead className={theadClass}>
              <tr>
                <th className={`px-5 py-3 text-xs font-semibold uppercase ${subTextClass}`}>{t('acc.form.name')}</th>
                <th className={`px-5 py-3 text-xs font-semibold uppercase ${subTextClass}`}>{t('acc.form.type')}</th>
                <th className={`px-5 py-3 text-xs font-semibold uppercase text-right ${subTextClass}`}>{t('acc.form.balance')}</th>
                <th className={`px-5 py-3 text-xs font-semibold uppercase text-center ${subTextClass}`}>{t('tx.form.action')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isGlass ? 'divide-white/5' : 'divide-slate-700/50'}`}>
              {accounts.map((acc) => (
                <tr key={acc.id} className={trHoverClass}>
                  <td className={`px-5 py-3 font-bold ${headingClass}`}>{acc.name}</td>
                  <td className={`px-5 py-3 text-sm font-medium ${isGlass ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{typeLabel[acc.type] || acc.type}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={isGlass 
                      ? `amount-badge ${Number(acc.balance) >= 0 ? "amount-badge-positive" : "amount-badge-negative"}`
                      : `font-mono font-semibold ${Number(acc.balance) >= 0 ? "text-emerald-400" : "text-red-400"}`
                    }>
                      {Number(acc.balance).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} đ
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => openEditForm(acc)} className="text-blue-400 hover:text-blue-300 text-sm font-medium mr-4 transition-colors">{t('acc.action.edit')}</button>
                    <button onClick={() => setConfirmDelete(acc.id)} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">{t('acc.action.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} title={t('acc.delete_confirm_title')} message={t('acc.delete_confirm_msg')} onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
