import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UsersClient from "./client";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "leader") {
    return (
      <div className="card">
        <h1 className="text-xl font-bold mb-2">الصلاحيات غير كافية</h1>
        <p className="text-sm text-slate-600">إدارة المستخدمين متاحة للقائد فقط.</p>
      </div>
    );
  }
  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">القادة والمشرفون</h1>
      <p className="text-sm text-slate-600">
        يُنشأ المستخدم بإنشاء حساب في Supabase (Auth) أولاً، ثم يظهر هنا لتحديد دوره.
        <br />
        <span className="text-xs">
          القائد: صلاحيات كاملة. المشرف: قراءة كل شيء + كتابة الحضور والمحاضر وحالة المهام.
        </span>
      </p>
      <UsersClient initial={profiles ?? []} />
    </div>
  );
}
