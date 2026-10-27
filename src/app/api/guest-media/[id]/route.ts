import { NextResponse } from "next/server";
import { createServerAuthClient, createSupabaseAdminClient } from "@/lib/supabase/server";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const authClient = createServerAuthClient();
  const admin = createSupabaseAdminClient();
  if (!authClient || !admin) return NextResponse.json({ error: "Servizio non configurato." }, { status: 503 });

  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData.user) return NextResponse.json({ error: "Sessione non valida." }, { status: 401 });

  const { data: item, error: itemError } = await admin
    .from("guest_media")
    .select("id, invitation_id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (itemError || !item) return NextResponse.json({ error: "Contenuto non trovato." }, { status: 404 });

  const { data: invitation, error: invitationError } = await admin
    .from("invitations")
    .select("owner_id")
    .eq("id", item.invitation_id)
    .maybeSingle();

  if (invitationError || !invitation || invitation.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "Non hai i permessi per eliminare questo contenuto." }, { status: 403 });
  }

  const { error: storageError } = await admin.storage
    .from("invitation-guest-media")
    .remove([item.storage_path]);

  if (storageError) {
    return NextResponse.json({ error: "Il file non è stato eliminato dallo storage." }, { status: 500 });
  }

  const { error: rowError } = await admin.from("guest_media").delete().eq("id", id);
  if (rowError) return NextResponse.json({ error: "Il contenuto non è stato rimosso dalla dashboard." }, { status: 500 });

  return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
}
