import { useState, useEffect, useCallback } from "react";
import {
  listTransactions, createTransaction, updateTransaction, deleteTransaction,
  listAccounts, listCategories,
} from "../service/api";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  date: string;
  note: string | null;
  account_id: string;
  category_id: string | null;
  created_at: string;
}
interface Account { id: string; name: string; type: string; }
interface Category { id: string; name: string; type: string; icon: string | null; color: string | null; }

export default function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("expense");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formNote, setFormNote] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [txns, accs, cats] = await Promise.all([
        listTransactions(),
        listAccounts(),
        listCategories(),
      ]);
      setTransactions(txns || []);
      setAccounts(accs || []);
      setCategories(cats || []);
      // Default account selection
      if (accs && accs.length > 0 && !formAccountId) {
        setFormAccountId(accs[0].id);
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormAmount("");
    setFormType("expense");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormNote("");
    setFormAccountId(accounts.length > 0 ? accounts[0].id : "");
    setFormCategoryId("");
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (txn: Transaction) => {
    setFormAmount(String(txn.amount));
    setFormType(txn.type);
    setFormDate(txn.date ? txn.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setFormNote(txn.note || "");
    setFormAccountId(txn.account_id);
    setFormCategoryId(txn.category_id || "");
    setEditingId(txn.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const payload: any = {
        amount: parseFloat(formAmount),
        type: formType,
        date: new Date(formDate).toISOString(),
        note: formNote || undefined,
        account_id: formAccountId,
        category_id: formCategoryId || undefined,
      };

      if (editingId) {
        await updateTransaction(editingId, payload);
        setMessage({ text: "Cập nhật giao dịch thành công!", type: "success" });
      } else {
        await createTransaction(payload);
        setMessage({ text: "Thêm giao dịch thành công!", type: "success" });
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá giao dịch này? Số dư tài khoản sẽ được hoàn lại.")) return;
    setMessage(null);
    try {
      await deleteTransaction(id);
      setMessage({ text: "Đã xoá giao dịch.", type: "success" });
      fetchData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  // Helper: tìm tên account / category theo id
  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || "—";
  const getCategoryInfo = (id: string | null) => {
    if (!id) return { name: "—", icon: "", color: "" };
    const cat = categories.find((c) => c.id === id);
    return cat ? { name: cat.name, icon: cat.icon || "", color: cat.color || "" } : { name: "—", icon: "", color: "" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Lịch sử giao dịch</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors text-sm">
          + Thêm giao dịch
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">{editingId ? "Sửa giao dịch" : "Thêm giao dịch mới"}</h3>

          {accounts.length === 0 ? (
            <div className="p-4 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-lg text-sm">
              ⚠️ Bạn cần tạo ít nhất 1 tài khoản (ví) trước khi thêm giao dịch.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Số tiền</label>
                  <input type="number" required min="0" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Loại</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="expense">Khoản chi</option>
                    <option value="income">Khoản thu</option>
                    <option value="transfer">Chuyển khoản</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Ngày</label>
                  <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tài khoản</label>
                  <select required value={formAccountId} onChange={(e) => setFormAccountId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500">
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Danh mục (tùy chọn)</label>
                  <select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">— Không chọn —</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Ghi chú</label>
                <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Mô tả ngắn..." />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors text-sm">
                  {editingId ? "Cập nhật" : "Lưu giao dịch"}
                </button>
                <button type="button" onClick={resetForm} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors text-sm">
                  Huỷ
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center text-slate-400 py-10">Đang tải...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center text-slate-500 py-10 bg-slate-900/30 rounded-2xl border border-slate-700">
          Chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-700">
          <table className="w-full text-left">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Ngày</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Danh mục</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Ghi chú</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Tài khoản</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase text-right">Số tiền</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {transactions.map((txn) => {
                const catInfo = getCategoryInfo(txn.category_id);
                const isIncome = txn.type === "income";
                return (
                  <tr key={txn.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300 text-sm whitespace-nowrap">
                      {new Date(txn.date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1.5">
                        {catInfo.icon && <span>{catInfo.icon}</span>}
                        <span className="text-white">{catInfo.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm truncate max-w-[160px]">{txn.note || "—"}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{getAccountName(txn.account_id)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${isIncome ? "text-emerald-400" : "text-red-400"}`}>
                      {isIncome ? "+" : "-"}{Number(txn.amount).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button onClick={() => openEditForm(txn)} className="text-blue-400 hover:text-blue-300 text-sm font-medium mr-3 transition-colors">Sửa</button>
                      <button onClick={() => handleDelete(txn.id)} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">Xoá</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
