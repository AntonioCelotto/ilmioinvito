"use client";

import { useMemo, useState } from "react";

type ExtraGuest = {
  id: number;
  name: string;
  surname: string;
};

type InviteRsvpProps = {
  whatsappNumber: string;
  invitationTitle: string;
};

function normalizeWhatsappNumber(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return digits;
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("39")) {
    return digits;
  }

  return digits.length === 10 ? `39${digits}` : digits;
}

export function InviteRsvp({
  whatsappNumber,
  invitationTitle
}: InviteRsvpProps) {
  const [extraGuests, setExtraGuests] = useState<ExtraGuest[]>([]);
  const [form, setForm] = useState({
    name: "",
    surname: "",
    phone: "",
    notes: ""
  });

  const guestsText = useMemo(() => {
    const filledGuests = extraGuests
      .map((guest, index) => {
        const fullName = `${guest.name} ${guest.surname}`.trim();
        return fullName ? `${index + 1}. ${fullName}` : null;
      })
      .filter(Boolean);

    return filledGuests.length > 0
      ? filledGuests.join(" | ")
      : "Nessun ospite aggiuntivo";
  }, [extraGuests]);

  const recipientNumber = useMemo(
    () => normalizeWhatsappNumber(whatsappNumber),
    [whatsappNumber]
  );

  const whatsappLink = useMemo(() => {
    const message = [
      `CONFERMA ${invitationTitle.toUpperCase()}`,
      `Nome e cognome: ${form.name} ${form.surname}`.trim(),
      `Telefono: ${form.phone}`,
      `Accompagnatori: ${guestsText}`,
      `Note: ${form.notes || "Nessuna nota"}`
    ].join("\n");

    return recipientNumber
      ? `https://wa.me/${recipientNumber}?text=${encodeURIComponent(message)}`
      : "";
  }, [form, guestsText, invitationTitle, recipientNumber]);

  return (
    <div className="rsvp-stack">
      <form
        className="rsvp-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (whatsappLink) {
            window.open(whatsappLink, "_blank", "noopener,noreferrer");
          }
        }}
      >
        <div className="field">
          <label htmlFor="name">Nome</label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="surname">Cognome</label>
          <input
            id="surname"
            required
            value={form.surname}
            onChange={(event) =>
              setForm((current) => ({ ...current, surname: event.target.value }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Telefono WhatsApp</label>
          <input
            id="phone"
            required
            type="tel"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
          />
        </div>

        <div className="guest-head">
          <strong>Altri ospiti</strong>
          <button
            className="button secondary"
            type="button"
            onClick={() =>
              setExtraGuests((current) => [
                ...current,
                { id: Date.now(), name: "", surname: "" }
              ])
            }
          >
            + Aggiungi
          </button>
        </div>

        {extraGuests.map((guest) => (
          <div className="guest-row" key={guest.id}>
            <input
              placeholder="Nome ospite"
              value={guest.name}
              onChange={(event) =>
                setExtraGuests((current) =>
                  current.map((item) =>
                    item.id === guest.id
                      ? { ...item, name: event.target.value }
                      : item
                  )
                )
              }
            />
            <input
              placeholder="Cognome ospite"
              value={guest.surname}
              onChange={(event) =>
                setExtraGuests((current) =>
                  current.map((item) =>
                    item.id === guest.id
                      ? { ...item, surname: event.target.value }
                      : item
                  )
                )
              }
            />
            <button
              className="remove-button"
              type="button"
              onClick={() =>
                setExtraGuests((current) =>
                  current.filter((item) => item.id !== guest.id)
                )
              }
            >
              Rimuovi
            </button>
          </div>
        ))}

        <div className="field">
          <label htmlFor="notes">Note</label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </div>

        {!recipientNumber ? (
          <p className="rsvp-warning">
            Il numero WhatsApp per le conferme non è stato configurato.
          </p>
        ) : null}

        <button
          className="button light"
          disabled={!recipientNumber}
          type="submit"
        >
          Invia conferma su WhatsApp
        </button>
      </form>
    </div>
  );
}
