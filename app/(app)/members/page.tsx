import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import MembersTable from "./table";

export default async function MembersPage() {
  const supabase = createClient();
  const { data: members } = await supabase
    .from("members")
    .select("id, serial_number, full_name, patrol, rank, active")
    .order("serial_number", { ascending: true, nullsFirst: false });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">الكشافون ({members?.length ?? 0})</h1>
        <Link href="/members/new" className="btn-primary">+ إضافة كشاف</Link>
      </div>
      <MembersTable members={members ?? []} />
    </div>
  );
}
