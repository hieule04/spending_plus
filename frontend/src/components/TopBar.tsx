import { useState, useEffect, useRef } from "react";
import ProfileModal from "./ProfileModal";
import InfoModal from "./InfoModal";
import SystemModal from "./SystemModal";
import { 
  getProfile, getUnreadCount, getNotifications, 
  markNotificationsAsRead, deleteNotification, clearNotifications 
} from "../service/api";
import { useLanguage } from "../context/LanguageContext";

type AppTheme = 'light' | 'dark';
type ThemeTranslationKey = 'nav.theme.light' | 'nav.theme.dark';
type LanguageTranslationKey = 'lang.vi' | 'lang.en';

interface TopBarProps {
  onLogout: () => void;
  direction?: 'up' | 'down';
}

export default function TopBar({ onLogout, direction = 'up' }: TopBarProps) {
  const { t, language, setLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSystem, setShowSystem] = useState(false);
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('light');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Apply theme to DOM
  const applyTheme = (theme: AppTheme) => {
    const html = document.documentElement;
    html.classList.remove("dark");
    html.removeAttribute("data-theme");

    if (theme === 'dark') {
      html.classList.add("dark");
    }
  };

  const fetchUser = async () => {
    const data = await getProfile();
    if (data && data.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
  };
  
  const fetchNotifs = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count ?? 0);
      if (dropdownOpen) {
        const list = await getNotifications();
        setNotifications(list || []);
      }
    } catch {
      setUnreadCount(0);
      if (dropdownOpen) {
        setNotifications([]);
      }
    }
  };

  // Initialize theme and profile
  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as AppTheme | null;
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

    fetchUser();
    fetchNotifs();

    const interval = setInterval(fetchNotifs, 30000);

    const handleProfileUpdate = () => fetchUser();
    window.addEventListener("profile_updated", handleProfileUpdate);
    window.addEventListener("refresh_transactions", fetchNotifs);

    return () => {
      window.removeEventListener("profile_updated", handleProfileUpdate);
      window.removeEventListener("refresh_transactions", fetchNotifs);
      clearInterval(interval);
    };
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      fetchNotifs();
    }
  }, [dropdownOpen]);

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

  const handleAction = (action: 'profile' | 'info' | 'system' | 'logout') => {
    setDropdownOpen(false);
    if (action === 'profile') setShowProfile(true);
    if (action === 'info') setShowInfo(true);
    if (action === 'system') setShowSystem(true);
    if (action === 'logout') onLogout();
  };

  const handleMarkAsRead = async () => {
    await markNotificationsAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleDeleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Re-fetch unread count just in case
    const count = await getUnreadCount();
    setUnreadCount(count);
  };

  const handleClearAll = async () => {
    await clearNotifications();
    setNotifications([]);
    setUnreadCount(0);
  };


  return (
    <>
      <div className="relative z-40" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`relative w-12 h-12 rounded-full border-2 focus:outline-none focus:ring-4 shadow-lg overflow-visible transition-all active:scale-95 border-blue-500/50 hover:border-blue-500 focus:ring-blue-500/20 shadow-blue-500/10 bg-slate-200 dark:bg-slate-700`}
        >
          <div className="w-full h-full rounded-full overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-full h-full text-slate-400 p-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </div>

          {/* Badge */}
          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 -mr-1 -mt-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg animate-pulse z-50 pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className={`absolute ${direction === 'up' ? 'bottom-full origin-bottom mb-3' : 'top-full origin-top mt-3'} left-1/2 -translate-x-1/2 w-64 rounded-2xl shadow-2xl py-2 animate-fade-in bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700`}>
            <div className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700`}>
              <p className={`text-sm font-medium text-slate-500 dark:text-slate-400`}>{t('nav.profile')}</p>
            </div>
            
            <div className="p-2 space-y-1">
              {/* Notifications List */}
              <div className={`mb-2 border-b pb-2 border-slate-100 dark:border-slate-700`}>
                <div className="px-4 py-1 flex items-center justify-between mb-1">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500`}>
                      Thông báo ({unreadCount})
                    </span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleClearAll}
                        className="text-[9px] text-rose-500 hover:underline font-bold text-left"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAsRead}
                      className="text-[10px] text-blue-500 hover:underline font-bold"
                    >
                      Đã đọc
                    </button>
                  )}
                </div>
                
                <div className="max-h-40 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className="relative group/notif">
                        <div className={`p-2.5 rounded-xl text-xs transition-colors pr-8 ${
                          n.is_read 
                            ? 'opacity-60' 
                            : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                        }`}>
                          <p className={`font-medium mb-0.5 text-slate-800 dark:text-slate-200`}>{n.message}</p>
                          <p className={`text-[9px] text-slate-400 dark:text-slate-500`}>
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteNotif(e, n.id)}
                          className="absolute right-2 top-2 p-1 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 opacity-0 group-hover/notif:opacity-100 transition-opacity"
                        >
                          <svg className={`w-3 h-3 text-slate-500 dark:text-slate-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-xs text-center text-slate-400 italic">Không có thông báo mới</p>
                  )}
                </div>
              </div>

              <button onClick={() => handleAction('profile')} className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200`}>
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                {t('nav.profile')}
              </button>

              {/* Sub-menu Language */}
              <div className="relative group/lang">
                <button className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center justify-between gap-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200`}>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                    <span>{t('nav.language')}</span>
                  </div>
                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
                
                <div className={`absolute left-full top-0 ml-1 w-44 rounded-2xl shadow-2xl py-2 opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-200 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700`}>
                  {[
                    { id: 'vi' as const, labelKey: 'lang.vi' as LanguageTranslationKey },
                    { id: 'en' as const, labelKey: 'lang.en' as LanguageTranslationKey },
                  ].map(({ id: lang, labelKey }) => (
                    <button 
                      key={lang}
                      onClick={() => { setLanguage(lang as any); setDropdownOpen(false); }} 
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between gap-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{lang.toUpperCase()}</span>
                        <span>{t(labelKey)}</span>
                      </div>
                      {language === lang && <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-menu Theme */}
              <div className="relative group/theme">
                <button className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center justify-between gap-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200`}>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                    <span>{t('nav.theme')}</span>
                  </div>
                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
                
                <div className={`absolute left-full top-0 ml-1 w-44 rounded-2xl shadow-2xl py-2 opacity-0 invisible group-hover/theme:opacity-100 group-hover/theme:visible transition-all duration-200 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700`}>
                  {[
                    { id: 'light' as const, labelKey: 'nav.theme.light' as ThemeTranslationKey },
                    { id: 'dark' as const, labelKey: 'nav.theme.dark' as ThemeTranslationKey },
                  ].map(({ id: theme, labelKey }) => (
                    <button 
                      key={theme}
                      onClick={() => setTheme(theme as AppTheme)} 
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between gap-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200`}
                    >
                      <div className="flex items-center gap-3">
                        {theme === 'light' && <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                        {theme === 'dark' && <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>}
                        <span>{t(labelKey)}</span>
                      </div>
                      {currentTheme === theme && <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => handleAction('system')} className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200`}>
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                {t('nav.system')}
              </button>

              <button onClick={() => handleAction('info')} className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200`}>
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {t('nav.info')}
              </button>
            </div>
            
            <div className={`px-2 pt-2 border-t mt-1 border-slate-100 dark:border-slate-700`}>
              <button onClick={() => handleAction('logout')} className={`w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition-colors hover:bg-rose-50 text-rose-600 dark:text-rose-400 dark:hover:bg-rose-500/10`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                {t('nav.logout')}
              </button>
            </div>
          </div>
        )}
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {showSystem && <SystemModal onClose={() => setShowSystem(false)} />}
    </>
  );
}
