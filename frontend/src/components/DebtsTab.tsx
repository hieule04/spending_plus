import { useEffect, useState } from "react";
import {
  listDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  listLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  listAccounts,
  createTransaction,
} from "../service/api";
import ConfirmModal from "./ConfirmModal";
import FancySelect from "./FancySelect";
import CurrencyInput from "./CurrencyInput";
import MobilePageHeader from "./MobilePageHeader";
import { useLanguage } from "../context/LanguageContext";

type DebtItem = {
  id: string;
  creditor_name: string;
  total_amount: number | string;
  remaining_amount: number | string;
  monthly_payment: number | string;
  due_date: number;
};

type LoanItem = {
  id: string;
  borrower_name: string;
  amount: number | string;
};

type AccountItem = { id: string; name: string; balance: number | string };

const normalizeMoney = (value: unknown) => {
  const n = Number(value);
  if (Number.isFinite(n)) return Math.round(n).toString();
  return String(value ?? "").replace(/\.0+$/, "").replace(/[^\d]/g, "");
};

const getLoanApiErrorMessage = (error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message : "";
  if (/api route not found|not found/i.test(message)) {
    return "Phiên bản backend hiện tại chưa hỗ trợ API khoản cho vay. Hãy cập nhật hoặc build lại backend.";
  }
  return message || fallback;
};

interface DebtsTabProps {
  onOpenMobileMenu?: () => void;
}

