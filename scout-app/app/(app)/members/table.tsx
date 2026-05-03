"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

type Row = {
  id: string;
  serial_number: number | null;
  full_name: string;
  patrol: string | null;
  rank: string | null;
  active: boolean;
};

export default function MembersTable({ members }: { members: Row[] }) {
  const [q, setQ] = useState("");
  const [patrol, setPatrol] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  const patrols = useMemo(
    () => Array.from(new Set(members.map(m => m.patrol).filter(Boolean))) as string[],
    [members]
  );

  const filtered = members.filter(m => {
    if (onlyActive && !m.active) return false;
    if (patrol && m.patrol !== patrol) return false;
    if (q && !m.full_name.includes(q)) return false;
    return true;
  });

  return (
    <>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label>بحث بالاسم</label>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="اكتب جزءاً من الاسم" />
        </div>
        <div>
          <label>الطليعة</label>
          <select value={patrol} onChange={e => setPatrol(e.target.value)}>
            <option value="">الكل</option>
            {patrols.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={onlyActive} onChange={e => setOnlyActive(e.target.checked)} />
          <span>النشطون فقط</span>
        </label>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>م</th>
              <th>الاسم</th>
              <th>الطليعة</th>
              <th>الرتبة</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td>{m.serial_number ?? "—"}</td>
                <td className="font-medium">{m.full_name}</td>
                <td>{m.patrol ?? "—"}</td>
                <td>{m.rank ?? "—"}</td>
                <td>
                  {m.active
                    ? <span className="badge bg-green-100 text-green-800">نشط</span>
                    : <span className="badge bg-slate-200 text-slate-700">غير نشط</span>}
                </td>
                <td>
                  <Link href={`/members/${m.id}`} className="text-brand hover:underline">عرض</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-6">لا توجد نتائج</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
