create extension if not exists "pgcrypto";

create or replace function public.next_utc_midnight()
returns timestamptz
language sql
stable
as $$
  select (date_trunc('day', now() at time zone 'utc') + interval '1 day') at time zone 'utc';
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text default 'free',
  daily_credits integer default 20,
  credits_reset_at timestamptz default public.next_utc_midnight()
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  theme text not null,
  status text not null default 'queued',
  complexity_score integer default 0,
  is_public boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.issues(id) on delete cascade,
  url text not null,
  canonical_url text,
  source_type text not null,
  order_index integer not null,
  parsed_json jsonb
);

create table if not exists public.assets (
  issue_id uuid primary key references public.issues(id) on delete cascade,
  pdf_url text,
  cover_url text,
  html_url text,
  created_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  issue_id uuid references public.issues(id) on delete cascade,
  type text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists issues_user_id_idx on public.issues(user_id);
create index if not exists links_issue_id_idx on public.links(issue_id);
create index if not exists events_user_id_idx on public.events(user_id);
create index if not exists events_issue_id_idx on public.events(issue_id);

alter table public.users enable row level security;
alter table public.issues enable row level security;
alter table public.links enable row level security;
alter table public.assets enable row level security;
alter table public.events enable row level security;

create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

create policy "Users can manage own issues" on public.issues
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Public can read public issues" on public.issues
  for select using (is_public = true);

create policy "Users can manage own links" on public.links
  for all using (auth.uid() = (select user_id from public.issues where id = issue_id))
  with check (auth.uid() = (select user_id from public.issues where id = issue_id));

create policy "Users can manage own assets" on public.assets
  for all using (auth.uid() = (select user_id from public.issues where id = issue_id))
  with check (auth.uid() = (select user_id from public.issues where id = issue_id));

create policy "Users can view own events" on public.events
  for select using (auth.uid() = user_id);

create policy "Users can insert own events" on public.events
  for insert with check (auth.uid() = user_id);
