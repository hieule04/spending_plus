import { useState, useEffect, useCallback } from "react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../service/api";

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

const DEFAULT_ICONS = ["🍔", "🏠", "🚗", "💊", "🎮", "📚", "💰", "🎁", "✈️", "☕", "🛒", "📱"];
const DEFAULT_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("expense");
  const [formIcon, setFormIcon] = useState("🍔");
  const [formColor, setFormColor] = useState("#ef4444");

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listCategories();
      setCategories(data || []);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setFormName("");
    setFormType("expense");
    setFormIcon("🍔");
    setFormColor("#ef4444");
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (cat: Category) => {
    setFormName(cat.name);
    setFormType(cat.type);
    setFormIcon(cat.icon || "🍔");
    setFormColor(cat.color || "#ef4444");
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const payload = { name: formName, type: formType, icon: formIcon, color: formColor };
      if (editingId) {
        await updateCategory(editingId, payload);
        setMessage({ text: "Cập nhật danh mục thành công!", type: "success" });
      } else {
        await createCategory(payload);
        setMessage({ text: "Tạo danh mục thành công!", type: "success" });
      }
      resetForm();
      fetchCategories();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá danh mục này?")) return;
    setMessage(null);
    try {
      await deleteCategory(id);
      setMessage({ text: "Đã xoá danh mục.", type: "success" });
      fetchCategories();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Danh mục</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors text-sm">
          + Thêm danh mục
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
          <h3 className="text-lg font-semibold text-white mb-4">{editingId ? "Sửa danh mục" : "Tạo danh mục mới"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tên danh mục</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ăn uống..." />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Loại</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="expense">Chi tiêu</option>
                  <option value="income">Thu nhập</option>
                </select>
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_ICONS.map((icon) => (
                  <button key={icon} type="button" onClick={() => setFormIcon(icon)}
                    className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${formIcon === icon ? "bg-blue-600 ring-2 ring-blue-400 scale-110" : "bg-slate-700 hover:bg-slate-600"}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Màu sắc</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${formColor === color ? "ring-2 ring-white scale-125" : "hover:scale-110"}`}
                    style={{ backgroundColor: color }} />
                ))}
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

      {/* Card Grid */}
      {loading ? (
        <div className="text-center text-slate-400 py-10">Đang tải...</div>
      ) : categories.length === 0 ? (
        <div className="text-center text-slate-500 py-10 bg-slate-900/30 rounded-2xl border border-slate-700">
          Bạn chưa có danh mục nào. Hãy tạo mới!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-slate-900/50 rounded-2xl border border-slate-700 p-4 flex flex-col items-center text-center hover:border-slate-500 transition-colors group relative">
              {/* Badge loại */}
              <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cat.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                {cat.type === "income" ? "Thu" : "Chi"}
              </span>
              {/* Icon */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2" style={{ backgroundColor: (cat.color || "#3b82f6") + "30" }}>
                {cat.icon || "📁"}
              </div>
              <span className="text-white font-medium text-sm truncate w-full">{cat.name}</span>
              {/* Actions */}
              <div className="flex gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditForm(cat)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">Sửa</button>
                <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-300 text-xs font-medium">Xoá</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
