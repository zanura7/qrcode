"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleStatus, deleteQr } from "./actions";

export function QrRowActions({
  id,
  status,
}: {
  id: string;
  status: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" asChild title="Edit">
        <Link href={`/qr/${id}`}>
          <Pencil className="size-4" />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        title={status ? "Deactivate" : "Activate"}
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            toggleStatus(id, !status);
          })
        }
      >
        <Power
          className={status ? "size-4 text-emerald-600" : "size-4 text-muted-foreground"}
        />
      </Button>

      {confirming ? (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => void deleteQr(id))}
        >
          Confirm
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          title="Delete"
          className="text-destructive"
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
