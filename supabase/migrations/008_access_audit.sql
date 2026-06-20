create table if not exists public.access_audit (
  id          uuid primary key default gen_random_uuid(),
  wallet      text not null,
  action      text not null,
  resource    text,
  ip_hash     text,
  created_at  timestamptz not null default now()
);

create index if not exists access_audit_wallet_idx  on public.access_audit (wallet);
create index if not exists access_audit_created_idx on public.access_audit (created_at desc);

alter table public.access_audit enable row level security;
