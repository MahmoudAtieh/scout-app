import { db } from "@/lib/db/dexie";
import { createClient } from "@/lib/supabase/client";

// طابور المزامنة: كل كتابة محلية تُسجَّل هنا، ثم تُرفع عند توفر الاتصال
export async function enqueue(table: string, op: "insert" | "update" | "delete", payload: unknown) {
  await db.pending_ops.add({
    table,
    op,
    payload,
    created_at: new Date().toISOString(),
    attempts: 0,
  });
}

export async function pendingCount(): Promise<number> {
  return db.pending_ops.count();
}

export async function flushQueue(): Promise<{ ok: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine) return { ok: 0, failed: 0 };

  const supabase = createClient();
  const ops = await db.pending_ops.orderBy("created_at").toArray();
  let ok = 0, failed = 0;

  for (const op of ops) {
    try {
      if (op.op === "insert") {
        const { error } = await supabase.from(op.table).insert(op.payload as never);
        if (error) throw error;
      } else if (op.op === "update") {
        const p = op.payload as { id: string; [k: string]: unknown };
        const { id, ...rest } = p;
        const { error } = await supabase.from(op.table).update(rest as never).eq("id", id);
        if (error) throw error;
      } else if (op.op === "delete") {
        const p = op.payload as { id: string };
        const { error } = await supabase.from(op.table).delete().eq("id", p.id);
        if (error) throw error;
      }
      await db.pending_ops.delete(op.id!);
      ok++;
    } catch (err) {
      failed++;
      await db.pending_ops.update(op.id!, {
        attempts: op.attempts + 1,
        last_error: String(err),
      });
    }
  }
  return { ok, failed };
}

// مزامنة القراءة: اجلب أحدث البيانات من الخادم إلى IndexedDB
export async function pullAll() {
  if (typeof window === "undefined" || !navigator.onLine) return;
  const supabase = createClient();

  const tables: Array<keyof Omit<typeof db, "pending_ops" | "tables" | "verno" | "name" | "backendDB" | "_dbSchema" | "_options">> = [
    "domains", "tasks", "members", "meetings", "meeting_segments",
    "attendance", "activities", "expenses", "subscriptions", "member_tasks"
  ] as never;

  for (const t of tables) {
    const { data, error } = await supabase.from(t as string).select("*");
    if (!error && data) {
      // @ts-expect-error dynamic table access
      await db[t].clear();
      // @ts-expect-error dynamic table access
      await db[t].bulkPut(data);
    }
  }
}

export function setupAutoSync() {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    void flushQueue().then(() => void pullAll());
  });
}
