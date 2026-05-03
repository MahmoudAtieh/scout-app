import { createClient } from "@/lib/supabase/server";
import TemplateClient from "./client";

export default async function MeetingTemplatePage() {
  const supabase = await createClient();
  const [{ data: rows }, { data: domains }] = await Promise.all([
    supabase.from("meeting_template").select("*").order("sort_order"),
    supabase.from("domains").select("id, name").eq("active", true).order("sort_order"),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">قالب فقرات اللقاء</h1>
      <p className="text-sm text-slate-600">
        هذه الفقرات تظهر تلقائياً عند إنشاء لقاء جديد. تغيير القالب لا يؤثر على اللقاءات السابقة.
      </p>
      <TemplateClient initial={rows ?? []} domains={domains ?? []} />
    </div>
  );
}
