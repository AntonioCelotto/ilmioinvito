import { NextResponse } from "next/server";
import { billingProducts, getStripePriceId, isBillingProductKey } from "@/lib/billing-plans";
import { createStripeCheckoutSession } from "@/lib/stripe-rest";
import { createServerAuthClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Accedi prima di acquistare." }, { status: 401 });

    const authClient = createServerAuthClient();
    if (!authClient) return NextResponse.json({ error: "Accesso non configurato." }, { status: 503 });

    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Sessione non valida." }, { status: 401 });

    const body = (await request.json()) as { productKey?: unknown; invitationId?: unknown };
    if (!isBillingProductKey(body.productKey)) {
      return NextResponse.json({ error: "Pacchetto non valido." }, { status: 400 });
    }

    if (typeof body.invitationId !== "string" || !body.invitationId) {
      return NextResponse.json({ error: "Apri l’invito dalla dashboard prima di acquistare." }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Pagamenti non ancora configurati." }, { status: 503 });

    const { data: invitation } = await admin
      .from("invitations")
      .select("id,title,slug,status")
      .eq("id", body.invitationId)
      .eq("owner_id", data.user.id)
      .maybeSingle();
    if (!invitation) {
      return NextResponse.json({ error: "Invito non trovato o non autorizzato." }, { status: 404 });
    }

    if (body.productKey === "guest_pack_50") {
      const { data: entitlement } = await admin
        .from("invitation_entitlements")
        .select("plan_key,status")
        .eq("invitation_id", body.invitationId)
        .eq("owner_id", data.user.id)
        .maybeSingle();

      if (!entitlement || entitlement.status !== "active") {
        return NextResponse.json({ error: "Acquista prima un pacchetto invito." }, { status: 409 });
      }
      if (entitlement.plan_key === "premium") {
        return NextResponse.json({ error: "Il piano Premium include già invitati illimitati." }, { status: 409 });
      }
    }

    const priceId = getStripePriceId(body.productKey);
    if (!priceId) return NextResponse.json({ error: "Prezzo Stripe non ancora configurato." }, { status: 503 });

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const session = await createStripeCheckoutSession({
      priceId,
      ownerId: data.user.id,
      invitationId: body.invitationId,
      email: data.user.email,
      productKey: billingProducts[body.productKey].key,
      successUrl: `${origin}/pagamento/completato?session_id={CHECKOUT_SESSION_ID}&invito=${encodeURIComponent(invitation.slug)}`,
      cancelUrl: `${origin}/abbonamenti?pagamento=annullato&invito=${encodeURIComponent(body.invitationId)}&titolo=${encodeURIComponent(invitation.title)}`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore durante il pagamento." },
      { status: 500 }
    );
  }
}
