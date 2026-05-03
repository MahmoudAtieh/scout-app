"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr("بيانات الدخول غير صحيحة");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-brand">وحدة الفتيان</div>
          <div className="text-sm text-slate-500 mt-1">نظام الإدارة الكشفية</div>
        </div>
        <div>
          <label>البريد الإلكتروني</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label>كلمة السر</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}
