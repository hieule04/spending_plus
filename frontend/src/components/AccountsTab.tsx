import { useState, useEffect, useCallback } from "react";
import { listAccounts, createAccount, updateAccount, deleteAccount } from "../service/api";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  created_at: string;
}

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("cash");
  const [formBalance, setFormBalance] = useState("0");

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAccounts();
      setAccounts(data || []);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const resetForm = () => {
    setFormName("");
    setFormType("cash");
    setFormBalance("0");
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (acc: Account) => {
    setFormName(acc.name);
    setFormType(acc.type);
    setFormBalance(String(acc.balance));
    setEditingId(acc.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      if (editingId) {
        await updateAccount(editingId, { name: formName, type: formType, balance: parseFloat(formBalance) });
        setMessage({ text: "Cập nhật tài khoản thành công!", type: "success" });
      } else {
        await createAccount({ name: formName, type: formType, balance: parseFloat(formBalance) });
        setMessage({ text: "Tạo tài khoản thành công!", type: "success" });
      }
      resetForm();
      fetchAccounts();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá tài khoản này?")) return;
    setMessage(null);
    try {
      await deleteAccount(id);
      setMessage({ text: "Đã xoá tài khoản.", type: "success" });
      fetchAccounts();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const typeLabel: Record<string, string> = {
    cash: "💵 Tiền mặt",
    bank: "🏦 Ngân hàng",
    credit: "💳 Tín dụng",
    saving: "🐖 Tiết kiệm",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Ví của tôi</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors text-sm"
        >
          + Thêm ví mới
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
          {message.text}
        </div>
      )}

      {/* Modal / Form */}
      {showForm && (
        <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">{editingId ? "Sửa tài khoản" : "Tạo tài khoản mới"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tên ví</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ví tiền mặt..." />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Loại</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Ngân hàng</option>
                  <option value="credit">Tín dụng</option>
                  <option value="saving">Tiết kiệm</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Số dư ban đầu</label>
                <input type="number" step="0.01" value={formBalance} onChange={(e) => setFormBalance(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors text-sm">
                {editingId ? "Cập nhật" : "Tạo mới"}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors text-sm">
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center text-slate-400 py-10">Đang tải...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center text-slate-500 py-10 bg-slate-900/30 rounded-2xl border border-slate-700">
          Bạn chưa có tài khoản nào. Hãy thêm ví mới!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700">
          <table className="w-full text-left">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Tên</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Loại</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Số dư</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{acc.name}</td>
                  <td className="px-5 py-3 text-slate-300 text-sm">{typeLabel[acc.type] || acc.type}</td>
                  <td className={`px-5 py-3 text-right font-mono font-semibold ${Number(acc.balance) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {Number(acc.balance).toLocaleString("vi-VN")} đ
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => openEditForm(acc)} className="text-blue-400 hover:text-blue-300 text-sm font-medium mr-4 transition-colors">Sửa</button>
                    <button onClick={() => handleDelete(acc.id)} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
