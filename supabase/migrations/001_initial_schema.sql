-- Universes of RPG — MVP schema
-- Run in Supabase SQL Editor or via Supabase CLI

-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
create type post_type as enum (
  'character_sheet',
  'code_template',
  'story_segment',
  'digital_asset',
  'collab_thread'
);

create type post_visibility as enum ('public', 'followers', 'private');
create type moderation_status as enum ('draft', 'pending', 'approved', 'rejected');
create type pricing_type as enum ('free', 'one_time', 'subscription');

-- Profiles (RPG identity)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  banner_url text,
  persona_mode boolean default true,
  layout_html text,
  layout_css text,
  is_verified_creator boolean default false,
  stripe_account_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

-- Posts / creations (feed + marketplace items)
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type post_type not null default 'code_template',
  title text not null,
  description text,
  content text,
  html_code text,
  css_code text,
  js_code text,
  bbcode text,
  preview_image_url text,
  pricing pricing_type not null default 'free',
  price_cents integer default 0 check (price_cents >= 0),
  is_code_locked boolean default false,
  visibility post_visibility not null default 'public',
  moderation_status moderation_status not null default 'draft',
  is_ai_generated boolean default false,
  forked_from_id uuid references public.posts (id) on delete set null,
  tags text[] default '{}',
  style_tags text[] default '{}',
  like_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Assets (images, files linked to posts)
create table public.assets (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes integer,
  created_at timestamptz default now() not null
);

-- Products (marketplace listings — mirrors paid posts)
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null unique references public.posts (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  stripe_price_id text,
  is_active boolean default false,
  created_at timestamptz default now() not null
);

-- Purchases / unlocks
create table public.purchases (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  platform_fee_cents integer default 0,
  created_at timestamptz default now() not null,
  unique (buyer_id, post_id)
);

-- Social: likes
create table public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (user_id, post_id)
);

-- Social: comments
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz default now() not null
);

-- Moderation reports
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz default now() not null
);

-- Indexes
create index posts_author_id_idx on public.posts (author_id);
create index posts_type_idx on public.posts (type);
create index posts_moderation_status_idx on public.posts (moderation_status);
create index posts_tags_idx on public.posts using gin (tags);
create index posts_style_tags_idx on public.posts using gin (style_tags);
create index comments_post_id_idx on public.comments (post_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    '[^a-z0-9_]', '_', 'g'
  ));
  if length(base_username) < 3 then
    base_username := 'user_' || substr(new.id::text, 1, 8);
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    base_username,
    coalesce(new.raw_user_meta_data->>'display_name', base_username)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.assets enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Posts policies
create policy "Public approved posts are viewable"
  on public.posts for select using (
    (visibility = 'public' and moderation_status = 'approved')
    or author_id = auth.uid()
    or exists (
      select 1 from public.purchases p
      where p.post_id = posts.id and p.buyer_id = auth.uid()
    )
  );

create policy "Authors can insert posts"
  on public.posts for insert with check (auth.uid() = author_id);

create policy "Authors can update own posts"
  on public.posts for update using (auth.uid() = author_id);

create policy "Authors can delete own posts"
  on public.posts for delete using (auth.uid() = author_id);

-- Likes policies
create policy "Likes viewable by everyone"
  on public.likes for select using (true);

create policy "Users can like"
  on public.likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.likes for delete using (auth.uid() = user_id);

-- Comments policies
create policy "Comments viewable by everyone"
  on public.comments for select using (true);

create policy "Authenticated users can comment"
  on public.comments for insert with check (auth.uid() = author_id);

-- Purchases: buyers see own purchases
create policy "Buyers see own purchases"
  on public.purchases for select using (auth.uid() = buyer_id);

-- Storage bucket (run separately in dashboard or via CLI)
-- insert into storage.buckets (id, name, public) values ('assets', 'assets', true);
