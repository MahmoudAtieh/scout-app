"use client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";

const COLORS = ["#15803d", "#0891b2", "#ca8a04", "#dc2626", "#7c3aed", "#db2777", "#0d9488"];

export default function DashboardCharts({
  domainData, monthsData, expenseData,
}: {
  domainData: { name: string; value: number }[];
  monthsData: { name: string; value: number }[];
  expenseData: { name: string; value: number }[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="font-semibold mb-3">نشاط المجالات (فقرات + أنشطة)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={domainData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#15803d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">نسبة الحضور (آخر 6 أشهر) %</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#15803d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card lg:col-span-2">
        <h2 className="font-semibold mb-3">توزيع المصاريف</h2>
        {expenseData.length === 0 ? (
          <div className="text-slate-500 text-sm py-8 text-center">لا توجد مصاريف مسجّلة بعد</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={expenseData} dataKey="value" nameKey="name" outerRadius={100} label>
                {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
