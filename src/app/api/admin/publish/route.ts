import { NextResponse } from "next/server";
import { createServerAuthClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { allowRequest } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Accesso amministratore richiesto." }, { status: 401 });

  const auth = createServerAuthClient();
  const admin = createSupabaseAdminClient();
  if (!auth || !admin) return NextResponse.json({ error: "Servizio non configurato." }, { status: 503 });

  const { data, error } = await auth.auth.getUser(token);
  const user = data.user;
  if (error || !user) return NextResponse.json({ error: "Sessione non valida." }, { status: 401 });
  if (user.app_metadata?.app_role !== "admin" || user.app_metadata?.project_owner !== true) {
    return NextResponse.json({ error: "Operazione riservata ai proprietari del progetto." }, { status: 403 });
  }
  if (!allowRequest(`admin-publish:${user.id}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "Troppe richieste. Attendi qualche minuto." }, { status: 429 });
  }

  const body = (await request.json()) as { invitationId?: unknown };
  if (typeof body.invitationId !== "string" || !body.invitationId) {
    return NextResponse.json({ error: "Invito non valido." }, { status: 400 });
  }

  const { data: invitation } = await admin
    .from("invitations")
    .select("id")
    .eq("id", body.invitationId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!invitation) return NextResponse.json({ error: "Invito non trovato o non autorizzato." }, { status: 404 });

  const now = new Date().toISOString();
  const { error: entitlementError } = await admin.from("invitation_entitlements").upsert({
    invitation_id: invitation.id,
    owner_id: user.id,
    plan_key: "premium",
    base_guest_limit: null,
    extra_guest_limit: 0,
    status: "active",
    last_checkout_session_id: null,
    activated_at: now,
    updated_at: now
  });
  if (entitlementError) return NextResponse.json({ error: "Attivazione amministrativa non riuscita." }, { status: 500 });

  const { error: publishError } = await admin
    .from("invitations")
    .update({ status: "published", published_at: now, updated_at: now })
    .eq("id", invitation.id)
    .eq("owner_id", user.id);
  if (publishError) return NextResponse.json({ error: "Pubblicazione non riuscita." }, { status: 500 });

  return NextResponse.json({ published: true }, { headers: { "Cache-Control": "no-store" } });
}
