create table if not exists public.submissions (
  id                uuid primary key default gen_random_uuid(),
  milestone_id      uuid not null references public.milestones(id) on delete cascade,
  builder_wallet    text not null,
  bond_tx_hash      text,
  evidence_refs     jsonb,
  evidence_digest   text,
  submit_tx_hash    text,
  status            text not null default 'bonded',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint submissions_one_per_milestone unique (milestone_id)
);

alter table public.submissions drop constraint if exists submissions_status_check;
alter table public.submissions add constraint submissions_status_check check (
  status in ('bonded','evidence_submitted','review_requested','verdict_received','settled')
);

create index if not exists submissions_builder_idx   on public.submissions (builder_wallet);
create index if not exists submissions_milestone_idx on public.submissions (milestone_id);

alter table public.submissions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'submissions' and policyname = 'submissions_select_own_builder'
  ) then
    create policy "submissions_select_own_builder"
      on public.submissions for select
      using (builder_wallet = current_setting('app.wallet', true));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'submissions' and policyname = 'submissions_select_sponsor'
  ) then
    create policy "submissions_select_sponsor"
      on public.submissions for select
      using (
        milestone_id in (
          select id from public.milestones
          where sponsor_wallet = current_setting('app.wallet', true)
        )
      );
  end if;
end $$;
