import { useState } from "react";
import { loginUser } from "../service/api";

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
      
      // Cấu trúc mới trả về { access_token, token_type, user: { id... } }
      if (userData && userData.user && userData.user.id) {
        localStorage.setItem("user_id", userData.user.id);
        localStorage.setItem("access_token", userData.access_token);
        window.dispatchEvent(new Event("user_login"));
      } else if (userData && userData.id) { 
        // Đề phòng trường hợp API cũ chưa được cập nhật hoàn toàn
        localStorage.setItem("user_id", userData.id);
        window.dispatchEvent(new Event("user_login"));
      }
      
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Đăng Nhập</h2>
      
      {message && (
        <div 
          className={`p-4 mb-4 rounded-lg text-sm ${
            message.type === "success" 
              ? "bg-green-50 text-green-800 border-l-4 border-green-500" 
              : "bg-red-50 text-red-800 border-l-4 border-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="you@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${
            loading 
              ? "bg-indigo-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
          }`}
        >
          {loading ? "Đang xử lý..." : "Đăng Nhập"}
        </button>
      </form>
    </div>
  );
}
