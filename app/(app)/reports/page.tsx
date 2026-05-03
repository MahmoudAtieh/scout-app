import ReportsClient from "./client";

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">التقارير</h1>
      <p className="text-sm text-slate-600">
        اختر نوع التقرير ثم صدِّره كملف Excel أو PDF (يدعم العربية).
      </p>
      <ReportsClient />
    </div>
  );
}
