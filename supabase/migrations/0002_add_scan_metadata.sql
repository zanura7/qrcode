-- Add scan metadata columns for richer analytics.
-- Safe to run on existing databases.

alter table public.qr_scans add column if not exists os text;
alter table public.qr_scans add column if not exists country text;
alter table public.qr_scans add column if not exists region text;
alter table public.qr_scans add column if not exists city text;

create index if not exists qr_scans_country_idx
  on public.qr_scans (country);
