interface AppWordmarkProps {
  size?: "sm" | "md" | "lg";
  tone?: "default" | "light";
  className?: string;
}

export default function AppWordmark({
  size = "md",
  tone = "default",
  className = "",
}: AppWordmarkProps) {
  const sizes = {
    sm: {
      wrap: "gap-1",
      spending: "text-[1.12rem]",
      plus: "text-[1rem]",
    },
    md: {
      wrap: "gap-1.5",
      spending: "text-[1.24rem]",
      plus: "text-[1.08rem]",
    },
    lg: {
      wrap: "gap-2",
      spending: "text-[2.7rem]",
      plus: "text-[2.15rem]",
    },
  }[size];

  const spendingTone =
    tone === "light"
      ? "text-white/96 drop-shadow-[0_8px_24px_rgba(15,23,42,0.28)]"
      : "text-slate-900 dark:text-slate-50";

  const plusTone =
    tone === "light"
      ? "text-white/62"
      : "text-slate-400 dark:text-slate-500";

  return (
    <div className={`inline-flex flex-col leading-none ${className}`}>
      <div className={`inline-flex items-baseline ${sizes.wrap}`}>
        <span className={`${sizes.spending} font-semibold tracking-[-0.055em] font-wordmark ${spendingTone}`}>
          Spending
        </span>
        <span className={`${sizes.plus} font-medium italic tracking-[-0.04em] font-wordmark ${plusTone}`}>
          Plus
        </span>
      </div>
    </div>
  );
}
