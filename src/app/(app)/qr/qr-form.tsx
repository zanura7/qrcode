"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "./actions";
import type { QrCode, QrType } from "@/lib/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function QrForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState | undefined, formData: FormData) => Promise<ActionState>;
  initial?: Partial<QrCode>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const [type, setType] = useState<QrType>((initial?.type as QrType) || "url");

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Sales WhatsApp — Storefront"
          defaultValue={initial?.name ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as QrType)}
        >
          <option value="url">URL — redirect to any link</option>
          <option value="whatsapp">WhatsApp — open a chat directly</option>
          <option value="link_hub">Link Hub — a page of multiple links</option>
        </Select>
      </div>

      {type === "url" && (
        <div className="space-y-2">
          <Label htmlFor="target_url">Target URL</Label>
          <Input
            id="target_url"
            name="target_url"
            type="url"
            placeholder="https://example.com"
            defaultValue={initial?.target_url ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            You can change this later without reprinting the QR.
          </p>
        </div>
      )}

      {type === "whatsapp" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">WhatsApp number</Label>
            <Input
              id="whatsapp_number"
              name="whatsapp_number"
              placeholder="60123456789 (country code, no +)"
              defaultValue={initial?.whatsapp_number ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              International format without “+”, e.g. 60123456789.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_message">Default message (optional)</Label>
            <Textarea
              id="whatsapp_message"
              name="whatsapp_message"
              placeholder="Hello, I'm interested in…"
              defaultValue={initial?.whatsapp_message ?? ""}
            />
          </div>
        </>
      )}

      {type === "link_hub" && (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Save first, then add platform links (Website, WhatsApp, Facebook,
          Instagram, TikTok, LinkedIn) on the QR detail page.
        </p>
      )}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
