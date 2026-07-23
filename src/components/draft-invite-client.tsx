"use client";

import { useEffect, useMemo, useState } from "react";
import { demoInvitation } from "@/lib/demo-data";
import {
  defaultBlockTexts,
  findDraftBySlug,
  InvitationDraft,
  InvitationSectionKey
} from "@/lib/draft-storage";
import { findDraftBySlugFromSupabase } from "@/lib/supabase/drafts";
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
  blockTexts: defaultBlockTexts,
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

function blockText(draft: InvitationDraft, section: InvitationSectionKey) {
  return draft.blockTexts?.[section] || defaultBlockTexts[section];
}

function parseEventDate(draft: InvitationDraft) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(draft.eventDate)) {
    const time = draft.eventTime || "00:00";
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    return new Date(`${draft.eventDate}T${normalizedTime}`);
  }

  if (draft.slug === demoInvitation.slug) {
    return new Date(demoInvitation.eventDateIso);
  }

  return null;
}

function eventDateIsoFromDraft(draft: InvitationDraft) {
  const eventDate = parseEventDate(draft);

  if (!eventDate || Number.isNaN(eventDate.getTime())) {
    return demoInvitation.eventDateIso;
  }

  return eventDate.toISOString();
}

function mapDirectionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address
  )}`;
}

function mapEmbedUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function LocationMapCard({
  location
}: {
  location: InvitationDraft["locations"][number];
}) {
  return (
    <article className="invite-location">
      <h3>{location.name || "Luogo dell'evento"}</h3>
      <p className="muted">{location.address || "Indirizzo da definire"}</p>
      {location.address ? (
        <>
          <iframe
            loading="lazy"
            src={mapEmbedUrl(location.address)}
            title={`Mappa ${location.name || "luogo"}`}
          />
          <a
            className="button"
            href={mapDirectionsUrl(location.address)}
            rel="noreferrer"
            target="_blank"
          >
            Portami
          </a>
        </>
      ) : null}
    </article>
  );
}

function CountdownBlock({ draft }: { draft: InvitationDraft }) {
  const [now, setNow] = useState(() => Date.now());
  const eventDate = parseEventDate(draft);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  if (!eventDate || Number.isNaN(eventDate.getTime())) {
    return (
      <p className="invite-date-line">
        {draft.eventDate}
        {draft.eventTime ? `, ore ${draft.eventTime}` : ""}
      </p>
    );
  }

  const diff = Math.max(0, eventDate.getTime() - now);
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="countdown-panel light-panel">
      <div>
        <strong>{days}</strong>
        <span>Giorni</span>
      </div>
      <div>
        <strong>{hours}</strong>
        <span>Ore</span>
      </div>
      <div>
        <strong>{minutes}</strong>
        <span>Minuti</span>
      </div>
      <div>
        <strong>{draft.eventTime || "--"}</strong>
        <span>Inizio</span>
      </div>
    </div>
  );
}

export function DraftInviteClient({ slug }: DraftInviteClientProps) {
  const [draft, setDraft] = useState<InvitationDraft | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const localDraft = findDraftBySlug(slug);

    if (localDraft) {
      setDraft(localDraft);
      setLoaded(true);
      return;
    }

    findDraftBySlugFromSupabase(slug).then((remoteDraft) => {
      setDraft(remoteDraft);
      setLoaded(true);
    });
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
                La demo cerca prima le bozze locali e poi Supabase. Se l'invito
                e ancora in bozza, aprilo dallo stesso browser/account con cui lo
                hai creato.
              </p>
              <a className="button" href="/builder">
                Torna al builder
              </a>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section invite-section">
        <div className="section-inner invite-section-inner">
            <p className="eyebrow">La storia</p>
            <h2>Un invito pensato per essere personale.</h2>
            <p className="muted invite-copy">{invitation.story}</p>
        </div>
      </section>

      {sectionIsActive(invitation, "countdown") ? (
        <section className="section invite-section">
          <div className="section-inner invite-section-inner">
            <p className="eyebrow">Countdown</p>
            <h2>Il grande giorno si avvicina.</h2>
            <p className="muted invite-copy">{blockText(invitation, "countdown")}</p>
            <CountdownBlock draft={invitation} />
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "ceremony") ||
      sectionIsActive(invitation, "reception") ? (
        <section className="section invite-section">
          <div className="section-inner invite-section-inner">
            <p className="eyebrow">Luoghi e mappa</p>
            <h2>Raggiungi ogni momento dell’evento.</h2>
            <p className="muted invite-copy">{blockText(invitation, "ceremony")}</p>
            <div className="invite-location-grid">
              {invitation.locations.map((location) => (
                <LocationMapCard key={location.id} location={location} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "program") ? (
        <section className="section invite-section">
          <div className="section-inner invite-section-inner">
            <p className="eyebrow">Programma</p>
            <h2>La giornata.</h2>
            <p className="muted invite-copy">{blockText(invitation, "program")}</p>
            <p className="invite-date-line">
              {invitation.eventDate}
              {invitation.eventTime ? `, ore ${invitation.eventTime}` : ""}
            </p>
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "dressCode") ? (
        <section className="section invite-section">
          <div className="section-inner invite-section-inner">
            <p className="eyebrow">Dress code</p>
            <h2>{invitation.dressCode || "Indicazioni di stile"}</h2>
            <p className="muted invite-copy">{blockText(invitation, "dressCode")}</p>
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "giftInfo") ? (
        <section className="section invite-section">
          <div className="section-inner invite-section-inner">
            <p className="eyebrow">Info utili</p>
            <h2>Regalo e dettagli.</h2>
            <p className="muted invite-copy">{blockText(invitation, "giftInfo")}</p>
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "gallery") || sectionIsActive(invitation, "video") ? (
        <section className="section invite-section">
          <div className="section-inner invite-section-inner">
            <p className="eyebrow">Foto e video</p>
            <h2>Media dell'invito</h2>
            <p className="muted invite-copy">
              {sectionIsActive(invitation, "video")
                ? blockText(invitation, "video")
                : blockText(invitation, "gallery")}
            </p>
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
          <div className="section-inner invite-section-inner">
            <div>
              <p className="eyebrow">RSVP</p>
              <h2>Conferma la tua presenza.</h2>
              <p className="muted invite-copy">{blockText(invitation, "rsvp")}</p>
            </div>
            <div className="rsvp">
              <InviteRsvp
                eventDateIso={eventDateIsoFromDraft(invitation)}
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
