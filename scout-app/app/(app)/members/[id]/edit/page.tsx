import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MemberForm from "../../form";

export default async function EditMemberPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: m } = await supabase.from("members").select("*").eq("id", params.id).single();
  if (!m) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">تعديل بيانات {m.full_name}</h1>
      <MemberForm initial={{
        id: m.id,
        serial_number: m.serial_number,
        full_name: m.full_name,
        patrol: m.patrol,
        rank: m.rank,
        date_of_birth: m.date_of_birth,
        join_date: m.join_date,
        notes: m.notes,
        incentives: m.incentives,
        warnings: m.warnings,
        active: m.active,
      }} />
      <p className="text-xs text-slate-500 mt-3">
        ملاحظة: الحقول المشفّرة لا تُعبّأ تلقائياً عند التعديل — أعد إدخالها فقط إذا أردت تغييرها.
      </p>
    </div>
  );
}
