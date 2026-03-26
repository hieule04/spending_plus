import { useEffect, useState } from "react";
import ProfileModal from "./ProfileModal";
import InfoModal from "./InfoModal";
import SystemModal from "./SystemModal";
import MobilePageHeader from "./MobilePageHeader";
import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  getProfile,
  getUnreadCount,
  markNotificationsAsRead,
} from "../service/api";
import { useLanguage } from "../context/LanguageContext";

type AppTheme = "light" | "dark";
type ThemeTranslationKey = "nav.theme.light" | "nav.theme.dark";
type LanguageTranslationKey = "lang.vi" | "lang.en";

interface MobileProfilePanelProps {
  onLogout: () => void;
  onOpenMobileMenu?: () => void;
}

export default function MobileProfilePanel({ onLogout, onOpenMobileMenu }: MobileProfilePanelProps) {
  const { t, language, setLanguage } = useLanguage();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>("light");
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSystem, setShowSystem] = useState(false);

  const applyTheme = (theme: AppTheme) => {
    const html = document.documentElement;
    html.classList.remove("dark");
    html.removeAttribute("data-theme");
    if (theme === "dark") html.classList.add("dark");
  };

  const fetchUser = async () => {
    const data = await getProfile();
    setAvatarUrl(data?.avatar_url || null);
    setUserName(data?.full_name?.trim() || "");
  };

  const fetchNotifs = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count ?? 0);
      const list = await getNotifications();
      setNotifications(list || []);
    } catch {
      setUnreadCount(0);
      setNotifications([]);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as AppTheme | null;
    const oldSaved = localStorage.getItem("theme");
    let theme: AppTheme = "light";
    if (saved) theme = saved;
    else if (oldSaved === "dark") theme = "dark";
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) theme = "dark";

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

  const setTheme = (theme: AppTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem("app-theme", theme);
    applyTheme(theme);
    setThemeMenuOpen(false);
    window.dispatchEvent(new CustomEvent("theme_changed", { detail: theme }));
  };

  const handleMarkAsRead = async () => {
    await markNotificationsAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDeleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const count = await getUnreadCount();
    setUnreadCount(count ?? 0);
  };

  const handleClearAll = async () => {
    await clearNotifications();
    setNotifications([]);
    setUnreadCount(0);
  };

  const sectionButton = "w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center gap-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200";
  const collapsibleButton = "w-full text-left px-4 py-2.5 rounded-xl font-bold flex items-center justify-between gap-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200";
  const optionButton = "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between gap-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200";
  const languages = [
    { id: "vi" as const, labelKey: "lang.vi" as LanguageTranslationKey },
    { id: "en" as const, labelKey: "lang.en" as LanguageTranslationKey },
  ];
  const themes = [
    { id: "light" as const, labelKey: "nav.theme.light" as ThemeTranslationKey },
    { id: "dark" as const, labelKey: "nav.theme.dark" as ThemeTranslationKey },
  ];
  const profileDisplayName = userName || (language === "vi" ? "Người dùng" : "User");

  return (
    <>
      <div className="mx-auto w-full max-w-md animate-fade-in">
        <MobilePageHeader onOpenMobileMenu={onOpenMobileMenu} className="mb-4" />

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-blue-500/30 bg-slate-200 dark:bg-slate-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-full w-full p-2.5 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{profileDisplayName}</p>
            </div>
          </div>

          <div className="space-y-1 p-2">
            <div className="mb-2 border-b border-slate-100 pb-2 dark:border-slate-700">
              <div className="mb-1 flex items-center justify-between px-4 py-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Thông báo ({unreadCount})
                  </span>
                  {notifications.length > 0 && (
                    <button onClick={handleClearAll} className="text-left text-[9px] font-bold text-rose-500 hover:underline">
                      Xóa tất cả
                    </button>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAsRead} className="text-[10px] font-bold text-blue-500 hover:underline">
                    Đã đọc
                  </button>
                )}
              </div>

              <div className="custom-scrollbar max-h-48 space-y-1 overflow-y-auto px-2">
                {notifications.length > 0 ? notifications.map((n) => (
                  <div key={n.id} className="relative group/notif">
                    <div className={`rounded-xl p-2.5 pr-8 text-xs transition-colors ${n.is_read ? "opacity-60" : "border border-blue-100 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"}`}>
                      <p className="mb-0.5 font-medium text-slate-800 dark:text-slate-200">{n.message}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={(e) => handleDeleteNotif(e, n.id)} className="absolute right-2 top-2 rounded-full bg-black/10 p-1 opacity-0 transition-opacity group-hover/notif:opacity-100 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20">
                      <svg className="h-3 w-3 text-slate-500 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                )) : (
                  <p className="px-4 py-3 text-center text-xs italic text-slate-400">Không có thông báo mới</p>
                )}
              </div>
            </div>

            <button onClick={() => setShowProfile(true)} className={sectionButton}>
              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              {t("nav.profile")}
            </button>

            <div className="rounded-2xl p-1">
              <button onClick={() => setLanguageMenuOpen((prev) => !prev)} className={collapsibleButton} aria-expanded={languageMenuOpen}>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                  <span>{t("nav.language")}</span>
                </div>
                <svg className={`h-4 w-4 opacity-50 transition-transform ${languageMenuOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
              {languageMenuOpen && (
                <div className="space-y-1 px-1 pb-1">
                  {languages.map(({ id, labelKey }) => (
                    <button key={id} onClick={() => { setLanguage(id); setLanguageMenuOpen(false); }} className={optionButton}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{id.toUpperCase()}</span>
                        <span>{t(labelKey)}</span>
                      </div>
                      {language === id && <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-1">
              <button onClick={() => setThemeMenuOpen((prev) => !prev)} className={collapsibleButton} aria-expanded={themeMenuOpen}>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                  <span>{t("nav.theme")}</span>
                </div>
                <svg className={`h-4 w-4 opacity-50 transition-transform ${themeMenuOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
              {themeMenuOpen && (
                <div className="space-y-1 px-1 pb-1">
                  {themes.map(({ id, labelKey }) => (
                    <button key={id} onClick={() => setTheme(id)} className={optionButton}>
                      <div className="flex items-center gap-3">
                        {id === "light" && <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
                        {id === "dark" && <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>}
                        <span>{t(labelKey)}</span>
                      </div>
                      {currentTheme === id && <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setShowSystem(true)} className={sectionButton}>
              <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
              {t("nav.system")}
            </button>

            <button onClick={() => setShowInfo(true)} className={sectionButton}>
              <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {t("nav.info")}
            </button>
          </div>

          <div className="mt-1 border-t border-slate-100 px-2 pb-2 pt-2 dark:border-slate-700">
            <button onClick={onLogout} className="w-full rounded-xl px-4 py-2.5 text-left font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">
              <span className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                {t("nav.logout")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {showSystem && <SystemModal onClose={() => setShowSystem(false)} />}
    </>
  );
}
