"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Save } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
};

export default function UsersClient({ initial }: { initial: Profile[] }) {
  const [rows, setRows] = useState<Profile[]>(initial);
  const [err, setErr] = useState("");

  function update(id: string, patch: Partial<Profile>) {
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  async function save(r: Profile) {
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      full_name: r.full_name,
      role: r.role,
    }).eq("id", r.id);
    if (error) setErr(error.message);
  }

  return (
    <div className="space-y-3">
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الدور</th>
              <th>تاريخ الإنشاء</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>
                  <input value={r.full_name ?? ""} onChange={e => update(r.id, { full_name: e.target.value })} />
                </td>
                <td>
                  <select value={r.role ?? "supervisor"} onChange={e => update(r.id, { role: e.target.value })}>
                    <option value="leader">قائد</option>
                    <option value="supervisor">مشرف</option>
                  </select>
                </td>
                <td>{formatDate(r.created_at)}</td>
                <td>
                  <button onClick={() => save(r)} className="text-brand" title="حفظ"><Save size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-6">لا توجد حسابات بعد</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        ملاحظة: لإنشاء مستخدم جديد، أضفه أولاً من لوحة Supabase (Authentication → Users).
        عند أول دخول له إلى التطبيق، سيظهر هنا ويُمكنك ضبط الدور.
      </p>
    </div>
  );
}
