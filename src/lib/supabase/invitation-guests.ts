import { createClient } from "@/lib/supabase/client";

export type InvitationGuestStatus = "pending" | "confirmed" | "declined";

export type InvitationGuest = {
  id: string;
  invitationId: string;
  invitationTitle: string;
  invitationSlug: string;
  guestName: string;
  contactPhone: string;
  email: string;
  additionalInfo: string;
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
    .select("id, invitation_id, guest_name, contact_phone, email, additional_info, status, reminded_at, created_at, invitations!inner(title, slug)")
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
      email: row.email ?? "",
      additionalInfo: row.additional_info ?? "",
      status: row.status === "confirmed" ? "confirmed" : row.status === "declined" ? "declined" : "pending",
      remindedAt: row.reminded_at ?? "",
      createdAt: row.created_at
    })),
    message: ""
  };
}

export async function addInvitationGuest(
  invitationId: string,
  guestName: string,
  contactPhone: string,
  email = "",
  additionalInfo = ""
) {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Supabase non configurato." };
  const name = guestName.trim();
  if (!name) return { ok: false, message: "Inserisci il nome dell'invitato." };

  const { error } = await supabase.from("invitation_guests").insert({
    invitation_id: invitationId,
    guest_name: name,
    contact_phone: contactPhone.trim() || null,
    email: email.trim() || null,
    additional_info: additionalInfo.trim() || null,
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


export type InvitationGuestImportRow = {
  guestName: string;
  contactPhone?: string;
  email?: string;
  additionalInfo?: string;
};

export async function importInvitationGuests(
  invitationId: string,
  rows: InvitationGuestImportRow[]
): Promise<{ ok: boolean; message: string }> {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Supabase non configurato." };

  const cleanRows = rows
    .map((row) => ({
      invitation_id: invitationId,
      guest_name: row.guestName.trim(),
      contact_phone: row.contactPhone?.trim() || null,
      email: row.email?.trim() || null,
      additional_info: row.additionalInfo?.trim() || null,
      status: "pending",
      updated_at: new Date().toISOString()
    }))
    .filter((row) => row.guest_name.length > 0);

  if (cleanRows.length === 0) return { ok: false, message: "Il file non contiene invitati validi." };
  if (cleanRows.length > 500) return { ok: false, message: "Puoi importare al massimo 500 invitati per volta." };

  const { error } = await supabase.from("invitation_guests").insert(cleanRows);
  return error
    ? { ok: false, message: error.message }
    : { ok: true, message: `${cleanRows.length} invitati importati correttamente.` };
}
