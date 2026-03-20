import { useState, useEffect } from "react";
import { api } from "../service/api";
import { useLanguage } from "../context/LanguageContext";

interface SystemModalProps { onClose: () => void; }
interface BackendStatus { message: string; }
interface DbStatus { status: string; message: string; supabase_version?: string; }

export default function SystemModal({ onClose }: SystemModalProps) {
  const { t } = useLanguage();
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try { setLoading(true); const response = await api.get("/"); setBackendStatus(response.data); setError(null); } catch (err) { setError(t('system.msg.backend_error')); } finally { setLoading(false); }
    };
    checkConnection();
  }, []);

  const testDatabase = async () => {
    try { setDbStatus(null); const response = await api.get("/test-db"); setDbStatus(response.data); } catch (err) { setDbStatus({ status: "error", message: t('system.msg.db_error') }); }
  };

  const sectionClass = 'bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5';
  const headingClass = 'text-slate-900 dark:text-white';
  const borderClass = 'border-slate-100 dark:border-slate-700';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm`}>
      <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
        <div className={`p-6 border-b ${borderClass} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${headingClass}`}>{t('system.title')}</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700/50`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={sectionClass}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-3 ${headingClass}`}>
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.5)]"></span>
              {t('system.backend')}
            </h3>
            {loading ? (
              <div className="space-y-3">
                <div className={`animate-pulse h-4 rounded-full w-3/4 bg-slate-200 dark:bg-slate-700`}></div>
                <div className={`animate-pulse h-4 rounded-full w-1/2 bg-slate-200 dark:bg-slate-700 opacity-50`}></div>
              </div>
            ) : error ? (
              <p className="text-rose-600 dark:text-rose-400 text-sm font-black flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  {backendStatus?.message}
                </p>
                <div className="bg-slate-100 dark:bg-black/40 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  <code className="text-xs text-slate-600 dark:text-slate-400 break-all font-mono">Endpoint: http://127.0.0.1:8000</code>
                </div>
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <h3 className={`text-lg font-bold mb-4 ${headingClass}`}>{t('system.db_check')}</h3>
            <button onClick={testDatabase} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]">
              {t('system.db_test_btn')}
            </button>
            {dbStatus && (
              <div className={`mt-5 p-4 rounded-2xl border transition-all animate-slide-up ${dbStatus.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'}`}>
                <p className="font-black flex items-center gap-3">
                  <span className="text-xl">{dbStatus.status === 'success' ? '🎉' : '❌'}</span>
                  {dbStatus.message}
                </p>
                {dbStatus.supabase_version && (
                  <div className="mt-3 pt-3 border-t border-current opacity-20 overflow-hidden">
                    <p className="text-[10px] font-mono truncate">Engine: {dbStatus.supabase_version}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
