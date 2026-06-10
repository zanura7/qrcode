"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QrDisplay({
  url,
  fileName,
}: {
  url: string;
  fileName: string;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [url]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${fileName}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg border bg-white p-4">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt="QR code"
            className="size-48"
            width={192}
            height={192}
          />
        ) : (
          <div className="size-48 animate-pulse rounded bg-muted" />
        )}
      </div>

      <div className="w-full break-all rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        {url}
      </div>

      <div className="flex w-full gap-2">
        <Button onClick={download} disabled={!dataUrl} className="flex-1">
          <Download className="size-4" />
          Download PNG
        </Button>
        <Button variant="outline" onClick={copyLink} className="flex-1">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
    </div>
  );
}
