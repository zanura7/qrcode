import Link from "next/link";
import { Clock, Repeat, ScanLine, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { BreakdownBars } from "@/components/breakdown-bars";
import {
  ScansAreaChart,
  MetricBarChart,
  BreakdownPieChart,
} from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { RANGE_PRESETS, resolveRange, buildTimeSeries } from "@/lib/insights";
import { QR_TYPE_LABELS, type QrType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics · QR Manager" };

type ScanRow = {
  qr_code_id: string;
  browser: string | null;
  device: string | null;
  os: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  ip_address: string | null;
  location_source: "ip" | "gps" | null;
  scanned_at: string;
  qrType: QrType | null;
  campaign: string | null;
};

const FILTER_KEYS = [
  "device",
  "browser",
  "country",
  "region",
  "type",
  "campaign",
] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

function tally(rows: ScanRow[], key: keyof ScanRow) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const v = (r[key] as string) || "Unknown";
    map.set(v, (map.get(v) ?? 0) + 1);
  });
  return Array.from(map, ([label, value]) => ({ label, value })).sort(
    (a, b) => b.value - a.value,
  );
}

function distinct(rows: ScanRow[], key: keyof ScanRow): string[] {
  const set = new Set<string>();
  rows.forEach((r) => {
    const v = r[key];
    if (typeof v === "string" && v.trim()) set.add(v);
  });
  return Array.from(set).sort();
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const range = resolveRange(sp);
  const filters: Record<FilterKey, string> = {
    device: sp.device ?? "",
    browser: sp.browser ?? "",
    country: sp.country ?? "",
    region: sp.region ?? "",
    type: sp.type ?? "",
    campaign: sp.campaign ?? "",
  };

  const supabase = await createClient();

  const [{ data: scansData }, { data: qrCodes }] = await Promise.all([
    supabase
      .from("qr_scans")
      .select(
        "qr_code_id, browser, device, os, country, region, city, ip_address, location_source, scanned_at",
      )
      .gte("scanned_at", range.startISO)
      .lt("scanned_at", range.endISO)
      .order("scanned_at", { ascending: false }),
    supabase
      .from("qr_codes")
      .select("id, name, short_code, type, campaign")
      .is("deleted_at", null),
  ]);

  const qrMeta = new Map(
    (qrCodes ?? []).map((q) => [
      q.id,
      { name: q.name, short_code: q.short_code, type: q.type, campaign: q.campaign },
    ]),
  );

  // Annotate each scan with its QR's type & campaign for filtering/breakdowns.
  const inRange: ScanRow[] = (scansData ?? []).map((s) => {
    const meta = qrMeta.get(s.qr_code_id);
    return {
      ...s,
      qrType: (meta?.type as QrType) ?? null,
      campaign: meta?.campaign ?? null,
    };
  });

  // Options for the filter dropdowns (from the unfiltered in-range set).
  const options = {
    device: distinct(inRange, "device"),
    browser: distinct(inRange, "browser"),
    country: distinct(inRange, "country"),
    region: distinct(inRange, "region"),
    type: distinct(inRange, "qrType"),
    campaign: distinct(inRange, "campaign"),
  };

  // Apply categorical filters.
  const allScans = inRange.filter((s) => {
    if (filters.device && s.device !== filters.device) return false;
    if (filters.browser && s.browser !== filters.browser) return false;
    if (filters.country && s.country !== filters.country) return false;
    if (filters.region && s.region !== filters.region) return false;
    if (filters.type && s.qrType !== filters.type) return false;
    if (filters.campaign && s.campaign !== filters.campaign) return false;
    return true;
  });

  const total = allScans.length;
  const uniqueVisitors = new Set(
    allScans.map((s) => s.ip_address).filter(Boolean),
  ).size;
  const repeat = Math.max(total - uniqueVisitors, 0);
  const lastScan = allScans[0]?.scanned_at ?? null;

  const series = buildTimeSeries(allScans, range);
  const byDevice = tally(allScans, "device");
  const byBrowser = tally(allScans, "browser");
  const byOs = tally(allScans, "os");
  const byCountry = tally(allScans, "country");
  const byState = tally(allScans, "region");
  const byType = Array.from(
    allScans.reduce((m, s) => {
      const label = s.qrType ? QR_TYPE_LABELS[s.qrType] : "Unknown";
      return m.set(label, (m.get(label) ?? 0) + 1);
    }, new Map<string, number>()),
    ([label, value]) => ({ label, value }),
  ).sort((a, b) => b.value - a.value);

  const perQr = new Map<string, { count: number; last: string }>();
  allScans.forEach((s) => {
    const cur = perQr.get(s.qr_code_id);
    if (cur) cur.count++;
    else perQr.set(s.qr_code_id, { count: 1, last: s.scanned_at });
  });
  const perQrRows = Array.from(perQr, ([id, v]) => ({
    qr: qrMeta.get(id),
    id,
    ...v,
  }))
    .filter((r) => r.qr)
    .sort((a, b) => b.count - a.count);

  const activeFilterCount = FILTER_KEYS.filter((k) => filters[k]).length;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Scan activity across all your QR codes."
      />

      {/* Filter panel */}
      <Card className="mb-6 p-4">
        <form action="/analytics" className="space-y-3">
          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="range">Period</Label>
              <Select id="range" name="range" defaultValue={range.preset}>
                {RANGE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="from">From (custom)</Label>
              <Input id="from" name="from" type="date" defaultValue={range.from ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To (custom)</Label>
              <Input id="to" name="to" type="date" defaultValue={range.to ?? ""} />
            </div>
            <FilterSelect
              name="type"
              label="QR Type"
              value={filters.type}
              options={options.type}
              renderLabel={(v) => QR_TYPE_LABELS[v as QrType] ?? v}
            />
            <FilterSelect
              name="campaign"
              label="Campaign"
              value={filters.campaign}
              options={options.campaign}
            />
            <FilterSelect
              name="device"
              label="Device"
              value={filters.device}
              options={options.device}
            />
            <FilterSelect
              name="browser"
              label="Browser"
              value={filters.browser}
              options={options.browser}
            />
            <FilterSelect
              name="country"
              label="Country"
              value={filters.country}
              options={options.country}
            />
            <FilterSelect
              name="region"
              label="State / Region"
              value={filters.region}
              options={options.region}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="outline">
              Apply filters
            </Button>
            {activeFilterCount > 0 && (
              <Button asChild type="button" variant="ghost">
                <Link href="/analytics">Reset</Link>
              </Button>
            )}
            <p className="ml-auto text-xs text-muted-foreground">
              <span className="font-medium">{range.label}</span>
              {activeFilterCount > 0 ? ` · ${activeFilterCount} filter(s)` : ""} ·
              Malaysia time (UTC+8)
            </p>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Scans" value={total} icon={ScanLine} />
        <StatCard title="Unique Visitors" value={uniqueVisitors} icon={Users} />
        <StatCard title="Repeat Scans" value={repeat} icon={Repeat} />
        <StatCard
          title="Last Scan"
          value={lastScan ? formatDate(lastScan).split(",")[0] : "—"}
          hint={lastScan ? formatDate(lastScan) : "No scans yet"}
          icon={Clock}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Scans Over Time</CardTitle>
          <CardDescription>
            {range.granularity === "hour"
              ? "Scans by hour of day."
              : range.granularity === "month"
                ? "Scans per month."
                : "Scans per day."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No scans match these filters.
            </p>
          ) : (
            <ScansAreaChart data={series} />
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Device</CardTitle>
            <CardDescription>Share of scans per device type.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownPieChart data={byDevice} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Browser</CardTitle>
            <CardDescription>Scans per browser.</CardDescription>
          </CardHeader>
          <CardContent>
            {byBrowser.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No data for this selection.
              </p>
            ) : (
              <MetricBarChart data={byBrowser.slice(0, 8)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By QR Type</CardTitle>
            <CardDescription>Scans grouped by QR type.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={byType} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Operating System</CardTitle>
            <CardDescription>OS detected from each scan.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={byOs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Country</CardTitle>
            <CardDescription>From hosting/CDN IP headers.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={byCountry} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By State / Region</CardTitle>
            <CardDescription>Approximate, from IP geolocation.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={byState} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Per QR Code</CardTitle>
          <CardDescription>
            Scan totals and last activity ({range.label}).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {perQrRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No scans match these filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead className="text-right">Scans</TableHead>
                  <TableHead>Last Scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perQrRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link href={`/qr/${r.id}`} className="hover:underline">
                        {r.qr!.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="muted" className="font-mono">
                        /r/{r.qr!.short_code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.count}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(r.last)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Recent Scan Log</CardTitle>
          <CardDescription>
            Latest scans with device, OS, browser, and location metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {allScans.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No scans match these filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Scanned At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allScans.slice(0, 50).map((scan, index) => {
                  const location = [scan.city, scan.region, scan.country]
                    .filter(Boolean)
                    .join(", ");
                  const meta = qrMeta.get(scan.qr_code_id);
                  return (
                    <TableRow
                      key={`${scan.qr_code_id}-${scan.scanned_at}-${index}`}
                    >
                      <TableCell className="font-medium">
                        {meta ? (
                          <Link
                            href={`/qr/${scan.qr_code_id}`}
                            className="hover:underline"
                          >
                            {meta.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{scan.device ?? "Unknown"}</TableCell>
                      <TableCell>{scan.os ?? "Unknown"}</TableCell>
                      <TableCell>{scan.browser ?? "Unknown"}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          {location || "Unknown"}
                          {scan.location_source === "gps" && (
                            <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                              GPS
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(scan.scanned_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
  renderLabel,
}: {
  name: string;
  label: string;
  value: string;
  options: string[];
  renderLabel?: (v: string) => string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Select id={name} name={name} defaultValue={value}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {renderLabel ? renderLabel(o) : o}
          </option>
        ))}
      </Select>
    </div>
  );
}
