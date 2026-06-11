import Link from "next/link";
import { Plus, QrCode as QrCodeIcon, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QrRowActions } from "./qr-row-actions";
import { formatDate } from "@/lib/utils";
import {
  QR_TYPE_LABELS,
  QR_TYPES,
  URL_QR_TYPES,
  type QrCode,
  type QrType,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "QR Codes - QR Manager" };

function destinationPreview(qr: QrCode): string {
  if (URL_QR_TYPES.includes(qr.type)) return qr.target_url ?? "-";
  if (qr.type === "whatsapp") return qr.whatsapp_number ?? "-";
  if (qr.type === "phone" || qr.type === "sms") return qr.phone_number ?? "-";
  if (qr.type === "email") return qr.email_address ?? "-";
  if (qr.type === "text") return qr.content_text ?? "-";
  if (qr.type === "wifi") return qr.wifi_ssid ?? "-";
  if (qr.type === "vcard") return qr.contact_name ?? "-";
  if (qr.type === "calendar") return qr.event_title ?? "-";
  return `Link Hub /r/${qr.short_code}`;
}

export default async function QrListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
}) {
  const { q, type, status } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const typeFilter = QR_TYPES.includes(type as QrType)
    ? (type as QrType)
    : "all";
  const statusFilter =
    status === "active" || status === "inactive" ? status : "all";
  const hasFilters =
    Boolean(query) || typeFilter !== "all" || statusFilter !== "all";
  const supabase = await createClient();

  const { data: qrCodesData } = await supabase
    .from("qr_codes")
    .select("*")
    .order("created_at", { ascending: false });

  const qrCodes = (qrCodesData ?? []) as QrCode[];
  const filteredQrCodes = qrCodes.filter((qr) => {
    const matchesQuery = query
      ? [
          qr.name,
          qr.short_code,
          qr.type,
          qr.target_url,
          qr.whatsapp_number,
          qr.whatsapp_message,
          qr.content_text,
          qr.phone_number,
          qr.email_address,
          qr.wifi_ssid,
          qr.contact_name,
          qr.event_title,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))
      : true;
    const matchesType = typeFilter === "all" || qr.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? qr.status : !qr.status);

    return matchesQuery && matchesType && matchesStatus;
  });

  const { data: scans } = await supabase.from("qr_scans").select("qr_code_id");
  const counts = new Map<string, number>();
  (scans ?? []).forEach((scan) =>
    counts.set(scan.qr_code_id, (counts.get(scan.qr_code_id) ?? 0) + 1),
  );

  return (
    <div>
      <PageHeader title="QR Codes" description="Search, manage, and monitor all QR codes.">
        <Button asChild>
          <Link href="/qr/new">
            <Plus className="size-4" />
            Create QR
          </Link>
        </Button>
      </PageHeader>

      <Card className="mb-4 p-4">
        <form action="/qr" className="grid gap-3 lg:grid-cols-[1fr_180px_160px_auto_auto]">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by name, short code, type, target, or WhatsApp number"
              className="pl-9"
            />
          </div>
          <Select name="type" defaultValue={typeFilter}>
            <option value="all">All types</option>
            {QR_TYPES.map((value) => (
              <option key={value} value={value}>
                {QR_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
          <Select name="status" defaultValue={statusFilter}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Button type="submit" variant="outline">
            Search
          </Button>
          {hasFilters && (
            <Button asChild type="button" variant="ghost">
              <Link href="/qr">Clear</Link>
            </Button>
          )}
        </form>
        <div className="mt-3 text-xs text-muted-foreground">
          Showing {filteredQrCodes.length} of {qrCodes.length} QR codes.
        </div>
      </Card>

      <Card>
        {qrCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <QrCodeIcon className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No QR codes yet.</p>
            <Button asChild>
              <Link href="/qr/new">
                <Plus className="size-4" />
                Create your first QR
              </Link>
            </Button>
          </div>
        ) : filteredQrCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Search className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No QR codes match this search.
            </p>
            <Button asChild variant="outline">
              <Link href="/qr">Clear search</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Short Code</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQrCodes.map((qr) => (
                <TableRow key={qr.id}>
                  <TableCell className="font-medium">
                    <Link href={`/qr/${qr.id}`} className="hover:underline">
                      {qr.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="muted">
                      {QR_TYPE_LABELS[qr.type as QrType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    /r/{qr.short_code}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                    {destinationPreview(qr)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {counts.get(qr.id) ?? 0}
                  </TableCell>
                  <TableCell>
                    {qr.status ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(qr.updated_at)}
                  </TableCell>
                  <TableCell>
                    <QrRowActions id={qr.id} status={qr.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
