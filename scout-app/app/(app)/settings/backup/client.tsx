"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download } from "lucide-react";

const TABLES = [
  "profiles",
  "domains",
  "members",
  "tasks",
  "member_tasks",
  "meetings",
  "meeting_segments",
  "meeting_template",
  "attendance",
  "activities",
  "activity_participants",
  "expenses",
  "subscriptions",
  "budgets",
];

export default function BackupClient() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [err, setErr] = useState("");

  async function exportAll() {
    setBusy(true); setErr(""); setProgress("");
    try {
      const supabase = createClient();
      const dump: Record<string, unknown[]> = {};
      for (const t of TABLES) {
        setProgress(`جارٍ تصدير ${t}...`);
        const { data, error } = await supabase.from(t).select("*");
        if (error) throw new Error(`${t}: ${error.message}`);
        dump[t] = data ?? [];
      }
      const envelope = {
        exported_at: new Date().toISOString(),
        app: "scout-unit-manager",
        version: 1,
        tables: dump,
      };
      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scout-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setProgress("تم التصدير بنجاح.");
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-3">
      <button onClick={exportAll} disabled={busy} className="btn-primary flex items-center gap-1 w-fit">
        <Download size={16} /> تصدير نسخة JSON
      </button>
      {progress && <div className="text-sm text-slate-600">{progress}</div>}
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <div className="text-xs text-slate-500 border-t pt-3">
        <div className="font-semibold mb-1">الجداول المصدَّرة:</div>
        <div className="flex flex-wrap gap-1">
          {TABLES.map(t => <span key={t} className="bg-slate-100 px-2 py-0.5 rounded">{t}</span>)}
        </div>
      </div>
    </div>
  );
}
