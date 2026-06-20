create table if not exists public.reviews (
  id                  uuid primary key default gen_random_uuid(),
  submission_id       uuid not null references public.submissions(id) on delete cascade,
  request_tx_hash     text,
  verdict             text,
  bond_action         text,
  reasoning_summary   text,
  validator_count     integer,
  consensus_reached   boolean,
  result_tx_hash      text,
  synced_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.reviews drop constraint if exists reviews_verdict_check;
alter table public.reviews drop constraint if exists reviews_bond_action_check;
alter table public.reviews
  add constraint reviews_verdict_check check (
    verdict is null or verdict in ('passed','partial_pass','failed','needs_human_review')
  ),
  add constraint reviews_bond_action_check check (
    bond_action is null or bond_action in ('return','slash','hold')
  );

create index if not exists reviews_submission_idx on public.reviews (submission_id);

alter table public.reviews enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'reviews' and policyname = 'reviews_select_builder'
  ) then
    create policy "reviews_select_builder"
      on public.reviews for select
      using (
        submission_id in (
          select id from public.submissions
          where builder_wallet = current_setting('app.wallet', true)
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'reviews' and policyname = 'reviews_select_sponsor'
  ) then
    create policy "reviews_select_sponsor"
      on public.reviews for select
      using (
        submission_id in (
          select s.id from public.submissions s
          join public.milestones m on m.id = s.milestone_id
          where m.sponsor_wallet = current_setting('app.wallet', true)
        )
      );
  end if;
end $$;
