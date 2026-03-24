interface QuickActionItem {
  emoji: string;
  title: string;
  description: string;
  color: string;
}

const quickActions: QuickActionItem[] = [
  {
    emoji: "🤖",
    title: "Chat AI",
    description: "Nhập liệu",
    color: "#FF8E60",
  },
  {
    emoji: "🧾",
    title: "Ghi nhanh",
    description: "Chi tiêu",
    color: "#898EFC",
  },
  {
    emoji: "🎯",
    title: "Mục tiêu",
    description: "Tiết kiệm",
    color: "#F4D160",
  },
];

export default function QuickActions() {
  return (
    <section className="-mt-10 rounded-t-[40px] bg-white px-5 pb-8 pt-6 shadow-[0_-8px_24px_rgba(15,23,42,0.04),0_20px_40px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Hành động nhanh</h2>
      </div>

      <div className="scrollbar-hide -mr-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pr-5">
        {quickActions.map((item) => (
          <article
            key={item.title}
            className="relative min-w-[140px] snap-start overflow-hidden rounded-[24px] px-4 pb-5 pt-4 text-slate-900 shadow-[0_16px_30px_rgba(15,23,42,0.14)]"
            style={{ backgroundColor: item.color }}
          >
            <span
              className="absolute -right-1 -top-1 h-11 w-11 rounded-bl-[22px] bg-white/80 shadow-[-8px_8px_20px_rgba(15,23,42,0.08)]"
              aria-hidden="true"
            />
            <span
              className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-white/80 shadow-[0_2px_10px_rgba(255,255,255,0.5)]"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div className="text-4xl leading-none">{item.emoji}</div>
              <p className="mt-5 text-base font-bold leading-tight">{item.title}</p>
              <p className="mt-1 text-sm font-medium text-slate-900/75">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
