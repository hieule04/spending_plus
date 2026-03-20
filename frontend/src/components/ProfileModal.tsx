import { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../service/api";
import { useLanguage } from "../context/LanguageContext";

interface ProfileModalProps { onClose: () => void; }

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  useEffect(() => {
    const fetchUser = async () => { setLoading(true); const data = await getProfile(); if (data) { setFullName(data.full_name || ""); setEmail(data.email || ""); setAvatarUrl(data.avatar_url || ""); setAllowNotifications(data.allow_notifications !== false); } setLoading(false); };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage(null);
    const updateData: any = { full_name: fullName, email, avatar_url: avatarUrl, allow_notifications: allowNotifications };
    if (password.trim() !== "") updateData.password = password;
    const data = await updateProfile(updateData);
    if (data) { setMessage({ text: t('profile.msg.update_success'), type: "success" }); setPassword(""); } else { setMessage({ text: t('profile.msg.update_error'), type: "error" }); }
    setSaving(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => { setAvatarUrl(reader.result as string); }; reader.readAsDataURL(file); }
  };

  const inputClass = 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-white transition-all';
  const labelClass = 'text-sm font-black text-slate-500 dark:text-slate-400';

  if (loading) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm`}>
        <div className={`p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm`}>
      <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
        <div className={`p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between`}>
          <h2 className={`text-xl font-bold text-slate-900 dark:text-white`}>{t('profile.title')}</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700/50`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6">
          {message && (
            <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>{message.text}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col items-center mb-6">
              <div className="relative group cursor-pointer mb-3">
                <div className={`w-28 h-28 rounded-3xl border-4 overflow-hidden border-white dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-xl`}>
                  {avatarUrl ? (<img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />) : (
                    <svg className="w-full h-full text-slate-300 p-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  )}
                </div>
                <label className="absolute inset-0 bg-slate-900/60 text-white rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all backdrop-blur-sm">
                  <span className="text-xs font-bold uppercase tracking-widest">{t('profile.change_avatar')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>

            <div><label className={`block mb-1 ${labelClass}`}>{t('profile.form.full_name')}</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`w-full px-4 py-2.5 transition-colors ${inputClass}`} placeholder={t('profile.form.placeholder.full_name')} /></div>
            <div><label className={`block mb-1 ${labelClass}`}>{t('profile.form.email')}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`w-full px-4 py-2.5 transition-colors ${inputClass}`} /></div>
            <div><label className={`block mb-1 ${labelClass}`}>{t('profile.form.password_help')}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full px-4 py-2.5 transition-colors ${inputClass}`} placeholder="••••••••" /></div>

            {/* Notification Toggle */}
            <div className={`flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50`}>
              <div>
                <p className={`font-bold text-slate-800 dark:text-slate-200`}>Thông báo ngân sách</p>
                <p className={`text-xs text-slate-500 dark:text-slate-400`}>Nhận cảnh báo khi chi tiêu vượt ngưỡng</p>
              </div>
              <button 
                type="button"
                onClick={() => setAllowNotifications(!allowNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${allowNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${allowNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <button type="submit" disabled={saving} className={`w-full py-3.5 px-4 rounded-2xl text-white font-bold transition-all shadow-lg ${saving ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-500 active:scale-[0.98] shadow-blue-500/30"}`}>
              {saving ? t('common.saving') : t('profile.save_changes')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
