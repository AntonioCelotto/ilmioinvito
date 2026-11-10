export function OperatorInvitation() {
  return (
    <section className="operator-invitation" aria-label="Diventa operatore">
      <div className="operator-invitation-copy">
        <p className="eyebrow">Per i professionisti degli eventi</p>
        <h2>Vuoi diventare operatore?</h2>
        <p>Sei un wedding planner, un grafico, una tipografia o gestisci una location? Crea e gestisci gli inviti dei tuoi clienti da un’unica area di lavoro.</p>
        <ul>
          <li>Usa i nostri modelli o carica la tua grafica.</li>
          <li>Gestisci eventi, invitati e conferme dalla dashboard.</li>
          <li>Pubblica con pacchetti a crediti riservati agli operatori.</li>
        </ul>
      </div>
      <div className="operator-invitation-action">
        <span className="operator-invitation-label">Il Mio Invito · Professionisti</span>
        <a className="button" href="/operatori">Richiedi di diventare operatore <span aria-hidden="true">↗</span></a>
        <p>Registrazione gratuita e abilitazione da parte del nostro team. Se hai già un account, puoi usare le stesse credenziali.</p>
      </div>
    </section>
  );
}
