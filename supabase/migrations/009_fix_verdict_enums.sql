-- Idempotent: drop and re-add all verdict/bond_action constraints with correct values.
-- Safe to run even if 006/007 already applied the correct values.

alter table public.reviews drop constraint if exists reviews_verdict_check;
alter table public.reviews drop constraint if exists reviews_bond_action_check;
alter table public.reviews
  add constraint reviews_verdict_check check (
    verdict is null or verdict in ('passed','partial_pass','failed','needs_human_review')
  ),
  add constraint reviews_bond_action_check check (
    bond_action is null or bond_action in ('return','slash','hold')
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
