-- Precise scan geolocation (device GPS, captured via the redirect interstitial).
-- IP-based country/region/city stay as a fallback; GPS overwrites them when granted.
-- Safe to run on existing databases.

alter table public.qr_scans add column if not exists latitude double precision;
alter table public.qr_scans add column if not exists longitude double precision;
alter table public.qr_scans add column if not exists accuracy double precision;
-- 'ip' (default, from CDN headers) or 'gps' (device location).
alter table public.qr_scans add column if not exists location_source text;
