import { createClient } from "@/lib/supabase/server";
import BudgetsClient from "./client";

export default async function BudgetsPage() {
  const supabase = createClient();
  const year = new Date().getFullYear();
  const { data } = await supabase.from("budgets").select("*").eq("year", year).order("category");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الميزانية المخطّطة — {year}</h1>
      <BudgetsClient year={year} initial={data ?? []} />
    </div>
  );
}
