import { createClient } from "@/lib/supabase/server";
import ExpensesClient from "./client";

export default async function ExpensesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("expenses")
    .select("id, date, amount, category, description, receipt_url, meeting_id, activity_id")
    .order("date", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">المصاريف</h1>
      <ExpensesClient initial={data ?? []} />
    </div>
  );
}
