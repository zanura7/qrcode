import { QR_TYPE_LABELS, type QrType } from "@/lib/types";
import { QR_TYPE_COLORS, qrTypeIcon } from "@/lib/qr-icons";
import { cn } from "@/lib/utils";

/** Icon + label chip for a QR type, tinted with the platform's brand color. */
export function QrTypeBadge({
  type,
  className,
}: {
  type: QrType;
  className?: string;
}) {
  const Icon = qrTypeIcon(type);
  const color = QR_TYPE_COLORS[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium",
        className,
      )}
    >
      <Icon
        className="size-3.5 shrink-0"
        style={color ? { color } : undefined}
      />
      {QR_TYPE_LABELS[type]}
    </span>
  );
}

/** Icon tile (for headers / cards), with brand-tinted background. */
export function QrTypeIconTile({
  type,
  className,
}: {
  type: QrType;
  className?: string;
}) {
  const Icon = qrTypeIcon(type);
  const color = QR_TYPE_COLORS[type] ?? "#0f172a";

  return (
    <span
      className={cn(
        "flex size-11 items-center justify-center rounded-lg",
        className,
      )}
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <Icon className="size-5" />
    </span>
  );
}
