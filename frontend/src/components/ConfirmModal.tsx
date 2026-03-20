import { useLanguage } from "../context/LanguageContext";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText, cancelText }: ConfirmModalProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const finalConfirmText = confirmText || t('common.delete');
  const finalCancelText = cancelText || t('common.cancel');

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm`}>
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-slide-up relative z-[101] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 shadow-sm`}>
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className={`text-2xl font-black mb-3 text-slate-900 dark:text-white`}>{title}</h3>
        <p className={`text-base font-medium mb-8 text-slate-500 dark:text-slate-400`}>{message}</p>
        <div className="flex gap-4">
          <button onClick={onCancel} className={`flex-1 py-3.5 px-4 rounded-2xl font-bold transition-all active:scale-95 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200`}>
            {finalCancelText}
          </button>
          <button onClick={onConfirm} className="flex-1 py-3.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/30 transition-all active:scale-95">
            {finalConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
