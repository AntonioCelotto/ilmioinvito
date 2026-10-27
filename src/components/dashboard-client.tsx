"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import {
  InvitationDraft,
  draftStorageKey,
  editingDraftStorageKey,
  readDrafts,
  removeDraft,
  saveDraft,
  setEditingDraft
} from "@/lib/draft-storage";
import {
  deleteDraftFromSupabase,
  getCurrentUser,
  loadUserDraftsFromSupabase
} from "@/lib/supabase/drafts";
import { DashboardRsvp, loadDashboardRsvps, updateDashboardRsvpInfo, updateDashboardRsvpStatus } from "@/lib/supabase/rsvps";
import {
  InvitationGuest,
  InvitationGuestImportRow,
  addInvitationGuest,
  deleteInvitationGuest,
  deleteInvitationGuests,
  importInvitationGuests,
  loadInvitationGuests,
  markGuestInvited,
  markGuestReminded
} from "@/lib/supabase/invitation-guests";
import {
  deleteGuestMedia,
  GuestMediaItem,
  loadDashboardGuestMedia,
  updateGuestMediaStatus
} from "@/lib/supabase/guest-media";
import { downloadGuestPdf } from "@/lib/guest-pdf";
import { isProjectAdmin, publishInvitationAsAdmin } from "@/lib/admin-publish";

