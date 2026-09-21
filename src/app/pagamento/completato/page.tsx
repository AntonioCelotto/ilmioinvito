import { PaymentStatus } from "@/components/payment-status";

export default async function PagamentoCompletatoPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  return (
    <main className="payment-result-page">
      <section className="payment-result-card">
        <PaymentStatus sessionId={session_id} />
      </section>
    </main>
  );
}
