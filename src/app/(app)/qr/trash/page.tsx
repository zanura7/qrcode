import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrashRowActions } from "./trash-row-actions";
import { QrTypeBadge } from "@/components/qr-type-badge";
import { formatDate } from "@/lib/utils";
import { type QrCode, type QrType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recycle Bin · QR Manager" };

export default async function TrashPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("qr_codes")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  const qrCodes = (data ?? []) as QrCode[];

  return (
    <div>
      <PageHeader
        title="Recycle Bin"
        description="Deleted QR codes are kept here. Restore them, or delete permanently."
      >
        <Button asChild variant="outline">
          <Link href="/qr">
            <ArrowLeft className="size-4" />
            Back to QR Codes
          </Link>
        </Button>
      </PageHeader>

      <Card>
        {qrCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Trash2 className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              The recycle bin is empty.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Short Code</TableHead>
                <TableHead>Deleted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qrCodes.map((qr) => (
                <TableRow key={qr.id}>
                  <TableCell className="font-medium">{qr.name}</TableCell>
                  <TableCell>
                    <QrTypeBadge type={qr.type as QrType} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    /r/{qr.short_code}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(qr.deleted_at)}
                  </TableCell>
                  <TableCell>
                    <TrashRowActions id={qr.id} />
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
