-- ==================================================================
-- 0001_init.sql — الهيكل الأساسي لنظام إدارة الوحدة الكشفية
-- ==================================================================

create extension if not exists "pgcrypto";

-- ---------------- profiles (المستخدمون) ----------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('leader','supervisor')),
  created_at timestamptz not null default now()
);

-- ---------------- domains (المجالات) ----------------
create table domains (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  weight_percent int check (weight_percent between 0 and 100),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------- members (الكشافون) ----------------
create table members (
  id uuid primary key default gen_random_uuid(),
  serial_number int,
  full_name text not null,
  patrol text,
  rank text,
  date_of_birth date,
  join_date date,
  guardian_name_enc bytea,
  guardian_phone_enc bytea,
  member_phone_enc bytea,
  national_id_enc bytea,
  notes text,
  incentives text,
  warnings text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index members_active_idx on members(active);
create index members_patrol_idx on members(patrol);

-- ---------------- tasks (مكتبة المهام) ----------------
create table tasks (
  id uuid primary key default gen_random_uuid(),
  task_number int unique,
  domain_id uuid references domains(id) on delete set null,
  level text not null check (level in ('basic','intermediate','advanced')),
  title text not null,
  description text,
  points int default 0,
  verification_method text,
  suggested_duration text,
  active boolean not null default true
);
create index tasks_domain_idx on tasks(domain_id);

-- ---------------- member_tasks (إسناد المهام) ----------------
create table member_tasks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','overdue')),
  started_at date,
  completed_at date,
  responsible_leader_id uuid references profiles(id) on delete set null,
  notes text,
  updated_at timestamptz not null default now(),
  unique(member_id, task_id)
);
create index member_tasks_member_idx on member_tasks(member_id);
create index member_tasks_status_idx on member_tasks(status);

-- ---------------- meetings (اللقاءات) ----------------
create table meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_number int,
  date date not null,
  unit_name text,
  leader_id uuid references profiles(id) on delete set null,
  duration_minutes int,
  location text,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index meetings_date_idx on meetings(date desc);

-- ---------------- meeting_segments (فقرات اللقاء) ----------------
create table meeting_segments (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  sort_order int not null,
  category text not null,
  subject text,
  educational_goal text,
  method_or_activity text,
  duration_minutes int,
  implementation_status text check (implementation_status in ('done','partial','not_done')),
  domain_id uuid references domains(id) on delete set null
);
create index meeting_segments_meeting_idx on meeting_segments(meeting_id);

-- ---------------- attendance (الحضور) ----------------
create table attendance (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  status text not null check (status in ('present','absent','late','excused')),
  arrival_time time,
  absence_reason text,
  unique(meeting_id, member_id)
);
create index attendance_member_idx on attendance(member_id);

-- ---------------- activities (الأنشطة الخارجية) ----------------
create table activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  activity_type text,
  start_date date,
  end_date date,
  location text,
  domain_id uuid references domains(id) on delete set null,
  description text,
  objectives text,
  planned_budget numeric(12,2),
  actual_budget numeric(12,2),
  created_at timestamptz not null default now()
);

create table activity_participants (
  activity_id uuid not null references activities(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  attended boolean default false,
  contribution numeric(12,2) default 0,
  primary key (activity_id, member_id)
);

-- ---------------- expenses (المصاريف) ----------------
create table expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric(12,2) not null,
  category text not null,
  description text,
  receipt_url text,
  meeting_id uuid references meetings(id) on delete set null,
  activity_id uuid references activities(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index expenses_date_idx on expenses(date desc);
create index expenses_category_idx on expenses(category);

-- ---------------- subscriptions (الاشتراكات الشهرية) ----------------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  amount numeric(12,2) not null default 0,
  paid boolean not null default false,
  paid_date date,
  unique(member_id, year, month)
);
create index subscriptions_member_idx on subscriptions(member_id);

-- ---------------- budgets (الميزانية) ----------------
create table budgets (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  category text not null,
  planned_amount numeric(12,2) not null,
  notes text
);

-- ---------------- audit_log ----------------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);

