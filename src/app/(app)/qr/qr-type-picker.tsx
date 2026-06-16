"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { QR_TYPE_LABELS, type QrType } from "@/lib/types";
import { QR_TYPE_COLORS, qrTypeIcon } from "@/lib/qr-icons";

const GROUPS: { label: string; types: QrType[] }[] = [
  {
    label: "Basic",
    types: [
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
      "link_hub",
      "custom_url",
    ],
  },
  {
    label: "Social & media",
    types: [
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
    ],
  },
  {
    label: "Business & payment",
    types: [
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
    ],
  },
  {
    label: "Files",
    types: ["pdf", "audio", "video", "image", "pptx", "excel", "png", "file"],
  },
];

function TypeCard({
  type,
  selected,
  onSelect,
}: {
  type: QrType;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = qrTypeIcon(type);
  const color = QR_TYPE_COLORS[type] ?? "#0f172a";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={QR_TYPE_LABELS[type]}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "hover:border-input hover:bg-accent",
      )}
    >
      <span
        className="flex size-9 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        <Icon className="size-5" />
      </span>
      <span className="line-clamp-2 text-xs font-medium leading-tight">
        {QR_TYPE_LABELS[type]}
      </span>
    </button>
  );
}

export function QrTypePicker({
  value,
  onChange,
}: {
  value: QrType;
  onChange: (type: QrType) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const groups = GROUPS.map((group) => ({
    ...group,
    types: q
      ? group.types.filter(
          (t) =>
            QR_TYPE_LABELS[t].toLowerCase().includes(q) ||
            t.toLowerCase().includes(q),
        )
      : group.types,
  })).filter((group) => group.types.length > 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search QR types (e.g. WhatsApp, Maps, PDF)"
          className="pl-9"
        />
      </div>

      {groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No QR types match “{query}”.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {group.types.map((type) => (
                <TypeCard
                  key={type}
                  type={type}
                  selected={value === type}
                  onSelect={() => onChange(type)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
