import { malaysiaDayStartISO } from "@/lib/utils";

export type ReportRange = "daily" | "weekly" | "monthly";

export const REPORT_RANGES: { value: ReportRange; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function normalizeRange(value: string | undefined): ReportRange {
  if (value === "weekly" || value === "monthly") return value;
  return "daily";
}

/** Start of the reporting window (UTC ISO string, aligned to Malaysia time). */
export function rangeStart(range: ReportRange): string {
  if (range === "weekly") return malaysiaDayStartISO(6); // last 7 days inclusive
  if (range === "monthly") return malaysiaDayStartISO(29); // last 30 days inclusive
  return malaysiaDayStartISO(); // today
}

export function rangeLabel(range: ReportRange): string {
  switch (range) {
    case "daily":
      return "Today";
    case "weekly":
      return "Last 7 days";
    case "monthly":
      return "Last 30 days";
  }
}

/** Convert rows to a CSV string with proper escaping. */
export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) lines.push(row.map(escape).join(","));
  return lines.join("\r\n");
}
