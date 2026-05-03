import Link from "next/link";
import { Layers, ListChecks, Users, Download, Lock } from "lucide-react";

const items = [
  { href: "/settings/domains", title: "مجالات المنهج الكشفي", desc: "تعديل، إضافة، أو إخفاء المجالات السبعة — التغييرات تنعكس فوراً على كل التقارير", icon: Layers },
  { href: "/settings/meeting-template", title: "قالب فقرات اللقاء", desc: "الفقرات السبع القياسية التي تُعبَّأ تلقائياً عند إنشاء لقاء جديد", icon: ListChecks },
  { href: "/settings/users", title: "القادة والمشرفون", desc: "إدارة الحسابات والصلاحيات (قائد / مشرف)", icon: Users },
  { href: "/settings/backup", title: "النسخ الاحتياطي", desc: "تصدير نسخة كاملة من البيانات بصيغة JSON للأرشفة", icon: Download },
  { href: "/settings/security", title: "كلمة السرّ للتشفير", desc: "فك قفل الحقول الحساسة (هواتف الأولياء، الهويات)", icon: Lock },
];

export default function SettingsIndex() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الإعدادات</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(({ href, title, desc, icon: Icon }) => (
          <Link key={href} href={href} className="card hover:border-brand transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-brand/10 text-brand shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <div className="font-semibold mb-1">{title}</div>
                <div className="text-sm text-slate-600">{desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
