interface HeaderBalanceProps {
  amount?: string;
  label?: string;
  onSearchClick?: () => void;
}

const SearchIcon = () => (
  <svg
    className="h-5 w-5 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
    />
  </svg>
);

export default function HeaderBalance({
  amount = "12,500,000 ₫",
  label = "Tổng số dư",
  onSearchClick,
}: HeaderBalanceProps) {
  return (
    <section className="rounded-b-[40px] bg-[#1B5E41] px-5 pt-14 pb-20 text-white">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={onSearchClick}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm transition active:scale-95"
          aria-label="Tìm kiếm"
        >
          <SearchIcon />
        </button>

        <div className="text-right">
          <p className="text-sm font-medium text-white/70">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-white">{amount}</p>
        </div>
      </div>
    </section>
  );
}
