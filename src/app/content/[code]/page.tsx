import { notFound } from "next/navigation";
import { Calendar, Contact, Copy, FileText, Wifi } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { QR_TYPE_LABELS, type QrCode } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium text-slate-900">
        {value}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("qr_codes")
    .select("name")
    .eq("short_code", code)
    .maybeSingle();

  return { title: data?.name ?? "QR Content" };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const admin = createAdminClient();

  const { data } = await admin
    .from("qr_codes")
    .select("*")
    .eq("short_code", code)
    .maybeSingle();

  if (!data || !data.status) notFound();
  const qr = data as QrCode;

  const Icon =
    qr.type === "wifi"
      ? Wifi
      : qr.type === "vcard"
        ? Contact
        : qr.type === "calendar"
          ? Calendar
          : FileText;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {QR_TYPE_LABELS[qr.type]}
              </div>
              <h1 className="truncate text-xl font-bold text-slate-950">
                {qr.name}
              </h1>
            </div>
          </div>
        </header>

        <div className="px-6 py-5">
          {qr.type === "text" && (
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
              {qr.content_text}
            </p>
          )}

          {qr.type === "wifi" && (
            <div>
              <InfoRow label="Network" value={qr.wifi_ssid} />
              <InfoRow label="Security" value={qr.wifi_encryption} />
              <InfoRow label="Password" value={qr.wifi_password} />
            </div>
          )}

          {qr.type === "vcard" && (
            <div>
              <InfoRow label="Name" value={qr.contact_name} />
              <InfoRow label="Company" value={qr.contact_company} />
              <InfoRow label="Phone" value={qr.contact_phone} />
              <InfoRow label="Email" value={qr.contact_email} />
              <InfoRow label="Website" value={qr.contact_url} />
            </div>
          )}

          {qr.type === "calendar" && (
            <div>
              <InfoRow label="Event" value={qr.event_title} />
              <InfoRow label="Start" value={formatDateTime(qr.event_start)} />
              <InfoRow label="End" value={formatDateTime(qr.event_end)} />
              <InfoRow label="Location" value={qr.event_location} />
            </div>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
          <Copy className="size-3.5" />
          <span>Powered by QR Code Manager</span>
        </footer>
      </section>
    </main>
  );
}
