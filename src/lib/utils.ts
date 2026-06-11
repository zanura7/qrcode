import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Crockford-ish base32 alphabet (no ambiguous chars) for short codes. */
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

export function generateShortCode(length = 6): string {
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function isLocalAppUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  } catch {
    return false;
  }
}

export function appUrl(requestOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
    ? stripTrailingSlash(process.env.NEXT_PUBLIC_APP_URL)
    : "";
  const origin = requestOrigin ? stripTrailingSlash(requestOrigin) : "";

  if (configured && !isLocalAppUrl(configured)) return configured;
  if (origin) return origin;
  return configured || "http://localhost:3000";
}
