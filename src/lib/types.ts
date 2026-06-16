export const QR_TYPES = [
  "url",
  "text",
  "map",
  "wifi",
  "whatsapp",
  "phone",
  "sms",
  "email",
  "vcard",
  "calendar",
  "telegram",
  "wechat",
  "line",
  "kakaotalk",
  "tiktok",
  "instagram",
  "facebook",
  "youtube",
  "linkedin",
  "x",
  "snapchat",
  "reddit",
  "spotify",
  "google_forms",
  "google_review",
  "google_docs",
  "google_sheets",
  "office_365",
  "paypal",
  "venmo",
  "upi",
  "crypto_payment",
  "amazon",
  "etsy",
  "booking",
  "online_booking",
  "link_hub",
  "custom_url",
  "pdf",
  "audio",
  "video",
  "image",
  "pptx",
  "excel",
  "png",
  "file",
] as const;

export type QrType = (typeof QR_TYPES)[number];

export interface QrCode {
  id: string;
  name: string;
  type: QrType;
  short_code: string;
  target_url: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  content_text: string | null;
  phone_number: string | null;
  email_address: string | null;
  email_subject: string | null;
  email_body: string | null;
  wifi_ssid: string | null;
  wifi_password: string | null;
  wifi_encryption: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_company: string | null;
  contact_url: string | null;
  event_title: string | null;
  event_start: string | null;
  event_end: string | null;
  event_location: string | null;
  status: boolean;
  campaign: string | null;
  deleted_at: string | null;
  qr_design: QrDesign | null;
  created_at: string;
  updated_at: string;
}

export type QrDotStyle =
  | "square"
  | "rounded"
  | "dots"
  | "classy"
  | "classy-rounded"
  | "extra-rounded";

export type QrCornerStyle = "square" | "rounded" | "dot" | "extra-rounded";

export interface QrDesign {
  /** Foreground / dots color. */
  dark?: string;
  /** Background color. */
  light?: string;
  dotsType?: QrDotStyle;
  cornersType?: QrCornerStyle;
  logoUrl?: string | null;
  margin?: number;
}

export interface QrScan {
  id: string;
  qr_code_id: string;
  browser: string | null;
  device: string | null;
  os: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  location_source: "ip" | "gps" | null;
  user_agent: string | null;
  ip_address: string | null;
  referrer: string | null;
  scanned_at: string;
}

export interface LinkHubItem {
  id: string;
  qr_code_id: string;
  title: string;
  platform: string;
  url: string;
  sort_order: number;
}

export const QR_TYPE_LABELS: Record<QrType, string> = {
  url: "URL",
  text: "Text",
  map: "Google Maps",
  wifi: "Wi-Fi",
  whatsapp: "WhatsApp",
  phone: "Phone Call",
  sms: "SMS",
  email: "E-mail",
  vcard: "vCard",
  calendar: "Calendar Event",
  telegram: "Telegram",
  wechat: "WeChat",
  line: "Line",
  kakaotalk: "KakaoTalk",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  snapchat: "Snapchat",
  reddit: "Reddit",
  spotify: "Spotify",
  google_forms: "Google Forms",
  google_review: "Google Review",
  google_docs: "Google Docs",
  google_sheets: "Google Sheets",
  office_365: "Office 365",
  paypal: "PayPal",
  venmo: "Venmo",
  upi: "UPI",
  crypto_payment: "Crypto Payment",
  amazon: "Amazon",
  etsy: "Etsy",
  booking: "Booking",
  online_booking: "Online Booking",
  link_hub: "Link Hub",
  custom_url: "Custom URL",
  pdf: "PDF",
  audio: "Audio",
  video: "Video",
  image: "Image",
  pptx: "PPTX",
  excel: "Excel",
  png: "PNG",
  file: "File",
};

export const URL_QR_TYPES: QrType[] = [
  "url",
  "map",
  "telegram",
  "wechat",
  "line",
  "kakaotalk",
  "tiktok",
  "instagram",
  "facebook",
  "youtube",
  "linkedin",
  "x",
  "snapchat",
  "reddit",
  "spotify",
  "google_forms",
  "google_review",
  "google_docs",
  "google_sheets",
  "office_365",
  "paypal",
  "venmo",
  "upi",
  "crypto_payment",
  "amazon",
  "etsy",
  "booking",
  "online_booking",
  "custom_url",
  "pdf",
  "audio",
  "video",
  "image",
  "pptx",
  "excel",
  "png",
  "file",
];

export const FILE_QR_TYPES: QrType[] = [
  "pdf",
  "audio",
  "video",
  "image",
  "pptx",
  "excel",
  "png",
  "file",
];

export const CONTENT_QR_TYPES: QrType[] = ["text", "wifi", "vcard", "calendar"];

export const LINK_HUB_PLATFORMS = [
  "Website",
  "WhatsApp",
  "Facebook",
  "Instagram",
  "TikTok",
  "LinkedIn",
] as const;
