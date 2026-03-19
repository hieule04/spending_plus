import { useState, useEffect } from "react"
import { api } from "./service/api"
import RegisterForm from "./components/RegisterForm"
import LoginForm from "./components/LoginForm"
import AccountsTab from "./components/AccountsTab"
import CategoriesTab from "./components/CategoriesTab"
import TransactionsTab from "./components/TransactionsTab"
import DashboardTab from "./components/DashboardTab"
import TopBar from "./components/TopBar"
import "./App.css"

type TabType = 'system' | 'transactions' | 'accounts' | 'categories';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'register'>('none');
  const [activeTab, setActiveTab] = useState<TabType>('system');
  
  useEffect(() => {
    // Auth logic
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

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'system',       label: 'Tổng quan',    icon: '📊' },
    { id: 'transactions', label: 'Giao dịch',   icon: '📝' },
    { id: 'accounts',     label: 'Ví',           icon: '💰' },
    { id: 'categories',   label: 'Danh mục',     icon: '📁' },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4 py-8 font-sans transition-colors duration-300 ease-in-out">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 text-center relative">
          
          <header className={`mb-8 ${authMode !== 'none' ? 'opacity-80 scale-95 transition-all' : 'transition-all scale-100'}`}>
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent mb-4 tracking-tight">
              Spending Plus
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Quản lý tài chính thông minh</p>
          </header>

          <div className="min-h-[250px] flex flex-col justify-center">
            {authMode === 'none' && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setAuthMode('login')}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-lg"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className="w-full py-3.5 px-6 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-lg"
                >
                  Đăng ký
                </button>
              </div>
            )}

            {authMode === 'login' && (
              <div className="w-full">
                <LoginForm />
                <button
                  onClick={() => setAuthMode('none')}
                  className="mt-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                >
                  &larr; Quay lại
                </button>
              </div>
            )}

            {authMode === 'register' && (
              <div className="w-full">
                <RegisterForm />
                <button
                  onClick={() => setAuthMode('none')}
                  className="mt-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                >
                  &larr; Quay lại
                </button>
              </div>
            )}
          </div>
        </div>
        
        <footer className="mt-8 text-center text-slate-500 dark:text-slate-500 text-sm font-medium">
          Spending Plus &bull; Built with FastAPI, React, and Supabase
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col items-center p-4 py-8 font-sans transition-colors duration-300 ease-in-out relative">
      <TopBar onLogout={handleLogout} />
      
      <div className="max-w-6xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 relative mt-16 sm:mt-0">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent mb-2">
            Spending Plus
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Hệ thống quản lý chi tiêu thông minh</p>
        </header>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-900/60 p-2 rounded-2xl mb-8 border border-slate-200 dark:border-slate-700/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-2 text-sm font-bold rounded-xl transition-all duration-200 ease-in-out flex flex-col sm:flex-row items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 transform scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <main className="min-h-[400px]">
          {/* TAB: Tổng quan */}
          {activeTab === 'system' && (
            <div className="animate-fade-in"><DashboardTab /></div>
          )}

          {/* TAB: Giao dịch */}
          {activeTab === 'transactions' && <div className="animate-fade-in"><TransactionsTab /></div>}

          {/* TAB: Ví của tôi */}
          {activeTab === 'accounts' && <div className="animate-fade-in"><AccountsTab /></div>}

          {/* TAB: Danh mục */}
          {activeTab === 'categories' && <div className="animate-fade-in"><CategoriesTab /></div>}

        </main>

        <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-slate-500 font-medium text-sm">
          Spending Plus &bull; Built with FastAPI, React, and Supabase
        </footer>
      </div>
    </div>
  )
}

export default App