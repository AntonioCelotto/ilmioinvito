import { createClient } from "@/lib/supabase/client";

export type GuestMediaItem = {
  id: string;
  invitationId: string;
  invitationTitle: string;
  guestName: string;
  dedication: string;
  mediaType: "photo" | "video";
  url: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

const bucket = "invitation-guest-media";
const supportedMediaTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm"
]);

function publicUrl(path: string) {
  const supabase = createClient();
  return supabase?.storage.from(bucket).getPublicUrl(path).data.publicUrl ?? "";
}

export async function uploadGuestMedia(
  invitationId: string,
  guestName: string,
  dedication: string,
  file: File
) {
  if (guestName.trim().length < 2) return { ok: false, message: "Inserisci il tuo nome." };

  if (!supportedMediaTypes.has(file.type)) {
    return {
      ok: false,
      message: "Formato non supportato. Usa JPG, PNG, WebP oppure un video MP4, MOV o WebM."
    };
  }
  if (file.size > 15 * 1024 * 1024) return { ok: false, message: "Il file non può superare 15 MB." };
  const form = new FormData();
  form.set("invitationId", invitationId);
  form.set("guestName", guestName.trim());
  form.set("dedication", dedication.trim());
  form.set("file", file);
  const response = await fetch("/api/guest-media", { method: "POST", body: form });
  const result = await response.json().catch(() => ({})) as { error?: string; item?: GuestMediaItem };
  if (!response.ok || !result.item) return { ok: false, message: result.error ?? "Caricamento non riuscito." };
  return {
    ok: true,
    message: "Caricato! Il proprietario dell’invito potrà approvare il contenuto dalla dashboard."
  };
}

export async function loadApprovedGuestMedia(invitationId: string) {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("guest_media")
    .select("id, invitation_id, guest_name, dedication, media_type, storage_path, status, created_at")
    .eq("invitation_id", invitationId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row: any) => ({
    id: row.id,
    invitationId: row.invitation_id,
    invitationTitle: "",
    guestName: row.guest_name,
    dedication: row.dedication ?? "",
    mediaType: row.media_type,
    url: publicUrl(row.storage_path),
    status: row.status,
    createdAt: row.created_at
  })) as GuestMediaItem[];
}

export async function loadDashboardGuestMedia() {
  const supabase = createClient();
  if (!supabase) return { items: [] as GuestMediaItem[], message: "Supabase non configurato." };
  const { data, error } = await supabase
    .from("guest_media")
    .select("id, invitation_id, guest_name, dedication, media_type, storage_path, status, created_at, invitations!inner(title)")
    .order("created_at", { ascending: false });
  if (error) return { items: [], message: error.message };
  return {
    items: (data ?? []).map((row: any) => ({
      id: row.id,
      invitationId: row.invitation_id,
      invitationTitle: row.invitations?.title ?? "Invito",
      guestName: row.guest_name,
      dedication: row.dedication ?? "",
      mediaType: row.media_type,
      url: publicUrl(row.storage_path),
      status: row.status,
      createdAt: row.created_at
    })) as GuestMediaItem[],
    message: ""
  };
}

export async function updateGuestMediaStatus(id: string, status: GuestMediaItem["status"]) {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Supabase non configurato." };
  const { error } = await supabase.from("guest_media").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true, message: "Contenuto aggiornato." };
}
