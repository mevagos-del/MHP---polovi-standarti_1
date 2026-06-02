-- Field Standards / Польові стандарти
-- MVP schema for Supabase SQL editor.
-- RLS is intentionally not enabled in this MVP script. Before real rollout,
-- configure Supabase Auth / SSO and proper RLS policies for every table.

create extension if not exists pgcrypto;

create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  channel_id uuid not null references channels(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (full_name, channel_id)
);

create table if not exists planning_months (
  id uuid primary key default gen_random_uuid(),
  month_name text not null,
  month_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists current_plans (
  id uuid primary key default gen_random_uuid(),
  period text not null,
  channel_id uuid not null references channels(id),
  employee_id uuid not null references employees(id),
  audits_count integer not null check (audits_count >= 0),
  admin_days_count integer not null check (admin_days_count >= 0),
  negotiations_count integer not null check (negotiations_count >= 0),
  comment text not null default '',
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period, channel_id, employee_id)
);

create table if not exists change_log (
  id uuid primary key default gen_random_uuid(),
  period text not null,
  channel_id uuid not null references channels(id),
  employee_id uuid not null references employees(id),
  audits_count integer not null check (audits_count >= 0),
  admin_days_count integer not null check (admin_days_count >= 0),
  negotiations_count integer not null check (negotiations_count >= 0),
  comment text not null default '',
  version integer not null check (version >= 1),
  action_type text not null check (action_type in ('Створено', 'Оновлено')),
  is_current boolean not null default true,
  changed_at timestamptz not null default now()
);

create table if not exists actual_performance (
  id uuid primary key default gen_random_uuid(),
  period text not null,
  channel_id uuid not null references channels(id),
  employee_id uuid not null references employees(id),
  actual_audits_count integer not null check (actual_audits_count >= 0),
  actual_admin_days_count integer not null check (actual_admin_days_count >= 0),
  actual_negotiations_count integer not null check (actual_negotiations_count >= 0),
  comment text not null default '',
  source text not null default 'Excel',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period, channel_id, employee_id)
);

create index if not exists idx_employees_channel_id on employees(channel_id);
create index if not exists idx_current_plans_lookup on current_plans(period, channel_id, employee_id);
create index if not exists idx_change_log_lookup on change_log(period, channel_id, employee_id);
create index if not exists idx_actual_performance_lookup on actual_performance(period, channel_id, employee_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_channels_updated_at on channels;
create trigger set_channels_updated_at
before update on channels
for each row execute function set_updated_at();

drop trigger if exists set_employees_updated_at on employees;
create trigger set_employees_updated_at
before update on employees
for each row execute function set_updated_at();

drop trigger if exists set_planning_months_updated_at on planning_months;
create trigger set_planning_months_updated_at
before update on planning_months
for each row execute function set_updated_at();

drop trigger if exists set_current_plans_updated_at on current_plans;
create trigger set_current_plans_updated_at
before update on current_plans
for each row execute function set_updated_at();

drop trigger if exists set_actual_performance_updated_at on actual_performance;
create trigger set_actual_performance_updated_at
before update on actual_performance
for each row execute function set_updated_at();
