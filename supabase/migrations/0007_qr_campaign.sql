-- Optional campaign label per QR, used to group and filter analytics.
-- Safe to run on existing databases.

alter table public.qr_codes add column if not exists campaign text;

create index if not exists qr_codes_campaign_idx on public.qr_codes (campaign);