export default function DebtsTab({ onOpenMobileMenu }: DebtsTabProps) {
  const { t, language, formatAmount } = useLanguage();
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<"debts" | "loans">("debts");

  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [creditorName, setCreditorName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [dueDate, setDueDate] = useState("1");
  const [confirmDeleteDebtId, setConfirmDeleteDebtId] = useState<string | null>(null);

  const [editingLoan, setEditingLoan] = useState<LoanItem | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [borrowerName, setBorrowerName] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [confirmDeleteLoanId, setConfirmDeleteLoanId] = useState<string | null>(null);

  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");

  const showTimedMessage = (text: string, type: "success" | "error", timeout = 3000) => {
    setMessage({ text, type });
    window.setTimeout(() => setMessage(null), timeout);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [debtResult, accountResult, loanResult] = await Promise.allSettled([
        listDebts(),
        listAccounts(),
        listLoans(),
      ]);

      if (debtResult.status === "fulfilled") {
        setDebts(debtResult.value || []);
      } else {
        throw debtResult.reason;
      }

      if (accountResult.status === "fulfilled") {
        setAccounts(accountResult.value || []);
      } else {
        throw accountResult.reason;
      }

      if (loanResult.status === "fulfilled") {
        setLoans(loanResult.value || []);
      } else {
        setLoans([]);
        setMessage({ text: getLoanApiErrorMessage(loanResult.reason, t("debt.msg.load_error")), type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || t("debt.msg.load_error"), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("refresh_transactions", fetchData);
    return () => window.removeEventListener("refresh_transactions", fetchData);
  }, []);

  const getNextDue = (day: number) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const currentDay = today.getDate();
    const targetMonth = day >= currentDay ? m : m + 1;
    const maxDay = new Date(y, targetMonth + 1, 0).getDate();
    return new Date(y, targetMonth, Math.min(day, maxDay));
  };

  const getNextDueDate = (day: number) =>
    getNextDue(day).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const isDueSoon = (day: number) => {
    const now = new Date();
    const next = getNextDue(day);
    const diff = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 3;
  };

  const openDebtModal = (debt: DebtItem | null = null) => {
    setEditingDebt(debt);
    setCreditorName(debt?.creditor_name || "");
    setTotalAmount(debt ? normalizeMoney(debt.total_amount) : "");
    setMonthlyPayment(debt ? normalizeMoney(debt.monthly_payment) : "");
    setDueDate(debt ? debt.due_date.toString() : "1");
    setIsDebtModalOpen(true);
  };

  const openLoanModal = (loan: LoanItem | null = null) => {
    setEditingLoan(loan);
    setBorrowerName(loan?.borrower_name || "");
    setLoanAmount(loan ? normalizeMoney(loan.amount) : "");
    setIsLoanModalOpen(true);
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(totalAmount);
    const monthly = Number(monthlyPayment);
    const due = parseInt(dueDate, 10);
    if (!creditorName.trim() || !Number.isFinite(total) || !Number.isFinite(monthly) || total <= 0 || monthly <= 0 || !Number.isInteger(due)) {
      showTimedMessage(t("debt.msg.error"), "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { creditor_name: creditorName.trim(), total_amount: total, monthly_payment: monthly, due_date: due };
      if (editingDebt) {
        await updateDebt(editingDebt.id, payload);
        setMessage({ text: t("debt.msg.update_success"), type: "success" });
      } else {
        await createDebt(payload);
        setMessage({ text: t("debt.msg.create_success"), type: "success" });
      }
      setIsDebtModalOpen(false);
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message || t("debt.msg.error"), type: "error" });
    } finally {
      setIsSubmitting(false);
      window.setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(loanAmount);
    if (!borrowerName.trim() || !Number.isFinite(amount) || amount <= 0) {
      showTimedMessage(t("debt.msg.error"), "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { borrower_name: borrowerName.trim(), amount };
      if (editingLoan) {
        await updateLoan(editingLoan.id, payload);
        setMessage({ text: t("loan.msg.update_success"), type: "success" });
      } else {
        await createLoan(payload);
        setMessage({ text: t("loan.msg.create_success"), type: "success" });
      }
      setIsLoanModalOpen(false);
      fetchData();
    } catch (err: any) {
      setMessage({ text: getLoanApiErrorMessage(err, t("debt.msg.error")), type: "error" });
    } finally {
      setIsSubmitting(false);
      window.setTimeout(() => setMessage(null), 3000);
    }
  };

  const openPayModal = (debt: DebtItem) => {
    const remaining = Number(debt.remaining_amount) || 0;
    const suggested = Math.min(Number(debt.monthly_payment) || 0, remaining);
    setSelectedDebt(debt);
    setPayAmount(suggested > 0 ? suggested.toString() : "");
    setPayAccountId(accounts[0]?.id || "");
    setIsPayModalOpen(true);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payAmount);
    const remaining = Number(selectedDebt?.remaining_amount) || 0;
    if (!selectedDebt || !payAccountId || !Number.isFinite(amount) || amount <= 0 || amount > remaining) {
      showTimedMessage(t("debt.msg.error"), "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await createTransaction({
        amount,
        type: "expense",
        date: new Date().toISOString(),
        note: `${t("debt.pay_title")}: ${selectedDebt.creditor_name}`,
        account_id: payAccountId,
        debt_id: selectedDebt.id,
      });
      setMessage({ text: t("debt.msg.update_success"), type: "success" });
      setIsPayModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent("refresh_accounts"));
    } catch (err: any) {
      setMessage({ text: err.message || t("debt.msg.error"), type: "error" });
    } finally {
      setIsSubmitting(false);
      window.setTimeout(() => setMessage(null), 3000);
    }
  };

  const confirmDeleteDebt = async () => {
    if (!confirmDeleteDebtId) return;
    await deleteDebt(confirmDeleteDebtId);
    setConfirmDeleteDebtId(null);
    setMessage({ text: t("debt.msg.delete_success"), type: "success" });
    fetchData();
  };

  const confirmDeleteLoan = async () => {
    if (!confirmDeleteLoanId) return;
    await deleteLoan(confirmDeleteLoanId);
    setConfirmDeleteLoanId(null);
    setMessage({ text: t("loan.msg.delete_success"), type: "success" });
    fetchData();
  };

  const card = "rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800";
  const title = "text-slate-900 dark:text-white";
  const sub = "text-slate-500 dark:text-slate-400";
  const primaryButton = "rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white";
  const primaryButtonWide = "rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white";

  return (
    <div className="w-full p-2">
      <MobilePageHeader onOpenMobileMenu={onOpenMobileMenu} className="mb-4" />
      <div className="mb-8">
        <h2 className={`text-4xl font-extrabold tracking-tight ${title}`}>{t("debt.title")}</h2>
        <p className={`mt-2 ${sub}`}>{t("debt.subtitle")}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 sm:justify-between">
        <div className="inline-flex flex-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900/60 sm:flex-none">
          <button
            type="button"
            onClick={() => setActiveSection("debts")}
            className={`flex-1 rounded-xl px-3 py-1.5 text-xs font-bold transition sm:flex-none sm:px-4 sm:py-2 sm:text-sm ${
              activeSection === "debts"
                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {language === "vi" ? "Dư nợ" : t("debt.title")}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("loans")}
            className={`flex-1 rounded-xl px-3 py-1.5 text-xs font-bold transition sm:flex-none sm:px-4 sm:py-2 sm:text-sm ${
              activeSection === "loans"
                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {t("loan.title")}
          </button>
        </div>

        <button
          onClick={() => (activeSection === "debts" ? openDebtModal() : openLoanModal())}
          className={`${primaryButton} inline-flex h-10 w-10 items-center justify-center rounded-xl whitespace-nowrap text-2xl leading-none md:h-auto md:w-auto md:rounded-2xl md:px-4 md:py-2 md:text-sm`}
          aria-label={activeSection === "debts" ? t("debt.add") : t("loan.add")}
        >
          <span className="md:hidden">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="hidden md:inline">{activeSection === "debts" ? t("debt.add") : t("loan.add")}</span>
        </button>
      </div>

      {message && <div className={`mb-6 rounded-2xl border p-4 text-sm font-bold ${message.type === "success" ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" : "border-rose-500/30 bg-rose-500/20 text-rose-400"}`}>{message.text}</div>}

      {loading ? (
        <div className={`py-20 text-center font-bold ${sub}`}>{t("common.loading")}</div>
      ) : (
        <div className="space-y-10 pb-24">
          {activeSection === "debts" && (
          <section className="space-y-6">
            {debts.length === 0 ? (
              <div className={`${card} flex flex-col items-center justify-center py-20 text-center`}>
                <p className={`mb-4 text-lg font-bold ${title}`}>{t("debt.no_debts")}</p>
                <button
                  onClick={() => openDebtModal()}
                  className={`${primaryButtonWide} inline-flex h-12 w-12 items-center justify-center rounded-xl text-3xl leading-none md:h-auto md:w-auto md:px-6 md:py-3 md:text-base`}
                  aria-label={t("debt.start")}
                >
                  <span className="md:hidden">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  <span className="hidden md:inline">{t("debt.start")}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {debts.map((debt) => {
                  const total = Number(debt.total_amount) || 0;
                  const remaining = Math.max(Number(debt.remaining_amount) || 0, 0);
                  const paid = total > 0 ? Math.max(0, total - Math.min(remaining, total)) : 0;
                  const pct = total > 0 ? (paid / total) * 100 : 0;
                  const done = remaining <= 0;
                  const soon = !done && isDueSoon(debt.due_date);
                  return (
                    <div key={debt.id} className={card}>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <h4 className={`text-xl font-black ${done ? "text-emerald-600" : title}`}>{debt.creditor_name}</h4>
                          <p className={`mt-1 text-xs font-bold uppercase tracking-wider ${done ? "text-emerald-500" : soon ? "text-amber-500" : "text-blue-500"}`}>
                            {done ? t("debt.completed") : soon ? t("debt.due_warning") : t("debt.in_progress")}
                          </p>
                        </div>
                        <div className="flex gap-2 text-xs font-bold">
                          <button onClick={() => openDebtModal(debt)} className="text-blue-500">Sửa</button>
                          <button onClick={() => setConfirmDeleteDebtId(debt.id)} className="text-rose-500">Xóa</button>
                        </div>
                      </div>
                      <div className="mb-2 flex items-end justify-between">
                        <div className={`text-sm font-semibold ${sub}`}>
                          <span className={`text-lg ${title}`}>{formatAmount(remaining)}</span> / {formatAmount(total)}
                        </div>
                        <div className="text-xs font-black text-blue-500">{Math.min(pct, 100).toFixed(0)}% {t("debt.paid")}</div>
                      </div>
                      <div className="mb-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                        <div className={`h-full ${done ? "bg-emerald-500" : soon ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <div className={`mb-4 flex justify-between text-xs font-bold ${sub}`}>
                        <span>{t("debt.next_due")}: {getNextDueDate(debt.due_date)}</span>
                        <span>{t("debt.monthly")}: {formatAmount(debt.monthly_payment)}</span>
                      </div>
                      {!done && <button onClick={() => openPayModal(debt)} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white">{t("debt.pay_btn")}</button>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          )}

          {activeSection === "loans" && (
          <section className="space-y-6">
            {loans.length === 0 ? (
              <div className={`${card} flex flex-col items-center justify-center py-20 text-center`}>
                <p className={`mb-4 text-lg font-bold ${title}`}>{t("loan.no_loans")}</p>
                <button
                  onClick={() => openLoanModal()}
                  className={`${primaryButtonWide} inline-flex h-12 w-12 items-center justify-center rounded-xl text-3xl leading-none md:h-auto md:w-auto md:px-6 md:py-3 md:text-base`}
                  aria-label={t("loan.start")}
                >
                  <span className="md:hidden">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                  <span className="hidden md:inline">{t("loan.start")}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loans.map((loan) => (
                  <div key={loan.id} className={`${card} bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-950/20 dark:to-slate-900`}>
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">{t("loan.title")}</p>
                        <h4 className={`mt-2 text-xl font-black ${title}`}>{loan.borrower_name}</h4>
                      </div>
                      <div className="flex gap-2 text-xs font-bold">
                        <button onClick={() => openLoanModal(loan)} className="text-blue-500">Sửa</button>
                        <button onClick={() => setConfirmDeleteLoanId(loan.id)} className="text-rose-500">Xóa</button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/70 px-4 py-4 dark:bg-slate-900/50">
                      <p className={`text-xs font-bold uppercase tracking-[0.16em] ${sub}`}>{t("loan.amount")}</p>
                      <p className={`mt-2 text-2xl font-black ${title}`}>{formatAmount(loan.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          )}
        </div>
      )}

      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDebtModalOpen(false)} />
          <div className={`${card} relative w-full max-w-sm`}>
            <h3 className={`mb-6 text-2xl font-black ${title}`}>{editingDebt ? t("debt.edit") : t("debt.add_new")}</h3>
            <form onSubmit={handleSaveDebt} className="space-y-4">
              <div>
                <label className={`mb-2 block text-sm font-bold ${sub}`}>{t("debt.creditor")}</label>
                <input value={creditorName} onChange={(e) => setCreditorName(e.target.value)} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder={t("debt.creditor_placeholder")} />
              </div>
              <div>
                <label className={`mb-2 block text-sm font-bold ${sub}`}>{t("debt.total")}</label>
                <CurrencyInput value={totalAmount} onChange={setTotalAmount} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="50 000 000" />
              </div>
              <div>
                <label className={`mb-2 block text-sm font-bold ${sub}`}>{t("debt.monthly")}</label>
                <CurrencyInput value={monthlyPayment} onChange={setMonthlyPayment} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="5 000 000" />
              </div>
              <div>
                <label className={`mb-2 block text-sm font-bold ${sub}`}>{t("debt.due_date")}</label>
                <FancySelect value={dueDate} onChange={setDueDate} options={Array.from({ length: 31 }, (_, i) => ({ label: `${language === "vi" ? "NgÃ y" : "Day"} ${i + 1}`, value: (i + 1).toString() }))} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsDebtModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">{t("common.cancel")}</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white">{isSubmitting ? t("common.saving") : t("common.save")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsLoanModalOpen(false)} />
          <div className={`${card} relative w-full max-w-sm`}>
            <h3 className={`mb-6 text-2xl font-black ${title}`}>{editingLoan ? t("loan.edit") : t("loan.add_new")}</h3>
            <form onSubmit={handleSaveLoan} className="space-y-4">
              <div>
                <label className={`mb-2 block text-sm font-bold ${sub}`}>{t("loan.borrower")}</label>
                <input value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder={t("loan.borrower_placeholder")} />
              </div>
              <div>
                <label className={`mb-2 block text-sm font-bold ${sub}`}>{t("loan.amount")}</label>
                <CurrencyInput value={loanAmount} onChange={setLoanAmount} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="10 000 000" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsLoanModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">{t("common.cancel")}</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white">{isSubmitting ? t("common.saving") : t("common.save")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPayModalOpen(false)} />
          <div className={`${card} relative w-full max-w-sm`}>
            <h3 className={`mb-2 text-2xl font-black ${title}`}>{t("debt.pay_title")}</h3>
            <p className={`mb-6 text-sm ${sub}`}>{t("debt.creditor")}: <span className={title}>{selectedDebt?.creditor_name}</span></p>
            <div className={`mb-4 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400`}>
              {t("debt.remaining")}: {formatAmount(selectedDebt?.remaining_amount || 0)}
            </div>
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className={`mb-2 block text-sm font-bold ${sub}`}>{t("debt.pay_wallet_label")}</label>
                {accounts.length > 0 ? (
                  <FancySelect value={payAccountId} onChange={setPayAccountId} options={accounts.map((a) => ({ label: `${a.name} (${formatAmount(a.balance)})`, value: a.id }))} />
                ) : (
                  <div className={`rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-900 ${sub}`}>{t("debt.msg.error")}</div>
                )}
              </div>
              <div>
                <label className={`mb-2 block text-sm font-bold ${sub}`}>{t("debt.pay_amount_label")}</label>
                <CurrencyInput value={payAmount} onChange={setPayAmount} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="0" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">{t("common.cancel")}</button>
                <button type="submit" disabled={isSubmitting || accounts.length === 0} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? t("common.saving") : t("common.confirm")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDeleteDebtId} title={t("debt.delete_confirm_title")} message={t("debt.delete_confirm_msg")} onConfirm={confirmDeleteDebt} onCancel={() => setConfirmDeleteDebtId(null)} />
      <ConfirmModal isOpen={!!confirmDeleteLoanId} title={t("loan.delete_confirm_title")} message={t("loan.delete_confirm_msg")} onConfirm={confirmDeleteLoan} onCancel={() => setConfirmDeleteLoanId(null)} />
    </div>
  );
}
