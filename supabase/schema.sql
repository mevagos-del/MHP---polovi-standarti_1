create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
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
  updated_at timestamptz not null default now()
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
  negotiations_count integer not null check (negotiations_count >= 0),
  admin_days_count integer not null check (admin_days_count >= 0),
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
  negotiations_count integer not null check (negotiations_count >= 0),
  admin_days_count integer not null check (admin_days_count >= 0),
  comment text not null default '',
  version integer not null check (version >= 1),
  action_type text not null check (action_type in ('Створено', 'Оновлено')),
  is_current boolean not null default true,
  changed_at timestamptz not null default now()
);

create index if not exists idx_employees_channel_id on employees(channel_id);
create index if not exists idx_current_plans_lookup on current_plans(channel_id, employee_id, period);
create index if not exists idx_change_log_lookup on change_log(channel_id, employee_id, period);
