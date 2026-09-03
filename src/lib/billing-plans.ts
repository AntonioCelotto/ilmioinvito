export const billingProducts = {
  essential: {
    key: "essential",
    name: "Essenziale",
    price: 29,
    guestLimit: 30,
    stripePriceId: "price_1UBBUVQa5onFFcwqUj1r5AOX"
  },
  complete: {
    key: "complete",
    name: "Completo",
    price: 59,
    guestLimit: 100,
    stripePriceId: "price_1UBBVyQa5onFFcwqBHdSrJRd"
  },
  premium: {
    key: "premium",
    name: "Premium",
    price: 99,
    guestLimit: null,
    stripePriceId: "price_1UBBY9Qa5onFFcwq1Mmukd0G"
  },
  guest_pack_50: {
    key: "guest_pack_50",
    name: "+50 invitati",
    price: 5,
    guestLimit: 50,
    stripePriceId: "price_1UBBdSQa5onFFcwqWAh9bcYa"
  }
} as const;

export type BillingProductKey = keyof typeof billingProducts;

export function isBillingProductKey(value: unknown): value is BillingProductKey {
  return typeof value === "string" && value in billingProducts;
}

export function getStripePriceId(productKey: BillingProductKey) {
  return billingProducts[productKey].stripePriceId;
}
