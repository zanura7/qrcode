import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logScan } from "@/lib/analytics";
import { appUrl } from "@/lib/utils";
import { CONTENT_QR_TYPES, URL_QR_TYPES, type QrCode } from "@/lib/types";

export const dynamic = "force-dynamic";

function resolveTarget(qr: QrCode, origin: string): string {
  const baseUrl = appUrl(origin);
  switch (qr.type) {
    case "whatsapp": {
      const number = (qr.whatsapp_number || "").replace(/[^\d]/g, "");
      const base = `https://wa.me/${number}`;
      return qr.whatsapp_message
        ? `${base}?text=${encodeURIComponent(qr.whatsapp_message)}`
        : base;
    }
    case "phone":
      return `tel:${(qr.phone_number || "").replace(/[^\d+]/g, "")}`;
    case "sms": {
      const number = (qr.phone_number || "").replace(/[^\d+]/g, "");
      const body = qr.content_text
        ? `?body=${encodeURIComponent(qr.content_text)}`
        : "";
      return `sms:${number}${body}`;
    }
    case "email": {
      const params = new URLSearchParams();
      if (qr.email_subject) params.set("subject", qr.email_subject);
      if (qr.email_body) params.set("body", qr.email_body);
      const query = params.toString();
      return `mailto:${qr.email_address || ""}${query ? `?${query}` : ""}`;
    }
    case "link_hub":
      return `${baseUrl}/hub/${qr.short_code}`;
    default:
      if (URL_QR_TYPES.includes(qr.type)) return qr.target_url || baseUrl;
      if (CONTENT_QR_TYPES.includes(qr.type)) {
        return `${baseUrl}/content/${qr.short_code}`;
      }
      return baseUrl;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const admin = createAdminClient();

  const { data: qr } = await admin
    .from("qr_codes")
    .select("*")
    .eq("short_code", code)
    .maybeSingle();

  if (!qr) {
    return new NextResponse("QR code not found.", { status: 404 });
  }

  if (!qr.status) {
    return new NextResponse("This QR code is currently inactive.", {
      status: 410,
    });
  }

  // Record the scan before redirecting (serverless-safe).
  await logScan(qr.id, request.headers);

  const target = resolveTarget(qr as QrCode, request.nextUrl.origin);
  return NextResponse.redirect(target, { status: 302 });
}
