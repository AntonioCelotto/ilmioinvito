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

function friendlyUploadError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("row-level security") || normalized.includes("policy")) {
    return "Questo invito non è ancora pubblicato. Il proprietario deve pubblicarlo prima di consentire i caricamenti.";
  }

  if (normalized.includes("mime") || normalized.includes("content type")) {
    return "Formato non supportato. Usa JPG, PNG, WebP oppure un video MP4, MOV o WebM.";
  }

  return message;
}

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
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Servizio non configurato." };
  if (guestName.trim().length < 2) return { ok: false, message: "Inserisci il tuo nome." };

  const isPhoto = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!supportedMediaTypes.has(file.type)) {
    return {
      ok: false,
      message: "Formato non supportato. Usa JPG, PNG, WebP oppure un video MP4, MOV o WebM."
    };
  }
  if (file.size > 50 * 1024 * 1024) return { ok: false, message: "Il file non può superare 50 MB." };

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (isPhoto ? "jpg" : "mp4");
  const path = `${invitationId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (uploadError) {
    return { ok: false, message: friendlyUploadError(uploadError.message) };
  }

  const { data: publishedItem, error } = await supabase.from("guest_media").insert({
    invitation_id: invitationId,
    guest_name: guestName.trim(),
    dedication: dedication.trim() || null,
    media_type: isPhoto ? "photo" : "video",
    storage_path: path,
    status: "approved"
  }).select("id, invitation_id, guest_name, dedication, media_type, storage_path, status, created_at").single();
  if (error) return { ok: false, message: friendlyUploadError(error.message) };
  return {
    ok: true,
    message: "Pubblicato! Il tuo ricordo è ora visibile nella bacheca.",
    item: {
      id: publishedItem.id,
      invitationId: publishedItem.invitation_id,
      invitationTitle: "",
      guestName: publishedItem.guest_name,
      dedication: publishedItem.dedication ?? "",
      mediaType: publishedItem.media_type,
      url: publicUrl(publishedItem.storage_path),
      status: publishedItem.status,
      createdAt: publishedItem.created_at
    } as GuestMediaItem
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
