import { useState } from "react";
import { verifyOTP } from "../service/api";

interface VerifyOTPFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function VerifyOTPForm({ email, onSuccess, onBack }: VerifyOTPFormProps) {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await verifyOTP({ email, otp });
      setMessage({ text: "Xác thực hoàn tất!", type: "success" });
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      setMessage({ text: error.message || "Mã OTP không chính xác", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const cardClass = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl';
  const headingClass = 'text-slate-900 dark:text-white';
  const labelClass = 'text-slate-500 dark:text-slate-400 font-bold';
  const inputClass = 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all';

  return (
    <div className={`max-w-md w-full mx-auto p-10 rounded-3xl transition-all duration-300 ${cardClass}`}>
      <h2 className={`text-3xl font-black text-center mb-4 ${headingClass}`}>Xác thực OTP</h2>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
        Mã xác thực đã được gửi đến <br/><span className="font-bold">{email}</span>
      </p>
      
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
          <label className={`block text-xs uppercase tracking-widest mb-2 ${labelClass}`}>Mã OTP (6 chữ số)</label>
          <input 
            type="text" 
            required 
            maxLength={6}
            value={otp} 
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className={`w-full px-5 py-4 border rounded-2xl outline-none text-center text-2xl tracking-[0.5em] font-mono ${inputClass}`}
            placeholder="••••••" 
          />
        </div>

        <button type="submit" disabled={loading || otp.length < 6}
          className={`w-full py-4.5 px-6 rounded-2xl text-white font-black text-lg shadow-xl transition-all active:scale-[0.98] ${
            loading || otp.length < 6 ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30"
          }`}>
          {loading ? "Đang xác thực..." : "Xác Nhận"}
        </button>
        
        <button
          type="button"
          onClick={onBack}
          className="w-full mt-4 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          &larr; Quay lại
        </button>
      </form>
    </div>
  );
}
