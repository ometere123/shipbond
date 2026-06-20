-- Private evidence file metadata (actual files in storage bucket)
create table if not exists public.evidence_files (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.submissions(id) on delete cascade,
  uploader_wallet text not null,
  file_name       text not null,
  storage_path    text not null unique,    -- path in shipbond-evidence bucket
  content_type    text,
  size_bytes      bigint,
  created_at      timestamptz not null default now()
);

create index evidence_files_submission_idx on public.evidence_files (submission_id);

alter table public.evidence_files enable row level security;

-- Builder who uploaded can see their own files
create policy "evidence_files_select_uploader"
  on public.evidence_files for select
  using (uploader_wallet = current_setting('app.wallet', true));

-- Sponsor can see evidence files for their milestones
create policy "evidence_files_select_sponsor"
  on public.evidence_files for select
  using (
    submission_id in (
      select s.id from public.submissions s
      join public.milestones m on m.id = s.milestone_id
      where m.sponsor_wallet = current_setting('app.wallet', true)
    )
  );
