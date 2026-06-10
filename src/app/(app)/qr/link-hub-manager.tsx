"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Trash2, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addLinkHubItem,
  deleteLinkHubItem,
  type ActionState,
} from "./actions";
import { LINK_HUB_PLATFORMS, type LinkHubItem } from "@/lib/types";

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Plus className="size-4" />
      {pending ? "Adding…" : "Add link"}
    </Button>
  );
}

export function LinkHubManager({
  qrCodeId,
  items,
}: {
  qrCodeId: string;
  items: LinkHubItem[];
}) {
  const action = addLinkHubItem.bind(null, qrCodeId);
  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    action,
    {},
  );
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      {items.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{it.title}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {it.platform}
                  </span>
                </div>
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:underline"
                >
                  {it.url}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => {
                    deleteLinkHubItem(it.id, qrCodeId);
                  })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No links yet. Add one below.
        </p>
      )}

      <form action={formAction} className="grid gap-3 rounded-md border bg-muted/30 p-4 sm:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Visit our website" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="platform">Platform</Label>
          <Select id="platform" name="platform" defaultValue={LINK_HUB_PLATFORMS[0]}>
            {LINK_HUB_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="url">URL</Label>
          <Input id="url" name="url" type="url" placeholder="https://…" required />
        </div>
        <div className="flex items-end sm:col-span-3">
          <AddButton />
        </div>
        {state?.error && (
          <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>
        )}
      </form>
    </div>
  );
}
