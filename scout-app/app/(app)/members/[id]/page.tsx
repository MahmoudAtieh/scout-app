import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, ATTENDANCE_STATUS_AR, TASK_STATUS_AR } from "@/lib/utils";
import MemberSensitive from "./sensitive";

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: m } = await supabase.from("members").select("*").eq("id", params.id).single();
  if (!m) notFound();

  const { data: att } = await supabase
    .from("attendance")
    .select("status, meetings!inner(date, meeting_number)")
    .eq("member_id", params.id)
    .order("meetings(date)", { ascending: false })
    .limit(20);

  const { data: memberTasks } = await supabase
    .from("member_tasks")
    .select("status, task_id, tasks(title, points, domains(name))")
    .eq("member_id", params.id);

  const total = att?.length ?? 0;
  const present = att?.filter(a => a.status === "present").length ?? 0;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  const completed = memberTasks?.filter(t => t.status === "completed").length ?? 0;
  const inProgress = memberTasks?.filter(t => t.status === "in_progress").length ?? 0;
  const taskTotal = memberTasks?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-2xl font-bold">{m.full_name}</h1>
        <div className="flex gap-2">
          <Link href={`/members/${m.id}/tasks`} className="btn-secondary">مهام العضو</Link>
          <Link href={`/members/${m.id}/edit`} className="btn-primary">تعديل</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-2">البيانات الأساسية</h2>
          <dl className="text-sm space-y-1">
            <Row label="الرقم التسلسلي" value={m.serial_number ?? "—"} />
            <Row label="الطليعة" value={m.patrol ?? "—"} />
            <Row label="الرتبة" value={m.rank ?? "—"} />
            <Row label="تاريخ الميلاد" value={formatDate(m.date_of_birth)} />
            <Row label="تاريخ الانضمام" value={formatDate(m.join_date)} />
            <Row label="الحالة" value={m.active ? "نشط" : "غير نشط"} />
          </dl>
        </div>

        <div className="card md:col-span-2">
          <h2 className="font-semibold mb-2">البيانات الحساسة (مشفّرة)</h2>
          <MemberSensitive
            guardian_name_enc={m.guardian_name_enc}
            guardian_phone_enc={m.guardian_phone_enc}
            member_phone_enc={m.member_phone_enc}
            national_id_enc={m.national_id_enc}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="نسبة الحضور" value={`${rate}% (${present}/${total})`} />
        <Stat title="المهام المكتملة" value={`${completed} / ${taskTotal}`} />
        <Stat title="المهام الجارية" value={inProgress} />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">آخر 20 لقاء</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>التاريخ</th><th>رقم اللقاء</th><th>الحالة</th></tr>
            </thead>
            <tbody>
              {att?.map((a, i) => (
                // @ts-expect-error nested
                <tr key={i}><td>{formatDate(a.meetings.date)}</td><td>{a.meetings.meeting_number ?? "—"}</td><td>{ATTENDANCE_STATUS_AR[a.status]}</td></tr>
              ))}
              {!att?.length && <tr><td colSpan={3} className="text-center text-slate-500 py-4">لا يوجد سجل حضور</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {(m.notes || m.incentives || m.warnings) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {m.notes && <div className="card"><h3 className="font-semibold mb-1">ملاحظات</h3><p className="text-sm">{m.notes}</p></div>}
          {m.incentives && <div className="card"><h3 className="font-semibold mb-1 text-green-700">الحوافز</h3><p className="text-sm">{m.incentives}</p></div>}
          {m.warnings && <div className="card"><h3 className="font-semibold mb-1 text-red-700">الإنذارات</h3><p className="text-sm">{m.warnings}</p></div>}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-2 border-b border-slate-100 py-1">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
