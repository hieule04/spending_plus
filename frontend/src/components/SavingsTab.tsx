import { useState, useEffect } from "react";
import { 
  getSavings, createSaving, updateSaving, deleteSaving,
  listAccounts, createTransaction
} from "../service/api";
import GlassSelect from "./GlassSelect";
import { useGlassTheme } from "../hooks/useGlassTheme";
import { useLanguage } from "../context/LanguageContext";

export default function SavingsTab() {
  const isGlass = useGlassTheme();
  const { language } = useLanguage();
  
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  
  // Create/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  
  // Action Modal state (Deposit/Withdraw)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const data = await getSavings();
    if (data) setGoals(data);
    
    const accs = await listAccounts();
    if (accs) setAccounts(accs);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("refresh_transactions", fetchData);
    return () => window.removeEventListener("refresh_transactions", fetchData);
  }, []);

  const handleOpenModal = (goal: any = null) => {
    setEditingGoal(goal);
    setName(goal ? goal.name : "");
    setTargetAmount(goal ? goal.target_amount.toString() : "");
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    setIsSubmitting(true);
    
    const data = {
      name,
      target_amount: parseFloat(targetAmount)
    };

    if (editingGoal) {
      const res = await updateSaving(editingGoal.id, data);
      if (res) setMessage({ text: "Cập nhật sổ tiết kiệm thành công!", type: "success" });
      else setMessage({ text: "Lỗi khi cập nhật sổ tiết kiệm", type: "error" });
    } else {
      const res = await createSaving(data);
      if (res) setMessage({ text: "Tạo sổ tiết kiệm mới thành công!", type: "success" });
      else setMessage({ text: "Lỗi khi tạo sổ tiết kiệm", type: "error" });
    }
    
    setIsSubmitting(false);
    setIsModalOpen(false);
    fetchData();
    setTimeout(() => setMessage(null), 3000);
  };

  const openActionModal = (goal: any, type: 'deposit' | 'withdraw') => {
    setSelectedGoal(goal);
    setActionType(type);
    setAmount("");
    setSelectedAccount(accounts.length > 0 ? accounts[0].id : "");
    setIsActionModalOpen(true);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedAccount || !selectedGoal) return;
    setIsSubmitting(true);

    // Create a transaction linked to the savings goal
    // Deposit: Expense from Account, adds to Savings
    // Withdraw: Income to Account, subtracts from Savings
    await createTransaction({
      amount: parseFloat(amount),
      type: actionType === 'deposit' ? 'expense' : 'income',
      date: new Date().toISOString(),
      note: `${actionType === 'deposit' ? 'Nạp tiền vào' : 'Rút tiền từ'} sổ: ${selectedGoal.name}`,
      account_id: selectedAccount,
      savings_goal_id: selectedGoal.id
    });

    setIsSubmitting(false);
    setIsActionModalOpen(false);
    fetchData();
    // Refresh accounts too
    window.dispatchEvent(new CustomEvent("refresh_accounts"));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sổ tiết kiệm này? Các giao dịch liên quan sẽ được giữ lại nhưng không còn liên kết với sổ.")) {
      try {
        console.log("Đang bắt đầu xóa goal id:", id);
        const res = await deleteSaving(id);
        console.log("Kết quả xóa từ API:", res);
        setMessage({ text: "Đã xóa sổ tiết kiệm thành công!", type: "success" });
        fetchData();
      } catch (err: any) {
        console.error("Lỗi chi tiết khi xóa:", err);
        const errorMsg = err.response?.data?.detail || err.message || "Lỗi không xác định";
        setMessage({ text: `Lỗi khi xóa: ${errorMsg}`, type: "error" });
      }
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const gridCardClass = isGlass 
    ? "glass-card p-6" 
    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl";
  
  const textTitleClass = isGlass ? "text-white drop-shadow-md" : "text-slate-900 dark:text-white";
  const textSubClass = isGlass ? "text-white drop-shadow-md" : "text-slate-500 dark:text-slate-400";

  return (
    <div className="h-full flex flex-col relative w-full h-full p-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className={`text-4xl font-extrabold tracking-tight ${textTitleClass}`}>Tiết kiệm</h2>
          <p className={`mt-2 ${textSubClass}`}>Quản lý các mục tiêu tài chính của bạn</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
            isGlass ? "bg-white/10 hover:bg-white/20 text-white border border-white/20" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tạo sổ mới
        </button>
      </div>
      
      {message && (
        <div className={`mb-6 p-4 rounded-2xl text-sm font-bold animate-fade-in ${
          message.type === "success" 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className={`text-center py-20 font-bold ${textSubClass}`}>Đang tải...</div>
      ) : goals.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl flex flex-col items-center justify-center ${gridCardClass}`}>
          <p className={`text-lg font-bold mb-4 ${textTitleClass}`}>Bạn chưa có sổ tiết kiệm nào</p>
          <button 
            onClick={() => handleOpenModal()}
            className={`px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 ${
              isGlass ? "bg-white/10 hover:bg-white/20 text-white border border-white/20" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
            }`}
          >
            Bắt đầu tiết kiệm ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {goals.map((goal) => {
            const pct = (goal.current_amount / goal.target_amount) * 100;
            const isCompleted = goal.current_amount >= goal.target_amount;
            
            // Completion logic - Liquid Gold
            const goldCardClass = isCompleted 
                ? (isGlass 
                    ? "bg-gradient-to-br from-amber-400/30 to-yellow-600/30 border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]" 
                    : "bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200 shadow-amber-200/50")
                : "";
            
            // Adjust text colors for completed goals (especially for "Liquid Gold" effect visibility)
            const cardTitleClass = isCompleted 
                ? (isGlass ? "text-amber-100 drop-shadow-sm" : "text-amber-900") 
                : textTitleClass;
            const cardSubClass = isCompleted 
                ? (isGlass ? "text-amber-200/80" : "text-amber-700") 
                : textSubClass;

            return (
              <div key={goal.id} className={`${gridCardClass} ${goldCardClass} relative overflow-hidden group`}>
                {isCompleted && (
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-400/20 rounded-full blur-2xl animate-pulse pointer-events-none"></div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`font-black text-xl truncate ${cardTitleClass}`}>{goal.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? 'text-amber-600 dark:text-amber-500' : 'text-blue-500'}`}>
                        {isCompleted ? 'Mục tiêu hoàn thành! 🎉' : 'Đang thực hiện'}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(goal)} className="p-1.5 rounded-lg hover:bg-white/10 text-blue-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-rose-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 2 0 00-1-1h-4a1 2 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
 
                <div className="flex justify-between items-end mb-2">
                  <div className={`font-semibold ${cardSubClass} text-sm`}>
                    <span className={`text-lg ${cardTitleClass}`}>
                      {Number(goal.current_amount).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </span> / {Number(goal.target_amount).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}đ
                  </div>
                  <div className={`text-xs font-black ${isCompleted ? 'text-amber-600' : 'text-blue-500'}`}>
                    {Math.min(pct, 100).toFixed(0)}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className={`w-full h-3 rounded-full overflow-hidden mb-6 relative ${isGlass ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-900'}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-in-out ${isCompleted ? 'bg-gradient-to-r from-amber-400 to-yellow-600' : 'bg-gradient-to-r from-blue-400 to-indigo-600'}`} 
                    style={{ width: `${Math.min(pct, 100)}%` }} 
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => openActionModal(goal, 'deposit')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isGlass ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Nạp tiền
                  </button>
                  <button 
                    onClick={() => openActionModal(goal, 'withdraw')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isGlass ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                    Rút tiền
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={`relative w-full max-w-sm rounded-[2rem] p-8 animate-slide-up shadow-2xl ${
            isGlass ? "glass-panel bg-white/10" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          }`}>
            <h3 className={`text-2xl font-black mb-6 ${textTitleClass}`}>{editingGoal ? 'Sửa sổ tiết kiệm' : 'Tạo sổ tiết kiệm mới'}</h3>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>Tên sổ</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all ${
                    isGlass ? "glass-input" : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  }`}
                  placeholder="Ví dụ: Mua iPhone 16..."
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>Mục tiêu (VNĐ)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all ${
                    isGlass ? "glass-input" : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  }`}
                  placeholder="20,000,000"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${isGlass ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"}`}>Hủy</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal (Deposit/Withdraw) */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsActionModalOpen(false)}></div>
          <div className={`relative w-full max-w-sm rounded-[2rem] p-8 animate-slide-up shadow-2xl ${
            isGlass ? "glass-panel bg-white/10" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          }`}>
            <h3 className={`text-2xl font-black mb-2 ${textTitleClass}`}>{actionType === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}</h3>
            <p className={`text-sm mb-6 ${textSubClass}`}>Sổ: <span className={textTitleClass}>{selectedGoal?.name}</span></p>
            
            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>Chọn ví thực hiện</label>
                <GlassSelect 
                  value={selectedAccount} 
                  onChange={(val) => setSelectedAccount(val)}
                  options={accounts.map((a) => ({ 
                    label: `${a.name} (${Number(a.balance).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}đ)`, 
                    value: a.id 
                  }))}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${textSubClass}`}>Số tiền (VNĐ)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl outline-none font-medium transition-all ${
                    isGlass ? "glass-input" : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  }`}
                  placeholder="0"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsActionModalOpen(false)} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${isGlass ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"}`}>Hủy</button>
                <button type="submit" disabled={isSubmitting} className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg ${actionType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
                    Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
