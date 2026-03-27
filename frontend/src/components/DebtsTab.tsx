import { useState, useEffect } from "react";
import {
  listDebts, createDebt, updateDebt, deleteDebt,
  listAccounts, createTransaction
} from "../service/api";
import ConfirmModal from "./ConfirmModal";
import FancySelect from "./FancySelect";

import CurrencyInput from "./CurrencyInput";

import { useLanguage } from "../context/LanguageContext";

export default function DebtsTab() {
  const { t, language, currency, formatAmount } = useLanguage();

  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Create/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [creditorName, setCreditorName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [dueDate, setDueDate] = useState("1");

  // Payment Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, accs] = await Promise.all([listDebts(), listAccounts()]);
      setDebts(data || []);
      setAccounts(accs || []);
    } catch (err: any) {
      setMessage({ text: err.message || t('debt.msg.load_error'), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("refresh_transactions", fetchData);
    return () => window.removeEventListener("refresh_transactions", fetchData);
  }, []);

  // Determine if a debt's due date is within the next 3 days
  const isDueSoon = (dueDayOfMonth: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Build the next due date in the current or next month
    let nextDue: Date;
    if (dueDayOfMonth >= currentDay) {
      // Due date is this month
      nextDue = new Date(currentYear, currentMonth, Math.min(dueDayOfMonth, new Date(currentYear, currentMonth + 1, 0).getDate()));
    } else {
      // Due date has passed this month, next is next month
      const nextMonth = currentMonth + 1;
      const daysInNextMonth = new Date(currentYear, nextMonth + 1, 0).getDate();
      nextDue = new Date(currentYear, nextMonth, Math.min(dueDayOfMonth, daysInNextMonth));
    }

    const diffMs = nextDue.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  const getNextDueDate = (dueDayOfMonth: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let nextDue: Date;
    if (dueDayOfMonth >= currentDay) {
      nextDue = new Date(currentYear, currentMonth, Math.min(dueDayOfMonth, new Date(currentYear, currentMonth + 1, 0).getDate()));
    } else {
      const nextMonth = currentMonth + 1;
      const daysInNextMonth = new Date(currentYear, nextMonth + 1, 0).getDate();
      nextDue = new Date(currentYear, nextMonth, Math.min(dueDayOfMonth, daysInNextMonth));
    }
    return nextDue.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleOpenModal = (debt: any = null) => {
    setEditingDebt(debt);
    setCreditorName(debt ? debt.creditor_name : "");
    setTotalAmount(debt ? debt.total_amount.toString() : "");
    setMonthlyPayment(debt ? debt.monthly_payment.toString() : "");
    setDueDate(debt ? debt.due_date.toString() : "1");
    setIsModalOpen(true);
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditorName || !totalAmount || !monthlyPayment) return;
    setIsSubmitting(true);

    try {
      if (editingDebt) {
        await updateDebt(editingDebt.id, {
          creditor_name: creditorName,
          total_amount: parseFloat(totalAmount),
          monthly_payment: parseFloat(monthlyPayment),
          due_date: parseInt(dueDate),
        });
        setMessage({ text: t('debt.msg.update_success'), type: "success" });
      } else {
        await createDebt({
          creditor_name: creditorName,
          total_amount: parseFloat(totalAmount),
          monthly_payment: parseFloat(monthlyPayment),
          due_date: parseInt(dueDate),
        });
        setMessage({ text: t('debt.msg.create_success'), type: "success" });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message || t('debt.msg.error'), type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const openPayModal = (debt: any) => {
    setSelectedDebt(debt);
    setPayAmount(debt.monthly_payment.toString());
    setPayAccountId(accounts.length > 0 ? accounts[0].id : "");
    setIsPayModalOpen(true);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || !payAccountId || !selectedDebt) return;
    setIsSubmitting(true);

    try {
      await createTransaction({
        amount: parseFloat(payAmount),
        type: 'expense',
        date: new Date().toISOString(),
        note: `${t('debt.pay_title')}: ${selectedDebt.creditor_name}`,
        account_id: payAccountId,
        debt_id: selectedDebt.id,
      });
      setMessage({ text: t('debt.msg.update_success'), type: "success" });
      setIsPayModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent("refresh_accounts"));
    } catch (err: any) {
      setMessage({ text: err.message || t('debt.msg.error'), type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const confirmDeleteDebt = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteDebt(confirmDeleteId);
      setMessage({ text: t('debt.msg.delete_success'), type: "success" });
      fetchData();
    } catch (err: any) {
      setMessage({ text: `${t('debt.msg.error')}: ${err.message}`, type: "error" });
    } finally {
      setConfirmDeleteId(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // const fmtCurrency = (val: number) =>
  //   Number(val).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');

  const gridCardClass = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl";

  const textTitleClass = "text-slate-900 dark:text-white";
  const textSubClass = "text-slate-500 dark:text-slate-400";

  return (
    <div className="h-full flex flex-col relative w-full p-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className={`text-4xl font-extrabold tracking-tight ${textTitleClass}`}>{t('debt.title')}</h2>
          <p className={`mt-2 ${textSubClass}`}>{t('debt.subtitle')}</p>
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
      ) : debts.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl flex flex-col items-center justify-center ${gridCardClass}`}>
          <p className={`text-lg font-bold mb-4 ${textTitleClass}`}>{t('debt.no_debts')}</p>
          <button
            onClick={() => handleOpenModal()}
            className={`px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-500 text-white shadow-lg`}
          >
            {t('debt.start')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {debts.map((debt) => {
            const paid = Number(debt.total_amount) - Number(debt.remaining_amount);
            const pctPaid = (paid / Number(debt.total_amount)) * 100;
            const isCompleted = Number(debt.remaining_amount) <= 0;
            const dueSoon = !isCompleted && isDueSoon(debt.due_date);

            // Card style overrides
            const completedCardClass = isCompleted
              ? "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800/50 shadow-emerald-200/50"
              : "";

            const dueWarningClass = dueSoon
              ? "ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 animate-pulse"
              : "";

            const cardTitleClass = isCompleted ? "text-emerald-900 dark:text-emerald-400" : textTitleClass;
            const cardSubClass = isCompleted ? "text-emerald-700 dark:text-emerald-500" : textSubClass;

            return (
              <div key={debt.id} className={`${gridCardClass} ${completedCardClass} ${dueWarningClass} relative overflow-hidden group`}>

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`font-black text-xl truncate ${cardTitleClass}`}>{debt.creditor_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className={`text-xs font-bold uppercase tracking-wider ${
                        isCompleted ? 'text-emerald-600 dark:text-emerald-500'
                        : dueSoon ? 'text-amber-600 dark:text-amber-400'
                        : 'text-blue-500'
                      }`}>
                        {isCompleted ? t('debt.completed')
                         : dueSoon ? t('debt.due_warning')
                         : t('debt.in_progress')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(debt)} className="p-1.5 rounded-lg hover:bg-white/10 text-blue-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => setConfirmDeleteId(debt.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.347-9Zm5.485.058a.75.75 0 0 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex justify-between items-end mb-2">
                  <div className={`font-semibold ${cardSubClass} text-sm`}>
                    <span className={`text-lg ${cardTitleClass}`}>
                      {formatAmount(debt.remaining_amount)}
                    </span> / {formatAmount(debt.total_amount)}
                  </div>
                  <div className={`text-xs font-black ${isCompleted ? 'text-emerald-600' : 'text-blue-500'}`}>
                    {Math.min(pctPaid, 100).toFixed(0)}% {t('debt.paid')}
                  </div>
                </div>

                {/* Reverse Progress Bar — shows how much is PAID */}
                <div className={`w-full h-3 rounded-full overflow-hidden mb-4 relative bg-slate-100 dark:bg-slate-900`}>
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-in-out ${
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-400 to-green-600'
                        : dueSoon
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                          : 'bg-gradient-to-r from-blue-400 to-indigo-600'
                    }`}
                    style={{ width: `${Math.min(pctPaid, 100)}%` }}
                  />
                </div>

                {/* Due date info */}
                <div className={`flex justify-between items-center mb-4 text-xs font-bold ${cardSubClass}`}>
                  <span>{t('debt.next_due')}: {getNextDueDate(debt.due_date)}</span>
                  <span>{t('debt.monthly')}: {formatAmount(debt.monthly_payment)}</span>
                </div>

                {/* Pay button */}
                {!isCompleted && (
                  <button
                    onClick={() => openPayModal(debt)}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      dueSoon
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {t('debt.pay_btn')}
                  </button>
                )}
              </div>
            );
          })}

          {/* Add New Debt Card */}
          <button 
            onClick={() => handleOpenModal()}
            className={`bg-transparent border-dashed border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-3xl flex flex-col items-center justify-center min-h-[220px] transition-all group`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:rotate-90 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
            <span className={`font-black tracking-wide text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400`}>
              {t('debt.add_new')}
            </span>
          </button>
        </div>
      )}

      {/* Debt Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={`relative w-full max-w-sm rounded-[2rem] p-8 animate-slide-up shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
            <h3 className={`text-2xl font-black mb-6 ${textTitleClass}`}>{editingDebt ? t('debt.edit') : t('debt.add_new')}</h3>
            <form onSubmit={handleSaveDebt} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('debt.creditor')}</label>
                <input
                  type="text"
                  required
                  value={creditorName}
                  onChange={(e) => setCreditorName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white`}
                  placeholder={t('debt.creditor_placeholder')}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('debt.total')}</label>
                <CurrencyInput
                  value={totalAmount}
                  onChange={setTotalAmount}
                  required
                  className={`w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white`}
                  placeholder="50 000 000"
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('debt.monthly')}</label>
                <CurrencyInput
                  value={monthlyPayment}
                  onChange={setMonthlyPayment}
                  required
                  className={`w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white`}
                  placeholder="5 000 000"
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('debt.due_date')}</label>
                <FancySelect
                  value={dueDate}
                  onChange={(val) => setDueDate(val)}
                  options={Array.from({ length: 31 }, (_, i) => ({
                    label: `${language === 'vi' ? 'Ngày' : 'Day'} ${i + 1}`,
                    value: (i + 1).toString()
                  }))}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300`}>{t('common.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg">
                  {isSubmitting ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPayModalOpen(false)}></div>
          <div className={`relative w-full max-w-sm rounded-[2rem] p-8 animate-slide-up shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
            <h3 className={`text-2xl font-black mb-2 ${textTitleClass}`}>{t('debt.pay_title')}</h3>
            <p className={`text-sm mb-6 ${textSubClass}`}>
              {t('debt.creditor')}: <span className={textTitleClass}>{selectedDebt?.creditor_name}</span>
            </p>
            <div className={`mb-4 p-3 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400`}>
              {t('debt.remaining')}: {formatAmount(selectedDebt?.remaining_amount || 0)}
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('debt.pay_wallet_label')}</label>
                <FancySelect
                  value={payAccountId}
                  onChange={(val) => setPayAccountId(val)}
                  options={accounts.map((a) => ({
                    label: `${a.name} (${formatAmount(a.balance)})`,
                    value: a.id
                  }))}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>{t('debt.pay_amount_label')}</label>
                <CurrencyInput
                  value={payAmount}
                  onChange={setPayAmount}
                  required
                  className={`w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white`}
                  placeholder="0"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300`}>{t('common.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg">
                  {isSubmitting ? t('common.saving') : t('common.confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title={t('debt.delete_confirm_title')}
        message={t('debt.delete_confirm_msg')}
        onConfirm={confirmDeleteDebt}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
