-- قالب فقرات اللقاء القياسية الـ 7 — يُستعمل في UI كقيمة افتراضية عند إنشاء لقاء جديد
-- (لا نخزنه كجدول — نخزنه في settings/meeting-template كـ config قابل للتعديل)

create table meeting_template (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null,
  category text not null,
  default_duration_minutes int,
  default_domain_id uuid references domains(id) on delete set null
);

alter table meeting_template enable row level security;

create policy "template select auth" on meeting_template
  for select using (auth.uid() is not null);
create policy "template leader writes" on meeting_template
  for all using (auth_role() = 'leader') with check (auth_role() = 'leader');

do $$
declare
  d_iman uuid := (select id from domains where name = 'الإيماني التربوي');
  d_kashf uuid := (select id from domains where name = 'الكشفي');
  d_culture uuid := (select id from domains where name = 'الثقافي الفكري');
  d_body uuid := (select id from domains where name = 'البدني الصحي');
begin
  insert into meeting_template (sort_order, category, default_duration_minutes, default_domain_id) values
    (1, 'افتتاح وصرخة كشفية', 10, d_kashf),
    (2, 'مادة دينية / قرآنية', 15, d_iman),
    (3, 'مهارة كشفية', 30, d_kashf),
    (4, 'نشاط ترفيهي / لعبة', 15, d_body),
    (5, 'مادة ثقافية / تربوية', 20, d_culture),
    (6, 'تقييم ومناقشة', 10, null),
    (7, 'ختام وصرخة', 5, d_kashf);
end $$;
