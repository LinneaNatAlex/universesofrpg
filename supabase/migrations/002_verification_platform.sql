-- Global verified-creator revocations (admin) and subscription mirror (Stripe checkout)

create table if not exists public.verification_revocations (
  username text primary key,
  revoked_at timestamptz default now() not null,
  revoked_by text
);

create table if not exists public.verification_subscriptions (
  username text primary key,
  status text not null default 'active',
  current_period_end timestamptz,
  stripe_subscription_id text,
  stripe_customer_id text,
  amount_cents integer,
  started_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.verification_revocations enable row level security;
alter table public.verification_subscriptions enable row level security;

create policy "verification_revocations are readable by everyone"
  on public.verification_revocations for select using (true);

create policy "verification_subscriptions are readable by everyone"
  on public.verification_subscriptions for select using (true);
