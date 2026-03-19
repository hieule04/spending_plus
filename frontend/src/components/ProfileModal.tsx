import { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../service/api";

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const data = await getProfile();
      if (data) {
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setAvatarUrl(data.avatar_url || "");
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const updateData: any = { full_name: fullName, email, avatar_url: avatarUrl };
    if (password.trim() !== "") {
      updateData.password = password;
    }

    const data = await updateProfile(updateData);
    if (data) {
      setMessage({ text: "Cập nhật hồ sơ thành công!", type: "success" });
      setPassword(""); // Clear password field after save
    } else {
      setMessage({ text: "Có lỗi xảy ra khi cập nhật", type: "error" });
    }
    setSaving(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Hồ sơ Của Tôi</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700/50 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6">
          {message && (
            <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col items-center mb-6">
              <div className="relative group cursor-pointer mb-3">
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-200 dark:bg-slate-600">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-full h-full text-slate-400 dark:text-slate-400 p-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  )}
                </div>
                <label className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <span className="text-xs font-semibold">Đổi ảnh</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors" placeholder="Nguyễn Văn A" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Đổi mật khẩu (Để trống nếu không đổi)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={saving} className={`w-full py-3 px-4 rounded-xl text-white font-bold transition-transform shadow-lg ${saving ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-500 active:scale-[0.98] shadow-blue-500/30"}`}>
              {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
