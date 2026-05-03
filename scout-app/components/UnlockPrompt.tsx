"use client";
import { useState } from "react";
import { unlock } from "@/lib/crypto/aes";

export default function UnlockPrompt({
  onUnlocked, onCancel,
}: { onUnlocked: () => void; onCancel: () => void }) {
  const [pwd, setPwd] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pwd) return;
    unlock(pwd);
    onUnlocked();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm space-y-4">
        <h2 className="font-bold text-lg">كلمة سر التشفير</h2>
        <p className="text-sm text-slate-600">
          هذه الكلمة تفك تشفير الحقول الحساسة (هواتف، هوية). لا تُحفظ على الخادم — تبقى في جلستك فقط.
          أول مرة: اختر كلمة قوية وسجّلها في مكان آمن — بدونها لا يمكن استرداد البيانات المشفّرة.
        </p>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} autoFocus placeholder="أدخل كلمة السر" />
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onCancel}>إلغاء</button>
          <button className="btn-primary">فتح</button>
        </div>
      </form>
    </div>
  );
}
