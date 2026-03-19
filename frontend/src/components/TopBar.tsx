import { useState, useEffect, useRef } from "react";
import ProfileModal from "./ProfileModal";
import SystemModal from "./SystemModal";
import { getProfile } from "../service/api";

type AppTheme = 'light' | 'dark' | 'glass';

interface TopBarProps {
  onLogout: () => void;
  direction?: 'up' | 'down';
}

export default function TopBar({ onLogout, direction = 'up' }: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSystem, setShowSystem] = useState(false);
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('light');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Apply theme to DOM
  const applyTheme = (theme: AppTheme) => {
    const html = document.documentElement;
    html.classList.remove("dark");
    html.removeAttribute("data-theme");

    if (theme === 'dark') {
      html.classList.add("dark");
    } else if (theme === 'glass') {
      html.setAttribute("data-theme", "glass");
    }
    // 'light' = no class, no attribute  
  };

  // Initialize theme and profile
  useEffect(() => {
    // Theme check
    const saved = localStorage.getItem("app-theme") as AppTheme | null;
    // Migration: check old 'theme' key
    const oldSaved = localStorage.getItem("theme");
    
    let theme: AppTheme = 'light';
    if (saved) {
      theme = saved;
    } else if (oldSaved === 'dark') {
      theme = 'dark';
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = 'dark';
    }
    
    setCurrentTheme(theme);
    applyTheme(theme);

    const fetchUser = async () => {
      const data = await getProfile();
      if (data && data.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    fetchUser();

    // Listen to profile updates
    const handleProfileUpdate = () => fetchUser();
    window.addEventListener("profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("profile_updated", handleProfileUpdate);
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setTheme = (theme: AppTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem("app-theme", theme);
    applyTheme(theme);
    setDropdownOpen(false);
    window.dispatchEvent(new CustomEvent("theme_changed", { detail: theme }));
  };

  const handleAction = (action: 'profile' | 'system' | 'logout') => {
    setDropdownOpen(false);
    if (action === 'profile') setShowProfile(true);
    if (action === 'system') setShowSystem(true);
    if (action === 'logout') onLogout();
  };

  const isGlass = currentTheme === 'glass';

  return (
    <>
      <div className="relative z-40" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-12 h-12 rounded-full border-2 focus:outline-none focus:ring-4 shadow-lg overflow-hidden transition-all active:scale-95 ${
            isGlass
              ? 'border-white/20 focus:ring-white/10 shadow-white/5 bg-white/10'
              : 'border-blue-500/50 hover:border-blue-500 focus:ring-blue-500/20 shadow-blue-500/10 bg-slate-200 dark:bg-slate-700'
          }`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-full h-full text-slate-400 p-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          )}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className={`absolute ${direction === 'up' ? 'bottom-full origin-bottom mb-3' : 'top-full origin-top mt-3'} left-1/2 -translate-x-1/2 w-56 rounded-2xl shadow-2xl py-2 animate-fade-in ${
            isGlass
              ? 'glass-dropdown'
              : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'
          }`}>
            <div className={`px-4 py-3 border-b ${isGlass ? 'border-white/10' : 'border-slate-100 dark:border-slate-700'}`}>
              <p className={`text-sm font-medium ${isGlass ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>Tài khoản</p>
            </div>
            
            <div className="p-2 space-y-1">
              <button onClick={() => handleAction('profile')} className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition-colors ${
                isGlass ? 'text-white hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}>
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Hồ sơ
              </button>
              
              <button onClick={() => handleAction('system')} className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition-colors ${
                isGlass ? 'text-white hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}>
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                Hệ thống
              </button>

              {/* Theme Sub-menu on Hover */}
              <div className="group/theme relative">
                <button className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center justify-between gap-3 transition-colors ${
                  isGlass ? 'text-white hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                    Nền
                  </div>
                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
                
                {/* Sub-menu options */}
                <div className={`absolute left-full top-0 ml-1 w-44 rounded-2xl shadow-2xl py-2 opacity-0 invisible group-hover/theme:opacity-100 group-hover/theme:visible transition-all duration-200 ${
                  isGlass ? 'glass-dropdown' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'
                }`}>
                  <button onClick={() => setTheme('light')} className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${
                    isGlass ? 'text-white hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    Sáng
                  </button>
                  <button onClick={() => setTheme('dark')} className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${
                    isGlass ? 'text-white hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                    Tối
                  </button>
                  <button onClick={() => setTheme('glass')} className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${
                    isGlass ? 'text-white hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    Glass
                  </button>
                </div>
              </div>
            </div>
            
            <div className={`px-2 pt-2 border-t mt-1 ${isGlass ? 'border-white/10' : 'border-slate-100 dark:border-slate-700'}`}>
              <button onClick={() => handleAction('logout')} className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition-colors ${
                isGlass ? 'text-rose-400 hover:bg-rose-500/10' : 'hover:bg-rose-50 text-rose-600 dark:text-rose-400 dark:hover:bg-rose-500/10'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showSystem && <SystemModal onClose={() => setShowSystem(false)} />}
    </>
  );
}
