import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { listAccounts, listTransactions } from "../service/api";
import { useLanguage } from "../context/LanguageContext";

type TransactionRow = {
  id: string;
  amount: number | string;
  type: string;
  date: string;
  note: string | null;
  account_id: string;
};

type AccountRow = {
  id: string;
  name: string;
};

interface CategoryTransactionsModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  categoryId: string | null;
  startDate?: string;
  endDate?: string;
  transactionType?: string;
  onClose: () => void;
}

export default function CategoryTransactionsModal({
  isOpen,
  title,
  subtitle,
  categoryId,
  startDate,
  endDate,
  transactionType,
  onClose,
}: CategoryTransactionsModalProps) {
  const { t, language, formatAmount } = useLanguage();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !categoryId) return;

    let cancelled = false;
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const [transactionData, accountData] = await Promise.all([
          listTransactions({ categoryId, startDate, endDate, type: transactionType, limit: 500 }),
          listAccounts(),
        ]);
        if (!cancelled) {
          setTransactions(transactionData || []);
          setAccounts(accountData || []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("common.error_load"));
          setTransactions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTransactions();
    return () => {
      cancelled = true;
    };
  }, [categoryId, endDate, isOpen, startDate, t, transactionType]);

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts]
  );

  if (!isOpen || !categoryId) return null;

  const headingClass = "text-slate-900 dark:text-white";
  const subTextClass = "text-slate-500 dark:text-slate-400";
  const closeLabel = language === "vi" ? "Đóng" : "Close";

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-700">
          <div className="min-w-0">
            <h3 className={`truncate text-xl font-black ${headingClass}`}>{title}</h3>
            {subtitle && <p className={`mt-1 text-sm font-semibold ${subTextClass}`}>{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            {closeLabel}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {loading ? (
            <div className={`py-16 text-center text-sm font-bold ${subTextClass}`}>{t("common.loading")}</div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-bold text-rose-500">{error}</div>
          ) : transactions.length === 0 ? (
            <div className={`py-16 text-center text-sm font-bold ${subTextClass}`}>{t("tx.no_transactions")}</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full min-w-[680px] text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60">
                  <tr>
                    <th className={`px-4 py-3 text-xs font-bold uppercase ${subTextClass}`}>{t("tx.form.date")}</th>
                    <th className={`px-4 py-3 text-xs font-bold uppercase ${subTextClass}`}>{t("tx.form.type")}</th>
                    <th className={`px-4 py-3 text-xs font-bold uppercase ${subTextClass}`}>{t("tx.form.note")}</th>
                    <th className={`px-4 py-3 text-xs font-bold uppercase ${subTextClass}`}>{t("tx.form.account")}</th>
                    <th className={`px-4 py-3 text-right text-xs font-bold uppercase ${subTextClass}`}>{t("tx.form.amount")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {transactions.map((transaction) => {
                    const isIncome = transaction.type === "income";
                    return (
                      <tr key={transaction.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className={`whitespace-nowrap px-4 py-3 text-sm font-bold ${headingClass}`}>
                          {new Date(transaction.date).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-bold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {isIncome ? t("tx.type.income") : t("tx.type.expense")}
                          </span>
                        </td>
                        <td className={`max-w-[240px] truncate px-4 py-3 text-sm font-medium ${subTextClass}`}>
                          {transaction.note || "-"}
                        </td>
                        <td className={`px-4 py-3 text-sm font-bold ${headingClass}`}>
                          {accountNameById.get(transaction.account_id) || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono font-bold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {isIncome ? "+" : "-"}{formatAmount(transaction.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
