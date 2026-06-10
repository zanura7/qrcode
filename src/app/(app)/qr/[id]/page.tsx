import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import { QrDisplay } from "@/components/qr-display";
import { QrForm } from "../qr-form";
import { LinkHubManager } from "../link-hub-manager";
import { DeleteQrButton } from "../delete-qr-button";
import { updateQr } from "../actions";
import { appUrl } from "@/lib/utils";
import { QR_TYPE_LABELS, type LinkHubItem, type QrCode, type QrType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { count: scanCount } = await supabase
    .from("qr_scans")
    .select("*", { count: "exact", head: true })
    .eq("qr_code_id", id);

  const shortUrl = `${appUrl()}/r/${qrCode.short_code}`;
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
                  <Badge variant="muted">
                    {QR_TYPE_LABELS[qrCode.type as QrType]}
                  </Badge>
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

          <div className="flex justify-end">
            <DeleteQrButton id={id} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR code</CardTitle>
              <CardDescription>Download &amp; print this image.</CardDescription>
            </CardHeader>
            <CardContent>
              <QrDisplay url={shortUrl} fileName={qrCode.short_code} />
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
