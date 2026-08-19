"use client";

import { useMemo, useState } from "react";
import { savePublicRsvp, type RsvpStatus } from "@/lib/supabase/rsvps";

type Guest = {
  id: number;
  name: string;
  surname: string;
  additionalInfo: string;
};

type InviteRsvpProps = {
  invitationId: string;
  whatsappNumber: string;
  invitationTitle: string;
};

function normalizeWhatsappNumber(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (trimmed.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("39")) return digits;
  return digits.length === 10 ? `39${digits}` : digits;
}

export function InviteRsvp({ invitationId, whatsappNumber, invitationTitle }: InviteRsvpProps) {
  const [guests, setGuests] = useState<Guest[]>([
    { id: 1, name: "", surname: "", additionalInfo: "" }
  ]);
  const [phone, setPhone] = useState("");
  const [attendance, setAttendance] = useState<RsvpStatus>("confirmed");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const guestsText = useMemo(() => guests.map((guest, index) => {
    const fullName = `${guest.name} ${guest.surname}`.trim() || "Nome non indicato";
    return [
      `${index + 1}. ${fullName}`,
      attendance === "confirmed" ? `   Allergie e informazioni aggiuntive: ${guest.additionalInfo || "Nessuna"}` : ""
    ].filter(Boolean).join("\n");
  }).join("\n"), [guests, attendance]);

  const recipientNumber = useMemo(() => normalizeWhatsappNumber(whatsappNumber), [whatsappNumber]);

  const whatsappLink = useMemo(() => {
    const message = attendance === "confirmed"
      ? [`CONFERMA ${invitationTitle.toUpperCase()}`, `Telefono di contatto: ${phone}`, `Invitati (${guests.length}):`, guestsText].join("\n")
      : [`RISPOSTA ${invitationTitle.toUpperCase()}`, "Non potrò partecipare all'evento.", `Telefono di contatto: ${phone}`, guestsText].join("\n");
    return recipientNumber ? `https://wa.me/${recipientNumber}?text=${encodeURIComponent(message)}` : "";
  }, [attendance, guests.length, guestsText, invitationTitle, phone, recipientNumber]);

  return (
    <div className="rsvp-stack">
      <form className="rsvp-form" onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setSubmitMessage("");
        const result = await savePublicRsvp(invitationId, phone, guests, attendance);
        setSubmitMessage(result.message);
        setSubmitting(false);
        if (result.status === "saved" && whatsappLink) window.location.href = whatsappLink;
      }}>
        <div className="field">
          <label>Parteciperai?</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
            <button className={`button ${attendance === "confirmed" ? "" : "secondary"}`} type="button" onClick={() => setAttendance("confirmed")}>Sì, partecipo</button>
            <button className={`button ${attendance === "declined" ? "" : "secondary"}`} type="button" onClick={() => setAttendance("declined")}>No, non partecipo</button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="phone">Telefono WhatsApp</label>
          <input id="phone" required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>

        <div className="guest-head">
          <strong>{attendance === "confirmed" ? "Dati degli invitati" : "Chi non potrà partecipare"}</strong>
          <button className="button secondary" type="button" onClick={() => setGuests((current) => [...current, { id: Date.now(), name: "", surname: "", additionalInfo: "" }])}>
            + Aggiungi invitato
          </button>
        </div>

        {guests.map((guest, index) => (
          <div className="guest-card" key={guest.id}>
            <div className="guest-card-head">
              <strong>Invitato {index + 1}</strong>
              {index > 0 ? <button className="remove-button" type="button" onClick={() => setGuests((current) => current.filter((item) => item.id !== guest.id))}>Rimuovi</button> : null}
            </div>
            <div className="guest-row">
              <input aria-label={`Nome invitato ${index + 1}`} placeholder="Nome" required value={guest.name} onChange={(event) => setGuests((current) => current.map((item) => item.id === guest.id ? { ...item, name: event.target.value } : item))} />
              <input aria-label={`Cognome invitato ${index + 1}`} placeholder="Cognome" required value={guest.surname} onChange={(event) => setGuests((current) => current.map((item) => item.id === guest.id ? { ...item, surname: event.target.value } : item))} />
            </div>
            {attendance === "confirmed" ? (
              <textarea aria-label={`Allergie e informazioni aggiuntive invitato ${index + 1}`} placeholder="Allergie, intolleranze o informazioni aggiuntive" value={guest.additionalInfo} onChange={(event) => setGuests((current) => current.map((item) => item.id === guest.id ? { ...item, additionalInfo: event.target.value } : item))} />
            ) : null}
          </div>
        ))}

        {!recipientNumber ? <p className="rsvp-warning">Il numero WhatsApp per le conferme non è stato configurato.</p> : null}
        {submitMessage ? <p className={submitMessage.includes("salvat") || submitMessage.includes("Risposta") ? "rsvp-success" : "rsvp-warning"}>{submitMessage}</p> : null}

        <button className="button light" disabled={submitting} type="submit">
          {submitting ? "Salvataggio..." : attendance === "confirmed" ? (recipientNumber ? "Partecipa e invia su WhatsApp" : "Conferma partecipazione") : (recipientNumber ? "Non partecipo e invia su WhatsApp" : "Conferma che non partecipi")}
        </button>
      </form>
    </div>
  );
}
