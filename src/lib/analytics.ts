import { createAdminClient } from "@/lib/supabase/admin";
import { detectBrowser, detectDevice, detectOS } from "@/lib/user-agent";

function headerValue(headers: Headers, names: string[]): string | null {
  for (const name of names) {
    const value = headers.get(name);
    if (value) return value;
  }
  return null;
}

function decodedHeaderValue(headers: Headers, names: string[]): string | null {
  const value = headerValue(headers, names);
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Record a scan. Best-effort — never throws into the redirect path.
 * Returns the new scan id (so the interstitial can attach GPS later), or null.
 */
export async function logScan(
  qrCodeId: string,
  headers: Headers,
): Promise<string | null> {
  try {
    const userAgent = headers.get("user-agent") ?? "";
    const forwarded = headers.get("x-forwarded-for") ?? "";
    const ip =
      forwarded.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      null;
    const referrer = headers.get("referer") ?? null;

    const admin = createAdminClient();
    const { data } = await admin
      .from("qr_scans")
      .insert({
        qr_code_id: qrCodeId,
        browser: detectBrowser(userAgent),
        device: detectDevice(userAgent),
        os: detectOS(userAgent),
        country: headerValue(headers, ["x-vercel-ip-country", "cf-ipcountry"]),
        region: decodedHeaderValue(headers, ["x-vercel-ip-country-region"]),
        city: decodedHeaderValue(headers, ["x-vercel-ip-city"]),
        location_source: "ip",
        user_agent: userAgent || null,
        ip_address: ip,
        referrer,
      })
      .select("id")
      .single();
    return data?.id ?? null;
  } catch (err) {
    console.error("logScan failed:", err);
    return null;
  }
}
