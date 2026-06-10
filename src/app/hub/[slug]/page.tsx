import { notFound } from "next/navigation";
import {
  Globe,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Link2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LinkHubItem, QrCode } from "@/lib/types";

export const dynamic = "force-dynamic";

const PLATFORM_ICON: Record<string, LucideIcon> = {
  Website: Globe,
  WhatsApp: MessageCircle,
  Facebook: Facebook,
  Instagram: Instagram,
  TikTok: Music2,
  LinkedIn: Linkedin,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("qr_codes")
    .select("name")
    .eq("short_code", slug)
    .eq("type", "link_hub")
    .maybeSingle();
  return { title: data?.name ?? "Link Hub" };
}

export default async function HubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: qr } = await admin
    .from("qr_codes")
    .select("*")
    .eq("short_code", slug)
    .eq("type", "link_hub")
    .maybeSingle();

  if (!qr || !(qr as QrCode).status) notFound();
  const qrCode = qr as QrCode;

  const { data: itemsData } = await admin
    .from("link_hub_items")
    .select("*")
    .eq("qr_code_id", qrCode.id)
    .order("sort_order", { ascending: true });

  const items = (itemsData ?? []) as LinkHubItem[];

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-50 to-slate-200 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <Link2 className="size-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{qrCode.name}</h1>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-xl bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
              No links available yet.
            </p>
          ) : (
            items.map((it) => {
              const Icon = PLATFORM_ICON[it.platform] ?? Link2;
              return (
                <a
                  key={it.id}
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-900">
                      {it.title}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {it.platform}
                    </span>
                  </span>
                </a>
              );
            })
          )}
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          Powered by QR Code Manager
        </p>
      </div>
    </div>
  );
}
