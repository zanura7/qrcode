-- Expand QR creation types and add fields for non-URL content QR codes.
-- Safe to run on existing databases.

alter table public.qr_codes add column if not exists content_text text;
alter table public.qr_codes add column if not exists phone_number text;
alter table public.qr_codes add column if not exists email_address text;
alter table public.qr_codes add column if not exists email_subject text;
alter table public.qr_codes add column if not exists email_body text;
alter table public.qr_codes add column if not exists wifi_ssid text;
alter table public.qr_codes add column if not exists wifi_password text;
alter table public.qr_codes add column if not exists wifi_encryption text;
alter table public.qr_codes add column if not exists contact_name text;
alter table public.qr_codes add column if not exists contact_phone text;
alter table public.qr_codes add column if not exists contact_email text;
alter table public.qr_codes add column if not exists contact_company text;
alter table public.qr_codes add column if not exists contact_url text;
alter table public.qr_codes add column if not exists event_title text;
alter table public.qr_codes add column if not exists event_start text;
alter table public.qr_codes add column if not exists event_end text;
alter table public.qr_codes add column if not exists event_location text;

alter table public.qr_codes drop constraint if exists qr_codes_type_check;
alter table public.qr_codes
  add constraint qr_codes_type_check
  check (
    type in (
      'url',
      'text',
      'map',
      'wifi',
      'whatsapp',
      'phone',
      'sms',
      'email',
      'vcard',
      'calendar',
      'telegram',
      'wechat',
      'line',
      'kakaotalk',
      'tiktok',
      'instagram',
      'facebook',
      'youtube',
      'linkedin',
      'x',
      'snapchat',
      'reddit',
      'spotify',
      'google_forms',
      'google_review',
      'google_docs',
      'google_sheets',
      'office_365',
      'paypal',
      'venmo',
      'upi',
      'crypto_payment',
      'amazon',
      'etsy',
      'booking',
      'online_booking',
      'link_hub',
      'custom_url',
      'pdf',
      'audio',
      'video',
      'image',
      'pptx',
      'excel',
      'png',
      'file'
    )
  );
