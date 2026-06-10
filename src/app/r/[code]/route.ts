import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logScan } from "@/lib/analytics";
import { appUrl } from "@/lib/utils";
import type { QrCode } from "@/lib/types";

export const dynamic = "force-dynamic";

function resolveTarget(qr: QrCode): string {
  switch (qr.type) {
    case "url":
      return qr.target_url || appUrl();
    case "whatsapp": {
      const number = (qr.whatsapp_number || "").replace(/[^\d]/g, "");
      const base = `https://wa.me/${number}`;
      return qr.whatsapp_message
        ? `${base}?text=${encodeURIComponent(qr.whatsapp_message)}`
        : base;
    }
    case "link_hub":
      return `${appUrl()}/hub/${qr.short_code}`;
    default:
      return appUrl();
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

  const target = resolveTarget(qr as QrCode);
  return NextResponse.redirect(target, { status: 302 });
}
