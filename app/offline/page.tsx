export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md text-center space-y-3">
        <h1 className="text-xl font-bold">أنت غير متصل بالإنترنت</h1>
        <p className="text-sm text-slate-600">
          لا بأس — يمكنك المتابعة في تسجيل الحضور ومحاضر اللقاءات والمصاريف محلياً.
          ستُزامَن بياناتك تلقائياً عند عودة الاتصال.
        </p>
        <a href="/dashboard" className="btn-primary inline-block">العودة للوحة</a>
      </div>
    </div>
  );
}
