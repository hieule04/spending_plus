import { createPortal } from "react-dom";
import { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import FancySelect from "./FancySelect";

export interface RelatedTransaction {
  id: string;
  amount: number;
  type: string;
  date: string;
  note: string | null;
}

interface RelatedTransactionsPanelProps {
  title: string;
  transactions: RelatedTransaction[];
  loading: boolean;
  emptyText: string;
  onClose: () => void;
}

export default function RelatedTransactionsPanel({
  title,
  transactions,
  loading,
  emptyText,
  onClose,
}: RelatedTransactionsPanelProps) {
  const { language, formatAmount } = useLanguage();
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month" | "year">("all");

  const filteredTransactions = useMemo(() => {
    if (timeFilter === "all") return transactions;

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (timeFilter === "week") {
      const day = start.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diffToMonday);
    }

    if (timeFilter === "month") {
      start.setDate(1);
    }

    if (timeFilter === "year") {
      start.setMonth(0, 1);
    }

    const end = new Date(start);
    if (timeFilter === "today") end.setDate(end.getDate() + 1);
    if (timeFilter === "week") end.setDate(end.getDate() + 7);
    if (timeFilter === "month") end.setMonth(end.getMonth() + 1);
    if (timeFilter === "year") end.setFullYear(end.getFullYear() + 1);

    return transactions.filter((txn) => {
      const date = new Date(txn.date);
      return date >= start && date < end;
    });
  }, [timeFilter, transactions]);

  const filterOptions: { value: "all" | "today" | "week" | "month" | "year"; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "today", label: "Hôm nay" },
    { value: "week", label: "Tuần này" },
    { value: "month", label: "Tháng này" },
    { value: "year", label: "Năm nay" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm md:p-8">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Đóng" />

      <section className="relative z-10 max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800 md:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <FancySelect
              value={timeFilter}
              onChange={(value) => setTimeFilter(value)}
              options={filterOptions}
              className="w-32 md:w-40"
              buttonClassName="h-10 rounded-xl px-3 py-2 text-sm"
              dropdownClassName="right-0 w-40"
            />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              aria-label="Đóng"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">Đang tải giao dịch...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 py-8 text-center text-sm font-bold text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            {transactions.length === 0 ? emptyText : "Không có giao dịch trong thời gian đã chọn."}
          </div>
        ) : (
          <div className="max-h-[64vh] overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredTransactions.map((txn) => {
                const isIncome = txn.type === "income";
                return (
                  <div key={txn.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {new Date(txn.date).toLocaleDateString(locale)}
                      </p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                        {txn.note || "Không có ghi chú"}
                      </p>
                    </div>
                    <p className={`shrink-0 font-mono text-sm font-black ${isIncome ? "text-emerald-500" : "text-rose-500"}`}>
                      {isIncome ? "+" : "-"}{formatAmount(txn.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
    ,
    document.body
  );
}
