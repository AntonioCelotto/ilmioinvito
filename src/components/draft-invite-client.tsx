"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { demoInvitation } from "@/lib/demo-data";
import {
  defaultBlockTexts,
  findDraftBySlug,
  InvitationDraft,
  InvitationSectionKey
} from "@/lib/draft-storage";
import { findDraftBySlugFromSupabase } from "@/lib/supabase/drafts";
import { InviteRsvp } from "@/components/invite-rsvp";
import { LiveCountdown } from "@/components/live-countdown";
import { InviteGuestMedia } from "@/components/invite-guest-media";

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
  giftIban: "",
  giftWishes: [],
  blockTexts: defaultBlockTexts,
  activeSections: ["countdown", "reception", "rsvp", "dressCode"],
  locations: [
    {
      id: "demo-location",
      type: "reception",
      name: demoInvitation.venueName,
      address: demoInvitation.venueAddress,
      description: "",
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        demoInvitation.venueAddress
      )}`,
      enabled: true,
      imageUrl: ""
    }
  ],
  program: [],
  media: [],
  theme: {
    template: "darkLuxury",
    primaryColor: "#151313",
    accentColor: "#b87333",
    fontStyle: "serif",
    textColor: "#ffffff",
    buttonColor: "#b87333",
    buttonTextColor: "#ffffff",
    fontScale: 1
  },
  updatedAt: new Date().toISOString()
};

function sectionIsActive(draft: InvitationDraft, section: InvitationSectionKey) {
  return draft.activeSections.includes(section);
}

function sectionPosition(
  draft: InvitationDraft,
  ...sections: InvitationSectionKey[]
) {
  const positions = sections
    .map((section) => draft.activeSections.indexOf(section))
    .filter((position) => position >= 0);

  return positions.length > 0 ? Math.min(...positions) : 999;
}

function blockText(draft: InvitationDraft, section: InvitationSectionKey) {
  return draft.blockTexts?.[section] || defaultBlockTexts[section];
}

function mapDirectionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address
  )}`;
}

function LocationCard({
  location
}: {
  location: InvitationDraft["locations"][number];
}) {
  return (
    <article className="invite-location">
      {location.imageUrl ? (
        <img
          alt={location.name || "Luogo dell'evento"}
          src={location.imageUrl}
        />
      ) : null}
      {location.description ? (
        <p className="invite-location-description">{location.description}</p>
      ) : null}
      <h3>{location.name || "Luogo dell'evento"}</h3>
      <p className="muted">{location.address || "Indirizzo da definire"}</p>
      {location.address ? (
        <a
          className="button"
          href={mapDirectionsUrl(location.address)}
          rel="noreferrer"
          target="_blank"
        >
          Portami
        </a>
      ) : null}
    </article>
  );
}

function CountdownBlock({ draft }: { draft: InvitationDraft }) {
  return (
    <LiveCountdown
      className="countdown-panel light-panel"
      eventDate={
        draft.slug === demoInvitation.slug
          ? demoInvitation.eventDateIso.slice(0, 10)
          : draft.eventDate
      }
      eventTime={draft.eventTime}
    />
  );
}

