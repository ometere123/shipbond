-- One profile per wallet address
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  wallet        text not null unique,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_wallet_idx on public.profiles (wallet);

alter table public.profiles enable row level security;

-- Authenticated users can read their own profile
create policy "profiles_select_own"
  on public.profiles for select
  using (wallet = current_setting('app.wallet', true));

-- Service-role manages all writes (no user-level insert/update policies)
