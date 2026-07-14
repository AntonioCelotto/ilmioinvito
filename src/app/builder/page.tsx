import { demoInvitation } from "@/lib/demo-data";

export default function BuilderPage() {
  return (
    <main className="workspace">
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand" href="/">
            ilmioinvito
          </a>
          <nav aria-label="Builder">
            <a className="active" href="/builder">
              Crea invito
            </a>
            <a href="/dashboard">Dashboard</a>
            <a href="/i/dora-lorenzo-demo">Anteprima pubblica</a>
          </nav>
        </aside>

        <section className="main">
          <div className="toolbar">
            <div>
              <p className="eyebrow">Builder MVP</p>
              <h2>Crea il tuo invito</h2>
              <p className="muted">
                Prima versione statica del flusso: i campi sono pronti per
                essere collegati a Supabase e checkout.
              </p>
            </div>
            <a className="button" href="/dashboard">
              Vai alla dashboard
            </a>
          </div>

          <div className="builder">
            <form className="form-panel">
              <div className="field">
                <label htmlFor="title">Titolo invito</label>
                <input id="title" defaultValue={demoInvitation.title} />
              </div>
              <div className="field">
                <label htmlFor="subtitle">Sottotitolo</label>
                <input id="subtitle" defaultValue={demoInvitation.subtitle} />
              </div>
              <div className="field">
                <label htmlFor="date">Data evento</label>
                <input id="date" defaultValue={demoInvitation.eventDate} />
              </div>
              <div className="field">
                <label htmlFor="time">Orario</label>
                <input id="time" defaultValue={demoInvitation.eventTime} />
              </div>
              <div className="field">
                <label htmlFor="venue">Location</label>
                <input id="venue" defaultValue={demoInvitation.venueName} />
              </div>
              <div className="field">
                <label htmlFor="address">Indirizzo</label>
                <input id="address" defaultValue={demoInvitation.venueAddress} />
              </div>
              <div className="field">
                <label htmlFor="whatsapp">Numero WhatsApp RSVP</label>
                <input id="whatsapp" defaultValue={demoInvitation.whatsappNumber} />
              </div>
              <div className="field">
                <label htmlFor="story">Racconto</label>
                <textarea id="story" defaultValue={demoInvitation.story} />
              </div>
              <button className="button" type="button">
                Salva bozza
              </button>
            </form>

            <div className="preview-phone" aria-label="Anteprima invito">
              <div>
                <p className="eyebrow">Anteprima</p>
                <h2>{demoInvitation.title}</h2>
                <p>{demoInvitation.subtitle}</p>
                <div className="invite-meta">
                  <span>{demoInvitation.eventDate}</span>
                  <span>{demoInvitation.eventTime}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
