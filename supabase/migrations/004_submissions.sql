-- Submissions: one builder per milestone (MVP)
create table if not exists public.submissions (
  id                uuid primary key default gen_random_uuid(),
  milestone_id      uuid not null references public.milestones(id) on delete cascade,
  builder_wallet    text not null,
  bond_tx_hash      text,                   -- Bond lock tx on GenLayer
  evidence_refs     jsonb,                  -- Public stable refs (commit hash, README URL, tx hash)
  evidence_digest   text,                   -- SHA-256 of evidence_refs JSON (for on-chain anchoring)
  submit_tx_hash    text,                   -- Submit evidence tx on GenLayer
  status            text not null default 'bonded',
  -- bonded → evidence_submitted → review_requested → verdict_received → settled
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint submissions_one_per_milestone unique (milestone_id),
  constraint submissions_status_check check (
    status in ('bonded','evidence_submitted','review_requested','verdict_received','settled')
  )
);

create index submissions_builder_idx    on public.submissions (builder_wallet);
create index submissions_milestone_idx  on public.submissions (milestone_id);

alter table public.submissions enable row level security;

-- Builder sees only their own submissions
create policy "submissions_select_own_builder"
  on public.submissions for select
  using (builder_wallet = current_setting('app.wallet', true));

-- Sponsor sees submissions for their milestones
create policy "submissions_select_sponsor"
  on public.submissions for select
  using (
    milestone_id in (
      select id from public.milestones
      where sponsor_wallet = current_setting('app.wallet', true)
    )
  );
-- NOTE: builders must NOT see each other — the unique constraint enforces one builder per milestone
-- so the "own builder" policy is sufficient isolation.