export function DashboardClient() {
  const [drafts, setDrafts] = useState<InvitationDraft[]>([]);
  const [remoteMessage, setRemoteMessage] = useState("");
  const [rsvps, setRsvps] = useState<DashboardRsvp[]>([]);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [updatingRsvpId, setUpdatingRsvpId] = useState("");
  const [invitationGuests, setInvitationGuests] = useState<InvitationGuest[]>([]);
  const [guestListMessage, setGuestListMessage] = useState("");
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [newGuestInfo, setNewGuestInfo] = useState("");
  const [guestListBusyId, setGuestListBusyId] = useState("");
  const [importingGuestList, setImportingGuestList] = useState(false);
  const [importInvitationId, setImportInvitationId] = useState("");
  const [selectedInvitationId, setSelectedInvitationId] = useState("all");
  const [deletingDraftId, setDeletingDraftId] = useState("");
  const [draftActionMessage, setDraftActionMessage] = useState("");
  const [guestMedia, setGuestMedia] = useState<GuestMediaItem[]>([]);
  const [guestMediaMessage, setGuestMediaMessage] = useState("");
  const [updatingGuestMediaId, setUpdatingGuestMediaId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPublishingId, setAdminPublishingId] = useState("");
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const guestTableTopScrollRef = useRef<HTMLDivElement>(null);
  const guestTableBottomScrollRef = useRef<HTMLDivElement>(null);
  const syncingGuestScrollRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function syncDashboard() {
      const user = await getCurrentUser();
      if (active) setIsAdmin(isProjectAdmin(user));

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

    async function syncGuestMedia() {
      const result = await loadDashboardGuestMedia();
      if (!active) return;
      setGuestMedia(result.items);
      setGuestMediaMessage(result.message);
    }

    void syncDashboard();
    void syncGuestMedia();
    loadDashboardRsvps().then((result) => {
      if (!active) return;
      setRsvps(result.rsvps);
      setRsvpMessage(result.message);
    });
    loadInvitationGuests().then((result) => {
      if (!active) return;
      setInvitationGuests(result.guests);
      setGuestListMessage(result.message);
    });

    const onFocus = () => {
      void syncDashboard();
      void syncGuestMedia();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncDashboard();
        void syncGuestMedia();
      }
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
  const publishedInvitations = useMemo(
    () => drafts.filter((draft) => draft.status === "published"),
    [drafts]
  );
  const savedDrafts = useMemo(
    () => drafts.filter((draft) => draft.status !== "published"),
    [drafts]
  );

  const visibleRsvps = useMemo(
    () => selectedInvitationId === "all"
      ? rsvps
      : rsvps.filter((rsvp) => rsvp.invitationId === selectedInvitationId),
    [rsvps, selectedInvitationId]
  );
  const visibleGuestMedia = useMemo(
    () => selectedInvitationId === "all"
      ? guestMedia
      : guestMedia.filter((item) => item.invitationId === selectedInvitationId),
    [guestMedia, selectedInvitationId]
  );
  const visibleInvitationGuests = useMemo(
    () => selectedInvitationId === "all"
      ? invitationGuests
      : invitationGuests.filter((guest) => guest.invitationId === selectedInvitationId),
    [invitationGuests, selectedInvitationId]
  );
  const pendingGuestMedia = visibleGuestMedia.filter((item) => item.status === "pending");
  const approvedGuestMedia = visibleGuestMedia.filter((item) => item.status === "approved");
  const rejectedGuestMedia = visibleGuestMedia.filter((item) => item.status === "rejected");

  const confirmedRsvps = visibleRsvps.filter((rsvp) => rsvp.status === "confirmed");
  const declinedRsvps = visibleRsvps.filter((rsvp) => rsvp.status === "declined");
  const responseGroups = new Set(visibleRsvps.map((rsvp) => rsvp.responseGroupId)).size;
  const guestsWithInformation = confirmedRsvps.filter(
    (rsvp) => rsvp.additionalInfo.trim().length > 0
  ).length;
  const pendingInvitationGuests = visibleInvitationGuests.filter((guest) => guest.status === "pending");
  const confirmedInvitationGuests = visibleInvitationGuests.filter((guest) => guest.status === "confirmed");
  const declinedInvitationGuests = visibleInvitationGuests.filter((guest) => guest.status === "declined");

  const selectedInvitationTitle = selectedInvitationId === "all"
    ? "Tutti gli inviti"
    : invitationOptions.find((invitation) => invitation.id === selectedInvitationId)?.title ?? "Invito";

  const effectiveImportInvitationId =
    selectedInvitationId !== "all"
      ? selectedInvitationId
      : importInvitationId || publishedInvitations[0]?.id || invitationOptions[0]?.id || "";

  function invitationStats(invitationId: string) {
    const rows = rsvps.filter((rsvp) => rsvp.invitationId === invitationId);
    return {
      confirmed: rows.filter((rsvp) => rsvp.status === "confirmed").length,
      declined: rows.filter((rsvp) => rsvp.status === "declined").length,
      responses: new Set(rows.map((rsvp) => rsvp.responseGroupId)).size
    };
  }

  async function handleRsvpInfoSave(rsvp: DashboardRsvp, value: string) {
    setUpdatingRsvpId(rsvp.id);
    setRsvpMessage("");
    const result = await updateDashboardRsvpInfo(rsvp.id, value);
    if (result.ok) {
      setRsvps((current) => current.map((item) => item.id === rsvp.id ? { ...item, additionalInfo: value.trim() } : item));
    }
    setRsvpMessage(result.message);
    setUpdatingRsvpId("");
  }

  async function handleManualRsvpStatus(rsvp: DashboardRsvp, status: DashboardRsvp["status"]) {
    if (rsvp.status === status) return;
    setUpdatingRsvpId(rsvp.id);
    setRsvpMessage("");
    const result = await updateDashboardRsvpStatus(rsvp.id, status);
    if (result.ok) {
      setRsvps((current) => current.map((item) => item.id === rsvp.id ? { ...item, status } : item));
    }
    setRsvpMessage(result.message);
    setUpdatingRsvpId("");
  }

  function reminderWhatsappLink(guest: InvitationGuest) {
    const digits = guest.contactPhone.replace(/\D/g, "");
    if (!digits) return "";
    const phone = digits.startsWith("39") ? digits : digits.length === 10 ? `39${digits}` : digits;
    const inviteUrl = `${window.location.origin}/i/${guest.invitationSlug}`;
    const message = `Ciao ${guest.guestName}, ti ricordiamo l'invito “${guest.invitationTitle}”. Quando puoi, conferma se parteciperai oppure no qui: ${inviteUrl}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  async function handleAddInvitationGuest() {
    if (!effectiveImportInvitationId) {
      setGuestListMessage("Non ci sono inviti disponibili per l'importazione.");
      return;
    }
    setGuestListBusyId("new");
    const result = await addInvitationGuest(selectedInvitationId, newGuestName, newGuestPhone, newGuestEmail, newGuestInfo);
    setGuestListMessage(result.message);
    if (result.ok) {
      setNewGuestName("");
      setNewGuestPhone("");
      setNewGuestEmail("");
      setNewGuestInfo("");
      const refreshed = await loadInvitationGuests();
      setInvitationGuests(refreshed.guests);
    }
    setGuestListBusyId("");
  }

  function parseGuestCsv(text: string): InvitationGuestImportRow[] {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return [];

    const separator = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";
    const parseLine = (line: string) => {
      const cells: string[] = [];
      let current = "";
      let quoted = false;
      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (char === '"') {
          if (quoted && line[index + 1] === '"') {
            current += '"';
            index += 1;
          } else {
            quoted = !quoted;
          }
        } else if (char === separator && !quoted) {
          cells.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells;
    };

    const headers = parseLine(lines[0]).map((value) => value.toLowerCase().trim());
    const findHeader = (...names: string[]) => headers.findIndex((header) => names.some((name) => header === name || header.includes(name)));
    const nameIndex = findHeader("nome", "name", "invitato");
    const surnameIndex = findHeader("cognome", "surname");
    const phoneIndex = findHeader("cellulare", "telefono", "phone", "mobile");
    const emailIndex = findHeader("email", "e-mail", "mail");
    const infoIndex = findHeader("allergie", "informazioni", "note", "info");

    const hasHeader = nameIndex >= 0 || phoneIndex >= 0 || emailIndex >= 0 || infoIndex >= 0;
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const cells = parseLine(line);
      const fallbackName = cells[0] ?? "";
      const firstName = nameIndex >= 0 ? cells[nameIndex] ?? "" : fallbackName;
      const surname = surnameIndex >= 0 ? cells[surnameIndex] ?? "" : "";
      const rawSecond = cells[1] ?? "";
      const rawThird = cells[2] ?? "";
      const rawFourth = cells[3] ?? "";
      const emailLike = (value: string) => value.includes("@");
      const contactPhone = phoneIndex >= 0
        ? cells[phoneIndex] ?? ""
        : emailLike(rawSecond) ? "" : rawSecond;
      const email = emailIndex >= 0
        ? cells[emailIndex] ?? ""
        : emailLike(rawSecond) ? rawSecond : emailLike(rawThird) ? rawThird : "";
      return {
        guestName: `${firstName} ${surname}`.trim(),
        contactPhone,
        email,
        additionalInfo: ""
      };
    }).filter((row) => row.guestName.length > 0);
  }

  async function handleGuestListImport(file: File) {
    if (!effectiveImportInvitationId) {
      setGuestListMessage("Seleziona l'invito in cui importare i contatti.");
      return;
    }
    setImportingGuestList(true);
    setGuestListMessage("");
    try {
      const text = await file.text();
      const rows = parseGuestCsv(text);
      const result = await importInvitationGuests(effectiveImportInvitationId, rows);
      setGuestListMessage(result.message);
      if (result.ok) {
        const refreshed = await loadInvitationGuests();
        setInvitationGuests(refreshed.guests);
      }
    } catch {
      setGuestListMessage("Non è stato possibile leggere il file. Usa un CSV esportato da Excel.");
    }
    setImportingGuestList(false);
  }

  function guestInvitationLink(guest: InvitationGuest) {
    return `${window.location.origin}/i/${guest.invitationSlug}`;
  }

  function guestEmailLink(guest: InvitationGuest) {
    if (!guest.email) return "";
    const subject = `Invito: ${guest.invitationTitle}`;
    const body = `Ciao ${guest.guestName}, sei invitato/a. Puoi vedere l'invito e confermare la partecipazione qui: ${guestInvitationLink(guest)}`;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(guest.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function guestWhatsappInviteLink(guest: InvitationGuest) {
    const digits = guest.contactPhone.replace(/\D/g, "");
    if (!digits) return "";
    const phone = digits.startsWith("39") ? digits : digits.length === 10 ? `39${digits}` : digits;
    const message = `Ciao ${guest.guestName}, sei invitato/a a “${guest.invitationTitle}”. Puoi vedere l'invito e confermare la partecipazione qui: ${guestInvitationLink(guest)}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  async function handleSendWhatsappInvite(guest: InvitationGuest) {
    const link = guestWhatsappInviteLink(guest);
    if (!link) {
      setGuestListMessage("Questo contatto non ha un numero WhatsApp.");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
    const result = await markGuestInvited(guest.id, "whatsapp");
    if (result.ok && result.invitedAt) {
      setInvitationGuests((current) => current.map((item) => item.id === guest.id
        ? { ...item, invitedAt: result.invitedAt!, inviteChannel: "whatsapp" }
        : item));
    }
    setGuestListMessage(result.message);
  }

  async function handleSendEmailInvite(guest: InvitationGuest) {
    const link = guestEmailLink(guest);
    if (!link) {
      setGuestListMessage("Questo contatto non ha un indirizzo email.");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
    const result = await markGuestInvited(guest.id, "email");
    if (result.ok && result.invitedAt) {
      setInvitationGuests((current) => current.map((item) => item.id === guest.id
        ? { ...item, invitedAt: result.invitedAt!, inviteChannel: "email" }
        : item));
    }
    setGuestListMessage(result.message);
  }

  async function handleDeleteSelectedGuests() {
    const ids = selectedGuestIds.filter((id) => visibleInvitationGuests.some((guest) => guest.id === id));
    if (ids.length === 0) {
      setGuestListMessage("Seleziona almeno un contatto da eliminare.");
      return;
    }
    if (!window.confirm(`Vuoi eliminare ${ids.length} contatti selezionati?`)) return;
    setGuestListBusyId("bulk");
    const result = await deleteInvitationGuests(ids);
    setGuestListMessage(result.message);
    if (result.ok) {
      setInvitationGuests((current) => current.filter((guest) => !ids.includes(guest.id)));
      setSelectedGuestIds((current) => current.filter((id) => !ids.includes(id)));
    }
    setGuestListBusyId("");
  }

  function syncGuestTableScroll(source: "top" | "bottom") {
    if (syncingGuestScrollRef.current) return;
    const from = source === "top" ? guestTableTopScrollRef.current : guestTableBottomScrollRef.current;
    const to = source === "top" ? guestTableBottomScrollRef.current : guestTableTopScrollRef.current;
    if (!from || !to) return;
    syncingGuestScrollRef.current = true;
    to.scrollLeft = from.scrollLeft;
    window.requestAnimationFrame(() => { syncingGuestScrollRef.current = false; });
  }

  async function handleDeleteInvitationGuest(guest: InvitationGuest) {
    if (!window.confirm(`Vuoi eliminare ${guest.guestName} dalla lista invitati?`)) return;
    setGuestListBusyId(guest.id);
    const result = await deleteInvitationGuest(guest.id);
    setGuestListMessage(result.message);
    if (result.ok) setInvitationGuests((current) => current.filter((item) => item.id !== guest.id));
    setGuestListBusyId("");
  }

  async function handleReminder(guest: InvitationGuest) {
    const link = reminderWhatsappLink(guest);
    if (!link) {
      setGuestListMessage("Inserisci un numero di telefono per poter inviare il promemoria WhatsApp.");
      return;
    }
    setGuestListBusyId(guest.id);
    const result = await markGuestReminded(guest.id);
    if (result.ok && result.remindedAt) {
      setInvitationGuests((current) => current.map((item) => item.id === guest.id ? { ...item, remindedAt: result.remindedAt! } : item));
      window.open(link, "_blank", "noopener,noreferrer");
    }
    setGuestListMessage(result.message);
    setGuestListBusyId("");
  }

  function handleEdit(draft: InvitationDraft) {
    setEditingDraft(draft);
    window.location.href = `/builder?edit=${encodeURIComponent(draft.id)}`;
  }

  function handlePublish(draft: InvitationDraft) {
    setEditingDraft(draft);
    window.location.href = `/abbonamenti?invito=${encodeURIComponent(draft.id)}&titolo=${encodeURIComponent(draft.title)}`;
  }

  async function handleAdminPublish(draft: InvitationDraft) {
    setAdminPublishingId(draft.id);
    setDraftActionMessage("");
    const result = await publishInvitationAsAdmin(draft.id);
    if (result.ok) {
      const publishedDraft = { ...draft, status: "published" as const, updatedAt: new Date().toISOString() };
      saveDraft(publishedDraft);
      setDrafts((current) => current.map((item) => item.id === draft.id ? publishedDraft : item));
    }
    setDraftActionMessage(result.message);
    setAdminPublishingId("");
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

  async function handleGuestMediaStatus(item: GuestMediaItem, status: GuestMediaItem["status"]) {
    setUpdatingGuestMediaId(item.id);
    setGuestMediaMessage("");
    const result = await updateGuestMediaStatus(item.id, status);
    if (result.ok) {
      setGuestMedia((current) => current.map((media) => media.id === item.id ? { ...media, status } : media));
      setGuestMediaMessage(status === "approved"
        ? "Ricordo pubblicato sull’invito."
        : status === "rejected"
          ? "Ricordo rifiutato e non visibile agli invitati."
          : "Ricordo riportato in attesa.");
    } else {
      setGuestMediaMessage(`Aggiornamento non riuscito: ${result.message}`);
    }
    setUpdatingGuestMediaId("");
  }

  async function handleGuestMediaDelete(item: GuestMediaItem) {
    if (!window.confirm(`Vuoi eliminare definitivamente il contenuto condiviso da ${item.guestName}?`)) return;
    setUpdatingGuestMediaId(item.id);
    setGuestMediaMessage("");
    const result = await deleteGuestMedia(item);
    if (result.ok) {
      setGuestMedia((current) => current.filter((media) => media.id !== item.id));
      setGuestMediaMessage(result.message);
    } else {
      setGuestMediaMessage(`Eliminazione non riuscita: ${result.message}`);
    }
    setUpdatingGuestMediaId("");
  }

  const GuestMediaCards = ({ items }: { items: GuestMediaItem[] }) => items.length === 0 ? (
    <div className="empty-state">
      <h3>Nessun ricordo in questa sezione</h3>
      <p className="muted">Le foto e i video condivisi dagli invitati compariranno qui.</p>
    </div>
  ) : (
    <div className="guest-media-gallery social-feed dashboard-media-feed">
      {items.map((item) => (
        <article className="guest-media-card social-post dashboard-media-card" key={item.id}>
          <div className="social-post-author">
            <span>{item.guestName.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{item.guestName}</strong>
              <small>{item.invitationTitle} · {new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}</small>
            </div>
          </div>
          {item.dedication ? <p className="social-post-dedication">“{item.dedication}”</p> : null}
          {item.mediaType === "photo" ? (
            <img src={item.url} alt={`Ricordo condiviso da ${item.guestName}`} loading="lazy" />
          ) : (
            <video src={item.url} controls preload="metadata" />
          )}
          <div className="draft-actions dashboard-media-actions">
            {item.status !== "approved" ? (
              <button className="button" disabled={updatingGuestMediaId === item.id} type="button" onClick={() => handleGuestMediaStatus(item, "approved")}>Pubblica sull’invito</button>
            ) : <span className="status confirmed">Pubblicato</span>}
            {item.status !== "rejected" ? (
              <button className="button light" disabled={updatingGuestMediaId === item.id} type="button" onClick={() => handleGuestMediaStatus(item, "rejected")}>Rifiuta</button>
            ) : <span className="status pending">Rifiutato</span>}
            {item.status !== "pending" ? (
              <button className="draft-delete-button" disabled={updatingGuestMediaId === item.id} type="button" onClick={() => handleGuestMediaStatus(item, "pending")}>Rimetti in attesa</button>
            ) : null}
            <button className="draft-delete-button" disabled={updatingGuestMediaId === item.id} type="button" onClick={() => handleGuestMediaDelete(item)}>{updatingGuestMediaId === item.id ? "Attendi…" : item.mediaType === "photo" ? "Elimina immagine" : "Elimina video"}</button>
          </div>
        </article>
      ))}
    </div>
  );

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
                <td>
                  <select
                    aria-label={`Stato di ${rsvp.guestName}`}
                    disabled={updatingRsvpId === rsvp.id}
                    value={rsvp.status}
                    onChange={(event) => void handleManualRsvpStatus(rsvp, event.target.value as DashboardRsvp["status"])}
                    style={{ minWidth: 132 }}
                  >
                    <option value="confirmed">Partecipa</option>
                    <option value="declined">Non partecipa</option>
                  </select>
                </td>
                <td>{rsvp.contactPhone || "-"}</td>
                {!declined ? (
                  <td>
                    <form
                      style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 260 }}
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        void handleRsvpInfoSave(rsvp, String(form.get("additionalInfo") ?? ""));
                      }}
                    >
                      <input
                        aria-label={`Allergie e informazioni di ${rsvp.guestName}`}
                        name="additionalInfo"
                        defaultValue={rsvp.additionalInfo}
                        placeholder="Nessuna"
                        style={{ minWidth: 170 }}
                      />
                      <button
                        className="button secondary"
                        type="submit"
                        disabled={updatingRsvpId === rsvp.id}
                      >
                        {updatingRsvpId === rsvp.id ? "Salvataggio…" : "Salva"}
                      </button>
                    </form>
                  </td>
                ) : null}
                <td>{new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(rsvp.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  const InvitationRows = ({ items, published = false }: { items: InvitationDraft[]; published?: boolean }) => (
    <div className="draft-list">
      {items.map((draft) => (
        <article className="draft-row" key={draft.id}>
          <div>
            <h3>{draft.title}</h3>
            <p className="muted">{draft.eventDate} alle {draft.eventTime} - {draft.activeSections.length} sezioni - {draft.locations.length} location</p>
            <div className="mini-section-list">{draft.activeSections.map((section) => <span key={section}>{section}</span>)}</div>
          </div>
          <div className="draft-actions">
            <span className={`status ${published ? "confirmed" : "pending"}`}>{published ? "Pubblicato" : "Bozza"}</span>
            <a className="button draft-preview-button" href={`/i/${draft.slug}`}>{published ? "Apri invito" : "Anteprima"}</a>
            <button className="button draft-edit-button" type="button" onClick={() => handleEdit(draft)}>Modifica</button>
            {!published ? <button className="button draft-publish-button" type="button" onClick={() => handlePublish(draft)}>Pubblica e paga</button> : null}
            {!published && isAdmin ? <button className="button secondary" disabled={adminPublishingId === draft.id} type="button" onClick={() => handleAdminPublish(draft)}>{adminPublishingId === draft.id ? "Pubblicazione…" : "Pubblica come amministratore"}</button> : null}
            <button className="draft-delete-button" disabled={deletingDraftId === draft.id} type="button" onClick={() => handleDelete(draft)}>{deletingDraftId === draft.id ? "Eliminazione…" : "Elimina"}</button>
          </div>
        </article>
      ))}
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
      <div className="panel-header"><h3>Inviti pubblicati</h3><span className="muted">{publishedInvitations.length} pubblicati</span></div>
      {remoteMessage ? <p className="panel-note">{remoteMessage}</p> : null}
      {draftActionMessage ? <p className="panel-note dashboard-action-message" role="status">{draftActionMessage}</p> : null}
      {publishedInvitations.length === 0 ? (
        <div className="empty-state"><h3>Nessun invito pubblicato</h3><p className="muted">Dopo il pagamento, gli inviti pubblicati compariranno qui.</p></div>
      ) : <InvitationRows items={publishedInvitations} published />}
    </section>

    <section className="panel dashboard-section" style={{ marginTop: 18 }}>
      <div className="panel-header"><h3>Bozze salvate</h3><span className="muted">{savedDrafts.length} bozze</span></div>
      {savedDrafts.length === 0 ? (
        <div className="empty-state"><h3>Nessuna bozza salvata</h3><p className="muted">Crea un invito dal builder e premi "Salva bozza".</p><a className="button" href="/templates">Crea invito</a></div>
      ) : <InvitationRows items={savedDrafts} />}
    </section>

    <section className="panel guest-dashboard" style={{ marginTop: 18 }}>
      <div className="guest-dashboard-head">
        <div>
          <p className="eyebrow">Gestione invitati</p>
          <h3>Scegli l'invito da gestire</h3>
          <p className="muted">Ogni invito mantiene una lista partecipanti separata. Puoi anche vedere il totale di tutti gli eventi.</p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <button
          type="button"
          className={`button ${selectedInvitationId === "all" ? "" : "light"}`}
          onClick={() => setSelectedInvitationId("all")}
          style={{ textAlign: "left", minHeight: 58, width: "auto", padding: "10px 15px" }}
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
              style={{ textAlign: "left", minHeight: 58, width: "auto", padding: "10px 15px" }}
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

    <section className="panel guest-dashboard" style={{ marginTop: 18 }}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Promemoria RSVP</p>
          <h3>Partecipa · Non partecipa · Nessuna risposta</h3>
          <p className="muted">Aggiungi gli invitati prima di inviare il link. Chi non ha ancora risposto resta in “Nessuna risposta” e può ricevere un promemoria WhatsApp.</p>
        </div>
        <strong>{pendingInvitationGuests.length} da ricordare</strong>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: 10, marginTop: 16 }}>
        {selectedInvitationId === "all" ? (
          <label className="field compact-field" style={{ margin: 0 }}>
            <span>Importa nell'invito:</span>
            <select
              value={effectiveImportInvitationId}
              onChange={(event) => setImportInvitationId(event.target.value)}
              style={{ minWidth: 170 }}
            >
              {invitationOptions.map((invitation) => (
                <option value={invitation.id} key={invitation.id}>{invitation.title}</option>
              ))}
            </select>
          </label>
        ) : null}
        <label
          className="button secondary"
          style={{
            cursor: !effectiveImportInvitationId || importingGuestList ? "not-allowed" : "pointer",
            opacity: !effectiveImportInvitationId ? 0.55 : 1
          }}
          onClick={() => {
            if (!importingGuestList && effectiveImportInvitationId) {
              window.alert("COME IMPORTARE I CONTATTI\n\n1. Prepara un file CSV da Excel.\n2. Usa le colonne: Nome, Cognome, Cellulare, Email, Allergie/Informazioni.\n3. Non è obbligatorio compilare telefono ed email entrambi: ne basta uno per poter inviare l'invito.\n4. Dopo l'importazione i contatti compariranno qui come Nessuna risposta.\n5. Quando risponderanno dal link passeranno automaticamente a Partecipa o Non partecipa.");
            }
          }}
        >
          {importingGuestList ? "Importazione…" : "Importa contatti"}
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            disabled={!effectiveImportInvitationId || importingGuestList}
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleGuestListImport(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      {selectedInvitationId === "all" ? (
        <p className="panel-note">Seleziona un invito qui sopra per aggiungere persone e inviare promemoria.</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginTop: 16 }}>
            <label className="field">
              <span>Nome invitato</span>
              <input value={newGuestName} onChange={(event) => setNewGuestName(event.target.value)} placeholder="Es. Mario Rossi" />
            </label>
            <label className="field">
              <span>Telefono WhatsApp</span>
              <input type="tel" value={newGuestPhone} onChange={(event) => setNewGuestPhone(event.target.value)} placeholder="Es. 3331234567" />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={newGuestEmail} onChange={(event) => setNewGuestEmail(event.target.value)} placeholder="nome@azienda.it" />
            </label>
            <label className="field">
              <span>Allergie e informazioni</span>
              <input value={newGuestInfo} onChange={(event) => setNewGuestInfo(event.target.value)} placeholder="Es. glutine, lattosio, note..." />
            </label>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            <button className="button" type="button" disabled={guestListBusyId === "new"} onClick={() => void handleAddInvitationGuest()}>
              {guestListBusyId === "new" ? "Aggiunta…" : "+ Aggiungi invitato"}
            </button>

          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            CSV da Excel: colonne consigliate Nome, Cognome, Cellulare, Email, Allergie/Informazioni. Sono supportati file separati da virgola, punto e virgola o tab.
          </p>
        </>
      )}

      {guestListMessage ? <p className="panel-note" role="status">{guestListMessage}</p> : null}

      <div className="metrics" style={{ marginTop: 18 }}>
        <div className="metric"><span className="muted">Partecipa</span><strong>{confirmedInvitationGuests.length}</strong></div>
        <div className="metric"><span className="muted">Non partecipa</span><strong>{declinedInvitationGuests.length}</strong></div>
        <div className="metric"><span className="muted">Nessuna risposta</span><strong>{pendingInvitationGuests.length}</strong></div>
      </div>

      {visibleInvitationGuests.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <h3>Nessun invitato inserito</h3>
          <p className="muted">Inserisci nome e telefono delle persone a cui mandi l'invito: così saprai esattamente chi non ha ancora risposto.</p>
        </div>
      ) : (
        <>
          <div className="guest-bulk-actions">
            <label className="check-row" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={visibleInvitationGuests.length > 0 && visibleInvitationGuests.every((guest) => selectedGuestIds.includes(guest.id))}
                onChange={(event) => {
                  const visibleIds = visibleInvitationGuests.map((guest) => guest.id);
                  setSelectedGuestIds((current) => event.target.checked
                    ? Array.from(new Set([...current, ...visibleIds]))
                    : current.filter((id) => !visibleIds.includes(id)));
                }}
              />
              <span>Seleziona tutto ({visibleInvitationGuests.length})</span>
            </label>
            <button
              className="draft-delete-button"
              type="button"
              disabled={guestListBusyId === "bulk" || selectedGuestIds.filter((id) => visibleInvitationGuests.some((guest) => guest.id === id)).length === 0}
              onClick={() => void handleDeleteSelectedGuests()}
            >
              {guestListBusyId === "bulk" ? "Eliminazione…" : `Elimina selezionati (${selectedGuestIds.filter((id) => visibleInvitationGuests.some((guest) => guest.id === id)).length})`}
            </button>
          </div>
          <div
            className="guest-table-top-scroll"
            ref={guestTableTopScrollRef}
            onScroll={() => syncGuestTableScroll("top")}
            aria-label="Scorrimento orizzontale tabella invitati"
          >
            <div className="guest-table-scroll-spacer" />
          </div>
          <div
            className="guest-table-scroll"
            style={{ marginTop: 6 }}
            ref={guestTableBottomScrollRef}
            onScroll={() => syncGuestTableScroll("bottom")}
          >
            <table className="table guest-table">
              <thead><tr><th aria-label="Seleziona"></th><th>Invitato</th><th>Invito</th><th>Stato</th><th>Telefono</th><th>Email</th><th>Allergie e informazioni</th><th>Invio</th><th>Azioni</th></tr></thead>
              <tbody>
                {visibleInvitationGuests.map((guest) => (
                  <tr key={guest.id}>
                    <td>
                      <input
                        aria-label={`Seleziona ${guest.guestName}`}
                        type="checkbox"
                        checked={selectedGuestIds.includes(guest.id)}
                        onChange={(event) => setSelectedGuestIds((current) => event.target.checked
                          ? Array.from(new Set([...current, guest.id]))
                          : current.filter((id) => id !== guest.id))}
                      />
                    </td>
                    <td><strong>{guest.guestName}</strong></td>
                    <td>{guest.invitationTitle}</td>
                    <td><span className={`status ${guest.status === "confirmed" ? "confirmed" : "pending"}`}>{guest.status === "confirmed" ? "Partecipa" : guest.status === "declined" ? "Non partecipa" : "Nessuna risposta"}</span></td>
                    <td>{guest.contactPhone || "-"}</td>
                    <td>{guest.email || "-"}</td>
                    <td><span className="muted">Da compilare con RSVP</span></td>
                    <td>
                      {guest.invitedAt ? (
                        <div className="guest-send-status sent">
                          <strong>Invitato</strong>
                          <span>{guest.inviteChannel === "email" ? "Email" : "WhatsApp"} · {new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(guest.invitedAt))}</span>
                        </div>
                      ) : (
                        <span className="guest-send-status pending">Da inviare</span>
                      )}
                    </td>
                    <td>
                      <div className="draft-actions guest-contact-actions">
                        {!guest.invitedAt && guest.contactPhone ? (
                          <button className="guest-action-button whatsapp" type="button" onClick={() => void handleSendWhatsappInvite(guest)}>
                            <span aria-hidden="true">✆</span> WhatsApp
                          </button>
                        ) : null}
                        {!guest.invitedAt && guest.email ? (
                          <button className="guest-action-button email" type="button" onClick={() => void handleSendEmailInvite(guest)}>
                            <span aria-hidden="true">✉</span> Email
                          </button>
                        ) : null}
                        {guest.invitedAt && guest.status === "pending" && guest.contactPhone ? (
                          <button className="guest-action-button reminder" type="button" disabled={guestListBusyId === guest.id} onClick={() => void handleReminder(guest)}>
                            <span aria-hidden="true">↻</span> Ricorda
                          </button>
                        ) : null}
                        <button className="guest-action-button delete" type="button" disabled={guestListBusyId === guest.id} onClick={() => void handleDeleteInvitationGuest(guest)}>
                          <span aria-hidden="true">×</span> Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>

    <section className="panel guest-dashboard" style={{ marginTop: 18 }}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Il mio album</p>
          <h3>Foto e video ricevuti — {selectedInvitationTitle}</h3>
          <p className="muted">Controlla i ricordi inviati dagli ospiti e scegli quali pubblicare sull’invito.</p>
        </div>
        <strong>{pendingGuestMedia.length} da approvare</strong>
      </div>
      {guestMediaMessage ? <p className="panel-note" role="status">{guestMediaMessage}</p> : null}

      <div className="media-moderation-group">
        <div className="panel-header"><h3>Da approvare</h3><span className="status pending">{pendingGuestMedia.length}</span></div>
        <GuestMediaCards items={pendingGuestMedia} />
      </div>

      {approvedGuestMedia.length > 0 ? (
        <div className="media-moderation-group">
          <div className="panel-header"><h3>Pubblicati sull’invito</h3><span className="status confirmed">{approvedGuestMedia.length}</span></div>
          <GuestMediaCards items={approvedGuestMedia} />
        </div>
      ) : null}

      {rejectedGuestMedia.length > 0 ? (
        <div className="media-moderation-group">
          <div className="panel-header"><h3>Rifiutati</h3><span className="status pending">{rejectedGuestMedia.length}</span></div>
          <GuestMediaCards items={rejectedGuestMedia} />
        </div>
      ) : null}
    </section>

    <div className="metrics" style={{ marginTop: 18 }}>
      <div className="metric"><span className="muted">Parteciperanno</span><strong>{confirmedRsvps.length}</strong></div>
      <div className="metric"><span className="muted">Non parteciperanno</span><strong>{declinedRsvps.length}</strong></div>
      <div className="metric"><span className="muted">Risposte ricevute</span><strong>{responseGroups}</strong></div>
      <div className="metric"><span className="muted">Con allergie o note</span><strong>{guestsWithInformation}</strong></div>
    </div>

    <section className="panel guest-dashboard" style={{ marginTop: 18 }}>
      <div className="panel-header">
        <div>
          <h3>✓ Parteciperanno — {selectedInvitationTitle}</h3>
          <p className="muted">Ospiti che hanno confermato la presenza. Puoi correggere stato, allergie e informazioni direttamente dalla tabella.</p>
        </div>
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
