-- GenLayer IC review records (mirrored from on-chain)
create table if not exists public.reviews (
  id                  uuid primary key default gen_random_uuid(),
  submission_id       uuid not null references public.submissions(id) on delete cascade,
  request_tx_hash     text,
  verdict             text,                -- 'pass' | 'fail' | 'undetermined'
  bond_action         text,                -- 'return' | 'slash' | 'pending'
  reasoning_summary   text,               -- Non-sensitive excerpt, no builder PII
  validator_count     integer,
  consensus_reached   boolean,
  result_tx_hash      text,
  synced_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint reviews_verdict_check check (
    verdict is null or verdict in ('pass','fail','undetermined')
  ),
  constraint reviews_bond_action_check check (
    bond_action is null or bond_action in ('return','slash','pending')
  )
);

create index reviews_submission_idx on public.reviews (submission_id);

alter table public.reviews enable row level security;

-- Builder sees review for their own submission
create policy "reviews_select_builder"
  on public.reviews for select
  using (
    submission_id in (
      select id from public.submissions
      where builder_wallet = current_setting('app.wallet', true)
    )
  );

-- Sponsor sees reviews for their milestones
create policy "reviews_select_sponsor"
  on public.reviews for select
  using (
    submission_id in (
      select s.id from public.submissions s
      join public.milestones m on m.id = s.milestone_id
      where m.sponsor_wallet = current_setting('app.wallet', true)
    )
  );
