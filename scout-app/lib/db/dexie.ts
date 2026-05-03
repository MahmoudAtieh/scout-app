import Dexie, { type Table } from "dexie";

export interface Member {
  id: string;
  serial_number?: number;
  full_name: string;
  patrol?: string;
  rank?: string;
  date_of_birth?: string;
  join_date?: string;
  guardian_name_enc?: Uint8Array;
  guardian_phone_enc?: Uint8Array;
  member_phone_enc?: Uint8Array;
  national_id_enc?: Uint8Array;
  notes?: string;
  incentives?: string;
  warnings?: string;
  active: boolean;
  updated_at: string;
}

export interface Domain {
  id: string;
  name: string;
  description?: string;
  weight_percent?: number;
  sort_order: number;
  active: boolean;
}

export interface Task {
  id: string;
  task_number?: number;
  domain_id?: string;
  level: "basic" | "intermediate" | "advanced";
  title: string;
  description?: string;
  points: number;
  verification_method?: string;
  suggested_duration?: string;
  active: boolean;
}

export interface MemberTask {
  id: string;
  member_id: string;
  task_id: string;
  status: "not_started" | "in_progress" | "completed" | "overdue";
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface Meeting {
  id: string;
  meeting_number?: number;
  date: string;
  unit_name?: string;
  leader_id?: string;
  duration_minutes?: number;
  location?: string;
  notes?: string;
}

export interface MeetingSegment {
  id: string;
  meeting_id: string;
  sort_order: number;
  category: string;
  subject?: string;
  educational_goal?: string;
  method_or_activity?: string;
  duration_minutes?: number;
  implementation_status?: "done" | "partial" | "not_done";
  domain_id?: string;
}

export interface Attendance {
  id: string;
  meeting_id: string;
  member_id: string;
  status: "present" | "absent" | "late" | "excused";
  arrival_time?: string;
  absence_reason?: string;
}

export interface Activity {
  id: string;
  title: string;
  activity_type?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  domain_id?: string;
  description?: string;
  objectives?: string;
  planned_budget?: number;
  actual_budget?: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  receipt_url?: string;
  meeting_id?: string;
  activity_id?: string;
}

export interface Subscription {
  id: string;
  member_id: string;
  year: number;
  month: number;
  amount: number;
  paid: boolean;
  paid_date?: string;
}

export interface PendingOp {
  id?: number;
  table: string;
  op: "insert" | "update" | "delete";
  payload: unknown;
  created_at: string;
  attempts: number;
  last_error?: string;
}

export class ScoutDB extends Dexie {
  members!: Table<Member, string>;
  domains!: Table<Domain, string>;
  tasks!: Table<Task, string>;
  member_tasks!: Table<MemberTask, string>;
  meetings!: Table<Meeting, string>;
  meeting_segments!: Table<MeetingSegment, string>;
  attendance!: Table<Attendance, string>;
  activities!: Table<Activity, string>;
  expenses!: Table<Expense, string>;
  subscriptions!: Table<Subscription, string>;
  pending_ops!: Table<PendingOp, number>;

  constructor() {
    super("scout_db");
    this.version(1).stores({
      members: "id, patrol, active, updated_at",
      domains: "id, sort_order",
      tasks: "id, domain_id, level",
      member_tasks: "id, member_id, task_id, status",
      meetings: "id, date",
      meeting_segments: "id, meeting_id, sort_order",
      attendance: "id, meeting_id, member_id, [meeting_id+member_id]",
      activities: "id, start_date",
      expenses: "id, date, category",
      subscriptions: "id, member_id, [member_id+year+month]",
      pending_ops: "++id, table, created_at",
    });
  }
}

export const db = typeof window !== "undefined" ? new ScoutDB() : (null as unknown as ScoutDB);
