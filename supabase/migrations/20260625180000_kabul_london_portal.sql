create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('owner', 'admin', 'manager', 'surveyor', 'office_agent');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

create table if not exists public.surveyors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  tidycal_link text,
  service_area text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  property_address text not null,
  postcode text not null,
  service_type text not null,
  source text,
  current_status text not null default 'New' check (
    current_status in (
      'New',
      'First attempt',
      'Second attempt',
      'Third attempt',
      'SMS sent',
      'Appointment booked',
      'Completed',
      'Refused',
      'No Show',
      'No answer',
      'No access',
      'Wrong number',
      'Cancelled'
    )
  ),
  assigned_surveyor_id uuid references public.surveyors(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  surveyor_id uuid references public.surveyors(id) on delete set null,
  recipient_phone text not null,
  message_body text not null,
  yay_message_id text,
  delivery_status text,
  sent_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  surveyor_id uuid references public.surveyors(id) on delete set null,
  tidycal_booking_id text unique,
  booking_time timestamptz,
  booking_status text not null default 'pending',
  customer_name text,
  customer_email text,
  customer_phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists leads_assigned_surveyor_id_idx on public.leads(assigned_surveyor_id);
create index if not exists leads_current_status_idx on public.leads(current_status);
create index if not exists leads_postcode_idx on public.leads(postcode);
create index if not exists sms_messages_lead_id_idx on public.sms_messages(lead_id);
create index if not exists bookings_tidycal_booking_id_idx on public.bookings(tidycal_booking_id);
create index if not exists notes_lead_id_idx on public.notes(lead_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create or replace function public.current_app_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.user_roles where user_id = auth.uid()
$$;

create or replace function public.has_any_role(roles public.app_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_app_role() = any(roles), false)
$$;

create or replace function public.current_surveyor_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.surveyors where user_id = auth.uid()
$$;

create or replace function public.lead_belongs_to_current_surveyor(lead_row public.leads)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select lead_row.assigned_surveyor_id = public.current_surveyor_id()
$$;

alter table public.user_roles enable row level security;
alter table public.surveyors enable row level security;
alter table public.leads enable row level security;
alter table public.lead_status_history enable row level security;
alter table public.sms_messages enable row level security;
alter table public.bookings enable row level security;
alter table public.notes enable row level security;

drop policy if exists "users can read own role" on public.user_roles;
create policy "users can read own role" on public.user_roles
for select using (user_id = auth.uid() or public.has_any_role(array['owner','admin']::public.app_role[]));

drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles" on public.user_roles
for all using (public.has_any_role(array['owner','admin']::public.app_role[]))
with check (public.has_any_role(array['owner','admin']::public.app_role[]));

drop policy if exists "surveyors visible by role" on public.surveyors;
create policy "surveyors visible by role" on public.surveyors
for select using (
  public.has_any_role(array['owner','admin','manager','office_agent']::public.app_role[])
  or user_id = auth.uid()
);

drop policy if exists "admins and managers manage surveyors" on public.surveyors;
create policy "admins and managers manage surveyors" on public.surveyors
for all using (public.has_any_role(array['owner','admin','manager']::public.app_role[]))
with check (public.has_any_role(array['owner','admin','manager']::public.app_role[]));

drop policy if exists "leads visible by assignment or role" on public.leads;
create policy "leads visible by assignment or role" on public.leads
for select using (
  public.has_any_role(array['owner','admin','manager','office_agent']::public.app_role[])
  or assigned_surveyor_id = public.current_surveyor_id()
);

drop policy if exists "leads update by assignment or role" on public.leads;
create policy "leads update by assignment or role" on public.leads
for update using (
  public.has_any_role(array['owner','admin','manager','office_agent']::public.app_role[])
  or assigned_surveyor_id = public.current_surveyor_id()
)
with check (
  public.has_any_role(array['owner','admin','manager','office_agent']::public.app_role[])
  or assigned_surveyor_id = public.current_surveyor_id()
);

drop policy if exists "admins and managers insert leads" on public.leads;
create policy "admins and managers insert leads" on public.leads
for insert with check (public.has_any_role(array['owner','admin','manager']::public.app_role[]));

drop policy if exists "admins delete leads" on public.leads;
create policy "admins delete leads" on public.leads
for delete using (public.has_any_role(array['owner','admin']::public.app_role[]));

drop policy if exists "lead activity visible by lead access" on public.lead_status_history;
create policy "lead activity visible by lead access" on public.lead_status_history
for select using (exists (select 1 from public.leads where leads.id = lead_status_history.lead_id));

drop policy if exists "lead status history insert by role" on public.lead_status_history;
create policy "lead status history insert by role" on public.lead_status_history
for insert with check (public.has_any_role(array['owner','admin','manager','surveyor','office_agent']::public.app_role[]));

drop policy if exists "sms visible by lead access" on public.sms_messages;
create policy "sms visible by lead access" on public.sms_messages
for select using (exists (select 1 from public.leads where leads.id = sms_messages.lead_id));

drop policy if exists "sms insert by allowed roles" on public.sms_messages;
create policy "sms insert by allowed roles" on public.sms_messages
for insert with check (public.has_any_role(array['owner','admin','manager','surveyor','office_agent']::public.app_role[]));

drop policy if exists "bookings visible by lead access" on public.bookings;
create policy "bookings visible by lead access" on public.bookings
for select using (exists (select 1 from public.leads where leads.id = bookings.lead_id));

drop policy if exists "booking sync managed by managers" on public.bookings;
create policy "booking sync managed by managers" on public.bookings
for all using (public.has_any_role(array['owner','admin','manager']::public.app_role[]))
with check (public.has_any_role(array['owner','admin','manager']::public.app_role[]));

drop policy if exists "notes visible by lead access" on public.notes;
create policy "notes visible by lead access" on public.notes
for select using (exists (select 1 from public.leads where leads.id = notes.lead_id));

drop policy if exists "notes insert by allowed roles" on public.notes;
create policy "notes insert by allowed roles" on public.notes
for insert with check (
  user_id = auth.uid()
  and public.has_any_role(array['owner','admin','manager','surveyor','office_agent']::public.app_role[])
);
