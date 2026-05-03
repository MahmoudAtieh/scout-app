import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import ActivityAttendanceToggle from "./attend";

export default async function ActivityDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: a }, { data: parts }] = await Promise.all([
    supabase.from("activities").select("*, domains(name)").eq("id", params.id).single(),
    supabase.from("activity_participants").select("*, members(id, full_name, serial_number, patrol)")
      .eq("activity_id", params.id),
  ]);
  if (!a) notFound();

  const attended = parts?.filter(p => p.attended).length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{a.title}</h1>

      <div className="card grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Info label="النوع" value={a.activity_type ?? "—"} />
        <Info label="من" value={formatDate(a.start_date)} />
        <Info label="إلى" value={formatDate(a.end_date)} />
        <Info label="المكان" value={a.location ?? "—"} />
        <Info label="المجال" value={a.domains?.name ?? "—"} />
        <Info label="ميزانية مخطّطة" value={a.planned_budget ? Number(a.planned_budget).toLocaleString("ar-EG") : "—"} />
        <Info label="ميزانية فعلية" value={a.actual_budget ? Number(a.actual_budget).toLocaleString("ar-EG") : "—"} />
        <Info label="الحضور" value={`${attended} / ${parts?.length ?? 0}`} />
      </div>

      {(a.description || a.objectives) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {a.description && <div className="card"><h3 className="font-semibold mb-1">الوصف</h3><p className="text-sm whitespace-pre-wrap">{a.description}</p></div>}
          {a.objectives && <div className="card"><h3 className="font-semibold mb-1">الأهداف</h3><p className="text-sm whitespace-pre-wrap">{a.objectives}</p></div>}
        </div>
      )}

      <div className="card">
        <h2 className="font-bold mb-3">المشاركون ({parts?.length ?? 0})</h2>
        <ActivityAttendanceToggle activityId={a.id} participants={parts ?? []} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (<div><div className="text-slate-500">{label}</div><div className="font-medium">{value}</div></div>);
}
