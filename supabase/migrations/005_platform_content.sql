-- Live site content (posts + RPG topics) synced from the app.
-- Run in Supabase SQL Editor after 001_initial_schema.sql.

create table if not exists public.platform_content_state (
  content_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now() not null
);

drop trigger if exists platform_content_state_updated_at on public.platform_content_state;
create trigger platform_content_state_updated_at
  before update on public.platform_content_state
  for each row execute function public.set_updated_at();

alter table public.platform_content_state enable row level security;

drop policy if exists "Platform content is public read" on public.platform_content_state;
create policy "Platform content is public read"
  on public.platform_content_state for select using (true);