export function DraftInviteClient({ slug }: DraftInviteClientProps) {
  const [draft, setDraft] = useState<InvitationDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [ibanCopied, setIbanCopied] = useState(false);

  useEffect(() => {
    const localDraft = findDraftBySlug(slug);
    findDraftBySlugFromSupabase(slug).then((remoteDraft) => {
      setDraft(remoteDraft ?? localDraft ?? null);
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

  if (loaded && !hasCustomDraft && !isDemoSlug) {
    return (
      <main className="workspace">
        <section className="section">
          <div className="section-inner">
            <div className="empty-state invitation-unavailable">
              <p className="eyebrow">Invito non disponibile</p>
              <h1>Questo invito è ancora in bozza.</h1>
              <p className="muted">
                La bozza è visibile soltanto al proprietario autenticato. Per
                condividerla con gli invitati, apri il builder e premi
                “Pubblica invito”.
              </p>
              <a className="button" href="/login">
                Accedi
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const themeStyles = {
    ...(invitation.theme.textColor
      ? { "--invitation-text-color": invitation.theme.textColor }
      : {}),
    "--invitation-button-color":
      invitation.theme.buttonColor ?? invitation.theme.accentColor,
    "--invitation-button-text":
      invitation.theme.buttonTextColor ?? "#ffffff",
    ...(invitation.theme.fontScale
      ? { "--invitation-font-scale": invitation.theme.fontScale }
      : {}),
    "--invitation-accent-color": invitation.theme.accentColor
  } as CSSProperties;

  return (
    <main
      className={`invitation-custom-theme preview-font-${invitation.theme.fontStyle}`}
      style={themeStyles}
    >
      <section
        className={`invite-hero theme-${invitation.theme.template}`}
        style={{
          backgroundColor: invitation.theme.primaryColor,
          backgroundImage: invitation.theme.backgroundImage
            ? `linear-gradient(rgba(255, 250, 242, 0.12), rgba(255, 250, 242, 0.22)), url("${invitation.theme.backgroundImage}")`
            : `linear-gradient(180deg, rgba(15, 13, 12, 0.2), ${invitation.theme.primaryColor})`,
          backgroundPosition: "center",
          backgroundSize: "cover"
        }}
      >
        {invitation.theme.backgroundVideo ? (
          <video
            aria-hidden="true"
            autoPlay
            className="invite-background-video"
            loop
            muted
            playsInline
            poster={invitation.theme.backgroundImage}
            preload="auto"
            src={invitation.theme.backgroundVideo}
          />
        ) : null}
        <div>
          <p className="eyebrow">
            {hasCustomDraft
              ? invitation.status === "published"
                ? "Invito ufficiale"
                : "Anteprima bozza"
              : "Invito digitale demo"}
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

      <section className="section invite-section">
        <div className="section-inner invite-section-inner">
            <h2>Un invito pensato per essere personale.</h2>
            <p className="muted invite-copy">{invitation.story}</p>
        </div>
      </section>

      <div className="invite-dynamic-sections">
      {sectionIsActive(invitation, "countdown") ? (
        <section
          className="section invite-section"
          style={{ order: sectionPosition(invitation, "countdown") }}
        >
          <div className="section-inner invite-section-inner">
            <h2>Il grande giorno si avvicina.</h2>
            <p className="muted invite-copy">{blockText(invitation, "countdown")}</p>
            <CountdownBlock draft={invitation} />
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "ceremony") ||
      sectionIsActive(invitation, "reception") ? (
        <section
          className="section invite-section"
          style={{ order: sectionPosition(invitation, "ceremony", "reception") }}
        >
          <div className="section-inner invite-section-inner">
            <h2>Raggiungi ogni momento dell’evento.</h2>
            <p className="muted invite-copy">{blockText(invitation, "ceremony")}</p>
            <div className="invite-location-grid">
              {invitation.locations.filter((location) => location.enabled).map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "program") ? (
        <section
          className="section invite-section"
          style={{ order: sectionPosition(invitation, "program") }}
        >
          <div className="section-inner invite-section-inner">
            <h2>La giornata.</h2>
            <p className="muted invite-copy">{blockText(invitation, "program")}</p>
            {invitation.program.length > 0 ? (
              <div className="invite-program">
                {invitation.program.map((item) => (
                  <article className="invite-program-item" key={item.id}>
                    <time>{item.time || "--:--"}</time>
                    <p>{item.description || "Programma da definire"}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="invite-date-line">
                {invitation.eventDate}
                {invitation.eventTime ? `, ore ${invitation.eventTime}` : ""}
              </p>
            )}
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "dressCode") ? (
        <section
          className="section invite-section"
          style={{ order: sectionPosition(invitation, "dressCode") }}
        >
          <div className="section-inner invite-section-inner">
            <div className="invite-dress-code-card">
              <h2>{invitation.dressCode || "Indicazioni di stile"}</h2>
              <p className="muted invite-copy">{blockText(invitation, "dressCode")}</p>
            </div>
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "giftInfo") ? (
        <section
          className="section invite-section"
          style={{ order: sectionPosition(invitation, "giftInfo") }}
        >
          <div className="section-inner invite-section-inner">
            <h2>Regalo e dettagli.</h2>
            <p className="muted invite-copy">{blockText(invitation, "giftInfo")}</p>
            {invitation.giftWishes.length > 0 ? (
              <div className="gift-wish-grid">
                {invitation.giftWishes.filter((wish) => wish.title.trim()).map((wish) => (
                  <article className="gift-wish-card" key={wish.id}>
                    <span aria-hidden="true">♡</span>
                    <strong>{wish.title}</strong>
                  </article>
                ))}
              </div>
            ) : null}
            {invitation.giftIban ? (
              <div className="gift-iban-card">
                <span>IBAN per il bonifico</span>
                <strong>{invitation.giftIban}</strong>
                <button className="button" type="button" onClick={async () => {
                  await navigator.clipboard.writeText(invitation.giftIban);
                  setIbanCopied(true);
                }}>{ibanCopied ? "IBAN copiato" : "Copia IBAN"}</button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "gallery") || sectionIsActive(invitation, "video") ? (
        <section
          className="section invite-section"
          style={{ order: sectionPosition(invitation, "gallery", "video") }}
        >
          <div className="section-inner invite-section-inner">
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
                    <article className="media-item social-owner-media" key={item.id}>
                      {item.type === "photo" ? (
                        <img
                          alt={item.title || "Foto dell'invito"}
                          loading="lazy"
                          src={item.url}
                        />
                      ) : (
                        <video controls preload="metadata" src={item.url} />
                      )}
                      <div>
                        <strong>{item.title || "Ricordo"}</strong>
                        <a href={item.url} rel="noreferrer" target="_blank">
                          Apri originale
                        </a>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <p className="muted">Nessun media caricato in questa bozza.</p>
            )}
            <InviteGuestMedia
              enabled={invitation.status === "published"}
              invitationId={invitation.id}
            />
          </div>
        </section>
      ) : null}

      {sectionIsActive(invitation, "rsvp") ? (
        <section
          className="section dark"
          style={{ order: sectionPosition(invitation, "rsvp") }}
        >
          <div className="section-inner invite-section-inner">
            <div>
              <h2>Conferma la tua presenza.</h2>
              <p className="muted invite-copy">{blockText(invitation, "rsvp")}</p>
            </div>
            <div className="rsvp">
              <InviteRsvp
                invitationId={invitation.id}
                invitationTitle={invitation.title}
                whatsappNumber={invitation.whatsappNumber}
              />
              <p className="muted">Link invito: /i/{invitation.slug}</p>
            </div>
          </div>
        </section>
      ) : null}
      </div>
    </main>
  );
}
