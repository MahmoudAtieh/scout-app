import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, ATTENDANCE_STATUS_AR } from "@/lib/utils";

const STATUS_BADGES: Record<string, string> = {
  done: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  not_done: "bg-red-100 text-red-800",
};
const STATUS_AR: Record<string, string> = {
  done: "نُفِّذ",
  partial: "جزئي",
  not_done: "لم يُنفَّذ",
};

export default async function MeetingDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: meeting }, { data: segments }, { data: attendance }] = await Promise.all([
    supabase.from("meetings").select("*, profiles(full_name)").eq("id", params.id).single(),
    supabase.from("meeting_segments").select("*, domains(name)").eq("meeting_id", params.id).order("sort_order"),
    supabase.from("attendance").select("*, members(full_name, serial_number, patrol)").eq("meeting_id", params.id),
  ]);
  if (!meeting) notFound();

  const total = attendance?.length ?? 0;
  const present = attendance?.filter(a => a.status === "present").length ?? 0;
  const absent = attendance?.filter(a => a.status === "absent").length ?? 0;
  const late = attendance?.filter(a => a.status === "late").length ?? 0;
  const excused = attendance?.filter(a => a.status === "excused").length ?? 0;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h1 className="text-2xl font-bold">لقاء #{meeting.meeting_number ?? "—"} — {formatDate(meeting.date)}</h1>
        <Link href={`/meetings/${meeting.id}/edit`} className="btn-primary">تعديل</Link>
      </div>

      <div className="card grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Info label="المكان" value={meeting.location ?? "—"} />
        <Info label="المدة" value={`${meeting.duration_minutes ?? 0} دقيقة`} />
        <Info label="القائد" value={meeting.profiles?.full_name ?? "—"} />
        <Info label="الفصيل" value={meeting.unit_name ?? "—"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="الحضور" value={`${rate}%`} />
        <Stat label="حاضر" value={present} />
        <Stat label="غائب" value={absent} />
        <Stat label="متأخر" value={late} />
        <Stat label="معذور" value={excused} />
      </div>

      <div className="card">
        <h2 className="font-bold mb-3">فقرات اللقاء</h2>
        <div className="space-y-3">
          {segments?.map(s => (
            <div key={s.id} className="border border-slate-200 rounded p-3">
              <div className="flex justify-between items-center mb-1">
                <div className="font-semibold">{s.sort_order}. {s.category}</div>
                {s.implementation_status && (
                  <span className={`badge ${STATUS_BADGES[s.implementation_status]}`}>
                    {STATUS_AR[s.implementation_status]}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-1">
                {s.subject && <div><strong>الموضوع:</strong> {s.subject}</div>}
                {s.educational_goal && <div><strong>الهدف:</strong> {s.educational_goal}</div>}
                {s.method_or_activity && <div><strong>الوسيلة:</strong> {s.method_or_activity}</div>}
                {s.duration_minutes && <div><strong>المدة:</strong> {s.duration_minutes} دقيقة</div>}
                {s.domains?.name && <div><strong>المجال:</strong> {s.domains.name}</div>}
              </div>
            </div>
          ))}
          {!segments?.length && <div className="text-slate-500 text-sm">لا توجد فقرات مسجّلة.</div>}
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold mb-3">سجل الحضور</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>م</th>
                <th>الاسم</th>
                <th>الطليعة</th>
                <th>الحالة</th>
                <th>الوصول</th>
                <th>سبب الغياب</th>
              </tr>
            </thead>
            <tbody>
              {attendance?.map(a => (
                <tr key={a.id}>
                  <td>{a.members?.serial_number ?? "—"}</td>
                  <td className="font-medium">{a.members?.full_name}</td>
                  <td>{a.members?.patrol ?? "—"}</td>
                  <td>{ATTENDANCE_STATUS_AR[a.status]}</td>
                  <td>{a.arrival_time ?? "—"}</td>
                  <td>{a.absence_reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {meeting.notes && (
        <div className="card">
          <h2 className="font-bold mb-2">ملاحظات</h2>
          <p className="whitespace-pre-wrap text-sm">{meeting.notes}</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
