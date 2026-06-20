create table if not exists public.milestones (
  id                  uuid primary key default gen_random_uuid(),
  sponsor_wallet      text not null,
  title               text not null,
  description         text not null,
  terms_hash          text not null,
  reward_wei          text not null,
  bond_wei            text not null,
  deadline            timestamptz,
  contract_address    text,
  on_chain_id         text,
  status              text not null default 'open',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Drop old constraint if it includes 'draft', replace with current set
alter table public.milestones drop constraint if exists milestones_status_check;
alter table public.milestones add constraint milestones_status_check check (
  status in ('open','accepted','submitted','reviewing','settled','cancelled')
);

create index if not exists milestones_sponsor_idx on public.milestones (sponsor_wallet);
create index if not exists milestones_status_idx  on public.milestones (status);

alter table public.milestones enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'milestones' and policyname = 'milestones_select_open'
  ) then
    create policy "milestones_select_open"
      on public.milestones for select
      using (status in ('open','accepted','submitted','reviewing','settled'));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'milestones' and policyname = 'milestones_select_own'
  ) then
    create policy "milestones_select_own"
      on public.milestones for select
      using (sponsor_wallet = current_setting('app.wallet', true));
  end if;
end $$;
