import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { EXPENSE_CATEGORIES } from "@/lib/utils";

export default async function FinanceHome() {
  const supabase = createClient();
  const year = new Date().getFullYear();

  const [{ data: expenses }, { data: budgets }, { data: subs }] = await Promise.all([
    supabase.from("expenses").select("amount, category").gte("date", `${year}-01-01`).lte("date", `${year}-12-31`),
    supabase.from("budgets").select("*").eq("year", year),
    supabase.from("subscriptions").select("amount, paid").eq("year", year),
  ]);

  const spentByCat: Record<string, number> = {};
  let spent = 0;
  for (const e of expenses ?? []) {
    spentByCat[e.category] = (spentByCat[e.category] ?? 0) + Number(e.amount);
    spent += Number(e.amount);
  }
  const plannedByCat: Record<string, number> = {};
  let planned = 0;
  for (const b of budgets ?? []) {
    plannedByCat[b.category] = (plannedByCat[b.category] ?? 0) + Number(b.planned_amount);
    planned += Number(b.planned_amount);
  }

  const subsPaid = (subs ?? []).filter(s => s.paid).reduce((s, x) => s + Number(x.amount), 0);
  const subsUnpaid = (subs ?? []).filter(s => !s.paid).reduce((s, x) => s + Number(x.amount), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">المالية — سنة {year}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="إجمالي الميزانية" value={planned.toLocaleString("ar-EG")} />
        <Kpi label="المنصرف" value={spent.toLocaleString("ar-EG")} />
        <Kpi label="الصافي" value={(planned - spent).toLocaleString("ar-EG")} />
        <Kpi label="اشتراكات محصّلة / متبقٍ" value={`${subsPaid.toLocaleString("ar-EG")} / ${subsUnpaid.toLocaleString("ar-EG")}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/finance/expenses" className="card hover:border-brand transition-colors">
          <h2 className="font-bold">المصاريف</h2>
          <p className="text-sm text-slate-600">تسجيل وعرض المصاريف مع إرفاق الفواتير.</p>
        </Link>
        <Link href="/finance/subscriptions" className="card hover:border-brand transition-colors">
          <h2 className="font-bold">الاشتراكات الشهرية</h2>
          <p className="text-sm text-slate-600">مصفوفة أعضاء × أشهر.</p>
        </Link>
        <Link href="/finance/budgets" className="card hover:border-brand transition-colors">
          <h2 className="font-bold">الميزانية السنوية</h2>
          <p className="text-sm text-slate-600">تحديد الميزانية المخطّطة لكل فئة.</p>
        </Link>
      </div>

      <div className="card">
        <h2 className="font-bold mb-3">المنصرف مقابل المخطّط لكل فئة</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>الفئة</th><th>مخطّط</th><th>منصرف</th><th>الباقي</th><th>نسبة الإنفاق</th></tr>
            </thead>
            <tbody>
              {EXPENSE_CATEGORIES.map(c => {
                const p = plannedByCat[c.value] ?? 0;
                const s = spentByCat[c.value] ?? 0;
                const pct = p > 0 ? Math.round((s / p) * 100) : 0;
                return (
                  <tr key={c.value}>
                    <td>{c.label}</td>
                    <td>{p.toLocaleString("ar-EG")}</td>
                    <td>{s.toLocaleString("ar-EG")}</td>
                    <td>{(p - s).toLocaleString("ar-EG")}</td>
                    <td>
                      <div className="bg-slate-100 rounded h-2 w-32 overflow-hidden">
                        <div className={pct > 100 ? "bg-red-500 h-full" : "bg-brand h-full"} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <span className="text-xs">{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
