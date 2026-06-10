import Link from "next/link";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDate } from "@/lib/utils";
import {
  REPORT_RANGES,
  normalizeRange,
  rangeStart,
  rangeLabel,
} from "@/lib/reports";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports · QR Manager" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await searchParams;
  const range = normalizeRange(rawRange);
  const start = rangeStart(range);

  const supabase = await createClient();

  const { data: scans } = await supabase
    .from("qr_scans")
    .select("qr_code_id, scanned_at, browser, device")
    .gte("scanned_at", start)
    .order("scanned_at", { ascending: false });

  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("id, name, short_code, type");

  const allScans = scans ?? [];
  const qrMap = new Map((qrCodes ?? []).map((q) => [q.id, q]));

  // Group by QR
  const perQr = new Map<string, number>();
  allScans.forEach((s) =>
    perQr.set(s.qr_code_id, (perQr.get(s.qr_code_id) ?? 0) + 1),
  );

  const rows = Array.from(perQr, ([id, count]) => ({
    qr: qrMap.get(id),
    count,
  }))
    .filter((r) => r.qr)
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <PageHeader
        title="Reports"
        description={`Scan report — ${rangeLabel(range)}.`}
      >
        <Button asChild>
          <a href={`/api/reports/export?range=${range}`}>
            <Download className="size-4" />
            Export CSV
          </a>
        </Button>
      </PageHeader>

      <div className="mb-6 flex gap-2">
        {REPORT_RANGES.map((r) => (
          <Button
            key={r.value}
            asChild
            variant={r.value === range ? "default" : "outline"}
            size="sm"
          >
            <Link href={`/reports?range=${r.value}`}>{r.label}</Link>
          </Button>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total scans</div>
            <div className="text-3xl font-bold">{allScans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">QR codes scanned</div>
            <div className="text-3xl font-bold">{perQr.size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Period</div>
            <div className={cn("text-3xl font-bold")}>{rangeLabel(range)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scans by QR code</CardTitle>
          <CardDescription>{rangeLabel(range)} summary.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No scans in this period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead className="text-right">Scans</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.qr!.id}>
                    <TableCell className="font-medium">{r.qr!.name}</TableCell>
                    <TableCell>
                      <Badge variant="muted">{r.qr!.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      /r/{r.qr!.short_code}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.count}
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
          <CardTitle className="text-lg">Scan log</CardTitle>
          <CardDescription>
            Individual scans in this period (latest first).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {allScans.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No scans in this period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Scanned At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allScans.slice(0, 100).map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {qrMap.get(s.qr_code_id)?.name ?? "—"}
                    </TableCell>
                    <TableCell>{s.device ?? "—"}</TableCell>
                    <TableCell>{s.browser ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(s.scanned_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {allScans.length > 100 && (
            <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
              Showing latest 100 of {allScans.length}. Export CSV for the full
              log.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
