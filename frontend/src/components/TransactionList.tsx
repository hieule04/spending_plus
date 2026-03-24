interface TransactionItem {
  id: string;
  name: string;
  category: string;
  amount: string;
  highlighted?: boolean;
}

const transactions: TransactionItem[] = [
  {
    id: "tx-1",
    name: "Ăn trưa văn phòng",
    category: "🍽️ Ăn uống",
    amount: "-120,000 ₫",
    highlighted: true,
  },
  {
    id: "tx-2",
    name: "Mua đồ gia dụng",
    category: "🛍️ Mua sắm",
    amount: "-640,000 ₫",
  },
];

export default function TransactionList() {
  return (
    <section className="bg-white px-5 pb-8 pt-2">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Giao dịch gần đây</h2>
      </div>

      <div className="flex flex-col gap-4">
        {transactions.map((transaction) => {
          const isHighlighted = transaction.highlighted;

          return (
            <article
              key={transaction.id}
              className={
                isHighlighted
                  ? "flex items-center justify-between rounded-[24px] bg-[#48C08A] px-5 py-4 text-white shadow-[0_18px_36px_rgba(72,192,138,0.24)]"
                  : "flex items-center justify-between rounded-[24px] bg-[#F8F9FB] px-5 py-4 text-slate-900"
              }
            >
              <div className="min-w-0">
                <p className="truncate text-base font-bold">{transaction.name}</p>
                <div
                  className={
                    isHighlighted
                      ? "mt-2 inline-flex items-center rounded-full bg-white/16 px-3 py-1 text-sm font-medium text-white/90"
                      : "mt-2 inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600 shadow-[0_6px_18px_rgba(15,23,42,0.05)]"
                  }
                >
                  {transaction.category}
                </div>
              </div>

              <p className="ml-4 shrink-0 text-base font-bold">{transaction.amount}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
