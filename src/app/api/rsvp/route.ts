import { NextResponse } from "next/server";
import { allowRequest, requestAddress } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type Guest = { name?: unknown; surname?: unknown; additionalInfo?: unknown };

export async function POST(request: Request) {
  if (!allowRequest(`rsvp:${requestAddress(request)}`, 8, 10 * 60_000)) {
    return NextResponse.json({ error: "Troppe richieste. Attendi qualche minuto." }, { status: 429 });
  }
  const body = await request.json().catch(() => null) as { invitationId?: unknown; phone?: unknown; guests?: unknown; status?: unknown } | null;
  if (!body || typeof body.invitationId !== "string" || !Array.isArray(body.guests) || body.guests.length < 1 || body.guests.length > 10) {
    return NextResponse.json({ error: "Dati della conferma non validi." }, { status: 400 });
  }
  const status = body.status === "declined" ? "declined" : "confirmed";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";
  const guests = (body.guests as Guest[]).map((guest) => ({
    name: `${typeof guest.name === "string" ? guest.name : ""} ${typeof guest.surname === "string" ? guest.surname : ""}`.trim().slice(0, 120),
    info: typeof guest.additionalInfo === "string" ? guest.additionalInfo.trim().slice(0, 500) : ""
  }));
  if (guests.some((guest) => guest.name.length < 2)) return NextResponse.json({ error: "Inserisci il nome degli invitati." }, { status: 400 });
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Servizio non configurato." }, { status: 503 });
  const { data: invitation } = await admin.from("invitations").select("id,public_rsvp_enabled,status").eq("id", body.invitationId).eq("status", "published").eq("public_rsvp_enabled", true).maybeSingle();
  if (!invitation) return NextResponse.json({ error: "Le conferme non sono disponibili per questo invito." }, { status: 404 });
  const responseGroupId = crypto.randomUUID();
  const { error } = await admin.from("rsvps").insert(guests.map((guest) => ({ invitation_id: invitation.id, response_group_id: responseGroupId, guest_name: guest.name, status, party_size: status === "confirmed" ? 1 : 0, contact_phone: phone, additional_info: guest.info || null })));
  if (error) return NextResponse.json({ error: "Conferma non salvata." }, { status: 500 });
  return NextResponse.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
}
