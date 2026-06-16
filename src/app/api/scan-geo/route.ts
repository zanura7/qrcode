import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanString(value: unknown, max = 120): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

function cleanCoord(value: unknown, limit: number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > limit) return null;
  return n;
}

/** Attach device GPS to a previously-logged scan. Public, best-effort. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const scanId = typeof body.scanId === "string" ? body.scanId : "";
  if (!UUID_RE.test(scanId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const latitude = cleanCoord(body.latitude, 90);
  const longitude = cleanCoord(body.longitude, 180);
  if (latitude === null || longitude === null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    latitude,
    longitude,
    accuracy: cleanCoord(body.accuracy, 1_000_000),
    location_source: "gps",
  };
  // Overwrite IP-based location only when reverse geocoding succeeded.
  const country = cleanString(body.country);
  const region = cleanString(body.region);
  const city = cleanString(body.city);
  if (country) update.country = country;
  if (region) update.region = region;
  if (city) update.city = city;

  try {
    const admin = createAdminClient();
    await admin.from("qr_scans").update(update).eq("id", scanId);
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