-- ==================================================================
-- Row Level Security
-- ==================================================================
alter table profiles enable row level security;
alter table members enable row level security;
alter table domains enable row level security;
alter table tasks enable row level security;
alter table member_tasks enable row level security;
alter table meetings enable row level security;
alter table meeting_segments enable row level security;
alter table attendance enable row level security;
alter table activities enable row level security;
alter table activity_participants enable row level security;
alter table expenses enable row level security;
alter table subscriptions enable row level security;
alter table budgets enable row level security;
alter table audit_log enable row level security;

-- helper: تحقق من دور المستخدم الحالي
create or replace function auth_role() returns text
  language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

-- profiles: القائد فقط يدير المستخدمين، كل مستخدم يقرأ نفسه
create policy "profiles select own or leader" on profiles
  for select using (id = auth.uid() or auth_role() = 'leader');
create policy "profiles leader writes" on profiles
  for all using (auth_role() = 'leader') with check (auth_role() = 'leader');

-- members, domains, tasks, activities: القراءة للجميع المصادقين
-- الكتابة للقائد فقط
create policy "members select auth" on members
  for select using (auth.uid() is not null);
create policy "members leader writes" on members
  for all using (auth_role() = 'leader') with check (auth_role() = 'leader');

create policy "domains select auth" on domains
  for select using (auth.uid() is not null);
create policy "domains leader writes" on domains
  for all using (auth_role() = 'leader') with check (auth_role() = 'leader');

create policy "tasks select auth" on tasks
  for select using (auth.uid() is not null);
create policy "tasks leader writes" on tasks
  for all using (auth_role() = 'leader') with check (auth_role() = 'leader');

create policy "activities select auth" on activities
  for select using (auth.uid() is not null);
create policy "activities writes" on activities
  for all using (auth_role() in ('leader','supervisor'))
  with check (auth_role() in ('leader','supervisor'));

create policy "activity_participants select auth" on activity_participants
  for select using (auth.uid() is not null);
create policy "activity_participants writes" on activity_participants
  for all using (auth_role() in ('leader','supervisor'))
  with check (auth_role() in ('leader','supervisor'));

-- meetings + segments + attendance: قراءة + كتابة للقائد والمشرف
create policy "meetings select auth" on meetings
  for select using (auth.uid() is not null);
create policy "meetings writes" on meetings
  for all using (auth_role() in ('leader','supervisor'))
  with check (auth_role() in ('leader','supervisor'));

create policy "meeting_segments select auth" on meeting_segments
  for select using (auth.uid() is not null);
create policy "meeting_segments writes" on meeting_segments
  for all using (auth_role() in ('leader','supervisor'))
  with check (auth_role() in ('leader','supervisor'));

create policy "attendance select auth" on attendance
  for select using (auth.uid() is not null);
create policy "attendance writes" on attendance
  for all using (auth_role() in ('leader','supervisor'))
  with check (auth_role() in ('leader','supervisor'));

-- member_tasks: قراءة للجميع، كتابة للقائد والمشرف (تحديث الحالة)
create policy "member_tasks select auth" on member_tasks
  for select using (auth.uid() is not null);
create policy "member_tasks writes" on member_tasks
  for all using (auth_role() in ('leader','supervisor'))
  with check (auth_role() in ('leader','supervisor'));

-- المالية: قراءة للجميع، كتابة للقائد فقط
create policy "expenses select auth" on expenses
  for select using (auth.uid() is not null);
create policy "expenses leader writes" on expenses
  for all using (auth_role() = 'leader') with check (auth_role() = 'leader');

create policy "subscriptions select auth" on subscriptions
  for select using (auth.uid() is not null);
create policy "subscriptions leader writes" on subscriptions
  for all using (auth_role() = 'leader') with check (auth_role() = 'leader');

create policy "budgets select auth" on budgets
  for select using (auth.uid() is not null);
create policy "budgets leader writes" on budgets
  for all using (auth_role() = 'leader') with check (auth_role() = 'leader');

-- audit_log: القائد فقط يقرأ، النظام يكتب
create policy "audit_log leader reads" on audit_log
  for select using (auth_role() = 'leader');
create policy "audit_log inserts" on audit_log
  for insert with check (auth.uid() is not null);

-- ==================================================================
-- Trigger لتحديث updated_at تلقائياً
-- ==================================================================
create or replace function touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger members_touch before update on members
  for each row execute function touch_updated_at();
create trigger member_tasks_touch before update on member_tasks
  for each row execute function touch_updated_at();
