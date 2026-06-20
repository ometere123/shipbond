-- Seed: create the private evidence storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shipbond-evidence',
  'shipbond-evidence',
  false,
  10485760,  -- 10 MiB
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'text/plain',
    'text/markdown',
    'application/json'
  ]
)
on conflict (id) do nothing;

-- Storage RLS: only service-role can manage files (enforced by API routes)
-- No anon/authenticated policies — all access goes through signed URLs issued server-side
