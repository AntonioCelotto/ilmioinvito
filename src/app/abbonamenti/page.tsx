import { PricingCheckoutButton } from "@/components/pricing-checkout-button";

const plans = [
  {
    key: "essential" as const,
    name: "Essenziale",
    price: "29",
    guests: "30 invitati",
    description: "Per feste intime e piccoli eventi.",
    features: ["Invito digitale personalizzabile", "Countdown, programma e location", "RSVP e allergie", "Dashboard partecipanti"]
  },
  {
    key: "complete" as const,
    name: "Completo",
    price: "59",
    guests: "100 invitati",
    description: "La scelta più completa per matrimoni ed eventi.",
    featured: true,
    features: ["Tutto il pacchetto Essenziale", "Tutti i template disponibili", "Social con foto e video", "PDF invitati e lista desideri"]
  },
  {
    key: "premium" as const,
    name: "Premium",
    price: "99",
    guests: "Invitati illimitati",
    description: "Per grandi eventi senza limiti di partecipazione.",
    features: ["Tutto il pacchetto Completo", "Invitati illimitati", "Grafica personale", "Assistenza prioritaria"]
  }
];

export default async function AbbonamentiPage({
  searchParams
}: {
  searchParams: Promise<{ invito?: string; titolo?: string; pagamento?: string }>;
}) {
  const params = await searchParams;
  const invitationId = params.invito;
  const invitationTitle = params.titolo;

  return (
    <main className="pricing-page">
      <header className="template-page-header pricing-header">
        <a className="brand" href="/">ilmioinvito</a>
        <nav className="pricing-nav" aria-label="Navigazione abbonamenti">
          <a href="/templates">Template</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
      </header>

      <section className="pricing-hero">
        <div className="checkout-steps" aria-label="Procedura di pubblicazione">
          <span className="done">1. Invito creato</span>
          <span className="active">2. Scegli e paga</span>
          <span>3. Pubblicazione</span>
        </div>
        <p className="eyebrow">Un pagamento, il tuo evento</p>
        <h1>Scegli il pacchetto giusto</h1>
        <p>Acquisto una tantum, nessun rinnovo automatico. Puoi aggiungere altri invitati quando vuoi.</p>
        {invitationId ? (
          <div className="publishing-invite-banner">
            <span>Stai pubblicando</span>
            <strong>{invitationTitle || "Il tuo invito"}</strong>
            <small>Dopo il pagamento verrà pubblicato automaticamente.</small>
          </div>
        ) : (
          <p className="pricing-demo-note">Questa è l’anteprima dei pacchetti. Per acquistare, apri una bozza dalla dashboard e premi “Pubblica”.</p>
        )}
        {params.pagamento === "annullato" ? <p className="pricing-error" role="alert">Pagamento annullato: il tuo invito è rimasto in bozza.</p> : null}
      </section>

      <section className="pricing-grid" aria-label="Pacchetti disponibili">
        {plans.map((plan) => (
          <article className={`pricing-card${plan.featured ? " featured" : ""}`} key={plan.key}>
            {plan.featured ? <span className="pricing-badge">Più scelto</span> : null}
            <p className="eyebrow">{plan.guests}</p>
            <h2>{plan.name}</h2>
            <p className="pricing-description">{plan.description}</p>
            <div className="pricing-price"><span>€</span>{plan.price}</div>
            <small>pagamento una tantum</small>
            <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <PricingCheckoutButton productKey={plan.key} label={`Scegli ${plan.name}`} featured={plan.featured} invitationId={invitationId} />
          </article>
        ))}
      </section>

      <section className="guest-pack-card">
        <div>
          <p className="eyebrow">Più spazio quando serve</p>
          <h2>Aggiungi 50 invitati</h2>
          <p>Disponibile per i pacchetti Essenziale e Completo. Puoi acquistarlo più volte.</p>
        </div>
        <div className="guest-pack-action">
          <strong>€5</strong>
          <PricingCheckoutButton productKey="guest_pack_50" label="Aggiungi 50 invitati" invitationId={invitationId} />
        </div>
      </section>

      <section className="pricing-security">
        <h2>Pagamento protetto</h2>
        <p>Il pagamento viene gestito da Stripe. Il Mio Invito non memorizza i dati della carta o del conto bancario.</p>
      </section>
    </main>
  );
}
