"use client";

import { useEffect, useMemo, useState } from "react";

type ExtraGuest = {
  id: number;
  name: string;
  surname: string;
};

type Countdown = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

type InviteRsvpProps = {
  eventDateIso: string;
  whatsappNumber: string;
  invitationTitle: string;
};

const emptyCountdown: Countdown = {
  days: "00",
  hours: "00",
  minutes: "00",
  seconds: "00"
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function calculateCountdown(eventDateIso: string): Countdown {
  const target = new Date(eventDateIso).getTime();
  const distance = target - Date.now();

  if (distance <= 0) {
    return emptyCountdown;
  }

  return {
    days: pad(Math.floor(distance / (1000 * 60 * 60 * 24))),
    hours: pad(Math.floor((distance / (1000 * 60 * 60)) % 24)),
    minutes: pad(Math.floor((distance / (1000 * 60)) % 60)),
    seconds: pad(Math.floor((distance / 1000) % 60))
  };
}

export function InviteRsvp({
  eventDateIso,
  whatsappNumber,
  invitationTitle
}: InviteRsvpProps) {
  const [countdown, setCountdown] = useState<Countdown>(() =>
    calculateCountdown(eventDateIso)
  );
  const [extraGuests, setExtraGuests] = useState<ExtraGuest[]>([]);
  const [form, setForm] = useState({
    name: "",
    surname: "",
    phone: "",
    notes: ""
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(calculateCountdown(eventDateIso));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [eventDateIso]);

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

  const whatsappLink = useMemo(() => {
    const message = [
      `CONFERMA ${invitationTitle.toUpperCase()}`,
      `Nome: ${form.name} ${form.surname}`.trim(),
      `Telefono: ${form.phone}`,
      `Ospiti aggiuntivi: ${guestsText}`,
      `Note: ${form.notes || "Nessuna nota"}`
    ].join(" | ");

    return `https://wa.me/39${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [form, guestsText, invitationTitle, whatsappNumber]);

  return (
    <div className="rsvp-stack">
      <section className="countdown-panel" aria-label="Countdown evento">
        <div>
          <strong>{countdown.days}</strong>
          <span>Giorni</span>
        </div>
        <div>
          <strong>{countdown.hours}</strong>
          <span>Ore</span>
        </div>
        <div>
          <strong>{countdown.minutes}</strong>
          <span>Minuti</span>
        </div>
        <div>
          <strong>{countdown.seconds}</strong>
          <span>Secondi</span>
        </div>
      </section>

      <form
        className="rsvp-form"
        onSubmit={(event) => {
          event.preventDefault();
          window.open(whatsappLink, "_blank", "noopener,noreferrer");
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

        <button className="button light" type="submit">
          Invia conferma su WhatsApp
        </button>
      </form>
    </div>
  );
}
