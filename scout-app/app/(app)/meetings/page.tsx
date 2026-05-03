import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function MeetingsPage() {
  const supabase = createClient();
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, meeting_number, date, location, profiles(full_name)")
    .order("date", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">اللقاءات ({meetings?.length ?? 0})</h1>
        <Link href="/meetings/new" className="btn-primary">+ لقاء جديد</Link>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>رقم اللقاء</th>
              <th>التاريخ</th>
              <th>المكان</th>
              <th>القائد</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {meetings?.map(m => (
              <tr key={m.id}>
                <td>{m.meeting_number ?? "—"}</td>
                <td>{formatDate(m.date)}</td>
                <td>{m.location ?? "—"}</td>
                {/* @ts-expect-error nested */}
                <td>{m.profiles?.full_name ?? "—"}</td>
                <td><Link href={`/meetings/${m.id}`} className="text-brand hover:underline">عرض</Link></td>
              </tr>
            ))}
            {!meetings?.length && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-6">لا توجد لقاءات بعد</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
