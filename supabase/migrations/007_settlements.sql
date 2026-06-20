create table if not exists public.settlements (
  id                  uuid primary key default gen_random_uuid(),
  milestone_id        uuid not null references public.milestones(id) on delete cascade,
  submission_id       uuid not null references public.submissions(id) on delete cascade,
  review_id           uuid references public.reviews(id),
  verdict             text not null,
  bond_action         text not null,
  reward_to_builder   text,
  bond_returned       text,
  bond_slashed        text,
  settle_tx_hash      text,
  settled_at          timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.settlements drop constraint if exists settlements_verdict_check;
alter table public.settlements drop constraint if exists settlements_bond_action_check;
alter table public.settlements
  add constraint settlements_verdict_check check (
    verdict in ('passed','partial_pass','failed')
  ),
  add constraint settlements_bond_action_check check (
    bond_action in ('return','slash','hold')
  );

alter table public.settlements enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'settlements' and policyname = 'settlements_select_builder'
  ) then
    create policy "settlements_select_builder"
      on public.settlements for select
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
    select 1 from pg_policies where tablename = 'settlements' and policyname = 'settlements_select_sponsor'
  ) then
    create policy "settlements_select_sponsor"
      on public.settlements for select
      using (
        milestone_id in (
          select id from public.milestones
          where sponsor_wallet = current_setting('app.wallet', true)
        )
      );
  end if;
end $$;
