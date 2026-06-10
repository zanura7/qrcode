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

/** Start of the reporting window (UTC ISO string). */
export function rangeStart(range: ReportRange): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "daily") {
    // today
  } else if (range === "weekly") {
    d.setDate(d.getDate() - 6); // last 7 days inclusive
  } else {
    d.setDate(d.getDate() - 29); // last 30 days inclusive
  }
  return d.toISOString();
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
