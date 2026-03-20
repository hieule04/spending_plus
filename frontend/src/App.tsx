import { useState, useEffect } from "react"
import RegisterForm from "./components/RegisterForm"
import LoginForm from "./components/LoginForm"
import AccountsTab from "./components/AccountsTab"
import CategoriesTab from "./components/CategoriesTab"
import TransactionsTab from "./components/TransactionsTab"
import DashboardTab from "./components/DashboardTab"
import BudgetsTab from "./components/BudgetsTab"
import SavingsTab from "./components/SavingsTab"
import DebtsTab from "./components/DebtsTab"
import TopBar from "./components/TopBar"
import "./App.css"
import { useLanguage } from "./context/LanguageContext"

type TabType = 'system' | 'transactions' | 'savings' | 'accounts' | 'categories' | 'budgets' | 'debts';

function App() {
  const { t, language } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'register'>('none');
  const [activeTab, setActiveTab] = useState<TabType>('system');
  
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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    window.dispatchEvent(new Event("user_logout"));
    setAuthMode('none');
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'system',       label: t('nav.dashboard') },
    { id: 'transactions', label: t('nav.transactions') },
    { id: 'savings',      label: t('nav.savings') },
    { id: 'budgets',      label: t('nav.budgets') },
    { id: 'accounts',     label: t('nav.accounts') },
    { id: 'categories',   label: t('nav.categories') },
    { id: 'debts',         label: t('nav.debts') },
  ];

  if (!isLoggedIn) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300 ease-in-out bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white`}>
        <div className={`max-w-md w-full rounded-3xl shadow-2xl p-8 text-center relative animate-fade-in bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
          <header className={`mb-8 ${authMode !== 'none' ? 'opacity-80 scale-95 transition-all' : 'transition-all scale-100'}`}>
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent pb-2 mb-2 tracking-tight leading-[1.2]">
              Spending Plus
            </h1>
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
                <RegisterForm />
                <button
                  onClick={() => setAuthMode('none')}
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
    <div className={`h-screen flex flex-col items-center font-sans transition-colors duration-300 ease-in-out overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white`}>
     <div className="w-full max-w-[1600px] h-full flex flex-col md:flex-row relative gap-4 p-4 sm:p-6 lg:p-8">
      
      {/* Mobile Top Header */}
      <header className={`md:hidden flex-none rounded-3xl px-5 py-4 flex items-center justify-between z-30 shadow-sm relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-blue-600 shadow-blue-500/20`}>
            <span className="text-white text-xl font-black">S+</span>
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent pb-1">Spending Plus</h1>
        </div>
        <div className="relative">
          <TopBar onLogout={handleLogout} direction="down" />
        </div>
      </header>

          {/* Mobile Navigation Footer (Sticky) */}
          <div className={`md:hidden flex items-center justify-around p-3 border-t shrink-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-2`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`p-2 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className="text-[10px] font-bold uppercase">{tab.label.substring(0, 3)}</div>
              </button>
            ))}
          </div>

      {/* Desktop Left Sidebar */}
      <aside className={`hidden md:flex w-64 flex-none rounded-3xl shadow-sm flex-col p-6 z-30 relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
        <div className="flex items-center gap-3 mb-10">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-blue-600 shadow-blue-500/20`}>
            <span className="text-white text-xl font-black">S+</span>
          </div>
          <div>
            <h1 className={`text-xl font-black bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent pb-1 leading-none tracking-tight`}>
              Spending Plus
            </h1>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 text-slate-600 dark:text-slate-500`}>Finance App</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-5 py-3.5 text-sm font-bold rounded-2xl transition-all ${
                activeTab === tab.id
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

      {/* Main Content Pane */}
      <main className={`flex-1 overflow-auto rounded-3xl shadow-inner flex flex-col relative z-20 bg-white/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50`}>
        <div className="flex-1 relative overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-in h-full">
            {activeTab === 'system' && <DashboardTab />}
            {activeTab === 'transactions' && <TransactionsTab />}
            {activeTab === 'savings' && <SavingsTab />}
            {activeTab === 'budgets' && <BudgetsTab />}
            {activeTab === 'accounts' && <AccountsTab />}
            {activeTab === 'categories' && <CategoriesTab />}
            {activeTab === 'debts' && <DebtsTab />}
          </div>
        </div>
      </main>
     </div>
    </div>
  )
}

export default App
