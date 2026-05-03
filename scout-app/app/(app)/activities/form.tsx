"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Domain = { id: string; name: string };
type Member = { id: string; full_name: string; serial_number: number | null; patrol: string | null };

const TYPES = ["مخيم كشفي", "زيارة معالم", "رحلة ترفيهية", "خدمة مجتمعية", "دورة تدريبية", "أخرى"];

export default function ActivityForm({
  domains, members, existing,
}: {
  domains: Domain[];
  members: Member[];
  existing?: {
    id: string;
    title: string;
    activity_type: string | null;
    start_date: string | null;
    end_date: string | null;
    location: string | null;
    domain_id: string | null;
    description: string | null;
    objectives: string | null;
    planned_budget: number | null;
    actual_budget: number | null;
    participantIds: string[];
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [f, setF] = useState({
    title: existing?.title ?? "",
    activity_type: existing?.activity_type ?? TYPES[0],
    start_date: existing?.start_date ?? new Date().toISOString().slice(0, 10),
    end_date: existing?.end_date ?? "",
    location: existing?.location ?? "",
    domain_id: existing?.domain_id ?? "",
    description: existing?.description ?? "",
    objectives: existing?.objectives ?? "",
    planned_budget: existing?.planned_budget ?? 0,
    actual_budget: existing?.actual_budget ?? 0,
  });

  const [participants, setParticipants] = useState<Set<string>>(
    new Set(existing?.participantIds ?? members.map(m => m.id))
  );

  function toggle(id: string) {
    const s = new Set(participants);
    s.has(id) ? s.delete(id) : s.add(id);
    setParticipants(s);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        title: f.title,
        activity_type: f.activity_type,
        start_date: f.start_date || null,
        end_date: f.end_date || null,
        location: f.location || null,
        domain_id: f.domain_id || null,
        description: f.description || null,
        objectives: f.objectives || null,
        planned_budget: f.planned_budget || null,
        actual_budget: f.actual_budget || null,
      };
      let id = existing?.id;
      if (id) {
        const { error } = await supabase.from("activities").update(payload).eq("id", id);
        if (error) throw error;
        await supabase.from("activity_participants").delete().eq("activity_id", id);
      } else {
        const { data, error } = await supabase.from("activities").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      if (participants.size > 0) {
        const { error } = await supabase.from("activity_participants").insert(
          Array.from(participants).map(mid => ({ activity_id: id, member_id: mid, attended: false }))
        );
        if (error) throw error;
      }
      router.push(`/activities/${id}`);
      router.refresh();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label>العنوان *</label>
          <input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
        </div>
        <div>
          <label>النوع</label>
          <select value={f.activity_type} onChange={e => setF({ ...f, activity_type: e.target.value })}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label>المجال</label>
          <select value={f.domain_id} onChange={e => setF({ ...f, domain_id: e.target.value })}>
            <option value="">—</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label>تاريخ البداية</label>
          <input type="date" value={f.start_date} onChange={e => setF({ ...f, start_date: e.target.value })} />
        </div>
        <div>
          <label>تاريخ النهاية</label>
          <input type="date" value={f.end_date} onChange={e => setF({ ...f, end_date: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label>المكان</label>
          <input value={f.location} onChange={e => setF({ ...f, location: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label>الوصف</label>
          <textarea rows={2} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label>الأهداف</label>
          <textarea rows={2} value={f.objectives} onChange={e => setF({ ...f, objectives: e.target.value })} />
        </div>
        <div>
          <label>الميزانية المخطّطة</label>
          <input type="number" step="0.01" value={f.planned_budget} onChange={e => setF({ ...f, planned_budget: Number(e.target.value) })} />
        </div>
        <div>
          <label>الميزانية الفعلية</label>
          <input type="number" step="0.01" value={f.actual_budget} onChange={e => setF({ ...f, actual_budget: Number(e.target.value) })} />
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">المشاركون ({participants.size} / {members.length})</h2>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={() => setParticipants(new Set(members.map(m => m.id)))}>الكل</button>
            <button type="button" className="btn-secondary text-sm" onClick={() => setParticipants(new Set())}>لا أحد</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 max-h-80 overflow-y-auto">
          {members.map(m => (
            <label key={m.id} className="flex items-center gap-2 text-sm p-1 hover:bg-slate-50 rounded">
              <input type="checkbox" checked={participants.has(m.id)} onChange={() => toggle(m.id)} />
              <span>{m.full_name}</span>
            </label>
          ))}
        </div>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ"}</button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>إلغاء</button>
      </div>
    </form>
  );
}
