import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Clock, MapPin, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BreakdownBars } from "@/components/breakdown-bars";
import { StatCard } from "@/components/stat-card";
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
import { QrDesigner } from "@/components/qr-designer";
import { QrTypeBadge } from "@/components/qr-type-badge";
import { QrForm } from "../qr-form";
import { LinkHubManager } from "../link-hub-manager";
import { DeleteQrButton } from "../delete-qr-button";
import { updateQr } from "../actions";
import { appUrl, formatDate, malaysiaDayStartISO } from "@/lib/utils";
import { type LinkHubItem, type QrCode } from "@/lib/types";

export const dynamic = "force-dynamic";

function tally(rows: { [key: string]: string | null }[], key: string) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const value = row[key] || "Unknown";
    map.set(value, (map.get(value) ?? 0) + 1);
  });
  return Array.from(map, ([label, value]) => ({ label, value }));
}

export default async function QrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const requestHeaders = await headers();
  const supabase = await createClient();

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!qr) notFound();
  const qrCode = qr as QrCode;

  let items: LinkHubItem[] = [];
  if (qrCode.type === "link_hub") {
    const { data } = await supabase
      .from("link_hub_items")
      .select("*")
      .eq("qr_code_id", id)
      .order("sort_order", { ascending: true });
    items = (data ?? []) as LinkHubItem[];
  }

  const { data: scans } = await supabase
    .from("qr_scans")
    .select("scanned_at, browser, device, os, country, region, city, referrer")
    .eq("qr_code_id", id)
    .order("scanned_at", { ascending: false });

  const allScans = scans ?? [];
  const scanCount = allScans.length;
  const scansToday = allScans.filter(
    (scan) => scan.scanned_at >= malaysiaDayStartISO(),
  ).length;
  const lastScan = allScans[0]?.scanned_at ?? null;
  const byDevice = tally(allScans, "device");
  const byOs = tally(allScans, "os");
  const byCountry = tally(allScans, "country");

  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
      ? "http"
      : "https");
  const requestOrigin = host ? `${protocol}://${host}` : undefined;
  const shortUrl = `${appUrl(requestOrigin)}/r/${qrCode.short_code}`;
  const boundUpdate = updateQr.bind(null, id);

  return (
    <div>
      <PageHeader title={qrCode.name} description={`Short link: /r/${qrCode.short_code}`}>
        <Button variant="outline" asChild>
          <Link href="/qr">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Edit details</CardTitle>
                <div className="flex items-center gap-2">
                  <QrTypeBadge type={qrCode.type} />
                  {qrCode.status ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                Changing the target keeps the same printed QR — that&apos;s the
                point of dynamic QR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QrForm
                action={boundUpdate}
                initial={qrCode}
                submitLabel="Save changes"
              />
            </CardContent>
          </Card>

          {qrCode.type === "link_hub" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Link Hub items</CardTitle>
                <CardDescription>
                  Public page:{" "}
                  <Link
                    href={`/hub/${qrCode.short_code}`}
                    target="_blank"
                    className="underline"
                  >
                    /hub/{qrCode.short_code}
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LinkHubManager qrCodeId={id} items={items} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR analytics</CardTitle>
              <CardDescription>
                Scan performance and audience details for this QR code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Scans" value={scanCount} icon={ScanLine} />
                <StatCard
                  title="Scans Today"
                  value={scansToday}
                  icon={CalendarClock}
                />
                <StatCard
                  title="Countries"
                  value={
                    byCountry.filter((item) => item.label !== "Unknown").length
                  }
                  icon={MapPin}
                />
                <StatCard
                  title="Last Scan"
                  value={lastScan ? formatDate(lastScan).split(",")[0] : "-"}
                  hint={lastScan ? formatDate(lastScan) : "No scans yet"}
                  icon={Clock}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div>
                  <h3 className="mb-3 text-sm font-semibold">By Device</h3>
                  <BreakdownBars data={byDevice} />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">By OS</h3>
                  <BreakdownBars data={byOs} />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">By Location</h3>
                  <BreakdownBars data={byCountry} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent scans</CardTitle>
              <CardDescription>
                Latest scan events for this QR code.
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
                      <TableHead>Time</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Referrer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allScans.slice(0, 50).map((scan, index) => {
                      const location = [scan.city, scan.region, scan.country]
                        .filter(Boolean)
                        .join(", ");

                      return (
                        <TableRow key={`${scan.scanned_at}-${index}`}>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(scan.scanned_at)}
                          </TableCell>
                          <TableCell>{scan.device ?? "-"}</TableCell>
                          <TableCell>{scan.os ?? "-"}</TableCell>
                          <TableCell>{scan.browser ?? "-"}</TableCell>
                          <TableCell>{location || "-"}</TableCell>
                          <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                            {scan.referrer ?? "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <DeleteQrButton id={id} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR code &amp; design</CardTitle>
              <CardDescription>
                Customize colors, style and logo, then download &amp; print.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QrDesigner
                url={shortUrl}
                fileName={qrCode.short_code}
                qrId={qrCode.id}
                initialDesign={qrCode.qr_design}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total scans</div>
              <div className="text-3xl font-bold">{scanCount ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
