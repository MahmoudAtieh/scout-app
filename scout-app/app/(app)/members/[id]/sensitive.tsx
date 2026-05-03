"use client";
import { useState } from "react";
import { decryptString, hexToBytes, isUnlocked } from "@/lib/crypto/aes";
import UnlockPrompt from "@/components/UnlockPrompt";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  guardian_name_enc?: string | null;
  guardian_phone_enc?: string | null;
  member_phone_enc?: string | null;
  national_id_enc?: string | null;
};

export default function MemberSensitive(props: Props) {
  const [show, setShow] = useState(false);
  const [unlockDialog, setUnlockDialog] = useState(false);
  const [decrypted, setDecrypted] = useState<Record<string, string | null>>({});

  async function reveal() {
    if (!isUnlocked()) {
      setUnlockDialog(true);
      return;
    }
    const out: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(props)) {
      out[k] = await decryptString(hexToBytes(v as string | null | undefined));
    }
    setDecrypted(out);
    setShow(true);
  }

  const hasAny = Object.values(props).some(v => v);

  if (!hasAny) {
    return <div className="text-sm text-slate-500">لا توجد بيانات حساسة مسجّلة.</div>;
  }

  return (
    <>
      {unlockDialog && (
        <UnlockPrompt
          onUnlocked={() => { setUnlockDialog(false); reveal(); }}
          onCancel={() => setUnlockDialog(false)}
        />
      )}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-500">
          {show ? "البيانات معروضة" : "البيانات مخفية"}
        </span>
        <button
          onClick={() => show ? setShow(false) : reveal()}
          className="btn-secondary flex items-center gap-1 text-sm"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
          {show ? "إخفاء" : "إظهار"}
        </button>
      </div>
      <dl className="text-sm space-y-1">
        <Field label="ولي الأمر" value={show ? decrypted.guardian_name_enc : "••••••"} has={!!props.guardian_name_enc} />
        <Field label="هاتف ولي الأمر" value={show ? decrypted.guardian_phone_enc : "••••••"} has={!!props.guardian_phone_enc} />
        <Field label="هاتف الكشاف" value={show ? decrypted.member_phone_enc : "••••••"} has={!!props.member_phone_enc} />
        <Field label="رقم الهوية" value={show ? decrypted.national_id_enc : "••••••"} has={!!props.national_id_enc} />
      </dl>
    </>
  );
}

function Field({ label, value, has }: { label: string; value: string | null | undefined; has: boolean }) {
  if (!has) return null;
  return (
    <div className="flex justify-between gap-2 border-b border-slate-100 py-1">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium" dir="ltr">{value || "—"}</span>
    </div>
  );
}
