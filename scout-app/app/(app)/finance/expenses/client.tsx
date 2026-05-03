"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES, formatDate } from "@/lib/utils";
import { Plus, Trash2, Paperclip } from "lucide-react";

type Exp = {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string | null;
  receipt_url: string | null;
  meeting_id: string | null;
  activity_id: string | null;
};

export default function ExpensesClient({ initial }: { initial: Exp[] }) {
  const [rows, setRows] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    category: EXPENSE_CATEGORIES[0].value,
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setErr("");
    try {
      const supabase = createClient();
      let receipt_url: string | null = null;
      if (file) {
        const path = `receipts/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("receipts").upload(path, file);
        if (upErr) throw upErr;
        receipt_url = path;
      }
      const { data, error } = await supabase.from("expenses").insert({
        ...form,
        receipt_url,
      }).select("*").single();
      if (error) throw error;
      setRows([data as Exp, ...rows]);
      setAdding(false);
      setForm({ date: new Date().toISOString().slice(0, 10), amount: 0, category: EXPENSE_CATEGORIES[0].value, description: "" });
      setFile(null);
    } catch (e) { setErr(String(e)); } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("تأكيد الحذف؟")) return;
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", id);
    setRows(rows.filter(r => r.id !== id));
  }

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const catLabel = (v: string) => EXPENSE_CATEGORIES.find(c => c.value === v)?.label ?? v;

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">الإجمالي: <strong>{total.toLocaleString("ar-EG")}</strong></div>
        <button onClick={() => setAdding(!adding)} className="btn-primary flex items-center gap-1">
          <Plus size={16} /> مصروف جديد
        </button>
      </div>

      {adding && (
        <div className="card space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label>التاريخ</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label>المبلغ</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div>
              <label>الفئة</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label>صورة الفاتورة</label>
              <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="md:col-span-4">
              <label>الوصف</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          {err && <div className="text-red-600 text-sm">{err}</div>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? "جارٍ..." : "حفظ"}</button>
            <button onClick={() => setAdding(false)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>التاريخ</th><th>الفئة</th><th>الوصف</th><th>المبلغ</th><th>فاتورة</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{formatDate(r.date)}</td>
                <td>{catLabel(r.category)}</td>
                <td>{r.description ?? "—"}</td>
                <td>{Number(r.amount).toLocaleString("ar-EG")}</td>
                <td>{r.receipt_url ? <Paperclip size={14} className="inline text-brand" /> : "—"}</td>
                <td>
                  <button onClick={() => remove(r.id)} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-6">لا توجد مصاريف</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        ملاحظة: تحميل الفواتير يحتاج إنشاء bucket باسم <code dir="ltr">receipts</code> في Supabase Storage (اجعله خاصاً).
      </p>
    </>
  );
}
