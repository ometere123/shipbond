create table if not exists public.login_nonces (
  id          uuid primary key default gen_random_uuid(),
  wallet      text not null,
  nonce       text not null unique,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '5 minutes',
  used        boolean not null default false
);

create index if not exists login_nonces_wallet_idx  on public.login_nonces (wallet);
create index if not exists login_nonces_expires_idx on public.login_nonces (expires_at);

alter table public.login_nonces enable row level security;
