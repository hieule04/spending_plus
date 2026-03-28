import { useState, useEffect } from "react"
import LoginForm from "./components/LoginForm"
import RegisterForm from "./components/RegisterForm"
import VerifyOTPForm from "./components/VerifyOTPForm"
import AccountsTab from "./components/AccountsTab"
import CategoriesTab from "./components/CategoriesTab"
import TransactionsTab from "./components/TransactionsTab"
import DashboardTab from "./components/DashboardTab"
import BudgetsTab from "./components/BudgetsTab"
import SavingsTab from "./components/SavingsTab"
import DebtsTab from "./components/DebtsTab"
import ChatTab from "./components/ChatTab"
import TopBar from "./components/TopBar"
import MobileLayout from "./components/MobileLayout"
import MobileProfilePanel from "./components/MobileProfilePanel"
import AppWordmark from "./components/AppWordmark"
import MobilePageHeader from "./components/MobilePageHeader"
import { getProfile } from "./service/api"
import "./App.css"
import { useLanguage } from "./context/LanguageContext"

type TabType = 'system' | 'transactions' | 'savings' | 'accounts' | 'categories' | 'budgets' | 'debts' | 'chat' | 'profile';

function App() {
  const { t, language } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'register' | 'verify-otp'>('none');
  const [activeTab, setActiveTab] = useState<TabType>('system');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      setIsLoggedIn(!!token);
    };
    checkAuth();

    window.addEventListener("user_login", checkAuth);
    window.addEventListener("user_logout", checkAuth);

    return () => {
      window.removeEventListener("user_login", checkAuth);
      window.removeEventListener("user_logout", checkAuth);
    };
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchProfile = async () => {
      const data = await getProfile();
      setUserName(data?.full_name?.trim() || "");
      setUserAvatar(data?.avatar_url || null);
    };

    fetchProfile();
    window.addEventListener("profile_updated", fetchProfile);

    return () => {
      window.removeEventListener("profile_updated", fetchProfile);
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    window.dispatchEvent(new Event("user_logout"));
    setAuthMode('none');
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'system', label: t('nav.dashboard') },
    { id: 'transactions', label: t('nav.transactions') },
    { id: 'savings', label: t('nav.savings') },
    { id: 'budgets', label: t('nav.budgets') },
    { id: 'accounts', label: t('nav.accounts') },
    { id: 'categories', label: t('nav.categories') },
    { id: 'debts', label: t('nav.debts') },
    { id: 'chat', label: t('nav.chat') },
  ];
  const mobileGreeting = language === 'vi' ? 'Xin chào' : 'Hello';
  const mobileDrawerIds = ['transactions', 'accounts', 'savings', 'budgets', 'categories', 'debts'] as const;
  type MobileDrawerTabId = typeof mobileDrawerIds[number];
  const mobileDrawerMeta: Record<MobileDrawerTabId, { accent: string; description: string }> = {
    transactions: {
      accent: 'from-cyan-500 to-blue-500',
      description: language === 'vi' ? 'Ghi lại mọi khoản thu chi' : 'Capture every cash flow',
    },
    accounts: {
      accent: 'from-violet-500 to-fuchsia-500',
      description: language === 'vi' ? 'Theo dõi số dư các ví' : 'Track balances across wallets',
    },
    savings: {
      accent: 'from-emerald-500 to-teal-500',
      description: language === 'vi' ? 'Bám sát mục tiêu tiết kiệm' : 'Stay on top of saving goals',
    },
    budgets: {
      accent: 'from-amber-500 to-orange-500',
      description: language === 'vi' ? 'Kiểm soát giới hạn chi tiêu' : 'Keep spending within plan',
    },
    categories: {
      accent: 'from-pink-500 to-rose-500',
      description: language === 'vi' ? 'Sắp xếp nhóm giao dịch rõ ràng' : 'Organize transaction groups clearly',
    },
    debts: {
      accent: 'from-slate-500 to-slate-700',
      description: language === 'vi' ? 'Theo dõi các khoản vay nợ' : 'Monitor outstanding debts',
    },
  };
  const mobileDrawerTabs = tabs
    .filter((tab): tab is { id: MobileDrawerTabId; label: string } => mobileDrawerIds.includes(tab.id as MobileDrawerTabId))
    .map((tab) => {
      return {
        ...tab,
        accent: mobileDrawerMeta[tab.id].accent,
        description: mobileDrawerMeta[tab.id].description,
      };
    });
  const displayName = userName || (language === 'vi' ? 'bạn' : 'there');

  if (!isLoggedIn) {
    return (
      <div className={`h-[100dvh] overscroll-none flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300 ease-in-out bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white`}>
        <div className={`max-w-md w-full rounded-3xl shadow-2xl p-8 text-center relative animate-fade-in bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
          <header className={`mb-8 ${authMode !== 'none' ? 'opacity-80 scale-95 transition-all' : 'transition-all scale-100'}`}>
            <AppWordmark size="lg" className="justify-center pb-2 mb-2" />
            <p className={`text-lg font-medium text-slate-500 dark:text-slate-400`}>
              {language === 'vi' ? 'Quản lý tài chính thông minh' : 'Smart Finance Management'}
            </p>
          </header>

          <div className="min-h-[250px] flex flex-col justify-center">
            {authMode === 'none' && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setAuthMode('login')}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-lg"
                >
                  {language === 'vi' ? 'Đăng nhập' : 'Login'}
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white`}
                >
                  {language === 'vi' ? 'Đăng ký' : 'Register'}
                </button>
              </div>
            )}

            {authMode === 'login' && (
              <div className="w-full animate-fade-in">
                <LoginForm />
                <button
                  onClick={() => setAuthMode('none')}
                  className={`mt-6 transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white`}
                >
                  &larr; {t('common.back')}
                </button>
              </div>
            )}

            {authMode === 'register' && (
              <div className="w-full animate-fade-in">
                <RegisterForm
                  onSuccess={(email) => {
                    setRegisteredEmail(email);
                    setAuthMode('verify-otp');
                  }}
                />
                <button
                  onClick={() => setAuthMode('none')}
                  className={`mt-6 transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white`}
                >
                  &larr; {t('common.back')}
                </button>
              </div>
            )}

            {authMode === 'verify-otp' && (
              <div className="w-full animate-fade-in">
                <VerifyOTPForm
                  email={registeredEmail}
                  onSuccess={() => setAuthMode('login')}
                  onBack={() => setAuthMode('register')}
                />
                <button
                  onClick={() => setAuthMode('register')}
                  className={`mt-6 transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white`}
                >
                  &larr; {t('common.back')}
                </button>
              </div>
            )}
          </div>
        </div>

        <footer className={`mt-8 text-center text-sm font-medium text-slate-600 dark:text-slate-500`}>
          Spending Plus &bull; Built with FastAPI, React, and Supabase
        </footer>
      </div>
    );
  }

  return (
    <div className={`h-[100dvh] overflow-hidden flex flex-col items-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white`}>
      <div className="w-full max-w-[1600px] h-full flex flex-col md:flex-row relative md:gap-4 md:p-6 lg:p-8">

        {/* Mobile View Container */}
        <div className="md:hidden fixed inset-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
          
          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-[60] flex">
              <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
              <div className="relative flex h-full w-[19rem] max-w-[86vw] flex-col overflow-y-auto rounded-r-[2rem] border-r border-slate-200/50 dark:border-slate-700/60 bg-white/95 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.97),rgba(15,23,42,0.92))] shadow-[0_30px_80px_rgba(15,23,42,0.1)] dark:shadow-[0_30px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl animate-slide-in-left">
                <div className="relative overflow-hidden border-b border-slate-100 dark:border-slate-700/70 px-5 pb-5 pt-6">
                  <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.1),_transparent_62%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_48%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.28),_transparent_62%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.22),_transparent_48%)]" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-400 shadow-lg shadow-blue-500/20">
                        {userAvatar ? (
                          <img src={userAvatar} alt="User Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-black text-white">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                          {mobileGreeting}
                        </p>
                        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">
                          {displayName}
                        </h2>
                      </div>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="rounded-full bg-slate-100 dark:bg-white/10 p-2 text-slate-500 dark:text-slate-400 shadow-sm transition-colors hover:bg-slate-200 dark:hover:bg-white/15 hover:text-slate-800 dark:hover:text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                </div>
                <nav className="flex-1 px-5 py-5">
                  {mobileDrawerTabs.map((tab, index) => (
                    <div key={tab.id}>
                      <button
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        className="group flex w-full items-center justify-between gap-4 py-4 text-left transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold transition-colors ${activeTab === tab.id ? 'text-blue-600 dark:text-white' : 'text-slate-600 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white'}`}>
                            {tab.label}
                          </p>
                          <p className={`mt-1 text-xs leading-5 transition-colors ${activeTab === tab.id ? 'text-blue-500/80 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'}`}>
                            {tab.description}
                          </p>
                        </div>
                        <svg className={`h-4 w-4 shrink-0 transition-all ${activeTab === tab.id ? 'translate-x-0.5 text-blue-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600 group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                      </button>
                      {index < mobileDrawerTabs.length - 1 && (
                        <div className="h-px bg-slate-100 dark:bg-white/8" />
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          )}

          <MobileLayout activeTab={activeTab} onTabChange={setActiveTab}>
            <div className="animate-fade-in h-full pt-1">
              {activeTab === 'system' && <DashboardTab onOpenMobileMenu={() => setMobileMenuOpen(true)} />}
              {activeTab === 'transactions' && <TransactionsTab onOpenMobileMenu={() => setMobileMenuOpen(true)} />}
              {activeTab === 'savings' && <SavingsTab />}
              {activeTab === 'budgets' && <BudgetsTab />}
              {activeTab === 'accounts' && <AccountsTab />}
              {activeTab === 'categories' && <CategoriesTab />}
              {activeTab === 'debts' && <DebtsTab />}
              {activeTab === 'chat' && <ChatTab onOpenMobileMenu={() => setMobileMenuOpen(true)} />}
              {activeTab === 'profile' && <MobileProfilePanel onLogout={handleLogout} onOpenMobileMenu={() => setMobileMenuOpen(true)} />}
            </div>
          </MobileLayout>
        </div>

        {/* Desktop Left Sidebar */}
        <aside className={`hidden md:flex w-64 flex-none rounded-3xl shadow-sm flex-col p-6 z-30 relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
          <div className="mb-10">
            <div>
              <AppWordmark size="md" className="pb-1" />
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 text-slate-600 dark:text-slate-500`}>Finance App</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-5 py-3.5 text-sm font-bold rounded-2xl transition-all ${activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-800/50'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Bottom TopBar */}
          <div className={`pt-6 mt-6 border-t flex justify-center border-slate-100 dark:border-slate-700`}>
            <TopBar onLogout={handleLogout} direction="up" />
          </div>
        </aside>

        {/* Main Content Pane (Desktop) */}
        <main className={`hidden md:flex flex-1 overflow-auto rounded-3xl shadow-inner flex flex-col relative z-20 bg-white/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50`}>
          <div className="flex-1 relative overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="animate-fade-in h-full">
              {activeTab === 'system' && <DashboardTab />}
              {activeTab === 'transactions' && <TransactionsTab />}
              {activeTab === 'savings' && <SavingsTab />}
              {activeTab === 'budgets' && <BudgetsTab />}
              {activeTab === 'accounts' && <AccountsTab />}
              {activeTab === 'categories' && <CategoriesTab />}
              {activeTab === 'debts' && <DebtsTab />}
              {activeTab === 'chat' && <ChatTab />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
