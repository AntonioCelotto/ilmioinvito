"use client";

import { useMemo, useState } from "react";

type Guest = {
  id: number;
  name: string;
  surname: string;
  additionalInfo: string;
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
  const [guests, setGuests] = useState<Guest[]>([
    { id: 1, name: "", surname: "", additionalInfo: "" }
  ]);
  const [phone, setPhone] = useState("");

  const guestsText = useMemo(() => {
    return guests
      .map((guest, index) => {
        const fullName = `${guest.name} ${guest.surname}`.trim() || "Nome non indicato";
        return [
          `${index + 1}. ${fullName}`,
          `   Allergie e informazioni aggiuntive: ${
            guest.additionalInfo || "Nessuna"
          }`
        ].join("\n");
      })
      .join("\n");
  }, [guests]);

  const recipientNumber = useMemo(
    () => normalizeWhatsappNumber(whatsappNumber),
    [whatsappNumber]
  );

  const whatsappLink = useMemo(() => {
    const message = [
      `CONFERMA ${invitationTitle.toUpperCase()}`,
      `Telefono di contatto: ${phone}`,
      `Invitati (${guests.length}):`,
      guestsText
    ].join("\n");

    return recipientNumber
      ? `https://wa.me/${recipientNumber}?text=${encodeURIComponent(message)}`
      : "";
  }, [guests.length, guestsText, invitationTitle, phone, recipientNumber]);

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
          <label htmlFor="phone">Telefono WhatsApp</label>
          <input
            id="phone"
            required
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>

        <div className="guest-head">
          <strong>Dati degli invitati</strong>
          <button
            className="button secondary"
            type="button"
            onClick={() =>
              setGuests((current) => [
                ...current,
                {
                  id: Date.now(),
                  name: "",
                  surname: "",
                  additionalInfo: ""
                }
              ])
            }
          >
            + Aggiungi invitato
          </button>
        </div>

        {guests.map((guest, index) => (
          <div className="guest-card" key={guest.id}>
            <div className="guest-card-head">
              <strong>Invitato {index + 1}</strong>
              {index > 0 ? (
                <button
                  className="remove-button"
                  type="button"
                  onClick={() =>
                    setGuests((current) =>
                      current.filter((item) => item.id !== guest.id)
                    )
                  }
                >
                  Rimuovi
                </button>
              ) : null}
            </div>
            <div className="guest-row">
              <input
                aria-label={`Nome invitato ${index + 1}`}
                placeholder="Nome"
                required
                value={guest.name}
                onChange={(event) =>
                  setGuests((current) =>
                    current.map((item) =>
                      item.id === guest.id
                        ? { ...item, name: event.target.value }
                        : item
                    )
                  )
                }
              />
              <input
                aria-label={`Cognome invitato ${index + 1}`}
                placeholder="Cognome"
                required
                value={guest.surname}
                onChange={(event) =>
                  setGuests((current) =>
                    current.map((item) =>
                      item.id === guest.id
                        ? { ...item, surname: event.target.value }
                        : item
                    )
                  )
                }
              />
            </div>
            <textarea
              aria-label={`Allergie e informazioni aggiuntive invitato ${index + 1}`}
              placeholder="Allergie, intolleranze o informazioni aggiuntive"
              value={guest.additionalInfo}
              onChange={(event) =>
                setGuests((current) =>
                  current.map((item) =>
                    item.id === guest.id
                      ? { ...item, additionalInfo: event.target.value }
                      : item
                  )
                )
              }
            />
          </div>
        ))}

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
