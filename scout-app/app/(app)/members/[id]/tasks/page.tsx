import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import TasksMatrix from "./matrix";

export default async function MemberTasksPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: member } = await supabase.from("members").select("id, full_name").eq("id", params.id).single();
  if (!member) notFound();

  const [{ data: tasks }, { data: memberTasks }, { data: domains }] = await Promise.all([
    supabase.from("tasks").select("id, task_number, domain_id, level, title, points").eq("active", true).order("task_number"),
    supabase.from("member_tasks").select("*").eq("member_id", params.id),
    supabase.from("domains").select("id, name").order("sort_order"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">مهام {member.full_name}</h1>
      <TasksMatrix
        memberId={params.id}
        tasks={tasks ?? []}
        memberTasks={memberTasks ?? []}
        domains={domains ?? []}
      />
    </div>
  );
}
