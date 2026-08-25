"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import {
  InvitationDraft,
  draftStorageKey,
  editingDraftStorageKey,
  readDrafts,
  removeDraft,
  setEditingDraft
} from "@/lib/draft-storage";
import {
  deleteDraftFromSupabase,
  getCurrentUser,
  loadUserDraftsFromSupabase
} from "@/lib/supabase/drafts";
import { DashboardRsvp, loadDashboardRsvps } from "@/lib/supabase/rsvps";
import { downloadGuestPdf } from "@/lib/guest-pdf";

export function DashboardClient() {
  const [drafts, setDrafts] = useState<InvitationDraft[]>([]);
  const [remoteMessage, setRemoteMessage] = useState("");
  const [rsvps, setRsvps] = useState<DashboardRsvp[]>([]);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [selectedInvitationId, setSelectedInvitationId] = useState("all");
  const [deletingDraftId, setDeletingDraftId] = useState("");
  const [draftActionMessage, setDraftActionMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function syncDashboard() {
      const user = await getCurrentUser();

      if (!user) {
        if (active) setDrafts(readDrafts());
        return;
      }

      const result = await loadUserDraftsFromSupabase();
      if (!active) return;

      setRemoteMessage(result.message);
      setDrafts(result.drafts);
      window.localStorage.setItem(draftStorageKey, JSON.stringify(result.drafts));

      const editingRaw = window.localStorage.getItem(editingDraftStorageKey);
      if (editingRaw) {
        try {
          const editing = JSON.parse(editingRaw) as InvitationDraft;
          if (!result.drafts.some((draft) => draft.id === editing.id)) {
            window.localStorage.removeItem(editingDraftStorageKey);
          }
        } catch {
          window.localStorage.removeItem(editingDraftStorageKey);
        }
      }
    }

    void syncDashboard();
    loadDashboardRsvps().then((result) => {
      if (!active) return;
      setRsvps(result.rsvps);
      setRsvpMessage(result.message);
    });

    const onFocus = () => void syncDashboard();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void syncDashboard();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const invitationOptions = useMemo(
    () => drafts.map((draft) => ({ id: draft.id, title: draft.title, status: draft.status })),
    [drafts]
  );

  const visibleRsvps = useMemo(
    () => selectedInvitationId === "all"
      ? rsvps
      : rsvps.filter((rsvp) => rsvp.invitationId === selectedInvitationId),
    [rsvps, selectedInvitationId]
  );

  const confirmedRsvps = visibleRsvps.filter((rsvp) => rsvp.status === "confirmed");
  const declinedRsvps = visibleRsvps.filter((rsvp) => rsvp.status === "declined");
  const responseGroups = new Set(visibleRsvps.map((rsvp) => rsvp.responseGroupId)).size;
  const guestsWithInformation = confirmedRsvps.filter(
    (rsvp) => rsvp.additionalInfo.trim().length > 0
  ).length;

  const selectedInvitationTitle = selectedInvitationId === "all"
    ? "Tutti gli inviti"
    : invitationOptions.find((invitation) => invitation.id === selectedInvitationId)?.title ?? "Invito";

  function invitationStats(invitationId: string) {
    const rows = rsvps.filter((rsvp) => rsvp.invitationId === invitationId);
    return {
      confirmed: rows.filter((rsvp) => rsvp.status === "confirmed").length,
      declined: rows.filter((rsvp) => rsvp.status === "declined").length,
      responses: new Set(rows.map((rsvp) => rsvp.responseGroupId)).size
    };
  }

  function handleEdit(draft: InvitationDraft) {
    setEditingDraft(draft);
    window.location.href = `/builder?edit=${encodeURIComponent(draft.id)}`;
  }

  function handlePublish(draft: InvitationDraft) {
    setEditingDraft(draft);
    window.location.href = `/abbonamenti?invito=${encodeURIComponent(draft.id)}&titolo=${encodeURIComponent(draft.title)}`;
  }

  async function handleDelete(draft: InvitationDraft) {
    if (!window.confirm(`Vuoi eliminare definitivamente “${draft.title}”? Questa azione non può essere annullata.`)) return;
    setDeletingDraftId(draft.id);
    setDraftActionMessage("");
    const result = await deleteDraftFromSupabase(draft.id);
    if (result.status === "error") {
      setDraftActionMessage(`Impossibile eliminare l'invito: ${result.message}`);
      setDeletingDraftId("");
      return;
    }
    removeDraft(draft.id);
    setDrafts((current) => current.filter((item) => item.id !== draft.id));
    setRsvps((current) => current.filter((rsvp) => rsvp.invitationId !== draft.id));
    if (selectedInvitationId === draft.id) setSelectedInvitationId("all");
    setDraftActionMessage(result.message);
    setDeletingDraftId("");
  }

  const GuestTable = ({ rows, declined = false }: { rows: DashboardRsvp[]; declined?: boolean }) =>
    rows.length === 0 ? (
      <div className="empty-state">
        <h3>{declined ? "Nessun assente comunicato" : "Nessuna partecipazione confermata"}</h3>
        <p className="muted">Le risposte degli invitati compariranno qui automaticamente.</p>
      </div>
    ) : (
      <div className="guest-table-scroll">
        <table className="table guest-table">
          <thead>
            <tr>
              <th>Invitato</th>
              <th>Invito</th>
              <th>Stato</th>
              <th>Telefono</th>
              {!declined ? <th>Allergie e informazioni</th> : null}
              <th>Ricevuto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((rsvp) => (
              <tr key={rsvp.id}>
                <td><strong>{rsvp.guestName}</strong></td>
                <td>{rsvp.invitationTitle}</td>
                <td><span className={`status ${declined ? "pending" : "confirmed"}`}>{declined ? "Non partecipa" : "Partecipa"}</span></td>
                <td>{rsvp.contactPhone || "-"}</td>
                {!declined ? <td>{rsvp.additionalInfo || "Nessuna"}</td> : null}
                <td>{new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(rsvp.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  return <>
    <div className="toolbar">
      <div>
        <p className="eyebrow">Dashboard cliente</p>
        <h2>I tuoi inviti</h2>
        <p className="muted">Qui vedi bozze, inviti pubblicati, RSVP e impostazioni principali.</p>
      </div>
      <a className="button" href="/templates">Nuova bozza</a>
    </div>

    <AuthPanel />

    <section className="panel dashboard-section">
      <div className="panel-header"><h3>Bozze salvate</h3><span className="muted">{drafts.length} bozze</span></div>
      {remoteMessage ? <p className="panel-note">{remoteMessage}</p> : null}
      {draftActionMessage ? <p className="panel-note dashboard-action-message" role="status">{draftActionMessage}</p> : null}
      {drafts.length === 0 ? (
        <div className="empty-state"><h3>Nessuna bozza salvata</h3><p className="muted">Crea un invito dal builder e premi "Salva bozza".</p><a className="button" href="/templates">Crea invito</a></div>
      ) : (
        <div className="draft-list">
          {drafts.map((draft) => (
            <article className="draft-row" key={draft.id}>
              <div>
                <h3>{draft.title}</h3>
                <p className="muted">{draft.eventDate} alle {draft.eventTime} - {draft.activeSections.length} sezioni - {draft.locations.length} location</p>
                <div className="mini-section-list">{draft.activeSections.map((section) => <span key={section}>{section}</span>)}</div>
              </div>
              <div className="draft-actions">
                <span className={`status ${draft.status === "published" ? "confirmed" : "pending"}`}>{draft.status === "published" ? "Pubblicato" : "Bozza"}</span>
                <a className="button draft-preview-button" href={`/i/${draft.slug}`}>Anteprima</a>
                <button className="button draft-edit-button" type="button" onClick={() => handleEdit(draft)}>Modifica</button>
                {draft.status !== "published" ? <button className="button draft-publish-button" type="button" onClick={() => handlePublish(draft)}>Pubblica e paga</button> : null}
                <button className="draft-delete-button" disabled={deletingDraftId === draft.id} type="button" onClick={() => handleDelete(draft)}>{deletingDraftId === draft.id ? "Eliminazione…" : "Elimina"}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>

    <section className="panel guest-dashboard" style={{ marginTop: 18 }}>
      <div className="guest-dashboard-head">
        <div>
          <p className="eyebrow">Gestione invitati</p>
          <h3>Scegli l'invito da gestire</h3>
          <p className="muted">Ogni invito mantiene una lista partecipanti separata. Puoi anche vedere il totale di tutti gli eventi.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, marginTop: 16 }}>
        <button
          type="button"
          className={`button ${selectedInvitationId === "all" ? "" : "light"}`}
          onClick={() => setSelectedInvitationId("all")}
          style={{ textAlign: "left", minHeight: 86 }}
        >
          <strong>Tutti gli inviti</strong><br />
          <span>{rsvps.filter((rsvp) => rsvp.status === "confirmed").length} partecipanti totali</span>
        </button>
        {invitationOptions.map((invitation) => {
          const stats = invitationStats(invitation.id);
          return (
            <button
              type="button"
              key={invitation.id}
              className={`button ${selectedInvitationId === invitation.id ? "" : "light"}`}
              onClick={() => setSelectedInvitationId(invitation.id)}
              style={{ textAlign: "left", minHeight: 86 }}
            >
              <strong>{invitation.title}</strong><br />
              <span>{stats.confirmed} presenti · {stats.declined} assenti · {stats.responses} risposte</span>
            </button>
          );
        })}
      </div>

      <div className="guest-dashboard-actions" style={{ marginTop: 18 }}>
        <label className="field compact-field">
          <span>Invito selezionato</span>
          <select value={selectedInvitationId} onChange={(event) => setSelectedInvitationId(event.target.value)}>
            <option value="all">Tutti gli inviti</option>
            {invitationOptions.map((invitation) => <option value={invitation.id} key={invitation.id}>{invitation.title}</option>)}
          </select>
        </label>
        <button className="button" disabled={visibleRsvps.length === 0} type="button" onClick={() => downloadGuestPdf(selectedInvitationTitle, visibleRsvps)}>Scarica PDF</button>
      </div>

      {rsvpMessage ? <p className="panel-note">{rsvpMessage}</p> : null}
    </section>

    <div className="metrics" style={{ marginTop: 18 }}>
      <div className="metric"><span className="muted">Parteciperanno</span><strong>{confirmedRsvps.length}</strong></div>
      <div className="metric"><span className="muted">Non parteciperanno</span><strong>{declinedRsvps.length}</strong></div>
      <div className="metric"><span className="muted">Risposte ricevute</span><strong>{responseGroups}</strong></div>
      <div className="metric"><span className="muted">Con allergie o note</span><strong>{guestsWithInformation}</strong></div>
    </div>

    <section className="panel guest-dashboard" style={{ marginTop: 18 }}>
      <div className="panel-header">
        <div><h3>✓ Parteciperanno — {selectedInvitationTitle}</h3><p className="muted">Ospiti che hanno confermato la presenza.</p></div>
        <strong>{confirmedRsvps.length}</strong>
      </div>
      <GuestTable rows={confirmedRsvps} />
    </section>

    <section className="panel guest-dashboard" style={{ marginTop: 18 }}>
      <div className="panel-header">
        <div><h3>✕ Non parteciperanno — {selectedInvitationTitle}</h3><p className="muted">Ospiti che hanno comunicato che non saranno presenti.</p></div>
        <strong>{declinedRsvps.length}</strong>
      </div>
      <GuestTable rows={declinedRsvps} declined />
    </section>
  </>;
}
