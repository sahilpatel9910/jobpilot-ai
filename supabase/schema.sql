create extension if not exists pgcrypto;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_name text not null,
  job_title text not null,
  job_url text,
  job_description text not null,
  resume_text text not null,
  status text not null default 'Saved'
    check (status in ('Saved', 'Analysed', 'Applied', 'Interview', 'Rejected', 'Offer', 'Archived')),
  match_score integer check (match_score between 0 and 100),
  summary text,
  required_skills jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  missing_keywords jsonb not null default '[]'::jsonb,
  suggested_bullets jsonb not null default '[]'::jsonb,
  cover_letter text,
  cover_letter_context text,
  cover_letter_revision_instruction text,
  cover_letter_generated_at timestamptz,
  cover_letter_status text not null default 'not_generated'
    check (cover_letter_status in ('not_generated', 'generated', 'regenerated')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.applications
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists applications_status_idx on public.applications(status);
create index if not exists applications_created_at_idx on public.applications(created_at desc);
create index if not exists applications_user_id_idx on public.applications(user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

alter table if exists public.applications
  drop constraint if exists applications_status_check;

alter table if exists public.applications
  add constraint applications_status_check
  check (status in ('Saved', 'Analysed', 'Applied', 'Interview', 'Rejected', 'Offer', 'Archived'));

alter table if exists public.applications
  add column if not exists notes text;

alter table if exists public.applications
  add column if not exists cover_letter_context text;

alter table if exists public.applications
  add column if not exists cover_letter_revision_instruction text;

alter table if exists public.applications
  add column if not exists cover_letter_generated_at timestamptz;

alter table if exists public.applications
  add column if not exists cover_letter_status text not null default 'not_generated';

alter table if exists public.applications
  drop constraint if exists applications_cover_letter_status_check;

alter table if exists public.applications
  add constraint applications_cover_letter_status_check
  check (cover_letter_status in ('not_generated', 'generated', 'regenerated'));

create table if not exists public.profile_settings (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_text text not null,
  profile_summary text,
  cover_letter_preferences text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.profile_settings
  alter column id drop default;

alter table if exists public.profile_settings
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table if exists public.profile_settings
  add column if not exists profile_summary text;

alter table if exists public.profile_settings
  add column if not exists cover_letter_preferences text;

create unique index if not exists profile_settings_user_id_idx on public.profile_settings(user_id);

drop trigger if exists set_profile_settings_updated_at on public.profile_settings;
create trigger set_profile_settings_updated_at
before update on public.profile_settings
for each row
execute function public.set_updated_at();

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status text
    check (from_status is null or from_status in ('Saved', 'Analysed', 'Applied', 'Interview', 'Rejected', 'Offer', 'Archived')),
  to_status text not null
    check (to_status in ('Saved', 'Analysed', 'Applied', 'Interview', 'Rejected', 'Offer', 'Archived')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists application_status_history_application_id_idx
  on public.application_status_history(application_id, created_at desc);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  agent_name text not null,
  input_summary text,
  output jsonb not null default '{}'::jsonb,
  status text not null default 'completed'
    check (status in ('completed', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists agent_runs_application_id_idx
  on public.agent_runs(application_id, started_at asc);

-- Auth migration note:
-- Existing shared MVP rows should be cleared before enforcing user ownership.
-- This project database was cleared during the auth implementation session.

alter table if exists public.applications
  alter column user_id set not null;

alter table if exists public.profile_settings
  alter column user_id set not null;

alter table public.applications enable row level security;
alter table public.profile_settings enable row level security;
alter table public.application_status_history enable row level security;
alter table public.agent_runs enable row level security;

drop policy if exists "Users can read own applications" on public.applications;
drop policy if exists "Users can insert own applications" on public.applications;
drop policy if exists "Users can update own applications" on public.applications;
drop policy if exists "Users can delete own applications" on public.applications;

create policy "Users can read own applications"
on public.applications for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own applications"
on public.applications for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own applications"
on public.applications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own applications"
on public.applications for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own profile settings" on public.profile_settings;
drop policy if exists "Users can insert own profile settings" on public.profile_settings;
drop policy if exists "Users can update own profile settings" on public.profile_settings;
drop policy if exists "Users can delete own profile settings" on public.profile_settings;

create policy "Users can read own profile settings"
on public.profile_settings for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own profile settings"
on public.profile_settings for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own profile settings"
on public.profile_settings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own profile settings"
on public.profile_settings for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own status history" on public.application_status_history;
drop policy if exists "Users can insert own status history" on public.application_status_history;

create policy "Users can read own status history"
on public.application_status_history for select
to authenticated
using (
  exists (
    select 1 from public.applications
    where applications.id = application_status_history.application_id
      and applications.user_id = (select auth.uid())
  )
);

create policy "Users can insert own status history"
on public.application_status_history for insert
to authenticated
with check (
  exists (
    select 1 from public.applications
    where applications.id = application_status_history.application_id
      and applications.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can read own agent runs" on public.agent_runs;
drop policy if exists "Users can insert own agent runs" on public.agent_runs;

create policy "Users can read own agent runs"
on public.agent_runs for select
to authenticated
using (
  exists (
    select 1 from public.applications
    where applications.id = agent_runs.application_id
      and applications.user_id = (select auth.uid())
  )
);

create policy "Users can insert own agent runs"
on public.agent_runs for insert
to authenticated
with check (
  exists (
    select 1 from public.applications
    where applications.id = agent_runs.application_id
      and applications.user_id = (select auth.uid())
  )
);
