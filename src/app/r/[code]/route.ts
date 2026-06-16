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
    .is("deleted_at", null)
    .maybeSingle();

  if (!qr) {
    return new NextResponse("QR code not found.", { status: 404 });
  }

  if (!qr.status) {
    return new NextResponse("This QR code is currently inactive.", {
      status: 410,
    });
  }

  // Record the scan (IP-based) before redirecting (serverless-safe).
  const scanId = await logScan(qr.id, request.headers);

  const target = resolveTarget(qr as QrCode, request.nextUrl.origin);
  return new NextResponse(interstitialHtml(target, scanId), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Lightweight redirect interstitial: tries to capture precise device GPS,
 * attaches it to the scan, then forwards to the target. Falls back to an
 * immediate redirect when JS is off or location is denied/unavailable.
 */
function interstitialHtml(target: string, scanId: string | null): string {
  const safeHref = escapeHtml(target);
  const targetJson = JSON.stringify(target);
  const scanJson = JSON.stringify(scanId);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Opening link…</title>
<noscript><meta http-equiv="refresh" content="0;url=${safeHref}"></noscript>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;color:#0f172a;padding:24px}
  .card{max-width:360px;width:100%;text-align:center;background:#fff;border:1px solid #e2e8f0;
    border-radius:16px;padding:32px 24px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .spinner{width:36px;height:36px;margin:0 auto 16px;border:3px solid #e2e8f0;border-top-color:#2563eb;
    border-radius:50%;animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  h1{font-size:16px;margin:0 0 6px}
  p{font-size:13px;color:#64748b;margin:0 0 16px}
  a.btn{display:inline-block;font-size:13px;font-weight:600;color:#2563eb;text-decoration:none}
</style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h1>Opening link…</h1>
    <p>Please wait a moment.</p>
    <a class="btn" id="continue" href="${safeHref}">Continue now →</a>
  </div>
<script>
(function(){
  var TARGET=${targetJson},SCAN_ID=${scanJson},done=false;
  function go(){ if(done) return; done=true; window.location.replace(TARGET); }
  async function reverseGeocode(lat,lng){
    try{
      var c=new AbortController(); setTimeout(function(){c.abort()},2000);
      var r=await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude="+lat+"&longitude="+lng+"&localityLanguage=en",{signal:c.signal});
      if(!r.ok) return {};
      var d=await r.json();
      return {country:d.countryName||null,region:d.principalSubdivision||null,city:d.city||d.locality||null};
    }catch(e){ return {}; }
  }
  async function report(pos){
    try{
      var lat=pos.coords.latitude,lng=pos.coords.longitude;
      var loc=await reverseGeocode(lat,lng);
      await fetch("/api/scan-geo",{method:"POST",headers:{"Content-Type":"application/json"},keepalive:true,
        body:JSON.stringify({scanId:SCAN_ID,latitude:lat,longitude:lng,accuracy:pos.coords.accuracy,
          country:loc.country,region:loc.region,city:loc.city})});
    }catch(e){}
    go();
  }
  setTimeout(go,5000); // hard fallback
  if(!SCAN_ID || !navigator.geolocation){ setTimeout(go,150); return; }
  try{
    navigator.geolocation.getCurrentPosition(report, go, {enableHighAccuracy:false,timeout:4000,maximumAge:600000});
  }catch(e){ go(); }
})();
</script>
</body>
</html>`;
}
