import BackupClient from "./client";

export default function BackupPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">النسخ الاحتياطي</h1>
      <p className="text-sm text-slate-600">
        تصدير نسخة كاملة من بيانات التطبيق بصيغة JSON للأرشفة أو النقل.
        <br />
        <span className="text-xs">
          ملاحظة: الحقول المشفّرة تُصدَّر كما هي مشفَّرة (لن تُقرأ إلا بكلمة السرّ الأصلية).
        </span>
      </p>
      <BackupClient />
    </div>
  );
}
