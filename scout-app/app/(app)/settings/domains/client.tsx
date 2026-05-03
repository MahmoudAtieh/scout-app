"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Save, EyeOff, Eye, Trash2 } from "lucide-react";

type Domain = {
  id: string;
  name: string;
  description: string | null;
  weight_percent: number | null;
  sort_order: number | null;
  active: boolean;
};

export default function DomainsClient({ initial }: { initial: Domain[] }) {
  const [rows, setRows] = useState<Domain[]>(initial);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ name: "", description: "", weight_percent: 0, sort_order: (initial.length + 1) });
  const [err, setErr] = useState("");

  function update(id: string, patch: Partial<Domain>) {
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  async function save(r: Domain) {
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.from("domains").update({
      name: r.name,
      description: r.description,
      weight_percent: r.weight_percent,
      sort_order: r.sort_order,
      active: r.active,
    }).eq("id", r.id);
    if (error) setErr(error.message);
  }

  async function toggleActive(r: Domain) {
    const next = !r.active;
    update(r.id, { active: next });
    const supabase = createClient();
    await supabase.from("domains").update({ active: next }).eq("id", r.id);
  }

  async function removeHard(r: Domain) {
    if (!confirm("حذف نهائي؟ سيُرفض إذا كانت هناك مهام مرتبطة. الأفضل إخفاؤه بدلاً من الحذف.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("domains").delete().eq("id", r.id);
    if (error) { setErr(error.message); return; }
    setRows(rows.filter(x => x.id !== r.id));
  }

  async function addNew() {
    setErr("");
    if (!newRow.name.trim()) { setErr("الاسم مطلوب"); return; }
    const supabase = createClient();
    const { data, error } = await supabase.from("domains").insert({
      name: newRow.name.trim(),
      description: newRow.description || null,
      weight_percent: newRow.weight_percent || null,
      sort_order: newRow.sort_order,
      active: true,
    }).select("*").single();
    if (error) { setErr(error.message); return; }
    if (data) setRows([...rows, data as Domain]);
    setAdding(false);
    setNewRow({ name: "", description: "", weight_percent: 0, sort_order: rows.length + 2 });
  }

  const totalWeight = rows.filter(r => r.active).reduce((s, r) => s + Number(r.weight_percent ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-sm">
          إجمالي الأوزان للمجالات النشطة: <strong>{totalWeight}%</strong>
          {totalWeight !== 100 && <span className="text-amber-600 mr-2">(يُستحسن أن يساوي 100%)</span>}
        </div>
        <button onClick={() => setAdding(!adding)} className="btn-primary flex items-center gap-1">
          <Plus size={16} /> مجال جديد
        </button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      {adding && (
        <div className="card grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label>الاسم</label>
            <input value={newRow.name} onChange={e => setNewRow({ ...newRow, name: e.target.value })} />
          </div>
          <div>
            <label>الوزن %</label>
            <input type="number" value={newRow.weight_percent} onChange={e => setNewRow({ ...newRow, weight_percent: Number(e.target.value) })} />
          </div>
          <div>
            <label>الترتيب</label>
            <input type="number" value={newRow.sort_order} onChange={e => setNewRow({ ...newRow, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex gap-2">
            <button onClick={addNew} className="btn-primary">إضافة</button>
            <button onClick={() => setAdding(false)} className="btn-secondary">إلغاء</button>
          </div>
          <div className="md:col-span-4">
            <label>الوصف</label>
            <input value={newRow.description} onChange={e => setNewRow({ ...newRow, description: e.target.value })} />
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>الترتيب</th>
              <th>الاسم</th>
              <th>الوصف</th>
              <th>الوزن %</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className={r.active ? "" : "opacity-50"}>
                <td>
                  <input type="number" value={r.sort_order ?? 0} onChange={e => update(r.id, { sort_order: Number(e.target.value) })} className="w-16" />
                </td>
                <td>
                  <input value={r.name} onChange={e => update(r.id, { name: e.target.value })} className="w-48" />
                </td>
                <td>
                  <input value={r.description ?? ""} onChange={e => update(r.id, { description: e.target.value })} />
                </td>
                <td>
                  <input type="number" value={r.weight_percent ?? 0} onChange={e => update(r.id, { weight_percent: Number(e.target.value) })} className="w-16" />
                </td>
                <td>{r.active ? "نشط" : "مخفي"}</td>
                <td className="flex gap-1">
                  <button onClick={() => save(r)} className="text-brand" title="حفظ"><Save size={14} /></button>
                  <button onClick={() => toggleActive(r)} className="text-slate-600" title={r.active ? "إخفاء" : "تفعيل"}>
                    {r.active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => removeHard(r)} className="text-red-600" title="حذف نهائي"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-6">لا توجد مجالات بعد</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
