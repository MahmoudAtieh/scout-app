"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Save, Trash2 } from "lucide-react";

type Row = {
  id: string;
  sort_order: number;
  category: string;
  default_duration_minutes: number | null;
  domain_id: string | null;
};
type Domain = { id: string; name: string };

export default function TemplateClient({ initial, domains }: { initial: Row[]; domains: Domain[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [err, setErr] = useState("");

  function update(id: string, patch: Partial<Row>) {
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  async function save(r: Row) {
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.from("meeting_template").update({
      sort_order: r.sort_order,
      category: r.category,
      default_duration_minutes: r.default_duration_minutes,
      domain_id: r.domain_id,
    }).eq("id", r.id);
    if (error) setErr(error.message);
  }

  async function addRow() {
    const supabase = createClient();
    const { data, error } = await supabase.from("meeting_template").insert({
      sort_order: rows.length + 1,
      category: "فقرة جديدة",
      default_duration_minutes: 10,
      domain_id: null,
    }).select("*").single();
    if (error) { setErr(error.message); return; }
    if (data) setRows([...rows, data as Row]);
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه الفقرة من القالب؟")) return;
    const supabase = createClient();
    await supabase.from("meeting_template").delete().eq("id", id);
    setRows(rows.filter(r => r.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={addRow} className="btn-primary flex items-center gap-1">
          <Plus size={16} /> فقرة جديدة
        </button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>الترتيب</th>
              <th>اسم الفقرة</th>
              <th>المجال</th>
              <th>المدة (د)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>
                  <input type="number" value={r.sort_order} onChange={e => update(r.id, { sort_order: Number(e.target.value) })} className="w-16" />
                </td>
                <td>
                  <input value={r.category} onChange={e => update(r.id, { category: e.target.value })} />
                </td>
                <td>
                  <select value={r.domain_id ?? ""} onChange={e => update(r.id, { domain_id: e.target.value || null })}>
                    <option value="">—</option>
                    {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </td>
                <td>
                  <input type="number" value={r.default_duration_minutes ?? 0} onChange={e => update(r.id, { default_duration_minutes: Number(e.target.value) })} className="w-20" />
                </td>
                <td className="flex gap-1">
                  <button onClick={() => save(r)} className="text-brand" title="حفظ"><Save size={14} /></button>
                  <button onClick={() => remove(r.id)} className="text-red-600" title="حذف"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-6">لا توجد فقرات في القالب</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
