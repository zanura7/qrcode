-- Storage bucket for uploaded QR file targets.
-- Files are public because QR scans redirect directly to the file URL.

insert into storage.buckets (id, name, public, file_size_limit)
values ('qr-files', 'qr-files', true, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "public read qr files" on storage.objects;
create policy "public read qr files" on storage.objects
  for select
  to public
  using (bucket_id = 'qr-files');
