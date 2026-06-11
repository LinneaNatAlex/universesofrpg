-- Public avatar URLs keyed by username (real accounts + demo personas).
-- Run once in Supabase → SQL Editor.

create table if not exists public.profile_avatar_media (
  username text primary key,
  avatar_url text not null,
  updated_at timestamptz default now() not null,
  constraint profile_avatar_media_username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

drop trigger if exists profile_avatar_media_updated_at on public.profile_avatar_media;
create trigger profile_avatar_media_updated_at
  before update on public.profile_avatar_media
  for each row execute function public.set_updated_at();

alter table public.profile_avatar_media enable row level security;

drop policy if exists "Profile avatars are viewable by everyone" on public.profile_avatar_media;
create policy "Profile avatars are viewable by everyone"
  on public.profile_avatar_media for select using (true);

drop policy if exists "Users insert own avatar media" on public.profile_avatar_media;
create policy "Users insert own avatar media"
  on public.profile_avatar_media for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.username = profile_avatar_media.username
    )
  );

drop policy if exists "Users update own avatar media" on public.profile_avatar_media;
create policy "Users update own avatar media"
  on public.profile_avatar_media for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.username = profile_avatar_media.username
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.username = profile_avatar_media.username
    )
  );

drop policy if exists "Users delete own avatar media" on public.profile_avatar_media;
create policy "Users delete own avatar media"
  on public.profile_avatar_media for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.username = profile_avatar_media.username
    )
  );
