import type { ReactElement, ReactNode, SVGProps } from "react";
import { useLanguage } from "../context/LanguageContext";

type TabType = 'system' | 'transactions' | 'savings' | 'accounts' | 'categories' | 'budgets' | 'debts' | 'chat' | 'profile';

interface MobileLayoutProps {
  children: ReactNode;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

interface NavItem {
  id: TabType;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
}

const HomeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const ChatIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12.375m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </svg>
);

const ProfileIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a8.966 8.966 0 0 1 15 0" />
  </svg>
);

export default function MobileLayout({
  children,
  activeTab = "system",
  onTabChange,
}: MobileLayoutProps) {
  const { t } = useLanguage();

  const navItems: NavItem[] = [
    { id: "system", label: t('nav.dashboard'), Icon: HomeIcon },
    { id: "chat", label: t('nav.chat'), Icon: ChatIcon },
    { id: "profile", label: t('nav.profile'), Icon: ProfileIcon },
  ];

  return (
    <div className="mobile-shell flex h-full w-full flex-col overflow-hidden bg-gray-50 dark:bg-slate-900">
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="mobile-content px-4">
          {children}
        </div>
      </main>

      <nav
        className="bottom-nav z-40 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]"
      >
        <div className="bottom-nav__inner mx-auto flex w-full max-w-md items-center justify-between">
          {navItems.map(({ id, label, Icon }) => {
            const isActive = id === activeTab;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange?.(id)}
                className="flex min-w-0 flex-1 flex-col items-center gap-1 py-0.5 text-center"
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={
                    isActive ? "h-6 w-6 text-blue-600 dark:text-blue-400" : "h-6 w-6 text-gray-300 dark:text-slate-600"
                  }
                />
                <span
                  className={
                    isActive
                      ? "max-w-[4.8rem] text-[10px] font-bold leading-tight text-blue-600 dark:text-blue-400"
                      : "max-w-[4.8rem] text-[10px] font-medium leading-tight text-gray-400 dark:text-slate-500"
                  }
                >
                  {label}
                </span>
                <span
                  className={
                    isActive
                      ? "h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5"
                      : "h-1 w-1 rounded-full bg-transparent mt-0.5"
                  }
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
