import { NextResponse } from "next/server";
import { operatorContext, validUuid, noStore } from "@/lib/operators/server";
import { operatorPackages } from "@/lib/operators/types";
import { operatorCheckoutBody, operatorStripeRequest, operatorStripeReady, operatorStripeReadiness, type OperatorStripeSession } from "@/lib/operators/stripe";
import { allowRequest } from "@/lib/rate-limit";

export async function GET() {
  const readiness = await operatorStripeReadiness();
  return NextResponse.json(readiness, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } });
}
export async function POST(request: Request) {
  const ctx = await operatorContext(request);
  if (ctx.response) return ctx.response;
  if (!allowRequest(`operator-checkout:${ctx.user.id}`, 8, 10 * 60_000)) return NextResponse.json({ error: "Troppi tentativi. Attendi qualche minuto." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const pack = operatorPackages.find(item => item.key === body?.packageKey);
  if (!pack || !validUuid(body?.requestId)) return NextResponse.json({ error: "Pacchetto non valido." }, { status: 400 });
  const { data: account, error: accountError } = await ctx.db.from("operator_accounts").select("status").eq("user_id", ctx.user.id).maybeSingle();
  if (accountError || account?.status !== "active") return NextResponse.json({ error: "Il pagamento è disponibile solo dopo l’approvazione dell’account operatore." }, { status: 403 });
  if (!await operatorStripeReady()) return NextResponse.json({ error: "Acquisto online al momento non disponibile. Contatta l’amministratore." }, { status: 503 });
  const { error: insertError } = await ctx.db.from("operator_stripe_orders").upsert({
    id: body.requestId, operator_id: ctx.user.id, package_key: pack.key, package_name: pack.name,
    event_count: pack.events, net_cents: pack.price * 100
  }, { onConflict: "id", ignoreDuplicates: true });
  if (insertError) return NextResponse.json({ error: "Preparazione ordine non riuscita." }, { status: 500 });
  const { data: order, error: orderError } = await ctx.db.from("operator_stripe_orders").select("id,status,package_key").eq("id", body.requestId).eq("operator_id", ctx.user.id).maybeSingle();
  if (orderError || !order || order.package_key !== pack.key) return NextResponse.json({ error: "Ordine non valido. Ricarica la pagina." }, { status: 409 });
  if (order.status === "paid") return NextResponse.json({ alreadyPaid: true }, noStore);
  try {
    const origin = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
    const session = await operatorStripeRequest<OperatorStripeSession>("checkout/sessions", operatorCheckoutBody({
      orderId: order.id, operatorId: ctx.user.id, packageKey: pack.key, email: ctx.user.email, origin
    }), `operator-checkout-${order.id}`);
    if (!session.url) throw new Error("Sessione di pagamento non disponibile.");
    const { error } = await ctx.db.from("operator_stripe_orders").update({ stripe_session_id: session.id }).eq("id", order.id).eq("operator_id", ctx.user.id);
    if (error) return NextResponse.json({ error: "Ordine non confermato. Riprova senza cambiare pacchetto." }, { status: 500 });
    return NextResponse.json({ url: session.url }, noStore);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Pagamento non disponibile." }, { status: 503 }); }
}
