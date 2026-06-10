import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { QrForm } from "../qr-form";
import { createQr } from "../actions";

export const metadata = { title: "Create QR · QR Manager" };

export default function NewQrPage() {
  return (
    <div>
      <PageHeader title="Create QR Code" description="Generate a new dynamic QR code.">
        <Button variant="outline" asChild>
          <Link href="/qr">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <QrForm action={createQr} submitLabel="Create QR" />
        </CardContent>
      </Card>
    </div>
  );
}
