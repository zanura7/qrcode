export type QrType = "url" | "whatsapp" | "link_hub";

export interface QrCode {
  id: string;
  name: string;
  type: QrType;
  short_code: string;
  target_url: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface QrScan {
  id: string;
  qr_code_id: string;
  browser: string | null;
  device: string | null;
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
  whatsapp: "WhatsApp",
  link_hub: "Link Hub",
};

export const LINK_HUB_PLATFORMS = [
  "Website",
  "WhatsApp",
  "Facebook",
  "Instagram",
  "TikTok",
  "LinkedIn",
] as const;
