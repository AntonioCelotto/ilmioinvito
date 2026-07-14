import { demoGuests, demoInvitation } from "@/lib/demo-data";

const labels = {
  confirmed: "Confermato",
  declined: "Non partecipa",
  pending: "In attesa"
};

export default function DashboardPage() {
  const confirmed = demoGuests.filter((guest) => guest.status === "confirmed");
  const pending = demoGuests.filter((guest) => guest.status === "pending");
  const declined = demoGuests.filter((guest) => guest.status === "declined");
  const totalPeople = confirmed.reduce((sum, guest) => sum + guest.partySize, 0);

  return (
    <main className="workspace">
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand" href="/">
            ilmioinvito
          </a>
          <nav aria-label="Dashboard">
            <a href="/builder">Crea invito</a>
            <a className="active" href="/dashboard">
              Dashboard
            </a>
            <a href="/i/dora-lorenzo-demo">Anteprima pubblica</a>
          </nav>
        </aside>

        <section className="main">
          <div className="toolbar">
            <div>
              <p className="eyebrow">Dashboard cliente</p>
              <h2>{demoInvitation.title}</h2>
              <p className="muted">
                Controllo partecipanti, RSVP e impostazioni principali
                dell'invito.
              </p>
            </div>
            <a className="button" href="/i/dora-lorenzo-demo">
              Apri invito
            </a>
          </div>

          <div className="metrics">
            <div className="metric">
              <span className="muted">Conferme</span>
              <strong>{confirmed.length}</strong>
            </div>
            <div className="metric">
              <span className="muted">Persone</span>
              <strong>{totalPeople}</strong>
            </div>
            <div className="metric">
              <span className="muted">In attesa</span>
              <strong>{pending.length}</strong>
            </div>
            <div className="metric">
              <span className="muted">Rifiuti</span>
              <strong>{declined.length}</strong>
            </div>
          </div>

          <div className="grid">
            <section className="panel">
              <div className="panel-header">
                <h3>Partecipanti</h3>
                <span className="muted">{demoGuests.length} risposte demo</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Stato</th>
                    <th>Persone</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {demoGuests.map((guest) => (
                    <tr key={guest.id}>
                      <td>{guest.name}</td>
                      <td>
                        <span className={`status ${guest.status}`}>
                          {labels[guest.status]}
                        </span>
                      </td>
                      <td>{guest.partySize}</td>
                      <td>{guest.note ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <aside className="form-panel">
              <h3>Impostazioni invito</h3>
              <div className="field">
                <label htmlFor="whatsapp">WhatsApp RSVP</label>
                <input id="whatsapp" defaultValue={demoInvitation.whatsappNumber} />
              </div>
              <div className="field">
                <label htmlFor="slug">Link pubblico</label>
                <input id="slug" defaultValue={`/i/${demoInvitation.slug}`} />
              </div>
              <div className="field">
                <label htmlFor="status">Stato pubblicazione</label>
                <select id="status" defaultValue="published">
                  <option value="draft">Bozza</option>
                  <option value="published">Pubblicato</option>
                  <option value="archived">Archiviato</option>
                </select>
              </div>
              <button className="button" type="button">
                Salva modifiche
              </button>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
