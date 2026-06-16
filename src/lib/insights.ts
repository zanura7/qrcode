import type { SeriesPoint } from "@/components/charts";

const MYT_OFFSET_MS = 8 * 60 * 60 * 1000;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type Granularity = "hour" | "day" | "month";
export type RangePreset = "today" | "7d" | "30d" | "12m" | "custom";

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today (hourly)" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "12m", label: "Last 12 months" },
  { value: "custom", label: "Custom range" },
];

export interface ResolvedRange {
  preset: RangePreset;
  startISO: string;
  /** Exclusive upper bound. */
  endISO: string;
  granularity: Granularity;
  label: string;
  from?: string;
  to?: string;
}

/** MYT calendar parts for an instant. */
function mytParts(date: Date) {
  const d = new Date(date.getTime() + MYT_OFFSET_MS);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1, // 1-12
    d: d.getUTCDate(),
    h: d.getUTCHours(),
  };
}

/** UTC ISO for a MYT wall-clock date/time. */
function mytToUtcISO(y: number, m: number, d: number, h = 0): string {
  return new Date(Date.UTC(y, m - 1, d, h) - MYT_OFFSET_MS).toISOString();
}

function parseDateInput(value?: string): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return { y: +match[1], m: +match[2], d: +match[3] };
}

export function resolveRange(input: {
  range?: string;
  from?: string;
  to?: string;
  now?: Date;
}): ResolvedRange {
  const now = input.now ?? new Date();
  const today = mytParts(now);
  const endISO = new Date(now.getTime() + 1000).toISOString(); // inclusive of "now"

  const preset: RangePreset =
    input.range === "7d" ||
    input.range === "30d" ||
    input.range === "12m" ||
    input.range === "custom"
      ? input.range
      : "today";

  if (preset === "custom") {
    const from = parseDateInput(input.from);
    const to = parseDateInput(input.to);
    if (from && to) {
      const startISO = mytToUtcISO(from.y, from.m, from.d);
      // exclusive end = start of day after `to`
      const endExclusive = new Date(
        Date.UTC(to.y, to.m - 1, to.d + 1) - MYT_OFFSET_MS,
      ).toISOString();
      const spanDays =
        (Date.UTC(to.y, to.m - 1, to.d) - Date.UTC(from.y, from.m - 1, from.d)) /
        86_400_000;
      return {
        preset,
        startISO,
        endISO: endExclusive,
        granularity: spanDays > 62 ? "month" : "day",
        label: `${input.from} → ${input.to}`,
        from: input.from,
        to: input.to,
      };
    }
    // Incomplete custom range → fall back to last 30 days.
    return {
      preset,
      startISO: mytToUtcISO(today.y, today.m, today.d - 29),
      endISO,
      granularity: "day",
      label: "Last 30 days",
      from: input.from,
      to: input.to,
    };
  }

  if (preset === "today") {
    return {
      preset,
      startISO: mytToUtcISO(today.y, today.m, today.d),
      endISO,
      granularity: "hour",
      label: "Today",
    };
  }

  if (preset === "12m") {
    return {
      preset,
      startISO: new Date(
        Date.UTC(today.y, today.m - 1 - 11, 1) - MYT_OFFSET_MS,
      ).toISOString(),
      endISO,
      granularity: "month",
      label: "Last 12 months",
    };
  }

  const days = preset === "7d" ? 6 : 29;
  return {
    preset,
    startISO: mytToUtcISO(today.y, today.m, today.d - days),
    endISO,
    granularity: preset === "7d" ? "day" : "day",
    label: preset === "7d" ? "Last 7 days" : "Last 30 days",
  };
}

/** Group scans into an ordered, gap-filled time series (MYT-aligned). */
export function buildTimeSeries(
  scans: { scanned_at: string }[],
  range: ResolvedRange,
): SeriesPoint[] {
  const counts = new Map<string, number>();
  for (const s of scans) {
    const p = mytParts(new Date(s.scanned_at));
    const key =
      range.granularity === "hour"
        ? String(p.h).padStart(2, "0")
        : range.granularity === "month"
          ? `${p.y}-${String(p.m).padStart(2, "0")}`
          : `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: SeriesPoint[] = [];

  if (range.granularity === "hour") {
    for (let h = 0; h < 24; h++) {
      const key = String(h).padStart(2, "0");
      points.push({ label: `${key}:00`, value: counts.get(key) ?? 0 });
    }
    return points;
  }

  const start = new Date(range.startISO);
  const end = new Date(range.endISO);

  if (range.granularity === "month") {
    const s = mytParts(start);
    let y = s.y;
    let m = s.m;
    const endP = mytParts(end);
    while (y < endP.y || (y === endP.y && m <= endP.m)) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      points.push({ label: `${MONTHS[m - 1]} ${String(y).slice(2)}`, value: counts.get(key) ?? 0 });
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return points;
  }

  // day granularity
  const s = mytParts(start);
  const cursor = new Date(Date.UTC(s.y, s.m - 1, s.d));
  const endDayUtc = Date.UTC(
    mytParts(new Date(end.getTime() - 1)).y,
    mytParts(new Date(end.getTime() - 1)).m - 1,
    mytParts(new Date(end.getTime() - 1)).d,
  );
  while (cursor.getTime() <= endDayUtc) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth() + 1;
    const d = cursor.getUTCDate();
    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    points.push({ label: `${d} ${MONTHS[m - 1]}`, value: counts.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}
