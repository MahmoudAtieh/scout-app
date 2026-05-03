import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("ar-EG", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function percent(n: number, total: number): string {
  if (total === 0) return "0%";
  return Math.round((n / total) * 100) + "%";
}

export const MEETING_CATEGORIES = [
  "افتتاح وصرخة كشفية",
  "مادة دينية / قرآنية",
  "مهارة كشفية",
  "نشاط ترفيهي / لعبة",
  "مادة ثقافية / تربوية",
  "تقييم ومناقشة",
  "ختام وصرخة",
] as const;

export const ATTENDANCE_STATUS_AR: Record<string, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "معذور",
};

export const TASK_STATUS_AR: Record<string, string> = {
  not_started: "لم يبدأ",
  in_progress: "جارٍ",
  completed: "مكتمل",
  overdue: "متأخر",
};

export const TASK_LEVEL_AR: Record<string, string> = {
  basic: "أساسي",
  intermediate: "متوسط",
  advanced: "متقدم",
};

export const EXPENSE_CATEGORIES = [
  { value: "subscription", label: "اشتراكات" },
  { value: "meeting", label: "لقاءات" },
  { value: "activity", label: "أنشطة ورحلات" },
  { value: "supplies", label: "مستلزمات ومعدات" },
  { value: "other", label: "أخرى" },
];
