import { NextResponse } from "next/server";
import { allowRequest, requestAddress } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"]);

export async function POST(request: Request) {
  if (!allowRequest(`media:${requestAddress(request)}`, 5, 30 * 60_000)) return NextResponse.json({ error: "Limite di caricamento raggiunto. Riprova più tardi." }, { status: 429 });
  const form = await request.formData().catch(() => null);
  const invitationId = form?.get("invitationId");
  const guestName = form?.get("guestName");
  const dedication = form?.get("dedication");
  const file = form?.get("file");
  if (typeof invitationId !== "string" || typeof guestName !== "string" || guestName.trim().length < 2 || !(file instanceof File)) return NextResponse.json({ error: "Dati del contenuto non validi." }, { status: 400 });
  if (!allowed.has(file.type) || file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Formato non supportato o file superiore a 15 MB." }, { status: 400 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Servizio non configurato." }, { status: 503 });
  const { data: invitation } = await admin.from("invitations").select("id").eq("id", invitationId).eq("status", "published").maybeSingle();
  if (!invitation) return NextResponse.json({ error: "Invito non pubblicato." }, { status: 404 });
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${invitation.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from("invitation-guest-media").upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (uploadError) return NextResponse.json({ error: "Caricamento non riuscito." }, { status: 500 });
  const { data: item, error } = await admin.from("guest_media").insert({ invitation_id: invitation.id, guest_name: guestName.trim().slice(0, 120), dedication: typeof dedication === "string" ? dedication.trim().slice(0, 500) || null : null, media_type: file.type.startsWith("image/") ? "photo" : "video", storage_path: path, status: "pending" }).select("id,invitation_id,guest_name,dedication,media_type,storage_path,status,created_at").single();
  if (error) { await admin.storage.from("invitation-guest-media").remove([path]); return NextResponse.json({ error: "Pubblicazione non riuscita." }, { status: 500 }); }
  const url = admin.storage.from("invitation-guest-media").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ item: { id: item.id, invitationId: item.invitation_id, invitationTitle: "", guestName: item.guest_name, dedication: item.dedication ?? "", mediaType: item.media_type, url, status: item.status, createdAt: item.created_at } }, { headers: { "Cache-Control": "no-store" } });
}
