import { createClient } from "@/lib/supabase/server";
import DashboardCharts from "./charts";

export default async function DashboardPage() {
  const supabase = createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);

  const [
    { count: activeCount },
    { data: monthMeetings },
    { data: attendanceThisMonth },
    { data: expensesAll },
    { data: budgets },
    { data: domains },
    { data: meetingSegmentsCount },
    { data: activitiesCount },
    { data: attendance6m },
    { data: expensesAll2 },
  ] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("meetings").select("id").gte("date", monthStart).lte("date", monthEnd),
    supabase.from("attendance").select("status, meeting_id, meetings!inner(date)").gte("meetings.date", monthStart).lte("meetings.date", monthEnd),
    supabase.from("expenses").select("amount, category, date"),
    supabase.from("budgets").select("planned_amount").eq("year", now.getFullYear()),
    supabase.from("domains").select("id, name, sort_order").order("sort_order"),
    supabase.from("meeting_segments").select("domain_id"),
    supabase.from("activities").select("domain_id"),
    supabase.from("attendance").select("status, meetings!inner(date)").gte("meetings.date", sixMonthsAgo),
    supabase.from("expenses").select("category, amount"),
  ]);

  const active = activeCount ?? 0;
  const meetingsThisMonth = monthMeetings?.length ?? 0;
  const attTotal = attendanceThisMonth?.length ?? 0;
  const attPresent = attendanceThisMonth?.filter(a => a.status === "present").length ?? 0;
  const attRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

  const planned = (budgets ?? []).reduce((s, b) => s + Number(b.planned_amount), 0);
  const spent = (expensesAll ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const net = planned - spent;

  // Bar chart: النشاط لكل مجال (فقرات لقاءات + أنشطة)
  const domainCounts: Record<string, number> = {};
  for (const d of domains ?? []) domainCounts[d.id] = 0;
  for (const s of meetingSegmentsCount ?? []) if (s.domain_id) domainCounts[s.domain_id] = (domainCounts[s.domain_id] ?? 0) + 1;
  for (const a of activitiesCount ?? []) if (a.domain_id) domainCounts[a.domain_id] = (domainCounts[a.domain_id] ?? 0) + 1;
  const domainData = (domains ?? []).map(d => ({ name: d.name, value: domainCounts[d.id] ?? 0 }));

  // Line: نسبة الحضور آخر 6 أشهر
  const monthMap: Record<string, { present: number; total: number }> = {};
  for (const a of attendance6m ?? []) {
    // @ts-expect-error nested
    const date = a.meetings?.date ?? "";
    if (!date) continue;
    const key = date.slice(0, 7);
    if (!monthMap[key]) monthMap[key] = { present: 0, total: 0 };
    monthMap[key].total++;
    if (a.status === "present") monthMap[key].present++;
  }
  const monthsData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ name: key, value: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0 }));

  // Pie: توزيع المصاريف
  const catMap: Record<string, number> = {};
  for (const e of expensesAll2 ?? []) catMap[e.category] = (catMap[e.category] ?? 0) + Number(e.amount);
  const expenseData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="الكشافون النشطون" value={active} />
        <Kpi title="نسبة الحضور هذا الشهر" value={`${attRate}%`} />
        <Kpi title="لقاءات الشهر" value={meetingsThisMonth} />
        <Kpi title="صافي الميزانية" value={net.toLocaleString("ar-EG")} />
      </div>

      <DashboardCharts domainData={domainData} monthsData={monthsData} expenseData={expenseData} />
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-3xl font-bold text-slate-800 mt-1">{value}</div>
    </div>
  );
}
