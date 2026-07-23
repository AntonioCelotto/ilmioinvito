"use client";

import { useEffect, useState } from "react";
import { demoGuests, demoInvitation } from "@/lib/demo-data";
import { AuthPanel } from "@/components/auth-panel";
import { InvitationDraft, readDrafts } from "@/lib/draft-storage";
import { loadUserDraftsFromSupabase } from "@/lib/supabase/drafts";

const labels = {
  confirmed: "Confermato",
  declined: "Non partecipa",
  pending: "In attesa"
};

export function DashboardClient() {
  const [drafts, setDrafts] = useState<InvitationDraft[]>([]);
  const [remoteMessage, setRemoteMessage] = useState("");

  useEffect(() => {
    const localDrafts = readDrafts();
    setDrafts(localDrafts);

    loadUserDraftsFromSupabase().then((result) => {
      setRemoteMessage(result.message);

      if (result.drafts.length > 0) {
        const remoteIds = new Set(result.drafts.map((draft) => draft.id));
        setDrafts([
          ...result.drafts,
          ...localDrafts.filter((draft) => !remoteIds.has(draft.id))
        ]);
      }
    });
  }, []);

  const confirmed = demoGuests.filter((guest) => guest.status === "confirmed");
  const pending = demoGuests.filter((guest) => guest.status === "pending");
  const declined = demoGuests.filter((guest) => guest.status === "declined");
  const totalPeople = confirmed.reduce((sum, guest) => sum + guest.partySize, 0);

  return (
    <>
      <div className="toolbar">
        <div>
          <p className="eyebrow">Dashboard cliente</p>
          <h2>I tuoi inviti</h2>
          <p className="muted">
            Qui vedi bozze, inviti pubblicati, RSVP e impostazioni principali.
          </p>
        </div>
        <a className="button" href="/templates">
          Nuova bozza
        </a>
      </div>

      <AuthPanel />

      <section className="panel dashboard-section">
        <div className="panel-header">
          <h3>Bozze salvate</h3>
          <span className="muted">{drafts.length} bozze</span>
        </div>
        {remoteMessage ? <p className="panel-note">{remoteMessage}</p> : null}
        {drafts.length === 0 ? (
          <div className="empty-state">
            <h3>Nessuna bozza salvata</h3>
            <p className="muted">
              Crea un invito dal builder e premi "Salva bozza". In questa prima
              fase puoi salvarla nel browser; se accedi con email viene salvata
              anche su Supabase.
            </p>
            <a className="button" href="/templates">
              Crea invito
            </a>
          </div>
        ) : (
          <div className="draft-list">
            {drafts.map((draft) => (
              <article className="draft-row" key={draft.id}>
                <div>
                  <h3>{draft.title}</h3>
                  <p className="muted">
                    {draft.eventDate} alle {draft.eventTime} - {draft.activeSections.length} sezioni - {draft.locations.length} location
                  </p>
                  <div className="mini-section-list">
                    {draft.activeSections.map((section) => (
                      <span key={section}>{section}</span>
                    ))}
                  </div>
                </div>
                <div className="draft-actions">
                  <span className="status pending">Bozza</span>
                  <a className="button secondary" href={`/i/${draft.slug}`}>
                    Anteprima
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="metrics">
        <div className="metric">
          <span className="muted">Conferme demo</span>
          <strong>{confirmed.length}</strong>
        </div>
        <div className="metric">
          <span className="muted">Persone demo</span>
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
            <h3>Partecipanti demo</h3>
            <span className="muted">{demoGuests.length} risposte</span>
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
          <h3>Impostazioni demo</h3>
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
    </>
  );
}
