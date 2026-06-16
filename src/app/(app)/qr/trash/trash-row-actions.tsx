"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restoreQr, purgeQr } from "../actions";

export function TrashRowActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        title="Restore"
        disabled={isPending}
        onClick={() => startTransition(() => void restoreQr(id))}
      >
        <RotateCcw className="size-4" />
        Restore
      </Button>

      {confirming ? (
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => void purgeQr(id))}
        >
          Delete forever
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          title="Delete permanently"
          className="text-destructive"
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
