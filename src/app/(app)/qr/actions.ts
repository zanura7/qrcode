"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateShortCode } from "@/lib/utils";
import {
  CONTENT_QR_TYPES,
  FILE_QR_TYPES,
  QR_TYPES,
  URL_QR_TYPES,
  type QrType,
} from "@/lib/types";

export type ActionState = { error?: string };

const QR_FILES_BUCKET = "qr-files";
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
const FILE_TYPE_EXTENSIONS: Partial<Record<QrType, string[]>> = {
  pdf: [".pdf"],
  audio: [".mp3", ".wav", ".m4a", ".aac", ".ogg"],
  video: [".mp4", ".mov", ".webm", ".m4v"],
  image: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  pptx: [".ppt", ".pptx"],
  excel: [".xls", ".xlsx", ".csv"],
  png: [".png"],
};

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
  const campaign = String(formData.get("campaign") || "").trim() || null;
  const target_url = String(formData.get("target_url") || "").trim() || null;
  const whatsapp_number =
    String(formData.get("whatsapp_number") || "").replace(/[^\d+]/g, "") || null;
  const whatsapp_message =
    String(formData.get("whatsapp_message") || "").trim() || null;
  const content_text = String(formData.get("content_text") || "").trim() || null;
  const phone_number =
    String(formData.get("phone_number") || "").replace(/[^\d+]/g, "") || null;
  const email_address = String(formData.get("email_address") || "").trim() || null;
  const email_subject = String(formData.get("email_subject") || "").trim() || null;
  const email_body = String(formData.get("email_body") || "").trim() || null;
  const wifi_ssid = String(formData.get("wifi_ssid") || "").trim() || null;
  const wifi_password = String(formData.get("wifi_password") || "").trim() || null;
  const wifi_encryption =
    String(formData.get("wifi_encryption") || "").trim() || null;
  const contact_name = String(formData.get("contact_name") || "").trim() || null;
  const contact_phone =
    String(formData.get("contact_phone") || "").replace(/[^\d+]/g, "") || null;
  const contact_email = String(formData.get("contact_email") || "").trim() || null;
  const contact_company =
    String(formData.get("contact_company") || "").trim() || null;
  const contact_url = String(formData.get("contact_url") || "").trim() || null;
  const event_title = String(formData.get("event_title") || "").trim() || null;
  const event_start = String(formData.get("event_start") || "").trim() || null;
  const event_end = String(formData.get("event_end") || "").trim() || null;
  const event_location =
    String(formData.get("event_location") || "").trim() || null;

  return {
    name,
    type,
    campaign,
    target_url,
    whatsapp_number,
    whatsapp_message,
    content_text,
    phone_number,
    email_address,
    email_subject,
    email_body,
    wifi_ssid,
    wifi_password,
    wifi_encryption,
    contact_name,
    contact_phone,
    contact_email,
    contact_company,
    contact_url,
    event_title,
    event_start,
    event_end,
    event_location,
  };
}

type QrInput = ReturnType<typeof parseForm>;

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    Number((value as File).size) > 0
  );
}

