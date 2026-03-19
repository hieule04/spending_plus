import { useState, useEffect } from "react";
import { api } from "../service/api";

interface SystemModalProps {
  onClose: () => void;
}

interface BackendStatus {
  message: string;
}

interface DbStatus {
  status: string;
  message: string;
  supabase_version?: string;
}

export default function SystemModal({ onClose }: SystemModalProps) {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setLoading(true);
        const response = await api.get("/");
        setBackendStatus(response.data);
        setError(null);
      } catch (err) {
        setError("Không thể kết nối với Backend. Hãy kiểm tra server.");
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, []);

  const testDatabase = async () => {
    try {
      setDbStatus(null);
      const response = await api.get("/test-db");
      setDbStatus(response.data);
    } catch (err) {
      setDbStatus({ status: "error", message: "Lỗi kết nối tới cơ sở dữ liệu." });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Trạng thái Hệ Thống</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700/50 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              Kết nối Backend
            </h3>
            {loading ? (
              <div className="animate-pulse h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            ) : error ? (
              <p className="text-red-500 text-sm font-medium">⚠️ {error}</p>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">✅ {backendStatus?.message}</p>
                <code className="text-xs bg-slate-200 dark:bg-black/40 text-slate-600 dark:text-slate-400 p-2 rounded block">API: http://127.0.0.1:8000</code>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-white">Kiểm tra cơ sở dữ liệu</h3>
            <button onClick={testDatabase} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 shadow-blue-500/20">
              Test Supabase Connection
            </button>
            {dbStatus && (
              <div className={`mt-4 p-3 rounded-xl border text-sm ${dbStatus.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300'}`}>
                <p className="font-bold flex items-center gap-2">{dbStatus.status === 'success' ? '🎉' : '❌'} {dbStatus.message}</p>
                {dbStatus.supabase_version && (
                  <p className="text-xs mt-1 opacity-80 font-mono">Ver: {dbStatus.supabase_version}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
