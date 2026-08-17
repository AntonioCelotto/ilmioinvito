export default function HomePage() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/">
          ilmioinvito.com
        </a>
        <nav className="nav" aria-label="Navigazione principale">
          <a href="/registrati">Registrati</a>
          <a href="/login">Accedi</a>
          <a href="/abbonamenti">Prezzi</a>
          <a href="/templates">Crea invito</a>
          <a href="/dashboard">Dashboard demo</a>
          <a href="/i/dora-lorenzo-demo">Invito demo</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Inviti digitali con RSVP e dashboard</p>
            <h1>ilmioinvito.com</h1>
            <p className="lead">
              Una piattaforma per creare inviti eleganti, pagarli online e
              controllare partecipanti, risposte e modifiche da un unico posto.
            </p>
            <div className="actions">
              <a className="button" href="/registrati">
                Registrati
              </a>
              <a className="button secondary" href="/login">
                Accedi
              </a>
              <a className="button light" href="/abbonamenti">
                Scopri prezzi e pacchetti
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-pricing-section">
        <div className="section-inner">
          <div className="home-pricing-heading">
            <p className="eyebrow">Prezzi chiari, nessun abbonamento</p>
            <h2>Prima scegli quanto ti serve. Paghi solo quando pubblichi.</h2>
            <p className="muted">Puoi progettare gratuitamente il tuo invito e acquistare il pacchetto soltanto quando è pronto.</p>
          </div>
          <div className="home-pricing-grid">
            <article><span>30 invitati</span><h3>Essenziale</h3><strong>€29</strong></article>
            <article className="recommended"><span>100 invitati</span><h3>Completo</h3><strong>€59</strong><small>Più scelto</small></article>
            <article><span>Invitati illimitati</span><h3>Premium</h3><strong>€99</strong></article>
          </div>
          <div className="home-pricing-footer">
            <span>Altri 50 invitati: €5</span>
            <a className="button" href="/abbonamenti">Vedi tutti i pacchetti</a>
          </div>
        </div>
      </section>

      <section className="section demo-status">
        <div className="section-inner split">
          <div>
            <p className="eyebrow">Demo aggiornata</p>
            <h2>Salva una bozza e apri subito il suo link.</h2>
            <p className="muted">
              Il flusso ora parte dalla registrazione cliente. Dopo l'accesso
              puoi creare la bozza, salvare i dati e aprire il link anteprima.
            </p>
          </div>
          <div className="demo-steps">
            <a className="button" href="/registrati">
              Registrati
            </a>
            <a className="button light" href="/login">
              Accedi
            </a>
            <span>Flusso: registrati, accedi, crea invito, salva bozza.</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner split">
          <div>
            <p className="eyebrow">Dal prototipo al prodotto</p>
            <h2>Il modello Dora/Lorenzo diventa riutilizzabile.</h2>
            <p className="muted">
              La prima base riprende le funzioni principali dell'invito evento:
              pagina mobile-first, countdown, racconto, location, RSVP e
              contatto WhatsApp configurabile.
            </p>
          </div>
          <ul className="feature-list">
            <li>
              <h3>Creazione guidata</h3>
              <span className="muted">
                Il cliente inserisce dati evento, testi, location e numero
                WhatsApp.
              </span>
            </li>
            <li>
              <h3>Pagamento online</h3>
              <span className="muted">
                Stripe attivera l'invito dopo il checkout con carta.
              </span>
            </li>
            <li>
              <h3>Dashboard partecipanti</h3>
              <span className="muted">
                Risposte, invitati, presenze e modifiche essenziali in tempo
                reale.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="section dark">
        <div className="section-inner split">
          <div>
            <p className="eyebrow">Stack previsto</p>
            <h2>GitHub, Vercel, Supabase e Stripe.</h2>
          </div>
          <p className="muted">
            Il progetto e strutturato per essere pubblicato su Vercel, versionato
            su GitHub e collegato a Supabase per dati, utenti e RSVP. Stripe
            gestira il pagamento e l'attivazione dell'invito.
          </p>
        </div>
      </section>
    </main>
  );
}
