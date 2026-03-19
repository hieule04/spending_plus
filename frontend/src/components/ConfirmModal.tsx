import { useGlassTheme } from "../hooks/useGlassTheme";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Xoá", cancelText = "Huỷ" }: ConfirmModalProps) {
  const isGlass = useGlassTheme();
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in ${
      isGlass ? 'bg-black/40 backdrop-blur-md' : 'bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm'
    }`}>
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-slide-up relative z-[101] ${
        isGlass ? 'glass-panel' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
      }`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm ${
          isGlass ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20'
        }`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className={`text-xl font-bold mb-2 ${isGlass ? 'text-white drop-shadow-md' : 'text-slate-900 dark:text-white'}`}>{title}</h3>
        <p className={`text-sm font-medium mb-6 ${isGlass ? 'text-white drop-shadow-md' : 'text-slate-500 dark:text-slate-400'}`}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all active:scale-95 ${
            isGlass ? 'glass-btn' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
          }`}>{cancelText}</button>
          <button onClick={onConfirm} className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
