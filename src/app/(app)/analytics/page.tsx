import Link from "next/link";
import {
  CalendarClock,
  Clock,
  MapPin,
  MonitorCog,
  ScanLine,
  Smartphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { BreakdownBars } from "@/components/breakdown-bars";
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

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics · QR Manager" };

function tally(rows: { [k: string]: string | null }[], key: string) {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const v = (r[key] as string) || "Unknown";
    map.set(v, (map.get(v) ?? 0) + 1);
  });
  return Array.from(map, ([label, value]) => ({ label, value }));
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const { data: scans } = await supabase
    .from("qr_scans")
    .select("qr_code_id, browser, device, os, country, region, city, scanned_at")
    .order("scanned_at", { ascending: false });

  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("id, name, short_code");

  const allScans = scans ?? [];
  const total = allScans.length;
  const today = startOfTodayISO();
  const scansToday = allScans.filter((s) => s.scanned_at >= today).length;
  const lastScan = allScans[0]?.scanned_at ?? null;

  const byDevice = tally(allScans, "device");
  const byBrowser = tally(allScans, "browser");
  const byOs = tally(allScans, "os");
  const byCountry = tally(allScans, "country");
  const knownCountryCount = byCountry.filter(
    (item) => item.label !== "Unknown",
  ).length;

  // Per QR aggregation
  const qrMap = new Map(
    (qrCodes ?? []).map((q) => [q.id, q]),
  );
  const perQr = new Map<string, { count: number; last: string }>();
  allScans.forEach((s) => {
    const cur = perQr.get(s.qr_code_id);
    if (cur) {
      cur.count++;
    } else {
      perQr.set(s.qr_code_id, { count: 1, last: s.scanned_at });
    }
  });

  const perQrRows = Array.from(perQr, ([id, v]) => ({
    qr: qrMap.get(id),
    ...v,
  }))
    .filter((r) => r.qr)
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Scan activity across all your QR codes."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Scans" value={total} icon={ScanLine} />
        <StatCard title="Scans Today" value={scansToday} icon={CalendarClock} />
        <StatCard
          title="Unique QR Scanned"
          value={perQr.size}
          icon={Smartphone}
        />
        <StatCard title="Countries" value={knownCountryCount} icon={MapPin} />
        <StatCard
          title="Last Scan"
          value={lastScan ? formatDate(lastScan).split(",")[0] : "—"}
          hint={lastScan ? formatDate(lastScan) : "No scans yet"}
          icon={Clock}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Device</CardTitle>
            <CardDescription>Device type of each scan.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={byDevice} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Browser</CardTitle>
            <CardDescription>Browser used for each scan.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={byBrowser} />
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
            <CardTitle className="text-lg">By Location</CardTitle>
            <CardDescription>Country from hosting/CDN headers.</CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownBars data={byCountry} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Per QR Code</CardTitle>
          <CardDescription>Scan totals and last activity.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {perQrRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No scans recorded yet.
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
                  <TableRow key={r.qr!.id}>
                    <TableCell className="font-medium">
                      <Link href={`/qr/${r.qr!.id}`} className="hover:underline">
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
              No scans recorded yet.
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
                  const qr = qrMap.get(scan.qr_code_id);

                  return (
                    <TableRow
                      key={`${scan.qr_code_id}-${scan.scanned_at}-${index}`}
                    >
                      <TableCell className="font-medium">
                        {qr ? (
                          <Link href={`/qr/${qr.id}`} className="hover:underline">
                            {qr.name}
                          </Link>
                        ) : (
                          "â€”"
                        )}
                      </TableCell>
                      <TableCell>{scan.device ?? "Unknown"}</TableCell>
                      <TableCell>{scan.os ?? "Unknown"}</TableCell>
                      <TableCell>{scan.browser ?? "Unknown"}</TableCell>
                      <TableCell>{location || "Unknown"}</TableCell>
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
