export type OperatorStatus = "pending" | "active" | "suspended";
export type OperatorAccount = {
  user_id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  vat_number: string;
  billing_address: string;
  status: OperatorStatus;
  requested_package_key?: string | null;
  created_at: string;
};
export type OperatorGrant = {
  id: string;
  operator_id: string;
  event_count: number;
  used_count: number;
  package_name: string;
  note: string;
  created_at: string;
  expires_at: string;
};
export type OperatorUsage = {
  invitation_id: string;
  operator_id: string;
  invitation_title: string;
  created_at: string;
};
export type OperatorSummary = {
  account: OperatorAccount | null;
  available: number;
  grants: OperatorGrant[];
  usages: OperatorUsage[];
};
export function availableCredits(grants: OperatorGrant[], now = Date.now()) {
  return grants.reduce((total, grant) => total + (Date.parse(grant.expires_at) > now ? grant.event_count - grant.used_count : 0), 0);
}
export const operatorPackages = [
  { key: "pilot", stripePriceId: "price_1UaCY3Qa5onFFcwq2E7Nu1qp", name: "Evento pilota Firma", events: 1, price: 89 },
  { key: "five", stripePriceId: "price_1UaCYHQa5onFFcwqHkKfUFBj", name: "5 eventi Firma", events: 5, price: 395 },
  { key: "ten", stripePriceId: "price_1UaCYNQa5onFFcwqDpdF9geC", name: "10 eventi Firma", events: 10, price: 690 },
  { key: "twentyfive", stripePriceId: "price_1UaCYSQa5onFFcwqEkhL0202", name: "25 eventi Firma", events: 25, price: 1475 }
] as const;
