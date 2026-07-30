import { createClient } from "@/lib/supabase/client";

export type RsvpGuestInput = {
  name: string;
  surname: string;
  additionalInfo: string;
};

export type DashboardRsvp = {
  id: string;
  invitationId: string;
  invitationTitle: string;
  responseGroupId: string;
  guestName: string;
  contactPhone: string;
  additionalInfo: string;
  createdAt: string;
};

type SaveRsvpResult =
  | { status: "saved"; message: string }
  | { status: "error"; message: string };

function makeGroupId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function savePublicRsvp(
  invitationId: string,
  phone: string,
  guests: RsvpGuestInput[]
): Promise<SaveRsvpResult> {
  const supabase = createClient();

  if (!supabase) {
    return { status: "error", message: "Salvataggio online non configurato." };
  }

  const responseGroupId = makeGroupId();
  const { error } = await supabase.from("rsvps").insert(
    guests.map((guest) => ({
      invitation_id: invitationId,
      response_group_id: responseGroupId,
      guest_name: `${guest.name} ${guest.surname}`.trim(),
      status: "confirmed",
      party_size: 1,
      contact_phone: phone.trim(),
      additional_info: guest.additionalInfo.trim() || null
    }))
  );

  if (error) {
    return {
      status: "error",
      message: "Non è stato possibile salvare la conferma nella dashboard."
    };
  }

  return {
    status: "saved",
    message: "Conferma salvata correttamente nella dashboard."
  };
}

export async function loadDashboardRsvps(): Promise<{
  rsvps: DashboardRsvp[];
  message: string;
}> {
  const supabase = createClient();

  if (!supabase) {
    return { rsvps: [], message: "Supabase non configurato." };
  }

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { rsvps: [], message: "Accedi per visualizzare gli invitati." };
  }

  const { data, error } = await supabase
    .from("rsvps")
    .select(
      "id, invitation_id, response_group_id, guest_name, contact_phone, additional_info, created_at, invitations!inner(title)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { rsvps: [], message: error.message };
  }

  return {
    rsvps: (data ?? []).map((row: any) => ({
      id: row.id,
      invitationId: row.invitation_id,
      invitationTitle: Array.isArray(row.invitations)
        ? row.invitations[0]?.title ?? "Invito"
        : row.invitations?.title ?? "Invito",
      responseGroupId: row.response_group_id,
      guestName: row.guest_name,
      contactPhone: row.contact_phone ?? "",
      additionalInfo: row.additional_info ?? "",
      createdAt: row.created_at
    })),
    message: ""
  };
}
