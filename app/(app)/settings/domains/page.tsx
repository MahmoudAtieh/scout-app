import { createClient } from "@/lib/supabase/server";
import DomainsClient from "./client";

export default async function DomainsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("domains").select("*").order("sort_order");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">مجالات المنهج الكشفي</h1>
      <p className="text-sm text-slate-600">
        سبعة مجالات رسمية للمنهج الكشفي. يمكنك تعديل الاسم أو الوزن أو إضافة مجال جديد.
        حذف المجال لا يحذف مهامه — يصبح فقط مخفياً.
      </p>
      <DomainsClient initial={data ?? []} />
    </div>
  );
}
