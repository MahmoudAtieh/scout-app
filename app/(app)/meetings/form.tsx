"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ATTENDANCE_STATUS_AR } from "@/lib/utils";

type Domain = { id: string; name: string };
type Template = { sort_order: number; category: string; default_duration_minutes: number | null; default_domain_id: string | null };
type Member = { id: string; full_name: string; patrol: string | null; rank: string | null; serial_number: number | null };

type Segment = {
  sort_order: number;
  category: string;
  subject: string;
  educational_goal: string;
  method_or_activity: string;
  duration_minutes: number | null;
  implementation_status: "done" | "partial" | "not_done" | null;
  domain_id: string | null;
};

type AttendanceRow = {
  member_id: string;
  status: "present" | "absent" | "late" | "excused";
  arrival_time: string;
  absence_reason: string;
};

export default function MeetingForm({
  domains, template, members, nextNumber, existing,
}: {
  domains: Domain[];
  template: Template[];
  members: Member[];
  nextNumber: number;
  existing?: {
    id: string;
    meeting_number: number | null;
    date: string;
    unit_name: string | null;
    duration_minutes: number | null;
    location: string | null;
    notes: string | null;
    segments: Segment[];
    attendance: AttendanceRow[];
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [meta, setMeta] = useState({
    meeting_number: existing?.meeting_number ?? nextNumber,
    date: existing?.date ?? new Date().toISOString().slice(0, 10),
    unit_name: existing?.unit_name ?? "وحدة الفتيان",
    duration_minutes: existing?.duration_minutes ?? 120,
    location: existing?.location ?? "",
    notes: existing?.notes ?? "",
  });

  const [segments, setSegments] = useState<Segment[]>(() => {
    if (existing?.segments?.length) return existing.segments;
    return template.map(t => ({
      sort_order: t.sort_order,
      category: t.category,
      subject: "",
      educational_goal: "",
      method_or_activity: "",
      duration_minutes: t.default_duration_minutes,
      implementation_status: null,
      domain_id: t.default_domain_id,
    }));
  });

  const [attendance, setAttendance] = useState<AttendanceRow[]>(() => {
    if (existing?.attendance?.length) return existing.attendance;
    return members.map(m => ({ member_id: m.id, status: "present", arrival_time: "", absence_reason: "" }));
  });

  function updSeg(i: number, patch: Partial<Segment>) {
    const next = [...segments];
    next[i] = { ...next[i], ...patch };
    setSegments(next);
  }

  function updAtt(member_id: string, patch: Partial<AttendanceRow>) {
    setAttendance(prev => prev.map(a => a.member_id === member_id ? { ...a, ...patch } : a));
  }

  function bulkStatus(status: AttendanceRow["status"]) {
    setAttendance(prev => prev.map(a => ({ ...a, status })));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const supabase = createClient();
      let meetingId = existing?.id;

      if (meetingId) {
        const { error } = await supabase.from("meetings").update(meta).eq("id", meetingId);
        if (error) throw error;
        await supabase.from("meeting_segments").delete().eq("meeting_id", meetingId);
        await supabase.from("attendance").delete().eq("meeting_id", meetingId);
      } else {
        const { data, error } = await supabase.from("meetings").insert(meta).select("id").single();
        if (error) throw error;
        meetingId = data.id;
      }

      if (segments.length > 0) {
        const { error } = await supabase.from("meeting_segments").insert(
          segments.map(s => ({ ...s, meeting_id: meetingId }))
        );
        if (error) throw error;
      }

      if (attendance.length > 0) {
        const { error } = await supabase.from("attendance").insert(
          attendance.map(a => ({
            meeting_id: meetingId,
            member_id: a.member_id,
            status: a.status,
            arrival_time: a.arrival_time || null,
            absence_reason: a.absence_reason || null,
          }))
        );
        if (error) throw error;
      }

      router.push(`/meetings/${meetingId}`);
      router.refresh();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="card grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label>رقم اللقاء</label>
          <input type="number" value={meta.meeting_number} onChange={e => setMeta({ ...meta, meeting_number: Number(e.target.value) })} />
        </div>
        <div>
          <label>التاريخ *</label>
          <input type="date" required value={meta.date} onChange={e => setMeta({ ...meta, date: e.target.value })} />
        </div>
        <div>
          <label>المدة (دقائق)</label>
          <input type="number" value={meta.duration_minutes} onChange={e => setMeta({ ...meta, duration_minutes: Number(e.target.value) })} />
        </div>
        <div>
          <label>المكان</label>
          <input value={meta.location} onChange={e => setMeta({ ...meta, location: e.target.value })} />
        </div>
        <div className="col-span-2 md:col-span-4">
          <label>ملاحظات اللقاء</label>
          <textarea rows={2} value={meta.notes} onChange={e => setMeta({ ...meta, notes: e.target.value })} />
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold mb-3">فقرات اللقاء (7 فقرات قياسية — يمكن تعديل القالب من الإعدادات)</h2>
        <div className="space-y-3">
          {segments.map((s, i) => (
            <div key={i} className="border border-slate-200 rounded-md p-3 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-brand">{i + 1}. {s.category}</div>
                <div className="flex items-center gap-2 text-sm">
                  <select
                    value={s.implementation_status ?? ""}
                    onChange={e => updSeg(i, { implementation_status: (e.target.value || null) as Segment["implementation_status"] })}
                    className="text-xs"
                  >
                    <option value="">لم يُحدَّد</option>
                    <option value="done">نُفِّذ</option>
                    <option value="partial">جزئي</option>
                    <option value="not_done">لم يُنفَّذ</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <label>الموضوع</label>
                  <input value={s.subject} onChange={e => updSeg(i, { subject: e.target.value })} />
                </div>
                <div>
                  <label>الهدف التربوي</label>
                  <input value={s.educational_goal} onChange={e => updSeg(i, { educational_goal: e.target.value })} />
                </div>
                <div>
                  <label>الوسيلة / النشاط</label>
                  <input value={s.method_or_activity} onChange={e => updSeg(i, { method_or_activity: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label>المدة (د)</label>
                    <input type="number" value={s.duration_minutes ?? ""} onChange={e => updSeg(i, { duration_minutes: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <label>المجال</label>
                    <select value={s.domain_id ?? ""} onChange={e => updSeg(i, { domain_id: e.target.value || null })}>
                      <option value="">—</option>
                      {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">تحضير الحضور ({members.length} عضو)</h2>
          <div className="flex gap-2 text-sm">
            <button type="button" onClick={() => bulkStatus("present")} className="btn-secondary">الكل حاضر</button>
            <button type="button" onClick={() => bulkStatus("absent")} className="btn-secondary">الكل غائب</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>م</th>
                <th>الاسم</th>
                <th>الطليعة</th>
                <th>الحالة</th>
                <th>وقت الوصول</th>
                <th>سبب الغياب</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const a = attendance.find(x => x.member_id === m.id)!;
                return (
                  <tr key={m.id}>
                    <td>{m.serial_number ?? "—"}</td>
                    <td className="font-medium">{m.full_name}</td>
                    <td>{m.patrol ?? "—"}</td>
                    <td>
                      <select value={a.status} onChange={e => updAtt(m.id, { status: e.target.value as AttendanceRow["status"] })}>
                        {Object.entries(ATTENDANCE_STATUS_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td><input type="time" value={a.arrival_time} onChange={e => updAtt(m.id, { arrival_time: e.target.value })} /></td>
                    <td><input value={a.absence_reason} onChange={e => updAtt(m.id, { absence_reason: e.target.value })} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ المحضر"}</button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>إلغاء</button>
      </div>
    </form>
  );
}
