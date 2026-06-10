import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeRange, rangeStart, toCsv } from "@/lib/reports";

export const dynamic = "force-dynamic";

type ScanRow = {
  scanned_at: string;
  browser: string | null;
  device: string | null;
  ip_address: string | null;
  referrer: string | null;
  qr_codes: { name: string; short_code: string; type: string } | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Guard: only authenticated admins may export.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const range = normalizeRange(
    request.nextUrl.searchParams.get("range") ?? undefined,
  );
  const start = rangeStart(range);

  const { data, error } = await supabase
    .from("qr_scans")
    .select(
      "scanned_at, browser, device, ip_address, referrer, qr_codes(name, short_code, type)",
    )
    .gte("scanned_at", start)
    .order("scanned_at", { ascending: false });

  if (error) {
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }

  const rows = (data as unknown as ScanRow[]) ?? [];
  const csv = toCsv(
    [
      "QR Name",
      "Short Code",
      "Type",
      "Device",
      "Browser",
      "IP Address",
      "Referrer",
      "Scanned At",
    ],
    rows.map((r) => [
      r.qr_codes?.name ?? "",
      r.qr_codes?.short_code ?? "",
      r.qr_codes?.type ?? "",
      r.device ?? "",
      r.browser ?? "",
      r.ip_address ?? "",
      r.referrer ?? "",
      r.scanned_at,
    ]),
  );

  const filename = `qr-report-${range}-${start.slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
