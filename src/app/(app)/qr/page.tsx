import Link from "next/link";
import { Plus, QrCode as QrCodeIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { QR_TYPE_LABELS, type QrType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "QR Codes · QR Manager" };

export default async function QrListPage() {
  const supabase = await createClient();

  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: scans } = await supabase.from("qr_scans").select("qr_code_id");
  const counts = new Map<string, number>();
  (scans ?? []).forEach((s) =>
    counts.set(s.qr_code_id, (counts.get(s.qr_code_id) ?? 0) + 1),
  );

  return (
    <div>
      <PageHeader title="QR Codes" description="Manage all your QR codes.">
        <Button asChild>
          <Link href="/qr/new">
            <Plus className="size-4" />
            Create QR
          </Link>
        </Button>
      </PageHeader>

      <Card>
        {!qrCodes || qrCodes.length === 0 ? (
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
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Short Code</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qrCodes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">
                    <Link href={`/qr/${q.id}`} className="hover:underline">
                      {q.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="muted">
                      {QR_TYPE_LABELS[q.type as QrType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    /r/{q.short_code}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {counts.get(q.id) ?? 0}
                  </TableCell>
                  <TableCell>
                    {q.status ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(q.created_at)}
                  </TableCell>
                  <TableCell>
                    <QrRowActions id={q.id} status={q.status} />
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
