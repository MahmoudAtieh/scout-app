import { createClient } from "@/lib/supabase/server";
import TasksLibrary from "./library";

export default async function TasksPage() {
  const supabase = createClient();
  const [{ data: tasks }, { data: domains }] = await Promise.all([
    supabase.from("tasks").select("*").order("task_number", { nullsFirst: false }),
    supabase.from("domains").select("id, name").order("sort_order"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">مكتبة المهام ({tasks?.length ?? 0})</h1>
      <p className="text-sm text-slate-600">
        تعديل المهام للقائد فقط. هذه هي المهام التي تُعرض في ملفات الكشافين لتحديث حالتها.
      </p>
      <TasksLibrary tasks={tasks ?? []} domains={domains ?? []} />
    </div>
  );
}
