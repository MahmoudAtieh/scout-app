"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { pendingCount, setupAutoSync } from "@/lib/sync/queue";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, CalendarCheck, Backpack, ListChecks,
  Wallet, FileBarChart, Settings, LogOut, WifiOff, Wifi,
} from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/members", label: "الكشافون", icon: Users },
  { href: "/meetings", label: "اللقاءات", icon: CalendarCheck },
  { href: "/activities", label: "الأنشطة والرحلات", icon: Backpack },
  { href: "/tasks", label: "مكتبة المهام", icon: ListChecks },
  { href: "/finance", label: "المالية", icon: Wallet },
  { href: "/reports", label: "التقارير", icon: FileBarChart },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export default function Nav({
  userName, role, children,
}: {
  userName: string;
  role: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    setupAutoSync();
    const interval = setInterval(() => {
      pendingCount().then(setPending).catch(() => {});
    }, 3000);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
      clearInterval(interval);
    };
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 h-14">
          <button className="md:hidden text-slate-700 text-xl" onClick={() => setOpen(!open)}>☰</button>
          <div className="font-bold text-brand">وحدة الفتيان — الكشافة</div>
          <div className="flex items-center gap-3 text-sm">
            <span className={cn("hidden sm:flex items-center gap-1", online ? "text-green-700" : "text-red-700")}>
              {online ? <Wifi size={16} /> : <WifiOff size={16} />}
              {online ? "متصل" : "دون اتصال"}
              {pending > 0 && <span className="badge bg-amber-100 text-amber-800 mr-1">{pending} قيد المزامنة</span>}
            </span>
            <span className="hidden md:inline text-slate-600">
              {userName} ({role === "leader" ? "قائد" : "مشرف"})
            </span>
            <button onClick={logout} className="text-slate-600 hover:text-red-600" title="خروج">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className={cn(
          "bg-white border-l border-slate-200 w-60 min-h-[calc(100vh-3.5rem)] md:sticky md:top-14",
          open ? "block absolute md:relative z-20 shadow-lg md:shadow-none" : "hidden md:block"
        )}>
          <nav className="p-3 space-y-1">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
                    active ? "bg-brand text-white" : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </>
  );
}
