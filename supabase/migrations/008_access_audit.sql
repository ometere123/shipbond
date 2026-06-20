-- Immutable audit log for all sensitive data access
create table if not exists public.access_audit (
  id          uuid primary key default gen_random_uuid(),
  wallet      text not null,
  action      text not null,      -- 'view_evidence' | 'create_milestone' | 'submit_evidence' | etc.
  resource    text,               -- e.g. 'submission:uuid'
  ip_hash     text,               -- hashed for privacy
  created_at  timestamptz not null default now()
);

create index access_audit_wallet_idx    on public.access_audit (wallet);
create index access_audit_created_idx   on public.access_audit (created_at desc);

-- Only service-role writes; no RLS select policies (admin-only via service role)
alter table public.access_audit enable row level security;
