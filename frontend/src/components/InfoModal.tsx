import { useGlassTheme } from "../hooks/useGlassTheme";
import { useLanguage } from "../context/LanguageContext";

interface InfoModalProps {
  onClose: () => void;
}

export default function InfoModal({ onClose }: InfoModalProps) {
  const { t } = useLanguage();
  const isGlass = useGlassTheme();

  const overlayClass = isGlass ? "bg-black/40 backdrop-blur-md" : "bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm";
  const panelClass = isGlass ? "glass-panel" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700";
  const borderClass = isGlass ? "border-white/10" : "border-slate-100 dark:border-slate-700";
  const headingClass = isGlass ? "text-white drop-shadow-md" : "text-slate-900 dark:text-white";
  const labelClass = isGlass ? "text-white/60" : "text-slate-500 dark:text-slate-400";
  const valueClass = isGlass ? "text-white" : "text-slate-900 dark:text-white";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${overlayClass}`}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${panelClass}`}>
        <div className={`p-6 border-b ${borderClass} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${headingClass}`}>{t("info.title")}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isGlass ? "text-white hover:text-white bg-white/10" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700/50"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className={`text-xs uppercase tracking-wider font-bold ${labelClass}`}>{t("info.author")}</p>
            <p className={valueClass}>Lê Minh Hiếu</p>
          </div>
          <div>
            <p className={`text-xs uppercase tracking-wider font-bold ${labelClass}`}>{t("info.created")}</p>
            <p className={valueClass}>9/3/2026</p>
          </div>
          <div>
            <p className={`text-xs uppercase tracking-wider font-bold ${labelClass}`}>{t("info.contact")}</p>
            <p className={valueClass}>hle009995@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
