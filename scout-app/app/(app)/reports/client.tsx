"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveAsExcel } from "@/lib/export/excel";
import { saveAsPDF } from "@/lib/export/pdf";
import { ATTENDANCE_STATUS_AR, TASK_STATUS_AR, formatDate } from "@/lib/utils";
import { FileSpreadsheet, FileText } from "lucide-react";

type Kind = "attendance" | "tasks" | "finance";

export default function ReportsClient() {
  const [kind, setKind] = useState<Kind>("attendance");
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function build() {
    setBusy(true); setErr("");
    try {
      const supabase = createClient();
      if (kind === "attendance") {
        const [{ data: members }, { data: meetings }, { data: att }] = await Promise.all([
          supabase.from("members").select("id, full_name, serial_number, patrol").eq("active", true).order("serial_number"),
          supabase.from("meetings").select("id, meeting_number, date").gte("date", from).lte("date", to).order("date"),
          supabase.from("attendance").select("member_id, meeting_id, status").gte("meeting_id", "00000000-0000-0000-0000-000000000000"),
        ]);

        const mMap = new Map<string, Record<string, string>>();
        for (const a of att ?? []) {
          if (!mMap.has(a.member_id)) mMap.set(a.member_id, {});
          mMap.get(a.member_id)![a.meeting_id] = a.status;
        }

        const mList = meetings ?? [];
        const headers = ["م", "الاسم", "الطليعة", ...mList.map(m => `#${m.meeting_number ?? ""} ${formatDate(m.date)}`), "حضور", "غياب", "متأخر", "معذور", "النسبة %"];
        const rows = (members ?? []).map(mem => {
          const row: (string | number | null)[] = [mem.serial_number ?? "", mem.full_name, mem.patrol ?? ""];
          let p = 0, ab = 0, la = 0, ex = 0;
          for (const mt of mList) {
            const s = mMap.get(mem.id)?.[mt.id];
            if (s === "present") { row.push("حـ"); p++; }
            else if (s === "absent") { row.push("غ"); ab++; }
            else if (s === "late") { row.push("م"); la++; }
            else if (s === "excused") { row.push("ع"); ex++; }
            else row.push("");
          }
          const total = p + ab + la + ex;
          const rate = total > 0 ? Math.round((p / total) * 100) : 0;
          row.push(p, ab, la, ex, rate);
          return row;
        });

        return { title: "تقرير الحضور", sheets: [{ name: "الحضور", headers, rows }] };
      }

      if (kind === "tasks") {
        const [{ data: members }, { data: tasks }, { data: memberTasks }, { data: domains }] = await Promise.all([
          supabase.from("members").select("id, full_name, serial_number").eq("active", true).order("serial_number"),
          supabase.from("tasks").select("id, title, domain_id, level, points").eq("active", true),
          supabase.from("member_tasks").select("member_id, task_id, status"),
          supabase.from("domains").select("id, name"),
        ]);
        const dName = (id: string | null) => domains?.find(d => d.id === id)?.name ?? "—";
        const headers = ["م", "الاسم", "مكتمل", "جارٍ", "متأخر", "لم يبدأ", "النقاط", "النسبة %"];
        const rows = (members ?? []).map(m => {
          const mtForMember = (memberTasks ?? []).filter(mt => mt.member_id === m.id);
          let done = 0, inProg = 0, over = 0, notStarted = 0, points = 0;
          for (const t of tasks ?? []) {
            const st = mtForMember.find(mt => mt.task_id === t.id)?.status ?? "not_started";
            if (st === "completed") { done++; points += t.points; }
            else if (st === "in_progress") inProg++;
            else if (st === "overdue") over++;
            else notStarted++;
          }
          const total = (tasks?.length ?? 0);
          const rate = total > 0 ? Math.round((done / total) * 100) : 0;
          return [m.serial_number ?? "", m.full_name, done, inProg, over, notStarted, points, rate];
        });
        // تفصيل حسب المجال
        const domainHeaders = ["الاسم", ...(domains ?? []).map(d => d.name)];
        const byDomain = (members ?? []).map(m => {
          const row: (string | number | null)[] = [m.full_name];
          for (const d of domains ?? []) {
            const inDomain = (tasks ?? []).filter(t => t.domain_id === d.id).map(t => t.id);
            const done = (memberTasks ?? []).filter(mt => mt.member_id === m.id && inDomain.includes(mt.task_id) && mt.status === "completed").length;
            row.push(`${done} / ${inDomain.length}`);
          }
          return row;
        });
        return {
          title: "تقرير المهام",
          sheets: [
            { name: "ملخص", headers, rows },
            { name: "بالمجال", headers: domainHeaders, rows: byDomain },
          ],
        };
      }

      // finance
      const [{ data: exps }, { data: budgets }, { data: subs }] = await Promise.all([
        supabase.from("expenses").select("date, category, amount, description").gte("date", from).lte("date", to).order("date"),
        supabase.from("budgets").select("*").eq("year", new Date(from).getFullYear()),
        supabase.from("subscriptions").select("amount, paid").eq("year", new Date(from).getFullYear()),
      ]);
      const paid = (subs ?? []).filter(s => s.paid).reduce((t, s) => t + Number(s.amount), 0);
      const unpaid = (subs ?? []).filter(s => !s.paid).reduce((t, s) => t + Number(s.amount), 0);
      return {
        title: "التقرير المالي",
        sheets: [
          { name: "المصاريف", headers: ["التاريخ", "الفئة", "الوصف", "المبلغ"], rows: (exps ?? []).map(e => [formatDate(e.date), e.category, e.description ?? "—", Number(e.amount)]) },
          { name: "الميزانية", headers: ["الفئة", "المخطّط", "ملاحظات"], rows: (budgets ?? []).map(b => [b.category, Number(b.planned_amount), b.notes ?? "—"]) },
          { name: "الاشتراكات", headers: ["الحالة", "المبلغ"], rows: [["مدفوع", paid], ["غير مدفوع", unpaid]] },
        ],
      };
    } catch (e) {
      setErr(String(e));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function exportExcel() {
    const r = await build();
    if (!r) return;
    await saveAsExcel(`${r.title}-${Date.now()}.xlsx`, r.sheets);
  }
  async function exportPDF() {
    const r = await build();
    if (!r) return;
    await saveAsPDF(`${r.title}-${Date.now()}.pdf`, r.title, r.sheets.map(s => ({ heading: s.name, headers: s.headers, rows: s.rows as (string | number)[][] })));
  }

  return (
    <div className="card space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label>نوع التقرير</label>
          <select value={kind} onChange={e => setKind(e.target.value as Kind)}>
            <option value="attendance">تقرير الحضور</option>
            <option value="tasks">تقرير المهام</option>
            <option value="finance">التقرير المالي</option>
          </select>
        </div>
        <div>
          <label>من تاريخ</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label>إلى تاريخ</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="flex gap-2">
        <button onClick={exportExcel} disabled={busy} className="btn-primary flex items-center gap-1">
          <FileSpreadsheet size={16} /> تصدير Excel
        </button>
        <button onClick={exportPDF} disabled={busy} className="btn-secondary flex items-center gap-1">
          <FileText size={16} /> تصدير PDF
        </button>
      </div>
      <p className="text-xs text-slate-500">
        تصدير PDF يُحمِّل خط العربية Amiri من الشبكة في أول مرة (~200KB). بعدها يعمل دون اتصال.
      </p>
    </div>
  );
}
