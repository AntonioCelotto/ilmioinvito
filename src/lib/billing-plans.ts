export const billingProducts = {
  essential: {
    key: "essential",
    name: "Essenziale",
    price: 29,
    guestLimit: 30,
    priceEnv: "STRIPE_PRICE_ESSENTIAL"
  },
  complete: {
    key: "complete",
    name: "Completo",
    price: 59,
    guestLimit: 100,
    priceEnv: "STRIPE_PRICE_COMPLETE"
  },
  premium: {
    key: "premium",
    name: "Premium",
    price: 99,
    guestLimit: null,
    priceEnv: "STRIPE_PRICE_PREMIUM"
  },
  guest_pack_50: {
    key: "guest_pack_50",
    name: "+50 invitati",
    price: 5,
    guestLimit: 50,
    priceEnv: "STRIPE_PRICE_GUEST_PACK_50"
  }
} as const;

export type BillingProductKey = keyof typeof billingProducts;

export function isBillingProductKey(value: unknown): value is BillingProductKey {
  return typeof value === "string" && value in billingProducts;
}

export function getStripePriceId(productKey: BillingProductKey) {
  return process.env[billingProducts[productKey].priceEnv];
}
