"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { InvitationDraft, readDrafts } from "@/lib/draft-storage";
import { loadUserDraftsFromSupabase } from "@/lib/supabase/drafts";
import {
  DashboardRsvp,
  loadDashboardRsvps
} from "@/lib/supabase/rsvps";
import { downloadGuestPdf } from "@/lib/guest-pdf";
import {
  GuestMediaItem,
  loadDashboardGuestMedia,
  updateGuestMediaStatus
} from "@/lib/supabase/guest-media";

export function DashboardClient() {
  const [drafts, setDrafts] = useState<InvitationDraft[]>([]);
  const [remoteMessage, setRemoteMessage] = useState("");
  const [rsvps, setRsvps] = useState<DashboardRsvp[]>([]);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [selectedInvitationId, setSelectedInvitationId] = useState("all");
  const [guestMedia, setGuestMedia] = useState<GuestMediaItem[]>([]);
  const [mediaMessage, setMediaMessage] = useState("");

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

    loadDashboardRsvps().then((result) => {
      setRsvps(result.rsvps);
      setRsvpMessage(result.message);
    });
    loadDashboardGuestMedia().then((result) => {
      setGuestMedia(result.items);
      setMediaMessage(result.message);
    });
  }, []);

  async function changeMediaStatus(id: string, status: GuestMediaItem["status"]) {
    const result = await updateGuestMediaStatus(id, status);
    setMediaMessage(result.message);
    if (result.ok) {
      setGuestMedia((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    }
  }

  const invitationsWithRsvps = useMemo(() => {
    const invitations = new Map<string, string>();
    rsvps.forEach((rsvp) =>
      invitations.set(rsvp.invitationId, rsvp.invitationTitle)
    );
    return Array.from(invitations, ([id, title]) => ({ id, title }));
  }, [rsvps]);

  const visibleRsvps = useMemo(
    () =>
      selectedInvitationId === "all"
        ? rsvps
        : rsvps.filter((rsvp) => rsvp.invitationId === selectedInvitationId),
    [rsvps, selectedInvitationId]
  );

  const responseGroups = new Set(
    visibleRsvps.map((rsvp) => rsvp.responseGroupId)
  ).size;
  const guestsWithInformation = visibleRsvps.filter(
    (rsvp) => rsvp.additionalInfo.trim().length > 0
  ).length;
  const selectedInvitationTitle =
    selectedInvitationId === "all"
      ? "Tutti gli inviti"
      : invitationsWithRsvps.find(
          (invitation) => invitation.id === selectedInvitationId
        )?.title ?? "Invito";

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
          <span className="muted">Invitati confermati</span>
          <strong>{visibleRsvps.length}</strong>
        </div>
        <div className="metric">
          <span className="muted">Conferme ricevute</span>
          <strong>{responseGroups}</strong>
        </div>
        <div className="metric">
          <span className="muted">Con allergie o note</span>
          <strong>{guestsWithInformation}</strong>
        </div>
        <div className="metric">
          <span className="muted">Inviti con risposte</span>
          <strong>{invitationsWithRsvps.length}</strong>
        </div>
      </div>

      <section className="panel guest-dashboard">
        <div className="guest-dashboard-head">
          <div>
            <h3>Lista invitati</h3>
            <p className="muted">
              Conferme, contatti, allergie e informazioni di ogni partecipante.
            </p>
          </div>
          <div className="guest-dashboard-actions">
            <label className="field compact-field">
              <span>Filtra per invito</span>
              <select
                value={selectedInvitationId}
                onChange={(event) =>
                  setSelectedInvitationId(event.target.value)
                }
              >
                <option value="all">Tutti gli inviti</option>
                {invitationsWithRsvps.map((invitation) => (
                  <option value={invitation.id} key={invitation.id}>
                    {invitation.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button"
              disabled={visibleRsvps.length === 0}
              type="button"
              onClick={() =>
                downloadGuestPdf(selectedInvitationTitle, visibleRsvps)
              }
            >
              Scarica PDF
            </button>
          </div>
        </div>

        {rsvpMessage ? <p className="panel-note">{rsvpMessage}</p> : null}
        {visibleRsvps.length === 0 ? (
          <div className="empty-state">
            <h3>Nessuna conferma ricevuta</h3>
            <p className="muted">
              Quando gli invitati compileranno il modulo RSVP, compariranno qui
              automaticamente.
            </p>
          </div>
        ) : (
          <div className="guest-table-scroll">
            <table className="table guest-table">
            <thead>
              <tr>
                <th>Invitato</th>
                <th>Invito</th>
                <th>Telefono</th>
                <th>Allergie e informazioni</th>
                <th>Ricevuto</th>
              </tr>
            </thead>
            <tbody>
              {visibleRsvps.map((rsvp) => (
                <tr key={rsvp.id}>
                  <td>
                    <strong>{rsvp.guestName}</strong>
                  </td>
                  <td>{rsvp.invitationTitle}</td>
                  <td>{rsvp.contactPhone || "-"}</td>
                  <td>{rsvp.additionalInfo || "Nessuna"}</td>
                  <td>
                    {new Intl.DateTimeFormat("it-IT", {
                      dateStyle: "short",
                      timeStyle: "short"
                    }).format(new Date(rsvp.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>

      <section className="panel guest-dashboard media-moderation">
        <div className="guest-dashboard-head">
          <div>
            <h3>Foto, video e dediche degli invitati</h3>
            <p className="muted">Approva i contenuti prima di mostrarli nell’invito.</p>
          </div>
          <span className="status pending">{guestMedia.filter((item) => item.status === "pending").length} da approvare</span>
        </div>
        {mediaMessage ? <p className="panel-note">{mediaMessage}</p> : null}
        {guestMedia.length === 0 ? (
          <div className="empty-state"><h3>Nessun contenuto ricevuto</h3><p className="muted">Le foto, i video e le dediche inviati dagli ospiti compariranno qui.</p></div>
        ) : (
          <div className="moderation-grid">
            {guestMedia.map((item) => (
              <article className="moderation-card" key={item.id}>
                {item.mediaType === "photo" ? <img src={item.url} alt={`Contenuto di ${item.guestName}`} /> : <video src={item.url} controls preload="metadata" />}
                <div><span className={`status ${item.status}`}>{item.status === "pending" ? "Da approvare" : item.status === "approved" ? "Approvato" : "Rifiutato"}</span><strong>{item.guestName}</strong><small>{item.invitationTitle}</small>{item.dedication ? <p>{item.dedication}</p> : null}</div>
                <div className="moderation-actions">
                  <button className="button" type="button" onClick={() => changeMediaStatus(item.id, "approved")}>Approva</button>
                  <button className="button secondary" type="button" onClick={() => changeMediaStatus(item.id, "rejected")}>Rifiuta</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
