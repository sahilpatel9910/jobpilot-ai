create extension if not exists pgcrypto;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_status_idx on public.applications(status);
create index if not exists applications_created_at_idx on public.applications(created_at desc);

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

create table if not exists public.profile_settings (
  id text primary key default 'default',
  resume_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profile_settings_updated_at on public.profile_settings;
create trigger set_profile_settings_updated_at
before update on public.profile_settings
for each row
execute function public.set_updated_at();

-- MVP note:
-- Keep RLS disabled while there is no authentication layer, or add server-only
-- policies before exposing direct client reads. API routes use the service role key.
