"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "./actions";
import {
  QR_TYPE_LABELS,
  URL_QR_TYPES,
  type QrCode,
  type QrType,
} from "@/lib/types";

const BASIC_TYPES: QrType[] = [
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
];

const SOCIAL_TYPES: QrType[] = [
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
];

const BUSINESS_TYPES: QrType[] = [
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
];

const FILE_TYPES: QrType[] = [
  "pdf",
  "audio",
  "video",
  "image",
  "pptx",
  "excel",
  "png",
  "file",
];

const FILE_ACCEPT: Partial<Record<QrType, string>> = {
  pdf: ".pdf,application/pdf",
  audio: "audio/*",
  video: "video/*",
  image: "image/*",
  pptx: ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
  excel:
    ".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
  png: ".png,image/png",
  file: "*/*",
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function QrForm({
  action,
  initial,
  submitLabel,
}: {
  action: (
    prev: ActionState | undefined,
    formData: FormData,
  ) => Promise<ActionState>;
  initial?: Partial<QrCode>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [type, setType] = useState<QrType>((initial?.type as QrType) || "url");
  const usesTargetUrl = URL_QR_TYPES.includes(type);
  const targetLabel =
    type === "map"
      ? "Google Maps URL"
      : FILE_TYPES.includes(type)
        ? "File URL"
        : "Target URL";

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Ramadan Campaign QR"
          defaultValue={initial?.name ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select
          id="type"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as QrType)}
        >
          <optgroup label="Basic">
            {BASIC_TYPES.map((value) => (
              <option key={value} value={value}>
                {QR_TYPE_LABELS[value]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Social and media">
            {SOCIAL_TYPES.map((value) => (
              <option key={value} value={value}>
                {QR_TYPE_LABELS[value]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Business and payment">
            {BUSINESS_TYPES.map((value) => (
              <option key={value} value={value}>
                {QR_TYPE_LABELS[value]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Files">
            {FILE_TYPES.map((value) => (
              <option key={value} value={value}>
                {QR_TYPE_LABELS[value]}
              </option>
            ))}
          </optgroup>
        </Select>
      </div>

      {usesTargetUrl && (
        <>
          {FILE_TYPES.includes(type) && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Label htmlFor="file_upload">Upload file</Label>
              <Input
                id="file_upload"
                name="file_upload"
                type="file"
                accept={FILE_ACCEPT[type]}
              />
              <p className="text-xs text-muted-foreground">
                Upload a file up to 50 MB. If a file is uploaded, it will
                replace the URL below.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="target_url">{targetLabel}</Label>
            <Input
              id="target_url"
              name="target_url"
              type="url"
              placeholder={
                type === "map"
                  ? "https://maps.google.com/..."
                  : FILE_TYPES.includes(type)
                    ? "https://example.com/file.pdf"
                    : "https://example.com"
              }
              defaultValue={initial?.target_url ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              The QR stores a short link. You can update this URL without
              reprinting the QR.
            </p>
          </div>
        </>
      )}

      {type === "whatsapp" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">WhatsApp number</Label>
            <Input
              id="whatsapp_number"
              name="whatsapp_number"
              placeholder="60123456789"
              defaultValue={initial?.whatsapp_number ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_message">Default message (optional)</Label>
            <Textarea
              id="whatsapp_message"
              name="whatsapp_message"
              placeholder="Hello, I am interested in..."
              defaultValue={initial?.whatsapp_message ?? ""}
            />
          </div>
        </>
      )}

      {type === "link_hub" && (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Save first, then add multiple platform links on the QR detail page.
        </p>
      )}

      {type === "text" && (
        <div className="space-y-2">
          <Label htmlFor="content_text">Text</Label>
          <Textarea
            id="content_text"
            name="content_text"
            placeholder="Enter the text to show when the QR is opened"
            defaultValue={initial?.content_text ?? ""}
          />
        </div>
      )}

      {(type === "phone" || type === "sms") && (
        <>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              placeholder="60123456789"
              defaultValue={initial?.phone_number ?? ""}
            />
          </div>
          {type === "sms" && (
            <div className="space-y-2">
              <Label htmlFor="content_text">SMS message (optional)</Label>
              <Textarea
                id="content_text"
                name="content_text"
                placeholder="Default SMS text"
                defaultValue={initial?.content_text ?? ""}
              />
            </div>
          )}
        </>
      )}

      {type === "email" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email_address">Email address</Label>
            <Input
              id="email_address"
              name="email_address"
              type="email"
              placeholder="name@example.com"
              defaultValue={initial?.email_address ?? ""}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email_subject">Subject (optional)</Label>
              <Input
                id="email_subject"
                name="email_subject"
                defaultValue={initial?.email_subject ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_body">Body (optional)</Label>
              <Input
                id="email_body"
                name="email_body"
                defaultValue={initial?.email_body ?? ""}
              />
            </div>
          </div>
        </>
      )}

      {type === "wifi" && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="wifi_ssid">Network name</Label>
            <Input
              id="wifi_ssid"
              name="wifi_ssid"
              placeholder="Wi-Fi SSID"
              defaultValue={initial?.wifi_ssid ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wifi_encryption">Security</Label>
            <Select
              id="wifi_encryption"
              name="wifi_encryption"
              defaultValue={initial?.wifi_encryption ?? "WPA"}
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No password</option>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="wifi_password">Password</Label>
            <Input
              id="wifi_password"
              name="wifi_password"
              placeholder="Wi-Fi password"
              defaultValue={initial?.wifi_password ?? ""}
            />
          </div>
          <p className="text-xs text-muted-foreground md:col-span-3">
            Dynamic QR opens a Wi-Fi details page. Auto-connect Wi-Fi requires a
            static Wi-Fi QR payload, not a short link.
          </p>
        </div>
      )}

      {type === "vcard" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact name</Label>
            <Input
              id="contact_name"
              name="contact_name"
              defaultValue={initial?.contact_name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_company">Company (optional)</Label>
            <Input
              id="contact_company"
              name="contact_company"
              defaultValue={initial?.contact_company ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Phone (optional)</Label>
            <Input
              id="contact_phone"
              name="contact_phone"
              defaultValue={initial?.contact_phone ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">Email (optional)</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={initial?.contact_email ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="contact_url">Website (optional)</Label>
            <Input
              id="contact_url"
              name="contact_url"
              type="url"
              defaultValue={initial?.contact_url ?? ""}
            />
          </div>
        </div>
      )}

      {type === "calendar" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="event_title">Event title</Label>
            <Input
              id="event_title"
              name="event_title"
              defaultValue={initial?.event_title ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_start">Start</Label>
            <Input
              id="event_start"
              name="event_start"
              type="datetime-local"
              defaultValue={initial?.event_start ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_end">End (optional)</Label>
            <Input
              id="event_end"
              name="event_end"
              type="datetime-local"
              defaultValue={initial?.event_end ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="event_location">Location (optional)</Label>
            <Input
              id="event_location"
              name="event_location"
              defaultValue={initial?.event_location ?? ""}
            />
          </div>
        </div>
      )}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
