"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

type Budget = { id: string; year: number; category: string; planned_amount: number; notes: string | null };

export default function BudgetsClient({ year, initial }: { year: number; initial: Budget[] }) {
  const [rows, setRows] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    category: EXPENSE_CATEGORIES[0].value,
    planned_amount: 0,
    notes: "",
  });

  async function add() {
    const supabase = createClient();
    const { data, error } = await supabase.from("budgets").insert({ ...form, year }).select("*").single();
    if (!error && data) { setRows([...rows, data as Budget]); setAdding(false); setForm({ category: EXPENSE_CATEGORIES[0].value, planned_amount: 0, notes: "" }); }
  }

  async function updateAmount(id: string, planned_amount: number) {
    setRows(rows.map(r => r.id === id ? { ...r, planned_amount } : r));
    const supabase = createClient();
    await supabase.from("budgets").update({ planned_amount }).eq("id", id);
  }

  async function remove(id: string) {
    if (!confirm("تأكيد الحذف؟")) return;
    const supabase = createClient();
    await supabase.from("budgets").delete().eq("id", id);
    setRows(rows.filter(r => r.id !== id));
  }

  const total = rows.reduce((s, r) => s + Number(r.planned_amount), 0);
  const catLabel = (v: string) => EXPENSE_CATEGORIES.find(c => c.value === v)?.label ?? v;

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="text-sm">الإجمالي: <strong>{total.toLocaleString("ar-EG")}</strong></div>
        <button onClick={() => setAdding(!adding)} className="btn-primary flex items-center gap-1">
          <Plus size={16} /> بند جديد
        </button>
      </div>

      {adding && (
        <div className="card grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label>الفئة</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label>المبلغ المخطّط</label>
            <input type="number" step="0.01" value={form.planned_amount} onChange={e => setForm({ ...form, planned_amount: Number(e.target.value) })} />
          </div>
          <div>
            <label>ملاحظات</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="btn-primary">إضافة</button>
            <button onClick={() => setAdding(false)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>الفئة</th><th>المبلغ المخطّط</th><th>ملاحظات</th><th></th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{catLabel(r.category)}</td>
                <td>
                  <input type="number" step="0.01" value={r.planned_amount} onChange={e => updateAmount(r.id, Number(e.target.value))} className="w-32" />
                </td>
                <td>{r.notes ?? "—"}</td>
                <td>
                  <button onClick={() => remove(r.id)} className="text-red-600"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-6">لا توجد بنود — أضف أولها</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
