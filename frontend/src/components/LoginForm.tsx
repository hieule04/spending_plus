import { useState } from "react";
import { loginUser } from "../service/api";
import { setAuthSession } from "../service/auth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const userData = await loginUser({ email, password });
      setMessage({ text: "Đăng nhập thành công!", type: "success" });
      if (userData && userData.user && userData.user.id) {
        setAuthSession(userData.access_token, userData.user.id);
        window.dispatchEvent(new Event("user_login"));
      } else if (userData && userData.id) { 
        setAuthSession(userData.access_token, userData.id);
        window.dispatchEvent(new Event("user_login"));
      }
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const cardClass = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl';
  const headingClass = 'text-slate-900 dark:text-white';
  const labelClass = 'text-slate-500 dark:text-slate-400 font-bold';
  const inputClass = 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';

  return (
    <div className={`max-w-md w-full mx-auto p-10 rounded-3xl transition-all duration-300 ${cardClass}`}>
      <h2 className={`text-3xl font-black text-center mb-10 ${headingClass}`}>Đăng Nhập</h2>
      
      {message && (
        <div className={`p-4 mb-8 rounded-2xl text-sm font-bold border transition-all animate-fade-in ${
          message.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" 
            : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
        }`}>
          <div className="flex items-center gap-3">
            <span>{message.type === 'success' ? '🎉' : '⚠️'}</span>
            {message.text}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className={`block text-xs uppercase tracking-widest mb-2 ${labelClass}`}>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-5 py-4 border rounded-2xl outline-none ${inputClass}`}
            placeholder="you@example.com" />
        </div>
        
        <div>
          <label className={`block text-xs uppercase tracking-widest mb-2 ${labelClass}`}>Mật khẩu</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-5 py-4 border rounded-2xl outline-none ${inputClass}`}
            placeholder="••••••••" />
        </div>

        <button type="submit" disabled={loading}
          className={`w-full py-4.5 px-6 rounded-2xl text-white font-black text-lg shadow-xl transition-all active:scale-[0.98] ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/30"
          }`}>
          {loading ? "Đang xử lý..." : "Đăng Nhập"}
        </button>
      </form>
    </div>
  );
}
