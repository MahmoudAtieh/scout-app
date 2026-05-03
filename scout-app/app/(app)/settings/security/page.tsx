import SecurityClient from "./client";

export default function SecurityPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">كلمة السرّ للتشفير</h1>
      <p className="text-sm text-slate-600">
        الحقول الحساسة (هواتف الأولياء، الهويات) مشفَّرة بـ AES-256 على جهازك قبل إرسالها للخادم.
        المفتاح يُشتَقّ من كلمة سرّ تدخلها مرّةً في كل جلسة — ولا تُحفَظ أبداً على القرص.
      </p>
      <div className="card border-amber-300 bg-amber-50 text-sm text-amber-900">
        <div className="font-semibold mb-1">تنبيه هام</div>
        <ul className="list-disc pr-5 space-y-1">
          <li>احفظ كلمة السرّ في مكان آمن. نسيانها = فقدان الوصول للحقول المشفّرة.</li>
          <li>جميع القادة يجب أن يستخدموا نفس كلمة السرّ لقراءة البيانات المشفّرة.</li>
          <li>تغيير كلمة السرّ لاحقاً يتطلب إعادة تشفير البيانات القديمة (ميزة قادمة).</li>
        </ul>
      </div>
      <SecurityClient />
    </div>
  );
}
