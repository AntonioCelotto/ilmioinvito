import { createHmac, timingSafeEqual } from "node:crypto";

const stripeApiUrl = "https://api.stripe.com/v1";

export async function createStripeCheckoutSession(params: {
  priceId: string;
  ownerId: string;
  email?: string;
  productKey: string;
  invitationId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe non è configurato.");

  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": params.priceId,
    "line_items[0][quantity]": "1",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.ownerId,
    "metadata[owner_id]": params.ownerId,
    "metadata[product_key]": params.productKey,
    "metadata[invitation_id]": params.invitationId,
    billing_address_collection: "required",
    allow_promotion_codes: "true",
    customer_creation: "always"
  });

  if (params.email) body.set("customer_email", params.email);

  const response = await fetch(`${stripeApiUrl}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  const data = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !data.url) {
    throw new Error(data.error?.message ?? "Impossibile avviare il pagamento.");
  }

  return data;
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
) {
  const values = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split("=", 2);
    if (key && value) (acc[key] ??= []).push(value);
    return acc;
  }, {});
  const timestamp = Number(values.t?.[0]);
  const signatures = values.v1 ?? [];

  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((signature) => {
    try {
      const receivedBuffer = Buffer.from(signature, "hex");
      return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
    } catch {
      return false;
    }
  });
}
