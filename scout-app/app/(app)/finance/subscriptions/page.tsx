import { createClient } from "@/lib/supabase/server";
import SubsMatrix from "./matrix";

export default async function SubscriptionsPage() {
  const supabase = createClient();
  const year = new Date().getFullYear();
  const [{ data: members }, { data: subs }] = await Promise.all([
    supabase.from("members").select("id, full_name, serial_number, patrol").eq("active", true).order("serial_number"),
    supabase.from("subscriptions").select("*").eq("year", year),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الاشتراكات الشهرية — {year}</h1>
      <SubsMatrix year={year} members={members ?? []} subscriptions={subs ?? []} />
    </div>
  );
}
