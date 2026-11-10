import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { operatorPackages } from "./types";
import { validUuid } from "./server";

export type OperatorStripeSession = {
  id: string;
  url?: string | null;
  payment_status?: string;
  amount_subtotal?: number | null;
  amount_total?: number | null;
  currency?: string | null;
  payment_intent?: string | null;
  automatic_tax?: { enabled?: boolean; status?: string | null };
  total_details?: { amount_tax?: number; amount_discount?: number; amount_shipping?: number };
  metadata?: { purchase_type?: string; operator_id?: string; operator_order_id?: string; operator_package_key?: string };
};
export async function operatorStripeRequest<T>(path: string, body?: URLSearchParams, idempotencyKey?: string): Promise<T> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Pagamenti online non configurati. Contatta l’amministratore.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${secret}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
    ...(body ? { body } : {}), cache: "no-store", signal: AbortSignal.timeout(15000)
  });
  const result = await response.json();
  if (!response.ok) {
    console.error("Operator Stripe request failed", { path, code: result.error?.code, type: result.error?.type });
    throw new Error("Pagamento online al momento non disponibile. Contatta l’amministratore o riprova più tardi.");
  }
  return result as T;
}
export async function operatorStripeReadiness() {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return { available: false, reason: "missing_configuration" };
  try {
    const settings = await operatorStripeRequest<{ status: string }>("tax/settings");
    if (settings.status !== "active") return { available: false, reason: "tax_setup" };
    const registrations = await operatorStripeRequest<{ data: unknown[] }>("tax/registrations?status=active&limit=1");
    return registrations.data.length ? { available: true, reason: "ready" } : { available: false, reason: "tax_registration" };
  } catch { return { available: false, reason: "connection" }; }
}
export async function operatorStripeReady() { return (await operatorStripeReadiness()).available; }
export function operatorCheckoutBody(params: { orderId: string; operatorId: string; packageKey: string; email?: string; origin: string }) {
  const pack = operatorPackages.find(item => item.key === params.packageKey);
  if (!pack) throw new Error("Pacchetto non valido.");
  const body = new URLSearchParams({
    mode: "payment", "managed_payments[enabled]": "false", "payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(pack.price * 100),
    "line_items[0][price_data][tax_behavior]": "exclusive",
    "line_items[0][price_data][product_data][name]": `Il Mio Invito Operatori — ${pack.name}`,
    "line_items[0][price_data][product_data][description]": `${pack.events} eventi Firma con grafica propria e invitati illimitati. Crediti attivabili entro 12 mesi.`,
    "line_items[0][quantity]": "1",
    "automatic_tax[enabled]": "true", "tax_id_collection[enabled]": "true",
    billing_address_collection: "required", customer_creation: "always",
    client_reference_id: params.operatorId,
    "metadata[purchase_type]": "operator_package",
    "metadata[operator_id]": params.operatorId,
    "metadata[operator_order_id]": params.orderId,
    "metadata[operator_package_key]": pack.key,
    success_url: `${params.origin}/operatori?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/operatori?pagamento=annullato`
  });
  if (params.email) body.set("customer_email", params.email);
  return body;
}
export async function retrieveOperatorSession(sessionId: string) {
  if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) throw new Error("Sessione Stripe non valida.");
  return operatorStripeRequest<OperatorStripeSession>(`checkout/sessions/${encodeURIComponent(sessionId)}`);
}
export async function fulfillOperatorSession(db: SupabaseClient, session: OperatorStripeSession) {
  const metadata = session.metadata;
  if (metadata?.purchase_type !== "operator_package" || !validUuid(metadata.operator_id) || !validUuid(metadata.operator_order_id)
    || !operatorPackages.some(pack => pack.key === metadata.operator_package_key)) throw new Error("Pagamento operatore non valido.");
  if (session.payment_status !== "paid") return { credited: false, paid: false };
  const tax = session.total_details?.amount_tax;
  if (session.currency?.toLowerCase() !== "eur" || !Number.isSafeInteger(session.amount_subtotal) || !Number.isSafeInteger(session.amount_total)
    || !Number.isSafeInteger(tax) || tax! < 0 || session.amount_total !== session.amount_subtotal! + tax!
    || (session.total_details?.amount_discount ?? 0) !== 0 || (session.total_details?.amount_shipping ?? 0) !== 0
    || session.automatic_tax?.enabled !== true || session.automatic_tax.status !== "complete") throw new Error("Importi o imposte del pagamento non validi.");
  const { error } = await db.rpc("apply_operator_stripe_checkout", {
    target_order: metadata.operator_order_id, target_operator: metadata.operator_id,
    target_package: metadata.operator_package_key, checkout_session: session.id,
    checkout_payment: session.payment_intent ?? null, checkout_net: session.amount_subtotal,
    checkout_tax: tax, checkout_total: session.amount_total
  });
  if (error) throw new Error("Accredito non riuscito. Il pagamento sarà verificato nuovamente.");
  return { credited: true, paid: true };
}
