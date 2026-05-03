"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type P = {
  activity_id: string;
  member_id: string;
  attended: boolean;
  contribution: number | null;
  members: { id: string; full_name: string; serial_number: number | null; patrol: string | null } | null;
};

export default function ActivityAttendanceToggle({
  activityId, participants,
}: { activityId: string; participants: P[] }) {
  const [rows, setRows] = useState(participants);
  const [saving, setSaving] = useState<string | null>(null);

  async function toggle(member_id: string, attended: boolean) {
    setSaving(member_id);
    setRows(rs => rs.map(r => r.member_id === member_id ? { ...r, attended } : r));
    const supabase = createClient();
    await supabase.from("activity_participants")
      .update({ attended })
      .eq("activity_id", activityId)
      .eq("member_id", member_id);
    setSaving(null);
  }

  async function setContribution(member_id: string, contribution: number) {
    setRows(rs => rs.map(r => r.member_id === member_id ? { ...r, contribution } : r));
    const supabase = createClient();
    await supabase.from("activity_participants")
      .update({ contribution })
      .eq("activity_id", activityId)
      .eq("member_id", member_id);
  }

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr><th>م</th><th>الاسم</th><th>الطليعة</th><th>حضر</th><th>مساهمة مالية</th></tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.member_id}>
              <td>{p.members?.serial_number ?? "—"}</td>
              <td className="font-medium">{p.members?.full_name}</td>
              <td>{p.members?.patrol ?? "—"}</td>
              <td>
                <input
                  type="checkbox"
                  checked={p.attended}
                  disabled={saving === p.member_id}
                  onChange={e => toggle(p.member_id, e.target.checked)}
                />
              </td>
              <td>
                <input
                  type="number" step="0.01"
                  value={p.contribution ?? 0}
                  onChange={e => setContribution(p.member_id, Number(e.target.value))}
                  className="w-28"
                />
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-4">لا يوجد مشاركون</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
