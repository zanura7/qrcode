import { createAdminClient } from "@/lib/supabase/admin";
import { detectBrowser, detectDevice } from "@/lib/user-agent";

/** Record a scan. Best-effort — never throws into the redirect path. */
export async function logScan(
  qrCodeId: string,
  headers: Headers,
): Promise<void> {
  try {
    const userAgent = headers.get("user-agent") ?? "";
    const forwarded = headers.get("x-forwarded-for") ?? "";
    const ip =
      forwarded.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      null;
    const referrer = headers.get("referer") ?? null;

    const admin = createAdminClient();
    await admin.from("qr_scans").insert({
      qr_code_id: qrCodeId,
      browser: detectBrowser(userAgent),
      device: detectDevice(userAgent),
      user_agent: userAgent || null,
      ip_address: ip,
      referrer,
    });
  } catch (err) {
    console.error("logScan failed:", err);
  }
}
