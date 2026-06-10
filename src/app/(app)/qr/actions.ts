"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateShortCode } from "@/lib/utils";
import type { QrType } from "@/lib/types";

export type ActionState = { error?: string };

async function uniqueShortCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateShortCode(6);
    const { data } = await supabase
      .from("qr_codes")
      .select("id")
      .eq("short_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  // Extremely unlikely fallback: longer code
  return generateShortCode(8);
}

function parseForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "") as QrType;
  const target_url = String(formData.get("target_url") || "").trim() || null;
  const whatsapp_number =
    String(formData.get("whatsapp_number") || "").replace(/[^\d+]/g, "") || null;
  const whatsapp_message =
    String(formData.get("whatsapp_message") || "").trim() || null;
  return { name, type, target_url, whatsapp_number, whatsapp_message };
}

function validate(input: ReturnType<typeof parseForm>): string | null {
  if (!input.name) return "Name is required.";
  if (!["url", "whatsapp", "link_hub"].includes(input.type))
    return "Invalid QR type.";
  if (input.type === "url") {
    if (!input.target_url) return "Target URL is required.";
    try {
      new URL(input.target_url);
    } catch {
      return "Target URL must be a valid URL (include https://).";
    }
  }
  if (input.type === "whatsapp" && !input.whatsapp_number)
    return "WhatsApp number is required.";
  return null;
}

export async function createQr(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const input = parseForm(formData);
  const err = validate(input);
  if (err) return { error: err };

  const supabase = await createClient();
  const short_code = await uniqueShortCode(supabase);

  const { data, error } = await supabase
    .from("qr_codes")
    .insert({ ...input, short_code, status: true })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/qr");
  revalidatePath("/dashboard");
  redirect(`/qr/${data.id}`);
}

export async function updateQr(
  id: string,
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const input = parseForm(formData);
  const err = validate(input);
  if (err) return { error: err };

  const supabase = await createClient();
  const { error } = await supabase
    .from("qr_codes")
    .update(input)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/qr");
  revalidatePath(`/qr/${id}`);
  revalidatePath("/dashboard");
  return {};
}

export async function toggleStatus(id: string, status: boolean) {
  const supabase = await createClient();
  await supabase.from("qr_codes").update({ status }).eq("id", id);
  revalidatePath("/qr");
  revalidatePath(`/qr/${id}`);
}

export async function deleteQr(id: string) {
  const supabase = await createClient();
  await supabase.from("qr_codes").delete().eq("id", id);
  revalidatePath("/qr");
  revalidatePath("/dashboard");
  redirect("/qr");
}

// ---------- Link Hub items ----------

export async function addLinkHubItem(
  qrCodeId: string,
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") || "").trim();
  const platform = String(formData.get("platform") || "").trim();
  const url = String(formData.get("url") || "").trim();

  if (!title || !platform || !url) return { error: "All fields are required." };
  try {
    new URL(url);
  } catch {
    return { error: "URL must be valid (include https://)." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("link_hub_items")
    .select("*", { count: "exact", head: true })
    .eq("qr_code_id", qrCodeId);

  const { error } = await supabase.from("link_hub_items").insert({
    qr_code_id: qrCodeId,
    title,
    platform,
    url,
    sort_order: count ?? 0,
  });

  if (error) return { error: error.message };

  revalidatePath(`/qr/${qrCodeId}`);
  return {};
}

export async function deleteLinkHubItem(id: string, qrCodeId: string) {
  const supabase = await createClient();
  await supabase.from("link_hub_items").delete().eq("id", id);
  revalidatePath(`/qr/${qrCodeId}`);
}
