import { useLanguage } from "../context/LanguageContext";

interface InfoModalProps {
  onClose: () => void;
}

export default function InfoModal({ onClose }: InfoModalProps) {
  const { t } = useLanguage();

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm`}>
      <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
        <div className={`p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between`}>
          <h2 className={`text-xl font-bold text-slate-900 dark:text-white`}>{t("info.title")}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700/50`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="group">
            <p className={`text-xs uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-1`}>{t("info.author")}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">Lê Minh Hiếu</p>
          </div>
          <div className="group">
            <p className={`text-xs uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-1`}>{t("info.created")}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">9/3/2026</p>
          </div>
          <div className="group">
            <p className={`text-xs uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-1`}>{t("info.contact")}</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">hle009995@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
