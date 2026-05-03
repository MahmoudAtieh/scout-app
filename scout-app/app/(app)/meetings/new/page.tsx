import { createClient } from "@/lib/supabase/server";
import MeetingForm from "../form";

export default async function NewMeetingPage() {
  const supabase = createClient();
  const [{ data: domains }, { data: template }, { data: members }, { data: meetings }] = await Promise.all([
    supabase.from("domains").select("id, name").eq("active", true).order("sort_order"),
    supabase.from("meeting_template").select("*").order("sort_order"),
    supabase.from("members").select("id, full_name, patrol, rank, serial_number").eq("active", true).order("serial_number"),
    supabase.from("meetings").select("meeting_number").order("meeting_number", { ascending: false }).limit(1),
  ]);

  const nextNumber = (meetings?.[0]?.meeting_number ?? 0) + 1;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">لقاء جديد</h1>
      <MeetingForm
        domains={domains ?? []}
        template={template ?? []}
        members={members ?? []}
        nextNumber={nextNumber}
      />
    </div>
  );
}
