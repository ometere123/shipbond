-- Milestones: created by sponsors, funded on GenLayer
create table if not exists public.milestones (
  id                  uuid primary key default gen_random_uuid(),
  sponsor_wallet      text not null,
  title               text not null,
  description         text not null,
  terms_hash          text not null,           -- SHA-256 of canonical terms JSON
  reward_wei          text not null,           -- GEN reward in wei (string to avoid bigint overflow)
  bond_wei            text not null,           -- Required builder bond in wei
  deadline            timestamptz,
  contract_address    text,                    -- Set after deploy
  on_chain_id         text,                    -- Milestone ID on-chain (uint256 as string)
  status              text not null default 'draft',
  -- draft → open → accepted → submitted → reviewing → settled
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint milestones_status_check check (
    status in ('draft','open','accepted','submitted','reviewing','settled','cancelled')
  )
);

create index milestones_sponsor_idx on public.milestones (sponsor_wallet);
create index milestones_status_idx  on public.milestones (status);

alter table public.milestones enable row level security;

-- Anyone authenticated can list open milestones
create policy "milestones_select_open"
  on public.milestones for select
  using (status in ('open','accepted','submitted','reviewing','settled'));

-- Sponsor sees all their own milestones (including drafts)
create policy "milestones_select_own"
  on public.milestones for select
  using (sponsor_wallet = current_setting('app.wallet', true));
