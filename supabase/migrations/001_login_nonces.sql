-- Login nonces: one-time use, 5-min TTL
create table if not exists public.login_nonces (
  id          uuid primary key default gen_random_uuid(),
  wallet      text not null,
  nonce       text not null unique,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '5 minutes',
  used        boolean not null default false
);

create index login_nonces_wallet_idx on public.login_nonces (wallet);
create index login_nonces_expires_idx on public.login_nonces (expires_at);

-- No RLS: nonces are managed exclusively by service-role in API routes
alter table public.login_nonces enable row level security;
-- deny all by default (no policies = no access for anon/authenticated)
