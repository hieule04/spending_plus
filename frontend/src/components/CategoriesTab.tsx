import { useState, useEffect, useCallback } from "react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../service/api";
import ConfirmModal from "./ConfirmModal";
import FancySelect from "./FancySelect";
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

  const cardClass = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl';
  const headingClass = 'text-slate-900 dark:text-white';
  const subTextClass = 'text-slate-500 dark:text-slate-400 font-bold';
  const inputClass = 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 transition-all';

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
                <FancySelect
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
                    className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${formIcon === icon ? "bg-blue-600 ring-2 ring-blue-400 scale-110" : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"}`}>
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
              <button type="button" onClick={resetForm} className={`px-5 py-2 rounded-lg font-semibold transition-colors text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300`}>{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={`text-center py-10 ${subTextClass}`}>{t('common.loading')}</div>
      ) : categories.length === 0 ? (
        <div className={`text-center py-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl ${subTextClass}`}>{t('cat.no_categories_short')}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-20">
          {categories.map((cat) => (
            <div key={cat.id} className={`rounded-2xl p-4 flex flex-col items-center text-center transition-colors group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 shadow-xl`}>
              <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cat.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                {cat.type === "income" ? t('cat.type.income_short') : t('cat.type.expense_short')}
              </span>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2" style={{ backgroundColor: (cat.color || "#3b82f6") + "30" }}>{cat.icon || "📁"}</div>
              <span className={`font-medium text-sm truncate w-full ${headingClass}`}>{cat.name}</span>
              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditForm(cat)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                </button>
                <button onClick={() => setConfirmDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.347-9Zm5.485.058a.75.75 0 0 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal isOpen={!!confirmDelete} title={t('cat.delete_confirm_title')} message={t('cat.delete_confirm_msg')} onConfirm={confirmDeleteAction} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
