-- Marketplace: Stripe Connect accounts + purchase records (global unlock state)

create table if not exists public.marketplace_connect_accounts (
  username text primary key,
  stripe_account_id text not null unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_purchases (
  buyer_username text not null,
  post_id text not null,
  seller_username text not null,
  amount_cents integer not null check (amount_cents > 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  purchased_at timestamptz not null default now(),
  primary key (buyer_username, post_id)
);

create index if not exists marketplace_purchases_buyer_idx
  on public.marketplace_purchases (buyer_username);

create index if not exists marketplace_purchases_post_idx
  on public.marketplace_purchases (post_id);
