-- Paid template source (HTML/CSS/JS) — served to buyers after purchase.
-- Run once in Supabase SQL Editor.

create table if not exists public.post_code_vault (
  post_id text primary key,
  html_code text not null,
  css_code text not null,
  js_code text,
  updated_at timestamptz default now() not null
);

drop trigger if exists post_code_vault_updated_at on public.post_code_vault;
create trigger post_code_vault_updated_at
  before update on public.post_code_vault
  for each row execute function public.set_updated_at();

alter table public.post_code_vault enable row level security;

-- No public policies — API uses service role after auth checks.
