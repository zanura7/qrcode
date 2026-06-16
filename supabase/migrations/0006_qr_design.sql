-- Custom QR design (colors, dot/corner styles, center logo).
-- Stored as JSON so the design schema can evolve without migrations.
-- Purely visual: the QR still encodes the /r/{short_code} short link.
-- Safe to run on existing databases.

alter table public.qr_codes add column if not exists qr_design jsonb;
