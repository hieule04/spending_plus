import { useState, useEffect, useCallback } from "react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../service/api";
import ConfirmModal from "./ConfirmModal";
import GlassSelect from "./GlassSelect";
import { useGlassTheme } from "../hooks/useGlassTheme";
import { useLanguage } from "../context/LanguageContext";

interface Category { id: string; name: string; type: string; icon: string | null; color: string | null; created_at: string; }

const DEFAULT_ICONS = ["🍔", "🏠", "🚗", "💊", "🎮", "📚", "💰", "🎁", "✈️", "☕", "🛒", "📱"];
const DEFAULT_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function CategoriesTab() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("expense");
  const [formIcon, setFormIcon] = useState("🍔");
  const [formColor, setFormColor] = useState("#ef4444");
  const isGlass = useGlassTheme();

  const fetchCategories = useCallback(async () => {
    try { setLoading(true); const data = await listCategories(); setCategories(data || []); } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const resetForm = () => { setFormName(""); setFormType("expense"); setFormIcon("🍔"); setFormColor("#ef4444"); setEditingId(null); setShowForm(false); };
  const openEditForm = (cat: Category) => { setFormName(cat.name); setFormType(cat.type); setFormIcon(cat.icon || "🍔"); setFormColor(cat.color || "#ef4444"); setEditingId(cat.id); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage(null);
    try {
      const payload = { name: formName, type: formType, icon: formIcon, color: formColor };
      if (editingId) { await updateCategory(editingId, payload); setMessage({ text: t('cat.msg.update_success'), type: "success" }); }
      else { await createCategory(payload); setMessage({ text: t('cat.msg.create_success'), type: "success" }); }
      resetForm(); fetchCategories();
    } catch (err: any) { setMessage({ text: err.message, type: "error" }); }
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return; setMessage(null);
    try { await deleteCategory(confirmDelete); setMessage({ text: t('cat.msg.delete_success'), type: "success" }); fetchCategories(); } catch (err: any) { setMessage({ text: err.message, type: "error" }); } finally { setConfirmDelete(null); }
  };

  const cardClass = isGlass ? 'glass-card' : 'bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-600 shadow-sm';
  const headingClass = isGlass ? 'text-white drop-shadow-md' : 'text-slate-900 dark:text-white';
  const subTextClass = isGlass ? 'text-white drop-shadow-md' : 'text-slate-600 dark:text-slate-400 font-bold';
  const inputClass = isGlass ? 'glass-input rounded-lg' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold ${headingClass}`}>{t('cat.title')}</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors text-sm">{t('cat.add')}</button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>{message.text}</div>
      )}

      {showForm && (
        <div className={`p-6 rounded-2xl ${cardClass}`}>
          <h3 className={`text-lg font-semibold mb-4 ${headingClass}`}>{editingId ? t('cat.action.edit') : t('cat.add_new')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${subTextClass}`}>{t('cat.form.name')}</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className={`w-full px-4 py-2 ${inputClass}`} placeholder={t('cat.form.placeholder.name')} />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${subTextClass}`}>{t('cat.form.type')}</label>
                <GlassSelect
                  value={formType}
                  onChange={(val) => setFormType(val)}
                  options={[
                    { label: t('cat.type.expense'), value: "expense" },
                    { label: t('cat.type.income'), value: "income" }
                  ]}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${subTextClass}`}>{t('cat.form.icon')}</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_ICONS.map((icon) => (
                  <button key={icon} type="button" onClick={() => setFormIcon(icon)}
                    className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${formIcon === icon ? "bg-blue-600 ring-2 ring-blue-400 scale-110" : isGlass ? "bg-white/10 hover:bg-white/15" : "bg-slate-700 hover:bg-slate-600"}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${subTextClass}`}>{t('cat.form.color')}</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${formColor === color ? "ring-2 ring-white scale-125" : "hover:scale-110"}`}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors text-sm">{editingId ? t('common.update') : t('common.create')}</button>
              <button type="button" onClick={resetForm} className={`px-5 py-2 rounded-lg font-semibold transition-colors text-sm ${isGlass ? 'glass-btn' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={`text-center py-10 ${subTextClass}`}>{t('common.loading')}</div>
      ) : categories.length === 0 ? (
        <div className={`text-center py-10 rounded-2xl ${isGlass ? 'glass-card' : 'bg-slate-900/30 border border-slate-700'} ${subTextClass}`}>{t('cat.no_categories_short')}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className={`rounded-2xl p-4 flex flex-col items-center text-center transition-colors group relative ${
              isGlass ? 'glass-card' : 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 shadow-sm'
            }`}>
              <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cat.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                {cat.type === "income" ? t('cat.type.income_short') : t('cat.type.expense_short')}
              </span>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2" style={{ backgroundColor: (cat.color || "#3b82f6") + "30" }}>{cat.icon || "📁"}</div>
              <span className={`font-medium text-sm truncate w-full ${headingClass}`}>{cat.name}</span>
              <div className="flex gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditForm(cat)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">{t('cat.action.edit')}</button>
                <button onClick={() => setConfirmDelete(cat.id)} className="text-red-400 hover:text-red-300 text-xs font-medium">{t('cat.action.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} title={t('cat.delete_confirm_title')} message={t('cat.delete_confirm_msg')} onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
