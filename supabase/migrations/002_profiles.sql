create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  wallet        text not null unique,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_wallet_idx on public.profiles (wallet);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_select_own'
  ) then
    create policy "profiles_select_own"
      on public.profiles for select
      using (wallet = current_setting('app.wallet', true));
  end if;
end $$;
