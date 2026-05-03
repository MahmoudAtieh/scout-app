"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = { id: string; full_name: string; serial_number: number | null; patrol: string | null };
type Sub = { id: string; member_id: string; year: number; month: number; amount: number; paid: boolean; paid_date: string | null };

const MONTHS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function SubsMatrix({
  year, members, subscriptions,
}: { year: number; members: Member[]; subscriptions: Sub[] }) {
  const [subs, setSubs] = useState<Sub[]>(subscriptions);
  const [defaultAmount, setDefaultAmount] = useState(0);

  function findSub(member_id: string, month: number) {
    return subs.find(s => s.member_id === member_id && s.month === month);
  }

  async function toggle(member_id: string, month: number) {
    const existing = findSub(member_id, month);
    const supabase = createClient();
    if (existing) {
      const paid = !existing.paid;
      const { data, error } = await supabase
        .from("subscriptions")
        .update({ paid, paid_date: paid ? new Date().toISOString().slice(0, 10) : null })
        .eq("id", existing.id)
        .select("*").single();
      if (!error && data) {
        setSubs(subs.map(s => s.id === existing.id ? (data as Sub) : s));
      }
    } else {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert({ member_id, year, month, amount: defaultAmount, paid: true, paid_date: new Date().toISOString().slice(0, 10) })
        .select("*").single();
      if (!error && data) setSubs([...subs, data as Sub]);
    }
  }

  const totalPaidByMonth = MONTHS.map((_, i) => {
    const m = i + 1;
    return subs.filter(s => s.month === m && s.paid).reduce((t, s) => t + Number(s.amount), 0);
  });

  return (
    <>
      <div className="card flex gap-3 items-end">
        <div>
          <label>قيمة الاشتراك الشهري الافتراضية</label>
          <input type="number" step="0.01" value={defaultAmount} onChange={e => setDefaultAmount(Number(e.target.value))} />
        </div>
        <div className="text-xs text-slate-500">
          اضغط مربع الشهر لتسجيل/إلغاء الدفع
        </div>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>م</th>
              <th>الاسم</th>
              {MONTHS.map(m => <th key={m} className="text-center">{m}</th>)}
              <th>المدفوع</th>
            </tr>
          </thead>
          <tbody>
            {members.map(mem => {
              let paidTotal = 0;
              return (
                <tr key={mem.id}>
                  <td>{mem.serial_number ?? "—"}</td>
                  <td className="font-medium whitespace-nowrap">{mem.full_name}</td>
                  {MONTHS.map((_, i) => {
                    const s = findSub(mem.id, i + 1);
                    if (s?.paid) paidTotal += Number(s.amount);
                    return (
                      <td key={i} className="text-center">
                        <button
                          onClick={() => toggle(mem.id, i + 1)}
                          className={`w-7 h-7 rounded text-xs ${s?.paid ? "bg-green-500 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
                          title={s?.paid ? `${s.amount} ${s.paid_date}` : "غير مدفوع"}
                        >
                          {s?.paid ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                  <td className="font-semibold">{paidTotal.toLocaleString("ar-EG")}</td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={2}>إجمالي الشهر</td>
              {totalPaidByMonth.map((t, i) => <td key={i} className="text-center text-xs">{t.toLocaleString("ar-EG")}</td>)}
              <td>{totalPaidByMonth.reduce((a, b) => a + b, 0).toLocaleString("ar-EG")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
