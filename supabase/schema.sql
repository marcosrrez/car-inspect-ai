-- Car Inspect AI — cloud sync schema
-- Run this once in your Supabase project: SQL Editor -> paste -> Run.
-- It creates a single table that stores one garage (as JSON) per signed-in user,
-- locked down with Row Level Security so each user can only read/write their own row.

create table if not exists public.garages (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.garages enable row level security;

-- A user can see only their own garage.
drop policy if exists "garages_select_own" on public.garages;
create policy "garages_select_own"
  on public.garages for select
  using (auth.uid() = user_id);

-- A user can insert only a row for themselves.
drop policy if exists "garages_insert_own" on public.garages;
create policy "garages_insert_own"
  on public.garages for insert
  with check (auth.uid() = user_id);

-- A user can update only their own garage.
drop policy if exists "garages_update_own" on public.garages;
create policy "garages_update_own"
  on public.garages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A user can delete only their own garage.
drop policy if exists "garages_delete_own" on public.garages;
create policy "garages_delete_own"
  on public.garages for delete
  using (auth.uid() = user_id);