function safeFileName(name: string): string {
  const parts = name.split(".");
  const ext = parts.length > 1 ? `.${parts.pop()}` : "";
  const base = parts
    .join(".")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "file"}${ext.toLowerCase()}`;
}

function validateUploadType(type: QrType, fileName: string): string | null {
  const allowed = FILE_TYPE_EXTENSIONS[type];
  if (!allowed) return null;
  const lower = fileName.toLowerCase();
  return allowed.some((ext) => lower.endsWith(ext))
    ? null
    : `Uploaded file must match ${allowed.join(", ")}.`;
}

async function attachUploadedFile(
  input: QrInput,
  formData: FormData,
): Promise<{ input: QrInput; error?: string }> {
  if (!FILE_QR_TYPES.includes(input.type)) return { input };

  const upload = formData.get("file_upload");
  if (!isUploadFile(upload)) return { input };

  if (upload.size > MAX_UPLOAD_SIZE) {
    return { input, error: "Uploaded file must be 50 MB or smaller." };
  }

  const typeError = validateUploadType(input.type, upload.name);
  if (typeError) return { input, error: typeError };

  const admin = createAdminClient();
  const path = `${input.type}/${crypto.randomUUID()}-${safeFileName(upload.name)}`;
  const { error } = await admin.storage
    .from(QR_FILES_BUCKET)
    .upload(path, Buffer.from(await upload.arrayBuffer()), {
      contentType: upload.type || "application/octet-stream",
      upsert: false,
    });

  if (error) return { input, error: error.message };

  const { data } = admin.storage.from(QR_FILES_BUCKET).getPublicUrl(path);
  return { input: { ...input, target_url: data.publicUrl } };
}

function validate(input: QrInput): string | null {
  if (!input.name) return "Name is required.";
  if (!QR_TYPES.includes(input.type)) return "Invalid QR type.";
  if (URL_QR_TYPES.includes(input.type)) {
    if (!input.target_url) return "Target URL is required.";
    try {
      new URL(input.target_url);
    } catch {
      return "Target URL must be a valid URL (include https://).";
    }
  }
  if (input.type === "whatsapp" && !input.whatsapp_number)
    return "WhatsApp number is required.";
  if ((input.type === "phone" || input.type === "sms") && !input.phone_number)
    return "Phone number is required.";
  if (input.type === "email" && !input.email_address)
    return "Email address is required.";
  if (input.type === "text" && !input.content_text)
    return "Text content is required.";
  if (input.type === "wifi" && !input.wifi_ssid)
    return "Wi-Fi network name is required.";
  if (input.type === "vcard" && !input.contact_name)
    return "Contact name is required.";
  if (input.type === "calendar" && (!input.event_title || !input.event_start))
    return "Event title and start time are required.";
  if (CONTENT_QR_TYPES.includes(input.type) && input.target_url)
    return "This QR type does not use a target URL.";
  return null;
}

export async function createQr(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const uploaded = await attachUploadedFile(parseForm(formData), formData);
  if (uploaded.error) return { error: uploaded.error };
  const input = uploaded.input;
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
  const uploaded = await attachUploadedFile(parseForm(formData), formData);
  if (uploaded.error) return { error: uploaded.error };
  const input = uploaded.input;
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

/** Move a QR code to the recycle bin (soft delete). Recoverable. */
export async function deleteQr(id: string) {
  const supabase = await createClient();
  await supabase
    .from("qr_codes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/qr");
  revalidatePath("/qr/trash");
  revalidatePath("/dashboard");
  redirect("/qr");
}

/** Restore a QR code from the recycle bin. */
export async function restoreQr(id: string) {
  const supabase = await createClient();
  await supabase.from("qr_codes").update({ deleted_at: null }).eq("id", id);
  revalidatePath("/qr");
  revalidatePath("/qr/trash");
  revalidatePath("/dashboard");
}

/** Permanently delete a QR code (and its scans, via cascade). Irreversible. */
export async function purgeQr(id: string) {
  const supabase = await createClient();
  await supabase.from("qr_codes").delete().eq("id", id);
  revalidatePath("/qr/trash");
  revalidatePath("/dashboard");
}

// ---------- QR design ----------

export async function updateQrDesign(
  id: string,
  design: Record<string, unknown>,
): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("qr_codes")
    .update({ qr_design: design })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/qr/${id}`);
  return {};
}

/** Upload a center logo image; returns its public URL. */
export async function uploadQrLogo(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const upload = formData.get("logo");
  if (!isUploadFile(upload)) return { error: "No image selected." };
  if (upload.size > 2 * 1024 * 1024)
    return { error: "Logo must be 2 MB or smaller." };
  if (!upload.type.startsWith("image/"))
    return { error: "Logo must be an image file." };

  const admin = createAdminClient();
  const path = `logos/${crypto.randomUUID()}-${safeFileName(upload.name)}`;
  const { error } = await admin.storage
    .from(QR_FILES_BUCKET)
    .upload(path, Buffer.from(await upload.arrayBuffer()), {
      contentType: upload.type || "image/png",
      upsert: false,
    });
  if (error) return { error: error.message };

  const { data } = admin.storage.from(QR_FILES_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
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
