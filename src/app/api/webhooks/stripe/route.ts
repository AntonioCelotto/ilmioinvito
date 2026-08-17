import { NextResponse } from "next/server";
import { isBillingProductKey } from "@/lib/billing-plans";
import { verifyStripeWebhookSignature } from "@/lib/stripe-rest";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type StripeCheckoutSession = {
  id: string;
  amount_total?: number | null;
  currency?: string | null;
  payment_status?: string;
  payment_intent?: string | null;
  metadata?: { owner_id?: string; product_key?: string; invitation_id?: string };
};

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !verifyStripeWebhookSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Firma webhook non valida." }, { status: 400 });
  }

  const event = JSON.parse(payload) as {
    type?: string;
    data?: { object?: StripeCheckoutSession };
  };

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object;
  const ownerId = session?.metadata?.owner_id;
  const productKey = session?.metadata?.product_key;
  const invitationId = session?.metadata?.invitation_id;

  if (!session || session.payment_status !== "paid" || !ownerId || !invitationId || !isBillingProductKey(productKey)) {
    return NextResponse.json({ error: "Dati pagamento incompleti." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Database non configurato." }, { status: 503 });

  const { error } = await admin.rpc("apply_stripe_checkout", {
    checkout_owner_id: ownerId,
    checkout_invitation_id: invitationId,
    checkout_session_id: session.id,
    checkout_payment_id: session.payment_intent ?? null,
    checkout_product_key: productKey,
    checkout_amount_cents: session.amount_total ?? 0,
    checkout_currency: session.currency ?? "eur"
  });

  if (error) return NextResponse.json({ error: "Attivazione non riuscita." }, { status: 500 });
  return NextResponse.json({ received: true });
}
