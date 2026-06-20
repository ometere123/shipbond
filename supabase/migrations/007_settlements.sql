-- Settlements: final payout records (driven by GenLayer verdict only)
create table if not exists public.settlements (
  id                  uuid primary key default gen_random_uuid(),
  milestone_id        uuid not null references public.milestones(id) on delete cascade,
  submission_id       uuid not null references public.submissions(id) on delete cascade,
  review_id           uuid references public.reviews(id),
  verdict             text not null,
  bond_action         text not null,
  reward_to_builder   text,               -- wei string, null if failed
  bond_returned       text,               -- wei string, null if slashed
  bond_slashed        text,               -- wei string, null if returned
  settle_tx_hash      text,
  settled_at          timestamptz,
  created_at          timestamptz not null default now(),

  constraint settlements_verdict_check check (verdict in ('pass','fail')),
  constraint settlements_bond_action_check check (bond_action in ('return','slash'))
);

alter table public.settlements enable row level security;

-- Builder sees their own settlement
create policy "settlements_select_builder"
  on public.settlements for select
  using (
    submission_id in (
      select id from public.submissions
      where builder_wallet = current_setting('app.wallet', true)
    )
  );

-- Sponsor sees settlements for their milestones
create policy "settlements_select_sponsor"
  on public.settlements for select
  using (
    milestone_id in (
      select id from public.milestones
      where sponsor_wallet = current_setting('app.wallet', true)
    )
  );
