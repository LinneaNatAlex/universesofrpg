-- Public avatar URLs keyed by username (real accounts + demo personas).

create table if not exists public.profile_avatar_media (
  username text primary key,
  avatar_url text not null,
  updated_at timestamptz default now() not null,
  constraint profile_avatar_media_username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

create trigger profile_avatar_media_updated_at
  before update on public.profile_avatar_media
  for each row execute function public.set_updated_at();

alter table public.profile_avatar_media enable row level security;

create policy "Profile avatars are viewable by everyone"
  on public.profile_avatar_media for select using (true);
