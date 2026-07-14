"use client";

import { useEffect, useMemo, useState } from "react";
import { demoInvitation } from "@/lib/demo-data";
import {
  findDraftBySlug,
  InvitationDraft,
  InvitationSectionKey
} from "@/lib/draft-storage";
import { InviteRsvp } from "@/components/invite-rsvp";

type DraftInviteClientProps = {
  slug: string;
};

const fallbackDraft: InvitationDraft = {
  id: "demo",
  slug: demoInvitation.slug,
  status: "published",
  title: demoInvitation.title,
  subtitle: demoInvitation.subtitle,
  hostName: demoInvitation.hostName,
  eventDate: demoInvitation.eventDate,
  eventTime: demoInvitation.eventTime,
  whatsappNumber: demoInvitation.whatsappNumber,
  story: demoInvitation.story,
  dressCode: demoInvitation.dressCode,
  activeSections: ["countdown", "reception", "rsvp", "dressCode"],
  locations: [
    {
      id: "demo-location",
      type: "reception",
      name: demoInvitation.venueName,
      address: demoInvitation.venueAddress,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        demoInvitation.venueAddress
      )}`
    }
  ],
  media: [],
  theme: {
    template: "darkLuxury",
    primaryColor: "#151313",
    accentColor: "#b87333",
    fontStyle: "serif"
  },
  updatedAt: new Date().toISOString()
};

function sectionIsActive(draft: InvitationDraft, section: InvitationSectionKey) {
  return draft.activeSections.includes(section);
}

export function DraftInviteClient({ slug }: DraftInviteClientProps) {
  const [draft, setDraft] = useState<InvitationDraft | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDraft(findDraftBySlug(slug) ?? null);
    setLoaded(true);
  }, [slug]);

  const invitation = draft ?? fallbackDraft;
  const primaryLocation = useMemo(
    () =>
      invitation.locations.find((location) =>
        ["reception", "main", "church", "ceremony"].includes(location.type)
      ),
    [invitation.locations]
  );
  const hasCustomDraft = Boolean(draft);
  const isDemoSlug = slug === demoInvitation.slug;

  return (
    <main>
      <section
        className={`invite-hero theme-${invitation.theme.template}`}
        style={{
          background: `linear-gradient(180deg, rgba(15, 13, 12, 0.2), ${invitation.theme.primaryColor}), ${invitation.theme.accentColor}`
        }}
      >
        <div>
          <p className="eyebrow">
            {hasCustomDraft ? "Bozza invito" : "Invito digitale demo"}
          </p>
          <h1>{invitation.title}</h1>
          <p className="lead">{invitation.subtitle}</p>
          <div className="invite-meta">
            <span>{invitation.eventDate}</span>
            <span>{invitation.eventTime}</span>
            {primaryLocation ? <span>{primaryLocation.name}</span> : null}
          </div>
        </div>
      </section>

      {!hasCustomDraft && loaded && !isDemoSlug ? (
        <section className="section">
          <div className="section-inner">
            <div className="empty-state">
              <h2>Bozza non trovata su questo browser.</h2>
              <p className="muted">
                La demo legge le bozze salvate localmente. Apri questo link dallo
                stesso browser in cui hai salvato la bozza, oppure torna al
                builder e salva di nuovo.
              </p>
              <a className="button" href="/builder">
                Torna al builder
              </a>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="section-inner split">
          <div>
            <p className="eyebrow">La storia</p>
            <h2>Un invito pensato per essere personale.</h2>
            <p className="muted">{invitation.story}</p>
          </div>
          <div>
            <p className="eyebrow">Dettagli evento</p>
            <ul className="feature-list">
              <li>
                <h3>Quando</h3>
                <span className="muted">
                  {invitation.eventDate}, ore {invitation.eventTime}
                </span>
              </li>
              {invitation.locations.map((location) => (
                <li key={location.id}>
                  <h3>{location.name || "Location"}</h3>
                  <span className="muted">{location.address || "Da definire"}</span>
                  {location.mapsUrl ? (
                    <a className="button" href={location.mapsUrl}>
                      Apri mappa
                    </a>
                  ) : null}
                </li>
              ))}
              {sectionIsActive(invitation, "dressCode") ? (
                <li>
                  <h3>Dress code</h3>
                  <span className="muted">{invitation.dressCode}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </section>

      {sectionIsActive(invitation, "gallery") || sectionIsActive(invitation, "video") ? (
        <section className="section">
          <div className="section-inner">
            <p className="eyebrow">Foto e video</p>
            <h2>Media dell'invito</h2>
            {invitation.media.some((item) => item.url) ? (
              <div className="media-grid">
                {invitation.media
                  .filter((item) => item.url)
                  .map((item) => (
                    <a className="media-item" href={item.url} key={item.id}>
                      <strong>{item.title}</strong>
                      <span>{item.type === "photo" ? "Foto" : "Video"}</span>
                    </a>
                  ))}
              </div>
            ) : (
              <p className="muted">Nessun media caricato in questa bozza.</p>
            )}
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "rsvp") ? (
        <section className="section dark">
          <div className="section-inner split">
            <div>
              <p className="eyebrow">RSVP</p>
              <h2>Conferma la tua presenza.</h2>
              <p className="muted">
                In questa fase demo il bottone apre WhatsApp. Nel prodotto finale
                la risposta verra salvata anche in dashboard.
              </p>
            </div>
            <div className="rsvp">
              <InviteRsvp
                eventDateIso={demoInvitation.eventDateIso}
                invitationTitle={invitation.title}
                whatsappNumber={invitation.whatsappNumber}
              />
              <p className="muted">Link invito: /i/{invitation.slug}</p>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
