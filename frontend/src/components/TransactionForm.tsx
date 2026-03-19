import { useState, useEffect } from "react";
import { createTransaction } from "../service/api";

export default function TransactionForm() {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Lấy user_id từ LocalStorage khi component được mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setMessage({ text: "Vui lòng đăng ký/đăng nhập trước (Chưa có user_id trong LocalStorage).", type: "error" });
      return;
    }

    if (!accountId) {
      setMessage({ text: "Vui lòng nhập ID tài khoản (Account ID).", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const transactionData = {
        amount: parseFloat(amount),
        type,
        date: new Date(date).toISOString(), // Convert về định dạng ISO 8601 DateTime
        note: note ? note : undefined,
        account_id: accountId,
        category_id: categoryId ? categoryId : undefined,
      };

      await createTransaction(userId, transactionData);
      
      setMessage({ text: "Đã thêm giao dịch thành công!", type: "success" });
      
      // Reset form một phần
      setAmount("");
      setNote("");
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Thêm Giao Dịch Mới</h2>
      
      {!userId && (
        <div className="p-4 mb-4 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500 rounded-lg text-sm">
          <strong>Lưu ý:</strong> Bạn cần đăng ký user (để lấy user_id) trước khi tạo giao dịch.
        </div>
      )}

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
        {/* Số tiền và Loại */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
            >
              <option value="expense">Khoản chi</option>
              <option value="income">Khoản thu</option>
              <option value="transfer">Chuyển khoản</option>
            </select>
          </div>
        </div>

        {/* Ngày giao dịch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giao dịch</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Account ID và Category ID */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account ID (Bắt buộc)</label>
            <input
              type="text"
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Nhập UUID của tài khoản..."
            />
            <p className="text-xs text-gray-500 mt-1">Giao dịch cần gắn với một tài khoản nhất định.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category ID (Tùy chọn)</label>
            <input
              type="text"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Nhập UUID của danh mục..."
            />
          </div>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Mô tả thêm về giao dịch..."
            rows={2}
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading || !userId}
          className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${
            loading || !userId
              ? "bg-indigo-400 cursor-not-allowed" 
              : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
          }`}
        >
          {loading ? "Đang xử lý..." : "Lưu Giao Dịch"}
        </button>
      </form>
    </div>
  );
}
