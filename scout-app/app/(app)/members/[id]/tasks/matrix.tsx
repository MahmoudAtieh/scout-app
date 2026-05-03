"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TASK_LEVEL_AR, TASK_STATUS_AR } from "@/lib/utils";

type Task = { id: string; task_number: number | null; domain_id: string | null; level: string; title: string; points: number };
type MT = { id: string; task_id: string; status: string; notes: string | null };
type Domain = { id: string; name: string };

const STATUSES = ["not_started", "in_progress", "completed", "overdue"];
const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
};

export default function TasksMatrix({
  memberId, tasks, memberTasks, domains,
}: { memberId: string; tasks: Task[]; memberTasks: MT[]; domains: Domain[] }) {
  const [state, setState] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const t of tasks) m[t.id] = memberTasks.find(mt => mt.task_id === t.id)?.status ?? "not_started";
    return m;
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState("");

  async function change(taskId: string, status: string) {
    setSaving(taskId);
    setState({ ...state, [taskId]: status });
    const supabase = createClient();
    const existing = memberTasks.find(mt => mt.task_id === taskId);
    const payload: Record<string, unknown> = {
      member_id: memberId, task_id: taskId, status,
      completed_at: status === "completed" ? new Date().toISOString().slice(0, 10) : null,
    };
    if (existing) {
      await supabase.from("member_tasks").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("member_tasks").insert(payload);
    }
    setSaving(null);
  }

  const filtered = domainFilter ? tasks.filter(t => t.domain_id === domainFilter) : tasks;
  const domainName = (id: string | null) => domains.find(d => d.id === id)?.name ?? "—";

  const completed = Object.values(state).filter(s => s === "completed").length;
  const totalPoints = tasks.reduce((s, t) =>
    state[t.id] === "completed" ? s + (t.points || 0) : s, 0);

  return (
    <>
      <div className="flex flex-wrap gap-3 items-end card">
        <div>
          <label>المجال</label>
          <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
            <option value="">كل المجالات</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="text-sm text-slate-600 ml-auto">
          مكتمل: <strong>{completed}</strong> / {tasks.length} · النقاط: <strong>{totalPoints}</strong>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>#</th>
              <th>المجال</th>
              <th>المستوى</th>
              <th>المهمة</th>
              <th>النقاط</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td>{t.task_number ?? "—"}</td>
                <td>{domainName(t.domain_id)}</td>
                <td>{TASK_LEVEL_AR[t.level]}</td>
                <td className="font-medium">{t.title}</td>
                <td>{t.points}</td>
                <td>
                  <select
                    value={state[t.id]}
                    onChange={e => change(t.id, e.target.value)}
                    disabled={saving === t.id}
                    className={`${STATUS_COLORS[state[t.id]]} border-none py-1 px-2 rounded`}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{TASK_STATUS_AR[s]}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-4">لا توجد مهام</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
