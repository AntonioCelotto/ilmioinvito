export default async function PagamentoCompletatoPage({ searchParams }: { searchParams: Promise<{ invito?: string }> }) {
  const { invito } = await searchParams;
  return (
    <main className="payment-result-page">
      <section className="payment-result-card">
        <span className="payment-check" aria-hidden="true">✓</span>
        <p className="eyebrow">Pagamento ricevuto</p>
        <h1>Il tuo invito è stato pubblicato</h1>
        <p>Pagamento completato. Stripe sta confermando l’operazione e il link pubblico sarà disponibile tra pochi secondi.</p>
        <div className="actions">
          {invito ? <a className="button" href={`/i/${invito}`}>Apri il mio invito</a> : null}
          <a className="button" href="/dashboard">Vai alla dashboard</a>
          <a className="button light" href="/templates">Scegli un template</a>
        </div>
      </section>
    </main>
  );
}
