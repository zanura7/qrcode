-- Soft delete (Archive / Recycle Bin) for QR codes.
-- A non-null deleted_at means the QR is in the recycle bin: it no longer
-- resolves publicly and is hidden from the main lists, but can be restored.
-- Safe to run on existing databases.

alter table public.qr_codes add column if not exists deleted_at timestamptz;

create index if not exists qr_codes_deleted_at_idx
  on public.qr_codes (deleted_at);
