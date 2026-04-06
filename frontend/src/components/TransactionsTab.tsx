import { useState, useEffect, useCallback } from "react";
import { listTransactions, createTransaction, updateTransaction, deleteTransaction, listAccounts, listCategories } from "../service/api";
import ConfirmModal from "./ConfirmModal";
import FancySelect from "./FancySelect";
import MobilePageHeader from "./MobilePageHeader";
import CurrencyInput from "./CurrencyInput";
import { useLanguage } from "../context/LanguageContext";

interface Transaction { id: string; amount: number; type: string; date: string; note: string | null; account_id: string; category_id: string | null; created_at: string; }
interface Account { id: string; name: string; type: string; }
interface Category { id: string; name: string; type: string; icon: string | null; color: string | null; }

interface TransactionsTabProps {
  onOpenMobileMenu?: () => void;
}

type PeriodType = "all" | "day" | "week" | "month" | "year";

export default function TransactionsTab({ onOpenMobileMenu }: TransactionsTabProps) {
  const { t, language, formatAmount } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [period, setPeriod] = useState<PeriodType>("month");
  const [refDate, setRefDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [swipedTransactionId, setSwipedTransactionId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("expense");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formNote, setFormNote] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");

  const getRangeForPeriod = (selectedPeriod: PeriodType, date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    if (selectedPeriod === "all") return null;

    if (selectedPeriod === "day") {
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }

    if (selectedPeriod === "week") {
      const weekday = start.getDay();
      const diffToMonday = weekday === 0 ? 6 : weekday - 1;
      start.setDate(start.getDate() - diffToMonday);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { start, end };
    }

    if (selectedPeriod === "month") {
      start.setDate(1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return { start, end };
    }

    const yearStart = new Date(start.getFullYear(), 0, 1);
    const yearEnd = new Date(start.getFullYear() + 1, 0, 1);
    return { start: yearStart, end: yearEnd };
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const range = getRangeForPeriod(period, refDate);
      const transactionParams = range
        ? { startDate: range.start.toISOString(), endDate: range.end.toISOString(), limit: 500 }
        : { limit: 500 };

      const [txns, accs, cats] = await Promise.all([
        listTransactions(transactionParams),
        listAccounts(),
        listCategories(),
      ]);

      setTransactions(txns || []);
      setAccounts(accs || []);
      setCategories(cats || []);
      if (accs && accs.length > 0) {
        setFormAccountId((current) => current || accs[0].id);
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [period, refDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleRefresh = () => fetchData();
    window.addEventListener("refresh_transactions", handleRefresh);
    return () => window.removeEventListener("refresh_transactions", handleRefresh);
  }, [fetchData]);

  const resetForm = () => {
    setFormAmount("");
    setFormType("expense");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormNote("");
    setFormAccountId(accounts.length > 0 ? accounts[0].id : "");
    setFormCategoryId("");
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (txn: Transaction) => {
    setFormAmount(String(txn.amount));
    setFormType(txn.type);
    setFormDate(txn.date ? txn.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setFormNote(txn.note || "");
    setFormAccountId(txn.account_id);
    setFormCategoryId(txn.category_id || "");
    setEditingId(txn.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const payload: any = {
        amount: parseFloat(formAmount),
        type: formType,
        date: new Date(formDate).toISOString(),
        note: formNote || undefined,
        account_id: formAccountId,
        category_id: formCategoryId || null,
      };
      if (editingId) {
        await updateTransaction(editingId, payload);
        setMessage({ text: t("tx.msg.update_success"), type: "success" });
      } else {
        await createTransaction(payload);
        setMessage({ text: t("tx.msg.create_success"), type: "success" });
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    setMessage(null);
    try {
      await deleteTransaction(confirmDelete);
      setMessage({ text: t("tx.msg.delete_success"), type: "success" });
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setConfirmDelete(null);
    }
  };

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || "—";
  const getCategoryInfo = (id: string | null) => {
    if (!id) return { name: "—", icon: "", color: "" };
    const cat = categories.find((c) => c.id === id);
    return cat ? { name: cat.name, icon: cat.icon || "", color: cat.color || "" } : { name: "—", icon: "", color: "" };
  };

  const formatShortDate = (value: string) =>
    new Date(value).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  const formatCurrentPeriod = () => {
    if (period === "all") return t("db.period.all");

    if (period === "day") {
      return refDate.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    if (period === "week") {
      const range = getRangeForPeriod("week", refDate);
      if (!range) return t("db.period.week");
      const weekEnd = new Date(range.end);
      weekEnd.setDate(weekEnd.getDate() - 1);
      return `${range.start.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit" })} - ${weekEnd.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
    }

    if (period === "month") {
      return refDate.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
        month: "long",
        year: "numeric",
      });
    }

    return `${t("common.year")} ${refDate.getFullYear()}`;
  };

  const handlePrevPeriod = () => {
    const nextDate = new Date(refDate);
    if (period === "day") nextDate.setDate(nextDate.getDate() - 1);
    else if (period === "week") nextDate.setDate(nextDate.getDate() - 7);
    else if (period === "month") nextDate.setMonth(nextDate.getMonth() - 1);
    else if (period === "year") nextDate.setFullYear(nextDate.getFullYear() - 1);
    setRefDate(nextDate);
    setPickerYear(nextDate.getFullYear());
  };

  const handleNextPeriod = () => {
    const nextDate = new Date(refDate);
    if (period === "day") nextDate.setDate(nextDate.getDate() + 1);
    else if (period === "week") nextDate.setDate(nextDate.getDate() + 7);
    else if (period === "month") nextDate.setMonth(nextDate.getMonth() + 1);
    else if (period === "year") nextDate.setFullYear(nextDate.getFullYear() + 1);
    setRefDate(nextDate);
    setPickerYear(nextDate.getFullYear());
  };

  const handlePeriodChange = (value: string) => {
    const nextPeriod = value as PeriodType;
    setPeriod(nextPeriod);
    setShowMonthPicker(false);
  };

  const handleSelectMonth = (monthIndex: number) => {
    const nextDate = new Date(refDate);
    nextDate.setFullYear(pickerYear, monthIndex, 1);
    setRefDate(nextDate);
    setShowMonthPicker(false);
  };

  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(pickerYear, index, 1);
    return {
      index,
      label: monthDate.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { month: "long" }),
    };
  });

  const periodOptions = [
    { value: "all", label: t("db.period.all") },
    { value: "day", label: t("db.period.day") },
    { value: "week", label: language === "vi" ? "Tuần" : t("db.period.week") },
    { value: "month", label: language === "vi" ? "Tháng" : t("db.period.month") },
    { value: "year", label: language === "vi" ? "Năm" : t("db.period.year") },
  ];

  const cardClass = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl";
  const headingClass = "text-slate-900 dark:text-white";
  const subTextClass = "text-slate-500 dark:text-slate-400 font-bold";
  const inputClass = "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 transition-all";
  const tableWrapClass = "overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800";
  const theadClass = "bg-slate-50 dark:bg-slate-900/80";
  const trHoverClass = "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors";
  const handleTouchStart = (clientX: number) => setTouchStartX(clientX);
  const handleTouchEnd = (txnId: string, clientX: number) => {
    if (touchStartX === null) return;
    const deltaX = clientX - touchStartX;
    if (deltaX <= -40) setSwipedTransactionId(txnId);
    if (deltaX >= 40) setSwipedTransactionId(null);
    setTouchStartX(null);
  };

  return (
    <div className="space-y-6">
      <MobilePageHeader
        onOpenMobileMenu={onOpenMobileMenu}
        rightSlot={
          <FancySelect
            value={period}
            onChange={handlePeriodChange}
            options={periodOptions}
            className="w-fit"
            buttonClassName="ml-auto inline-flex w-auto justify-end gap-0.5 border-none bg-transparent px-0 py-0 text-right shadow-none hover:border-transparent dark:bg-transparent"
            dropdownClassName="right-0 w-max min-w-[7.25rem] origin-top-right z-[70]"
            showCheckmark={false}
          />
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <h2 className={`text-xl font-bold ${headingClass}`}>{t("tx.title")}</h2>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold leading-none text-white transition-colors hover:bg-blue-500 md:hidden"
            aria-label={t("tx.add")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <div className="hidden md:flex items-center gap-3 sm:justify-end">
          <div className="w-full sm:w-40">
            <FancySelect
              value={period}
              onChange={handlePeriodChange}
              options={periodOptions}
            />
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="hidden px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors text-sm md:inline-flex">{t("tx.add")}</button>
        </div>
      </div>

      {period !== "all" && (
        <>
          <div className="md:hidden flex items-center justify-between px-2">
            <button
              onClick={handlePrevPeriod}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
              aria-label="Previous period"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>

            <div className="flex flex-col items-center">
              {period === "month" ? (
                <button
                  type="button"
                  onClick={() => {
                    setPickerYear(refDate.getFullYear());
                    setShowMonthPicker((open) => !open);
                  }}
                  className="inline-flex items-center gap-1 text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider"
                >
                  <span>{formatCurrentPeriod()}</span>
                  <svg className={`h-4 w-4 transition-transform ${showMonthPicker ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7"></path></svg>
                </button>
              ) : (
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {formatCurrentPeriod()}
                </span>
              )}
            </div>

            <button
              onClick={handleNextPeriod}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
              aria-label="Next period"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>

          {period === "month" && showMonthPicker && (
            <div className="md:hidden rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <button type="button" onClick={() => setPickerYear((year) => year - 1)} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all" aria-label="Previous year">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <p className={`text-sm font-black ${headingClass}`}>{pickerYear}</p>
                <button type="button" onClick={() => setPickerYear((year) => year + 1)} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 active:scale-95 transition-all" aria-label="Next year">
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
          )}
        </>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>{message.text}</div>
      )}

      {showForm && (
        <div className={`p-6 rounded-2xl ${cardClass}`}>
          <h3 className={`text-lg font-semibold mb-4 ${headingClass}`}>{editingId ? t("tx.edit") : t("tx.add_new")}</h3>
          {accounts.length === 0 ? (
            <div className="p-4 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-lg text-sm">⚠️ {t("tx.error_no_accounts")}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className={`block text-sm mb-1 ${subTextClass}`}>{t("tx.form.amount")}</label>
                  <CurrencyInput
                    value={formAmount}
                    onChange={setFormAmount}
                    required
                    className={`w-full px-4 py-2 ${inputClass}`}
                    placeholder="0"
                  />
                </div>
                <div><label className={`block text-sm mb-1 ${subTextClass}`}>{t("tx.form.type")}</label>
                  <FancySelect
                    value={formType}
                    onChange={(val) => setFormType(val)}
                    options={[
                      { label: t("tx.type.expense"), value: "expense" },
                      { label: t("tx.type.income"), value: "income" }
                    ]}
                  />
                </div>
                <div><label className={`block text-sm mb-1 ${subTextClass}`}>{t("tx.form.date")}</label><input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} className={`w-full px-4 py-2 ${inputClass}`} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={`block text-sm mb-1 ${subTextClass}`}>{t("tx.form.account")}</label>
                  <FancySelect
                    value={formAccountId}
                    onChange={(val) => setFormAccountId(val)}
                    options={accounts.map((acc) => ({ label: acc.name, value: acc.id }))}
                  />
                </div>
                <div><label className={`block text-sm mb-1 ${subTextClass}`}>{t("tx.form.category_optional")}</label>
                  <FancySelect
                    value={formCategoryId}
                    onChange={(val) => setFormCategoryId(val)}
                    options={[{ label: t("common.none_selected"), value: "" }, ...categories.map((cat) => ({ label: `${cat.icon || ""} ${cat.name}`, value: cat.id }))]}
                  />
                </div>
              </div>
              <div><label className={`block text-sm mb-1 ${subTextClass}`}>{t("tx.form.note")}</label><input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)} className={`w-full px-4 py-2 ${inputClass}`} placeholder={t("tx.form.placeholder.note")} /></div>
              <div className="flex gap-3">
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors text-sm">{editingId ? t("common.update") : t("common.save_transaction")}</button>
                <button type="button" onClick={resetForm} className={`px-5 py-2 rounded-lg font-semibold transition-colors text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300`}>{t("common.cancel")}</button>
              </div>
            </form>
          )}
        </div>
      )}

      {loading ? (
        <div className={`text-center py-10 ${subTextClass}`}>{t("common.loading")}</div>
      ) : transactions.length === 0 ? (
        <div className={`text-center py-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl ${subTextClass}`}>
          {period === "all" ? t("tx.no_transactions_short") : t("db.no_transactions_period")}
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {transactions.map((txn) => {
              const catInfo = getCategoryInfo(txn.category_id);
              const isIncome = txn.type === "income";
              const isSwiped = swipedTransactionId === txn.id;

              return (
                <div key={txn.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className={`absolute inset-y-0 right-0 flex w-32 items-stretch transition-opacity duration-200 ${isSwiped ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
                    <button
                      onClick={() => openEditForm(txn)}
                      className="flex-1 bg-blue-500 text-xs font-bold text-white"
                    >
                      {t("tx.action.edit")}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(txn.id)}
                      className="flex-1 bg-rose-500 text-xs font-bold text-white"
                    >
                      {t("tx.action.delete")}
                    </button>
                  </div>

                  <div
                    className="relative z-10 flex items-center justify-between gap-3 bg-white px-4 py-3 transition-transform duration-200 dark:bg-slate-800"
                    style={{ transform: isSwiped ? "translateX(-8rem)" : "translateX(0)" }}
                    onTouchStart={(e) => handleTouchStart(e.changedTouches[0].clientX)}
                    onTouchEnd={(e) => handleTouchEnd(txn.id, e.changedTouches[0].clientX)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                          {formatShortDate(txn.date)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className={`font-bold ${headingClass}`}>{catInfo.name}</span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span className={`text-xs font-bold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {isIncome ? t("tx.type.income") : t("tx.type.expense")}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`font-mono text-sm font-bold ${isIncome ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                        {isIncome ? "+" : "-"}{formatAmount(txn.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`${tableWrapClass} hidden md:block`}>
            <table className="w-full text-left">
              <thead className={theadClass}>
                <tr>
                  <th className={`px-4 py-3 text-xs font-semibold uppercase ${subTextClass}`}>{t("tx.form.date")}</th>
                  <th className={`px-4 py-3 text-xs font-semibold uppercase ${subTextClass}`}>{t("tx.form.category")}</th>
                  <th className={`px-4 py-3 text-xs font-semibold uppercase ${subTextClass}`}>{t("tx.form.note")}</th>
                  <th className={`px-4 py-3 text-xs font-semibold uppercase ${subTextClass}`}>{t("tx.form.account")}</th>
                  <th className={`px-4 py-3 text-xs font-semibold uppercase text-right ${subTextClass}`}>{t("tx.form.amount")}</th>
                  <th className={`px-4 py-3 text-xs font-semibold uppercase text-center ${subTextClass}`}>{t("tx.form.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {transactions.map((txn) => {
                  const catInfo = getCategoryInfo(txn.category_id);
                  const isIncome = txn.type === "income";
                  return (
                    <tr key={txn.id} className={trHoverClass}>
                      <td className={`px-4 py-3 text-sm font-bold whitespace-nowrap text-slate-700 dark:text-slate-300`}>{new Date(txn.date).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</td>
                      <td className="px-4 py-3 text-sm"><span className="flex items-center gap-1.5">{catInfo.icon && <span>{catInfo.icon}</span>}<span className={`font-bold ${headingClass}`}>{catInfo.name}</span></span></td>
                      <td className={`px-4 py-3 text-sm font-medium truncate max-w-[160px] text-slate-500 dark:text-slate-400`}>{txn.note || "—"}</td>
                      <td className={`px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300`}>{getAccountName(txn.account_id)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono font-bold ${isIncome ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                          {isIncome ? "+" : "-"}{formatAmount(txn.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button onClick={() => openEditForm(txn)} className="text-blue-400 hover:text-blue-300 text-sm font-medium mr-3 transition-colors">{t("tx.action.edit")}</button>
                        <button onClick={() => setConfirmDelete(txn.id)} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">{t("tx.action.delete")}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmModal isOpen={!!confirmDelete} title={t("tx.delete_confirm_title")} message={t("tx.delete_confirm_msg")} onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
