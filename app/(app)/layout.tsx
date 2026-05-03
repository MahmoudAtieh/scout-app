import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // مستخدم موجود في auth لكن بلا ملف — لم يكتمل الإعداد
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h1 className="text-xl font-bold mb-4">لم يُنشَأ ملفك الشخصي بعد</h1>
        <p className="text-slate-600 mb-4">تواصل مع القائد لإضافتك إلى النظام.</p>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn-secondary">تسجيل خروج</button>
        </form>
      </div>
    );
  }

  return (
    <Nav userName={profile.full_name} role={profile.role}>
      {children}
    </Nav>
  );
}
