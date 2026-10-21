import { createClient } from "@/lib/supabase/client";

export type InvitationGuestStatus = "pending" | "confirmed" | "declined";

export type InvitationGuest = {
  id: string;
  invitationId: string;
  invitationTitle: string;
  invitationSlug: string;
  guestName: string;
  contactPhone: string;
  status: InvitationGuestStatus;
  remindedAt: string;
  createdAt: string;
};

export async function loadInvitationGuests(): Promise<{ guests: InvitationGuest[]; message: string }> {
  const supabase = createClient();
  if (!supabase) return { guests: [], message: "Supabase non configurato." };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { guests: [], message: "Accedi per visualizzare gli invitati." };

  const { data, error } = await supabase
    .from("invitation_guests")
    .select("id, invitation_id, guest_name, contact_phone, status, reminded_at, created_at, invitations!inner(title, slug)")
    .order("created_at", { ascending: true });

  if (error) return { guests: [], message: error.message };

  return {
    guests: (data ?? []).map((row: any) => ({
      id: row.id,
      invitationId: row.invitation_id,
      invitationTitle: Array.isArray(row.invitations) ? row.invitations[0]?.title ?? "Invito" : row.invitations?.title ?? "Invito",
      invitationSlug: Array.isArray(row.invitations) ? row.invitations[0]?.slug ?? "" : row.invitations?.slug ?? "",
      guestName: row.guest_name,
      contactPhone: row.contact_phone ?? "",
      status: row.status === "confirmed" ? "confirmed" : row.status === "declined" ? "declined" : "pending",
      remindedAt: row.reminded_at ?? "",
      createdAt: row.created_at
    })),
    message: ""
  };
}

export async function addInvitationGuest(invitationId: string, guestName: string, contactPhone: string) {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Supabase non configurato." };
  const name = guestName.trim();
  if (!name) return { ok: false, message: "Inserisci il nome dell'invitato." };

  const { error } = await supabase.from("invitation_guests").insert({
    invitation_id: invitationId,
    guest_name: name,
    contact_phone: contactPhone.trim() || null,
    status: "pending",
    updated_at: new Date().toISOString()
  });
  return error ? { ok: false, message: error.message } : { ok: true, message: "Invitato aggiunto." };
}

export async function deleteInvitationGuest(id: string) {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Supabase non configurato." };
  const { error } = await supabase.from("invitation_guests").delete().eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true, message: "Invitato eliminato." };
}

export async function markGuestReminded(id: string) {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Supabase non configurato." };
  const remindedAt = new Date().toISOString();
  const { error } = await supabase.from("invitation_guests").update({ reminded_at: remindedAt, updated_at: remindedAt }).eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true, message: "Promemoria registrato.", remindedAt };
}
