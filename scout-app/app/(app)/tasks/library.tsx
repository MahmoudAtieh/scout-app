"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TASK_LEVEL_AR } from "@/lib/utils";
import { Pencil, Plus, Save, X } from "lucide-react";

type Task = {
  id: string;
  task_number: number | null;
  domain_id: string | null;
  level: "basic" | "intermediate" | "advanced";
  title: string;
  description: string | null;
  points: number;
  verification_method: string | null;
  suggested_duration: string | null;
  active: boolean;
};
type Domain = { id: string; name: string };

const LEVELS: Task["level"][] = ["basic", "intermediate", "advanced"];
const BADGE: Record<Task["level"], string> = {
  basic: "bg-green-100 text-green-800",
  intermediate: "bg-amber-100 text-amber-800",
  advanced: "bg-red-100 text-red-800",
};

export default function TasksLibrary({ tasks: initial, domains }: { tasks: Task[]; domains: Domain[] }) {
  const [tasks, setTasks] = useState(initial);
  const [filter, setFilter] = useState({ domain: "", level: "" });
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  const domainName = (id: string | null) => domains.find(d => d.id === id)?.name ?? "—";

  const filtered = tasks.filter(t =>
    (!filter.domain || t.domain_id === filter.domain) &&
    (!filter.level || t.level === filter.level)
  );

  return (
    <>
      <div className="card flex flex-wrap gap-3 items-end">
        <div>
          <label>المجال</label>
          <select value={filter.domain} onChange={e => setFilter({ ...filter, domain: e.target.value })}>
            <option value="">الكل</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label>المستوى</label>
          <select value={filter.level} onChange={e => setFilter({ ...filter, level: e.target.value })}>
            <option value="">الكل</option>
            {LEVELS.map(l => <option key={l} value={l}>{TASK_LEVEL_AR[l]}</option>)}
          </select>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary ml-auto flex items-center gap-1">
          <Plus size={16} /> مهمة جديدة
        </button>
      </div>

      {(creating || editing) && (
        <TaskEditor
          task={editing}
          domains={domains}
          existingNumbers={tasks.map(t => t.task_number).filter(Boolean) as number[]}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSaved={(t) => {
            if (editing) {
              setTasks(tasks.map(x => x.id === t.id ? t : x));
            } else {
              setTasks([...tasks, t]);
            }
            setCreating(false); setEditing(null);
          }}
        />
      )}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>#</th><th>المجال</th><th>المستوى</th><th>العنوان</th><th>النقاط</th><th>طريقة التحقق</th><th>المدة</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className={t.active ? "" : "opacity-60"}>
                <td>{t.task_number ?? "—"}</td>
                <td>{domainName(t.domain_id)}</td>
                <td><span className={`badge ${BADGE[t.level]}`}>{TASK_LEVEL_AR[t.level]}</span></td>
                <td className="font-medium">{t.title}</td>
                <td>{t.points}</td>
                <td className="text-xs">{t.verification_method ?? "—"}</td>
                <td className="text-xs">{t.suggested_duration ?? "—"}</td>
                <td>
                  <button onClick={() => setEditing(t)} className="text-slate-600 hover:text-brand"><Pencil size={14} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-6">لا توجد مهام</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TaskEditor({
  task, domains, existingNumbers, onCancel, onSaved,
}: {
  task: Task | null;
  domains: Domain[];
  existingNumbers: number[];
  onCancel: () => void;
  onSaved: (t: Task) => void;
}) {
  const [f, setF] = useState<Partial<Task>>(
    task ?? {
      task_number: (Math.max(0, ...existingNumbers) || 0) + 1,
      level: "basic",
      points: 5,
      active: true,
    }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    try {
      const supabase = createClient();
      const payload = {
        task_number: f.task_number ?? null,
        domain_id: f.domain_id || null,
        level: f.level ?? "basic",
        title: f.title ?? "",
        description: f.description ?? null,
        points: f.points ?? 0,
        verification_method: f.verification_method ?? null,
        suggested_duration: f.suggested_duration ?? null,
        active: f.active ?? true,
      };
      if (task) {
        const { data, error } = await supabase.from("tasks").update(payload).eq("id", task.id).select("*").single();
        if (error) throw error;
        onSaved(data as Task);
      } else {
        const { data, error } = await supabase.from("tasks").insert(payload).select("*").single();
        if (error) throw error;
        onSaved(data as Task);
      }
    } catch (e) { setErr(String(e)); } finally { setSaving(false); }
  }

  return (
    <div className="card border-brand/40 bg-green-50/30">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">{task ? "تعديل مهمة" : "مهمة جديدة"}</h3>
        <button onClick={onCancel} className="text-slate-500"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label>رقم المهمة</label>
          <input type="number" value={f.task_number ?? ""} onChange={e => setF({ ...f, task_number: e.target.value ? Number(e.target.value) : null })} />
        </div>
        <div>
          <label>المجال</label>
          <select value={f.domain_id ?? ""} onChange={e => setF({ ...f, domain_id: e.target.value || undefined })}>
            <option value="">—</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label>المستوى</label>
          <select value={f.level} onChange={e => setF({ ...f, level: e.target.value as Task["level"] })}>
            {LEVELS.map(l => <option key={l} value={l}>{TASK_LEVEL_AR[l]}</option>)}
          </select>
        </div>
        <div className="md:col-span-3">
          <label>العنوان *</label>
          <input required value={f.title ?? ""} onChange={e => setF({ ...f, title: e.target.value })} />
        </div>
        <div className="md:col-span-3">
          <label>الوصف</label>
          <textarea rows={2} value={f.description ?? ""} onChange={e => setF({ ...f, description: e.target.value })} />
        </div>
        <div>
          <label>النقاط</label>
          <input type="number" value={f.points ?? 0} onChange={e => setF({ ...f, points: Number(e.target.value) })} />
        </div>
        <div>
          <label>طريقة التحقق</label>
          <input value={f.verification_method ?? ""} onChange={e => setF({ ...f, verification_method: e.target.value })} />
        </div>
        <div>
          <label>المدة المقترحة</label>
          <input value={f.suggested_duration ?? ""} onChange={e => setF({ ...f, suggested_duration: e.target.value })} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.active ?? true} onChange={e => setF({ ...f, active: e.target.checked })} />
          <span>نشطة</span>
        </label>
      </div>
      {err && <div className="text-red-600 text-sm mt-2">{err}</div>}
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={save} disabled={saving} className="btn-primary flex items-center gap-1">
          <Save size={14} /> {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">إلغاء</button>
      </div>
    </div>
  );
}
