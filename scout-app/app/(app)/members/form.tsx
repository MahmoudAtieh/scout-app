"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { encryptString, bytesToHex, isUnlocked } from "@/lib/crypto/aes";
import UnlockPrompt from "@/components/UnlockPrompt";

type Initial = {
  id?: string;
  serial_number?: number | null;
  full_name?: string;
  patrol?: string | null;
  rank?: string | null;
  date_of_birth?: string | null;
  join_date?: string | null;
  notes?: string | null;
  incentives?: string | null;
  warnings?: string | null;
  active?: boolean;
  guardian_name?: string;
  guardian_phone?: string;
  member_phone?: string;
  national_id?: string;
};

export default function MemberForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [needUnlock, setNeedUnlock] = useState(false);
  const [f, setF] = useState<Initial>(initial ?? { active: true });

  function upd<K extends keyof Initial>(k: K, v: Initial[K]) {
    setF({ ...f, [k]: v });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const hasSensitive = !!(f.guardian_name || f.guardian_phone || f.member_phone || f.national_id);
    if (hasSensitive && !isUnlocked()) {
      setNeedUnlock(true);
      return;
    }

    setSaving(true);
    try {
      const row: Record<string, unknown> = {
        serial_number: f.serial_number ?? null,
        full_name: f.full_name,
        patrol: f.patrol ?? null,
        rank: f.rank ?? null,
        date_of_birth: f.date_of_birth || null,
        join_date: f.join_date || null,
        notes: f.notes ?? null,
        incentives: f.incentives ?? null,
        warnings: f.warnings ?? null,
        active: f.active ?? true,
      };
      if (hasSensitive) {
        row.guardian_name_enc = bytesToHex(await encryptString(f.guardian_name));
        row.guardian_phone_enc = bytesToHex(await encryptString(f.guardian_phone));
        row.member_phone_enc = bytesToHex(await encryptString(f.member_phone));
        row.national_id_enc = bytesToHex(await encryptString(f.national_id));
      }

      const supabase = createClient();
      if (f.id) {
        const { error } = await supabase.from("members").update(row).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("members").insert(row);
        if (error) throw error;
      }
      router.push("/members");
      router.refresh();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {needUnlock && (
        <UnlockPrompt onUnlocked={() => setNeedUnlock(false)} onCancel={() => setNeedUnlock(false)} />
      )}
      <form onSubmit={submit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label>الرقم التسلسلي</label>
            <input type="number" value={f.serial_number ?? ""} onChange={e => upd("serial_number", e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label>الاسم الكامل *</label>
            <input required value={f.full_name ?? ""} onChange={e => upd("full_name", e.target.value)} />
          </div>
          <div>
            <label>الطليعة</label>
            <input value={f.patrol ?? ""} onChange={e => upd("patrol", e.target.value)} placeholder="مثال: طليعة النسور" />
          </div>
          <div>
            <label>الرتبة</label>
            <input value={f.rank ?? ""} onChange={e => upd("rank", e.target.value)} placeholder="كشاف / استكشاف / ..." />
          </div>
          <div>
            <label>تاريخ الميلاد</label>
            <input type="date" value={f.date_of_birth ?? ""} onChange={e => upd("date_of_birth", e.target.value)} />
          </div>
          <div>
            <label>تاريخ الانضمام</label>
            <input type="date" value={f.join_date ?? ""} onChange={e => upd("join_date", e.target.value)} />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm text-amber-800 bg-amber-50 p-2 rounded mb-3">
            الحقول أدناه مشفّرة AES-256 قبل الإرسال. تحتاج إدخال كلمة سر التشفير مرة واحدة لكل جلسة.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label>اسم ولي الأمر</label>
              <input value={f.guardian_name ?? ""} onChange={e => upd("guardian_name", e.target.value)} />
            </div>
            <div>
              <label>هاتف ولي الأمر</label>
              <input value={f.guardian_phone ?? ""} onChange={e => upd("guardian_phone", e.target.value)} />
            </div>
            <div>
              <label>هاتف الكشاف</label>
              <input value={f.member_phone ?? ""} onChange={e => upd("member_phone", e.target.value)} />
            </div>
            <div>
              <label>رقم الهوية</label>
              <input value={f.national_id ?? ""} onChange={e => upd("national_id", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div>
            <label>ملاحظات</label>
            <textarea rows={2} value={f.notes ?? ""} onChange={e => upd("notes", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label>الحوافز</label>
              <input value={f.incentives ?? ""} onChange={e => upd("incentives", e.target.value)} />
            </div>
            <div>
              <label>الإنذارات</label>
              <input value={f.warnings ?? ""} onChange={e => upd("warnings", e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={f.active ?? true} onChange={e => upd("active", e.target.checked)} />
            <span>نشط</span>
          </label>
        </div>

        {err && <div className="text-red-600 text-sm">{err}</div>}
        <div className="flex gap-2">
          <button className="btn-primary" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ"}</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>إلغاء</button>
        </div>
      </form>
    </>
  );
}
