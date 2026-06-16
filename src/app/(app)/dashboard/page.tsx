import Link from "next/link";
import { QrCode, ScanLine, CalendarClock, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type QrType } from "@/lib/types";
import { QrTypeBadge } from "@/components/qr-type-badge";
import { malaysiaDayStartISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: totalQr }, { count: totalScan }, { count: scanToday }] =
    await Promise.all([
      supabase
        .from("qr_codes")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase.from("qr_scans").select("*", { count: "exact", head: true }),
      supabase
        .from("qr_scans")
        .select("*", { count: "exact", head: true })
        .gte("scanned_at", malaysiaDayStartISO()),
    ]);

  // Top QR codes by scan count
  const { data: scans } = await supabase.from("qr_scans").select("qr_code_id");
  const counts = new Map<string, number>();
  (scans ?? []).forEach((s) => {
    counts.set(s.qr_code_id, (counts.get(s.qr_code_id) ?? 0) + 1);
  });

  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("id, name, type, short_code")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const top = (qrCodes ?? [])
    .map((q) => ({ ...q, scans: counts.get(q.id) ?? 0 }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your QR codes and scan activity."
      >
        <Button asChild>
          <Link href="/qr/new">Create QR</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total QR" value={totalQr ?? 0} icon={QrCode} />
        <StatCard title="Total Scans" value={totalScan ?? 0} icon={ScanLine} />
        <StatCard
          title="Scans Today"
          value={scanToday ?? 0}
          icon={CalendarClock}
        />
        <StatCard
          title="Most Popular"
          value={top[0]?.scans ?? 0}
          hint={top[0]?.name ?? "No scans yet"}
          icon={TrendingUp}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Top QR Codes</CardTitle>
          <CardDescription>Ranked by total scans.</CardDescription>
        </CardHeader>
        <CardContent>
          {top.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No QR codes yet.{" "}
              <Link href="/qr/new" className="underline">
                Create your first one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y">
              {top.map((q, i) => (
                <li
                  key={q.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <Link
                        href={`/qr/${q.id}`}
                        className="font-medium hover:underline"
                      >
                        {q.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        /r/{q.short_code}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <QrTypeBadge type={q.type as QrType} />
                    <span className="text-sm font-semibold tabular-nums">
                      {q.scans} scans
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
