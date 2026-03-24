import type { ReactElement, ReactNode, SVGProps } from "react";

type MobileTab = "home" | "chat" | "history" | "profile";

interface MobileLayoutProps {
  children: ReactNode;
  activeTab?: MobileTab;
  onTabChange?: (tab: MobileTab) => void;
}

interface NavItem {
  id: MobileTab;
  label: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
}

const HomeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75V21h13.5V9.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21v-6h4.5v6" />
  </svg>
);

const ChatIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16.5c-1.933 0-3.5-1.567-3.5-3.5v-5C3.5 6.067 5.067 4.5 7 4.5h10c1.933 0 3.5 1.567 3.5 3.5v5c0 1.933-1.567 3.5-3.5 3.5h-5.25L7.5 20v-3.5H7Z"
    />
  </svg>
);

const HistoryIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1 0 2.197-5.303" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5v4.5H9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25V12l2.625 2.625" />
  </svg>
);

const ProfileIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a8.966 8.966 0 0 1 15 0"
    />
  </svg>
);

const navItems: NavItem[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "chat", label: "Chat", Icon: ChatIcon },
  { id: "history", label: "Lịch sử", Icon: HistoryIcon },
  { id: "profile", label: "Cá nhân", Icon: ProfileIcon },
];

export default function MobileLayout({
  children,
  activeTab = "home",
  onTabChange,
}: MobileLayoutProps) {
  return (
    <div className="relative flex h-[100dvh] flex-col bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-start justify-between">
          {navItems.map(({ id, label, Icon }) => {
            const isActive = id === activeTab;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange?.(id)}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5 py-1 text-center"
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={
                    isActive ? "h-6 w-6 text-emerald-500" : "h-6 w-6 text-gray-300"
                  }
                />
                <span
                  className={
                    isActive
                      ? "text-[11px] font-semibold text-emerald-600"
                      : "text-[11px] font-medium text-gray-400"
                  }
                >
                  {label}
                </span>
                <span
                  className={
                    isActive
                      ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                      : "h-1.5 w-1.5 rounded-full bg-transparent"
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
