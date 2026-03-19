import { useState, useEffect, useRef } from "react";
import ProfileModal from "./ProfileModal";
import SystemModal from "./SystemModal";
import { getProfile } from "../service/api";

interface TopBarProps {
  onLogout: () => void;
  direction?: 'up' | 'down';
}

export default function TopBar({ onLogout, direction = 'up' }: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSystem, setShowSystem] = useState(false);
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize theme and profile
  useEffect(() => {
    // Theme check
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme === "dark" || (!currentTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }

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

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
    setDropdownOpen(false);
  };

  const handleAction = (action: 'profile' | 'system' | 'logout') => {
    setDropdownOpen(false);
    if (action === 'profile') setShowProfile(true);
    if (action === 'system') setShowSystem(true);
    if (action === 'logout') onLogout();
  };

  return (
    <>
      <div className="relative z-40" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-12 h-12 rounded-full border-2 border-blue-500/50 hover:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-lg shadow-blue-500/10 overflow-hidden bg-slate-200 dark:bg-slate-700 transition-all active:scale-95"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-full h-full text-slate-400 dark:text-slate-400 p-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          )}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className={`absolute ${direction === 'up' ? 'bottom-full origin-bottom mb-3' : 'top-full origin-top mt-3'} left-1/2 -translate-x-1/2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 animate-fade-in`}>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tài khoản</p>
            </div>
            
            <div className="p-2 space-y-1">
              <button onClick={() => handleAction('profile')} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-3 transition-colors">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Hồ sơ
              </button>
              
              <button onClick={() => handleAction('system')} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-3 transition-colors">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                Hệ thống
              </button>

              <button onClick={toggleTheme} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center gap-3 transition-colors">
                {isDark ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : (
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                )}
                {isDark ? "Giao diện Sáng" : "Giao diện Tối"}
              </button>
            </div>
            
            <div className="px-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-1">
              <button onClick={() => handleAction('logout')} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 dark:text-rose-400 dark:hover:bg-rose-500/10 font-bold flex items-center gap-3 transition-colors">
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
