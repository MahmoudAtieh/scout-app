import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MeetingForm from "../../form";

export default async function EditMeetingPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [
    { data: meeting },
    { data: segments },
    { data: attendance },
    { data: domains },
    { data: template },
    { data: members },
  ] = await Promise.all([
    supabase.from("meetings").select("*").eq("id", params.id).single(),
    supabase.from("meeting_segments").select("*").eq("meeting_id", params.id).order("sort_order"),
    supabase.from("attendance").select("*").eq("meeting_id", params.id),
    supabase.from("domains").select("id, name").eq("active", true).order("sort_order"),
    supabase.from("meeting_template").select("*").order("sort_order"),
    supabase.from("members").select("id, full_name, patrol, rank, serial_number").eq("active", true).order("serial_number"),
  ]);
  if (!meeting) notFound();

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">تعديل لقاء #{meeting.meeting_number ?? "—"}</h1>
      <MeetingForm
        domains={domains ?? []}
        template={template ?? []}
        members={members ?? []}
        nextNumber={meeting.meeting_number ?? 1}
        existing={{
          id: meeting.id,
          meeting_number: meeting.meeting_number,
          date: meeting.date,
          unit_name: meeting.unit_name,
          duration_minutes: meeting.duration_minutes,
          location: meeting.location,
          notes: meeting.notes,
          segments: (segments ?? []).map(s => ({
            sort_order: s.sort_order, category: s.category, subject: s.subject ?? "",
            educational_goal: s.educational_goal ?? "", method_or_activity: s.method_or_activity ?? "",
            duration_minutes: s.duration_minutes, implementation_status: s.implementation_status, domain_id: s.domain_id,
          })),
          attendance: (attendance ?? []).map(a => ({
            member_id: a.member_id,
            status: a.status,
            arrival_time: a.arrival_time ?? "",
            absence_reason: a.absence_reason ?? "",
          })),
        }}
      />
    </div>
  );
}
