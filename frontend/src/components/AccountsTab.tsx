import { useState, useEffect, useCallback } from "react";
import { listAccounts, createAccount, updateAccount, deleteAccount } from "../service/api";
import ConfirmModal from "./ConfirmModal";
import GlassSelect from "./GlassSelect";
import { useGlassTheme } from "../hooks/useGlassTheme";

interface Account { id: string; name: string; type: string; balance: number; created_at: string; }

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("cash");
  const [formBalance, setFormBalance] = useState("0");
  const isGlass = useGlassTheme();

  const fetchAccounts = useCallback(async () => {
    try { setLoading(true); const data = await listAccounts(); setAccounts(data || []); } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const resetForm = () => { setFormName(""); setFormType("cash"); setFormBalance("0"); setEditingId(null); setShowForm(false); };
  const openEditForm = (acc: Account) => { setFormName(acc.name); setFormType(acc.type); setFormBalance(String(acc.balance)); setEditingId(acc.id); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage(null);
    try {
      if (editingId) { await updateAccount(editingId, { name: formName, type: formType, balance: parseFloat(formBalance) }); setMessage({ text: "Cập nhật tài khoản thành công!", type: "success" }); }
      else { await createAccount({ name: formName, type: formType, balance: parseFloat(formBalance) }); setMessage({ text: "Tạo tài khoản thành công!", type: "success" }); }
      resetForm(); fetchAccounts();
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); }
  };

  const handleDelete = (id: string) => { setConfirmDelete(id); };
  const confirmDeleteAction = async () => {
    if (!confirmDelete) return; setMessage(null);
    try { await deleteAccount(confirmDelete); setMessage({ text: "Đã xoá tài khoản.", type: "success" }); fetchAccounts(); } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setConfirmDelete(null); }
  };

  const typeLabel: Record<string, string> = { cash: "💵 Tiền mặt", bank: "🏦 Ngân hàng", credit: "💳 Tín dụng", saving: "🐖 Tiết kiệm", "e-wallet": "📱 Ví điện tử" };

  // Glass-aware classes
  const cardClass = isGlass ? 'glass-card' : 'bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-600 shadow-sm';
  const headingClass = isGlass ? 'text-white drop-shadow-md' : 'text-slate-900 dark:text-white';
  const subTextClass = isGlass ? 'text-white drop-shadow-md' : 'text-slate-600 dark:text-slate-400 font-bold';
  const inputClass = isGlass ? 'glass-input rounded-lg' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500';
  const tableWrapClass = isGlass ? 'glass-card overflow-x-auto rounded-2xl' : 'overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm';
  const theadClass = isGlass ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-900/80';
  const trHoverClass = isGlass ? 'hover:scale-[1.01] transition-all duration-200' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${headingClass}`}>Ví của tôi</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors text-sm">+ Thêm ví mới</button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>{message.text}</div>
      )}

      {showForm && (
        <div className={`p-6 rounded-2xl ${cardClass}`}>
          <h3 className={`text-lg font-semibold mb-4 ${headingClass}`}>{editingId ? "Sửa tài khoản" : "Tạo tài khoản mới"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${subTextClass}`}>Tên ví</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className={`w-full px-4 py-2 ${inputClass}`} placeholder="Ví tiền mặt..." />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${subTextClass}`}>Phân loại</label>
                <GlassSelect 
                  value={formType} 
                  onChange={(val) => setFormType(val)}
                  options={[
                    { label: "Tiền mặt", value: "cash" },
                    { label: "Tài khoản ngân hàng", value: "bank" },
                    { label: "Ví điện tử", value: "e-wallet" },
                    { label: "Thẻ tín dụng", value: "credit" },
                    { label: "Tiết kiệm", value: "saving" }
                  ]}
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${subTextClass}`}>Số dư ban đầu</label>
                <input type="number" step="0.01" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} className={`w-full px-4 py-2 ${inputClass}`} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors text-sm">{editingId ? "Cập nhật" : "Tạo mới"}</button>
              <button type="button" onClick={resetForm} className={`px-5 py-2 rounded-lg font-semibold transition-colors text-sm ${isGlass ? 'glass-btn' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>Huỷ</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={`text-center py-10 ${subTextClass}`}>Đang tải...</div>
      ) : accounts.length === 0 ? (
        <div className={`text-center py-10 rounded-2xl ${isGlass ? 'glass-card' : 'bg-slate-900/30 border border-slate-700'} ${subTextClass}`}>Bạn chưa có tài khoản nào. Hãy thêm ví mới!</div>
      ) : (
        <div className={tableWrapClass}>
          <table className="w-full text-left">
            <thead className={theadClass}>
              <tr>
                <th className={`px-5 py-3 text-xs font-semibold uppercase ${subTextClass}`}>Tên</th>
                <th className={`px-5 py-3 text-xs font-semibold uppercase ${subTextClass}`}>Loại</th>
                <th className={`px-5 py-3 text-xs font-semibold uppercase text-right ${subTextClass}`}>Số dư</th>
                <th className={`px-5 py-3 text-xs font-semibold uppercase text-center ${subTextClass}`}>Hành động</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isGlass ? 'divide-white/5' : 'divide-slate-700/50'}`}>
              {accounts.map((acc) => (
                <tr key={acc.id} className={trHoverClass}>
                  <td className={`px-5 py-3 font-bold ${headingClass}`}>{acc.name}</td>
                  <td className={`px-5 py-3 text-sm font-medium ${isGlass ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{typeLabel[acc.type] || acc.type}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={isGlass 
                      ? `amount-badge ${Number(acc.balance) >= 0 ? "amount-badge-positive" : "amount-badge-negative"}`
                      : `font-mono font-semibold ${Number(acc.balance) >= 0 ? "text-emerald-400" : "text-red-400"}`
                    }>
                      {Number(acc.balance).toLocaleString("vi-VN")} đ
                    </span>
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

      <ConfirmModal isOpen={!!confirmDelete} title="Xác nhận xoá tài khoản" message="Bạn có chắc chắn muốn xoá tài khoản này không? Hành động này sẽ hoàn trả số dư nhưng không thể hoàn tác." onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
