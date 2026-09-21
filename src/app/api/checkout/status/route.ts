import { NextResponse } from "next/server";
import { billingProducts, isBillingProductKey } from "@/lib/billing-plans";
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
    const productKey = session.metadata?.product_key;
    const expectedAmount = isBillingProductKey(productKey) ? billingProducts[productKey].price * 100 : null;
    if (session.payment_status === "paid" && invitationId && isBillingProductKey(productKey)
      && session.amount_total === expectedAmount && session.currency?.toLowerCase() === "eur") {
      const { error: activationError } = await admin.rpc("apply_stripe_checkout", {
        checkout_owner_id: data.user.id,
        checkout_invitation_id: invitationId,
        checkout_session_id: session.id,
        checkout_payment_id: session.payment_intent ?? null,
        checkout_product_key: productKey,
        checkout_amount_cents: session.amount_total ?? 0,
        checkout_currency: session.currency ?? "eur"
      });
      if (activationError) return NextResponse.json({ error: "Attivazione pagamento non riuscita." }, { status: 500 });
    }
    const { data: invitation } = invitationId ? await admin.from("invitations").select("slug,status").eq("id", invitationId).eq("owner_id", data.user.id).maybeSingle() : { data: null };
    return NextResponse.json({ paid: session.payment_status === "paid", published: invitation?.status === "published", slug: invitation?.slug ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Pagamento non verificabile." }, { status: 400 });
  }
}
