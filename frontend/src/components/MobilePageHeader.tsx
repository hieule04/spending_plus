import type { ReactNode } from "react";
import AppWordmark from "./AppWordmark";

interface MobilePageHeaderProps {
  onOpenMobileMenu?: () => void;
  rightSlot?: ReactNode;
  className?: string;
}

export default function MobilePageHeader({
  onOpenMobileMenu,
  rightSlot,
  className = "",
}: MobilePageHeaderProps) {
  return (
    <div className={`md:hidden ${className}`}>
      <div className="flex items-center gap-3 pl-1 pr-0">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-900"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <AppWordmark size="sm" />
        </div>

        {rightSlot && <div className="ml-auto w-fit shrink-0">{rightSlot}</div>}
      </div>
    </div>
  );
}
