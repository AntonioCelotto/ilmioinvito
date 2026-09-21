import { NextResponse } from "next/server";
import { retrieveStripeCheckoutSession } from "@/lib/stripe-rest";
import { createServerAuthClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Accesso richiesto." }, { status: 401 });
    const auth = createServerAuthClient();
    const admin = createSupabaseAdminClient();
    if (!auth || !admin) return NextResponse.json({ error: "Servizio non configurato." }, { status: 503 });
    const { data } = await auth.auth.getUser(token);
    if (!data.user) return NextResponse.json({ error: "Sessione non valida." }, { status: 401 });
    const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
    const session = await retrieveStripeCheckoutSession(sessionId);
    if (session.metadata?.owner_id !== data.user.id) return NextResponse.json({ error: "Pagamento non autorizzato." }, { status: 403 });
    const invitationId = session.metadata?.invitation_id;
    const { data: invitation } = invitationId ? await admin.from("invitations").select("slug,status").eq("id", invitationId).eq("owner_id", data.user.id).maybeSingle() : { data: null };
    return NextResponse.json({ paid: session.payment_status === "paid", published: invitation?.status === "published", slug: invitation?.slug ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Pagamento non verificabile." }, { status: 400 });
  }
}
