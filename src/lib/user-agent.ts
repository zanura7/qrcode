/** Lightweight UA parsing — no external dependency. */

export function detectBrowser(ua: string): string {
  if (!ua) return "Unknown";
  if (/edg/i.test(ua)) return "Edge";
  if (/opr|opera/i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return "Safari";
  if (/msie|trident/i.test(ua)) return "Internet Explorer";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  return "Other";
}

export function detectDevice(ua: string): string {
  if (!ua) return "Unknown";
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "Tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return "Mobile";
  if (/android/i.test(ua)) return "Tablet";
  return "Desktop";
}

export function detectOS(ua: string): string {
  if (!ua) return "Unknown";
  if (/windows phone/i.test(ua)) return "Windows Phone";
  if (/windows nt/i.test(ua)) return "Windows";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}
