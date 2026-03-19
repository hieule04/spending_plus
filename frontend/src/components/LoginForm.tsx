import { useState, useEffect } from "react";
import { loginUser } from "../service/api";
import { useGlassTheme } from "../hooks/useGlassTheme";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const isGlass = useGlassTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const userData = await loginUser({ email, password });
      setMessage({ text: "Đăng nhập thành công!", type: "success" });
      if (userData && userData.user && userData.user.id) {
        localStorage.setItem("user_id", userData.user.id);
        localStorage.setItem("access_token", userData.access_token);
        window.dispatchEvent(new Event("user_login"));
      } else if (userData && userData.id) { 
        localStorage.setItem("user_id", userData.id);
        window.dispatchEvent(new Event("user_login"));
      }
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const cardClass = isGlass ? 'glass-card' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl';
  const headingClass = isGlass ? 'text-white drop-shadow-md' : 'text-slate-900 dark:text-white';
  const labelClass = isGlass ? 'text-white' : 'text-slate-700 dark:text-slate-300';
  const inputClass = isGlass ? 'glass-input' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-blue-500';

  return (
    <div className={`max-w-md w-full mx-auto p-8 rounded-3xl transition-all duration-300 ${cardClass}`}>
      <h2 className={`text-3xl font-black text-center mb-8 ${headingClass}`}>Đăng Nhập</h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded-xl text-sm font-bold border ${
          message.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" 
            : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={`block text-sm font-bold mb-2 ${labelClass}`}>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-5 py-3 border rounded-2xl outline-none transition-all ${inputClass}`}
            placeholder="you@example.com" />
        </div>
        
        <div>
          <label className={`block text-sm font-bold mb-2 ${labelClass}`}>Mật khẩu</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-5 py-3 border rounded-2xl outline-none transition-all ${inputClass}`}
            placeholder="••••••••" />
        </div>

        <button type="submit" disabled={loading}
          className={`w-full py-4 px-6 rounded-2xl text-white font-black text-lg shadow-lg transition-all active:scale-[0.98] ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/25"
          }`}>
          {loading ? "Đang xử lý..." : "Đăng Nhập"}
        </button>
      </form>
    </div>
  );
}
