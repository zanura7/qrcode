-- QR Code Management System — initial schema
-- Run this in the Supabase SQL editor (or via the Supabase CLI).

create extension if not exists "pgcrypto";

-- =========================================================
-- qr_codes
-- =========================================================
create table if not exists public.qr_codes (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  type             text not null check (type in ('url', 'whatsapp', 'link_hub')),
  short_code       text not null unique,
  target_url       text,
  whatsapp_number  text,
  whatsapp_message text,
  status           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists qr_codes_short_code_idx on public.qr_codes (short_code);
create index if not exists qr_codes_type_idx on public.qr_codes (type);

-- =========================================================
-- qr_scans
-- =========================================================
create table if not exists public.qr_scans (
  id          uuid primary key default gen_random_uuid(),
  qr_code_id  uuid not null references public.qr_codes (id) on delete cascade,
  browser     text,
  device      text,
  user_agent  text,
  ip_address  text,
  referrer    text,
  scanned_at  timestamptz not null default now()
);

create index if not exists qr_scans_qr_code_id_idx on public.qr_scans (qr_code_id);
create index if not exists qr_scans_scanned_at_idx on public.qr_scans (scanned_at);

-- =========================================================
-- link_hub_items
-- =========================================================
create table if not exists public.link_hub_items (
  id          uuid primary key default gen_random_uuid(),
  qr_code_id  uuid not null references public.qr_codes (id) on delete cascade,
  title       text not null,
  platform    text not null,
  url         text not null,
  sort_order  integer not null default 0
);

create index if not exists link_hub_items_qr_code_id_idx on public.link_hub_items (qr_code_id);

-- =========================================================
-- updated_at trigger
-- =========================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists qr_codes_set_updated_at on public.qr_codes;
create trigger qr_codes_set_updated_at
  before update on public.qr_codes
  for each row execute function public.set_updated_at();

-- =========================================================
-- Row Level Security
-- The app server uses the service-role key for public redirect/hub
-- resolution and analytics logging (bypasses RLS). Authenticated
-- admins manage everything through the dashboard.
-- =========================================================
alter table public.qr_codes      enable row level security;
alter table public.qr_scans      enable row level security;
alter table public.link_hub_items enable row level security;

-- Authenticated admins: full access
drop policy if exists "admin all qr_codes" on public.qr_codes;
create policy "admin all qr_codes" on public.qr_codes
  for all to authenticated using (true) with check (true);

drop policy if exists "admin all qr_scans" on public.qr_scans;
create policy "admin all qr_scans" on public.qr_scans
  for all to authenticated using (true) with check (true);

drop policy if exists "admin all link_hub_items" on public.link_hub_items;
create policy "admin all link_hub_items" on public.link_hub_items
  for all to authenticated using (true) with check (true);
