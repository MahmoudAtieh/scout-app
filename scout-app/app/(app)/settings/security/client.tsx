"use client";
import { useEffect, useState } from "react";
import { isUnlocked, unlock, lock } from "@/lib/crypto/aes";
import { Lock, Unlock } from "lucide-react";

export default function SecurityClient() {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { setOpen(isUnlocked()); }, []);

  function doUnlock() {
    setErr("");
    if (pw.length < 8) { setErr("كلمة السر يجب أن تكون 8 أحرف على الأقل"); return; }
    if (pw !== pw2) { setErr("كلمتا السر غير متطابقتين"); return; }
    unlock(pw);
    setOpen(true);
    setPw(""); setPw2("");
  }

  function doLock() {
    lock();
    setOpen(false);
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        {open
          ? <><Unlock size={18} className="text-brand" /> <span className="font-semibold">الحقول المشفّرة مفتوحة لهذه الجلسة</span></>
          : <><Lock size={18} className="text-slate-600" /> <span className="font-semibold">مقفل — أدخل كلمة السر لفك القفل</span></>}
      </div>

      {open ? (
        <button onClick={doLock} className="btn-secondary w-fit">إقفال وإزالة المفتاح من الذاكرة</button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label>كلمة السر</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label>تأكيد كلمة السر</label>
            <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <button onClick={doUnlock} className="btn-primary">فتح</button>
          </div>
          {err && <div className="md:col-span-3 text-red-600 text-sm">{err}</div>}
        </div>
      )}
    </div>
  );
}
