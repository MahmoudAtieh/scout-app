import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function ActivitiesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("activities")
    .select("id, title, activity_type, start_date, end_date, location, planned_budget, actual_budget, domains(name)")
    .order("start_date", { ascending: false, nullsFirst: false });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">الأنشطة والرحلات ({data?.length ?? 0})</h1>
        <Link href="/activities/new" className="btn-primary">+ نشاط جديد</Link>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>العنوان</th>
              <th>النوع</th>
              <th>التاريخ</th>
              <th>المكان</th>
              <th>المجال</th>
              <th>الميزانية</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.map(a => (
              <tr key={a.id}>
                <td className="font-medium">{a.title}</td>
                <td>{a.activity_type ?? "—"}</td>
                <td>{formatDate(a.start_date)}{a.end_date && a.end_date !== a.start_date ? ` → ${formatDate(a.end_date)}` : ""}</td>
                <td>{a.location ?? "—"}</td>
                {/* @ts-expect-error nested */}
                <td>{a.domains?.name ?? "—"}</td>
                <td>{a.planned_budget ? Number(a.planned_budget).toLocaleString("ar-EG") : "—"}</td>
                <td><Link href={`/activities/${a.id}`} className="text-brand hover:underline">عرض</Link></td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={7} className="text-center text-slate-500 py-6">لا توجد أنشطة بعد</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
