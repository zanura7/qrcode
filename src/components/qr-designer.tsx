"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type QRCodeStyling from "qr-code-styling";
import type { Options } from "qr-code-styling";
import {
  AlertTriangle,
  Check,
  Download,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateQrDesign, uploadQrLogo } from "@/app/(app)/qr/actions";
import type {
  QrCornerStyle,
  QrDesign,
  QrDotStyle,
} from "@/lib/types";

const DOT_STYLES: { value: QrDotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy rounded" },
  { value: "extra-rounded", label: "Extra rounded" },
];

const CORNER_STYLES: { value: QrCornerStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dot", label: "Dot" },
  { value: "extra-rounded", label: "Extra rounded" },
];

function buildOptions(url: string, design: QrDesign): Options {
  const dark = design.dark || "#000000";
  return {
    width: 280,
    height: 280,
    type: "canvas",
    data: url,
    margin: design.margin ?? 8,
    qrOptions: { errorCorrectionLevel: design.logoUrl ? "H" : "M" },
    image: design.logoUrl || undefined,
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 6,
      imageSize: 0.28,
      hideBackgroundDots: true,
    },
    dotsOptions: { color: dark, type: design.dotsType ?? "square" },
    backgroundOptions: { color: design.light || "#ffffff" },
    cornersSquareOptions: {
      color: dark,
      type: design.cornersType ?? "square",
    },
    cornersDotOptions: { color: dark },
  };
}

function isLocal(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0";
  } catch {
    return false;
  }
}

export function QrDesigner({
  url,
  fileName,
  qrId,
  initialDesign,
}: {
  url: string;
  fileName: string;
  qrId: string;
  initialDesign: QrDesign | null;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const instance = useRef<QRCodeStyling | null>(null);
  const [design, setDesign] = useState<QrDesign>(initialDesign ?? {});
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise the styled QR once.
  useEffect(() => {
    let active = true;
    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      if (!active || !holder.current) return;
      instance.current = new QRCodeStyling(buildOptions(url, design));
      holder.current.innerHTML = "";
      instance.current.append(holder.current);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render on design / url change.
  useEffect(() => {
    instance.current?.update(buildOptions(url, design));
  }, [url, design]);

  function set<K extends keyof QrDesign>(key: K, value: QrDesign[K]) {
    setDesign((d) => ({ ...d, [key]: value }));
  }

  function download(extension: "png" | "svg") {
    instance.current?.download({ name: fileName, extension });
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set("logo", file);
    const res = await uploadQrLogo(fd);
    setUploading(false);
    e.target.value = "";
    if (res.error) {
      setError(res.error);
      return;
    }
    set("logoUrl", res.url ?? null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateQrDesign(qrId, design as Record<string, unknown>);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center rounded-lg border bg-white p-4">
        <div ref={holder} />
      </div>

      {isLocal(url) && (
        <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            This QR uses a local URL. Set NEXT_PUBLIC_APP_URL to your public
            domain before printing.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="qr-dark">Foreground</Label>
          <input
            id="qr-dark"
            type="color"
            value={design.dark || "#000000"}
            onChange={(e) => set("dark", e.target.value)}
            className="h-10 w-full cursor-pointer rounded-md border bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qr-light">Background</Label>
          <input
            id="qr-light"
            type="color"
            value={design.light || "#ffffff"}
            onChange={(e) => set("light", e.target.value)}
            className="h-10 w-full cursor-pointer rounded-md border bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qr-dots">Dot style</Label>
          <Select
            id="qr-dots"
            value={design.dotsType ?? "square"}
            onChange={(e) => set("dotsType", e.target.value as QrDotStyle)}
          >
            {DOT_STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qr-corners">Corner style</Label>
          <Select
            id="qr-corners"
            value={design.cornersType ?? "square"}
            onChange={(e) =>
              set("cornersType", e.target.value as QrCornerStyle)
            }
          >
            {CORNER_STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Center logo</Label>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 cursor-pointer"
            disabled={uploading}
          >
            <label>
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {design.logoUrl ? "Change logo" : "Upload logo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onLogo}
              />
            </label>
          </Button>
          {design.logoUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => set("logoUrl", null)}
            >
              <Trash2 className="size-4" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          PNG/JPG up to 2 MB. A logo raises error-correction so the QR still
          scans.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => download("png")}>
          <Download className="size-4" />
          PNG
        </Button>
        <Button variant="outline" onClick={() => download("svg")}>
          <Download className="size-4" />
          SVG
        </Button>
      </div>

      <Button
        onClick={save}
        disabled={pending}
        variant="secondary"
        className="w-full"
      >
        {saved ? <Check className="size-4" /> : <Save className="size-4" />}
        {saved ? "Saved" : pending ? "Saving…" : "Save design"}
      </Button>
    </div>
  );
}
