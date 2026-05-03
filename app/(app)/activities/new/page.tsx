import { createClient } from "@/lib/supabase/server";
import ActivityForm from "../form";

export default async function NewActivityPage() {
  const supabase = createClient();
  const [{ data: domains }, { data: members }] = await Promise.all([
    supabase.from("domains").select("id, name").eq("active", true).order("sort_order"),
    supabase.from("members").select("id, full_name, serial_number, patrol").eq("active", true).order("serial_number"),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">نشاط / رحلة جديدة</h1>
      <ActivityForm domains={domains ?? []} members={members ?? []} />
    </div>
  );
}
