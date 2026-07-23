"use client";

import { useEffect, useMemo, useState } from "react";
import { demoInvitation } from "@/lib/demo-data";
import { AuthPanel } from "@/components/auth-panel";
import {
  defaultBlockTexts,
  defaultSections,
  InvitationDraft,
  InvitationLocation,
  InvitationMedia,
  InvitationSectionKey,
  InvitationTheme,
  makeSlug,
  saveDraft
} from "@/lib/draft-storage";
import { saveDraftToSupabase } from "@/lib/supabase/drafts";
import {
  invitationTemplates,
  readSelectedTemplate
} from "@/lib/template-catalog";

const sectionLabels: Record<InvitationSectionKey, string> = {
  countdown: "Countdown",
  ceremony: "Chiesa / cerimonia",
  reception: "Ricevimento / location",
  rsvp: "Conferma partecipazione",
  gallery: "Foto",
  video: "Video",
  program: "Programma",
  dressCode: "Dress code",
  giftInfo: "Regalo / info utili"
};

const blockTextHelpers: Record<InvitationSectionKey, string> = {
  countdown: "Testo sopra il conto alla rovescia.",
  ceremony: "Indicazioni per chiesa o cerimonia.",
  reception: "Indicazioni per location e ricevimento.",
  rsvp: "Testo per la conferma partecipazione.",
  gallery: "Testo per foto e ricordi.",
  video: "Testo per il video invito.",
  program: "Programma della giornata.",
  dressCode: "Indicazioni di stile per gli invitati.",
  giftInfo: "Informazioni su regalo, lista nozze o note utili."
};

const initialLocations: InvitationLocation[] = [
  {
    id: "loc-ceremony",
    type: "church",
    name: "Chiesa / cerimonia",
    address: "",
    mapsUrl: ""
  },
  {
    id: "loc-reception",
    type: "reception",
    name: demoInvitation.venueName,
    address: demoInvitation.venueAddress,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      demoInvitation.venueAddress
    )}`
  }
];

function PreviewSection({
  draft,
  section
}: {
  draft: InvitationDraft;
  section: InvitationSectionKey;
}) {
  const text = draft.blockTexts[section] || defaultBlockTexts[section];

  if (section === "ceremony" || section === "reception") {
    const acceptedTypes =
      section === "ceremony"
        ? ["church", "ceremony", "main"]
        : ["reception", "main", "other"];
    const locations = draft.locations.filter((location) =>
      acceptedTypes.includes(location.type)
    );

    return (
      <section className="phone-slot">
        <span className="phone-slot-label">{sectionLabels[section]}</span>
        <p>{text}</p>
        {locations.map((location) => (
          <div className="phone-location" key={location.id}>
            <strong>{location.name || sectionLabels[section]}</strong>
            <span>{location.address || "Indirizzo da definire"}</span>
          </div>
        ))}
      </section>
    );
  }

  if (section === "countdown") {
    return (
      <section className="phone-slot">
        <span className="phone-slot-label">Countdown</span>
        <p>{text}</p>
        <div className="phone-countdown">
          <strong>{draft.eventDate || "Data"}</strong>
          <span>{draft.eventTime ? `Ore ${draft.eventTime}` : "Orario da definire"}</span>
        </div>
      </section>
    );
  }

  if (section === "gallery" || section === "video") {
    const media = draft.media.filter((item) =>
      section === "gallery" ? item.type === "photo" : item.type === "video"
    );

    return (
      <section className="phone-slot">
        <span className="phone-slot-label">{sectionLabels[section]}</span>
        <p>{text}</p>
        <div className="phone-media-grid">
          {media.length > 0 ? (
            media.map((item) => (
              <div className="phone-media-card" key={item.id}>
                <span>{item.type === "photo" ? "Foto" : "Video"}</span>
                <strong>{item.title || "Media senza titolo"}</strong>
              </div>
            ))
          ) : (
            <div className="phone-empty-card">Aggiungi un contenuto</div>
          )}
        </div>
      </section>
    );
  }

  if (section === "program") {
    return (
      <section className="phone-slot">
        <span className="phone-slot-label">Programma</span>
        <p>{text}</p>
        <strong className="phone-featured-text">
          {draft.eventDate || "Data da definire"}
          {draft.eventTime ? ` · ${draft.eventTime}` : ""}
        </strong>
      </section>
    );
  }

  if (section === "dressCode") {
    return (
      <section className="phone-slot">
        <span className="phone-slot-label">Dress code</span>
        <strong className="phone-featured-text">
          {draft.dressCode || "Indicazioni di stile"}
        </strong>
        <p>{text}</p>
      </section>
    );
  }

  if (section === "rsvp") {
    return (
      <section className="phone-slot phone-rsvp-slot">
        <span className="phone-slot-label">RSVP</span>
        <strong className="phone-featured-text">Conferma la tua presenza</strong>
        <p>{text}</p>
        <span className="phone-preview-button">Parteciperò</span>
      </section>
    );
  }

  return (
    <section className="phone-slot">
      <span className="phone-slot-label">{sectionLabels[section]}</span>
      <p>{text}</p>
    </section>
  );
}

export function BuilderClient() {
  const [selectedTemplate, setSelectedTemplate] = useState(invitationTemplates[0]);
  const [savedMessage, setSavedMessage] = useState("");
  const [draft, setDraft] = useState<InvitationDraft>({
    id: crypto.randomUUID(),
    slug: demoInvitation.slug,
    status: "draft",
    title: demoInvitation.title,
    subtitle: demoInvitation.subtitle,
    hostName: demoInvitation.hostName,
    eventDate: demoInvitation.eventDate,
    eventTime: demoInvitation.eventTime,
    whatsappNumber: demoInvitation.whatsappNumber,
    story: demoInvitation.story,
    dressCode: demoInvitation.dressCode,
    blockTexts: defaultBlockTexts,
    activeSections: defaultSections,
    locations: initialLocations,
    media: [
      {
        id: "media-photo-1",
        type: "photo",
        title: "Foto hero",
        url: ""
      },
      {
        id: "media-video-1",
        type: "video",
        title: "Video invito",
        url: ""
      }
    ],
    theme: invitationTemplates[0].theme,
    updatedAt: new Date().toISOString()
  });

  const publicPath = useMemo(() => `/i/${makeSlug(draft.title)}`, [draft.title]);

  useEffect(() => {
    const template = readSelectedTemplate();
    setSelectedTemplate(template);
    setDraft((current) => ({ ...current, theme: template.theme }));
  }, []);

  function updateField<Key extends keyof InvitationDraft>(
    key: Key,
    value: InvitationDraft[Key]
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      slug: key === "title" ? makeSlug(String(value)) : current.slug
    }));
  }

  function toggleSection(section: InvitationSectionKey) {
    setDraft((current) => {
      const activeSections = current.activeSections.includes(section)
        ? current.activeSections.filter((item) => item !== section)
        : [...current.activeSections, section];

      return { ...current, activeSections };
    });
  }

  function updateLocation(id: string, patch: Partial<InvitationLocation>) {
    setDraft((current) => ({
      ...current,
      locations: current.locations.map((location) =>
        location.id === id ? { ...location, ...patch } : location
      )
    }));
  }

  function updateMedia(id: string, patch: Partial<InvitationMedia>) {
    setDraft((current) => ({
      ...current,
      media: current.media.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    }));
  }

  function updateBlockText(section: InvitationSectionKey, value: string) {
    setDraft((current) => ({
      ...current,
      blockTexts: {
        ...current.blockTexts,
        [section]: value
      }
    }));
  }

  function updateTheme(patch: Partial<InvitationTheme>) {
    setDraft((current) => ({
      ...current,
      theme: { ...current.theme, ...patch }
    }));
  }

  async function handleSave() {
    const nextDraft = {
      ...draft,
      slug: makeSlug(draft.title),
      updatedAt: new Date().toISOString()
    };

    saveDraft(nextDraft);
    setDraft(nextDraft);
    setSavedMessage("Salvataggio locale completato. Invio a Supabase...");

    const result = await saveDraftToSupabase(nextDraft);
    setSavedMessage(result.message);
  }

  return (
    <div className="builder builder-wide">
      <form className="form-panel">
        <AuthPanel compact />
        <div className="selected-template-panel">
          <div>
            <span>Template selezionato</span>
            <strong>{selectedTemplate.name}</strong>
            <small>{selectedTemplate.occasionLabel}</small>
          </div>
          <a className="button light" href="/templates">
            Cambia template
          </a>
        </div>
        <h3>Dati invito</h3>
        <div className="preview-link-panel">
          <div>
            <span>Link anteprima generato</span>
            <strong>{publicPath}</strong>
          </div>
          <a className="button" href={publicPath}>
            Apri link
          </a>
        </div>
        <div className="field">
          <label htmlFor="title">Titolo invito</label>
          <input
            id="title"
            value={draft.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="subtitle">Sottotitolo</label>
          <input
            id="subtitle"
            value={draft.subtitle}
            onChange={(event) => updateField("subtitle", event.target.value)}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="date">Data evento</label>
            <input
              id="date"
              value={draft.eventDate}
              onChange={(event) => updateField("eventDate", event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="time">Orario</label>
            <input
              id="time"
              value={draft.eventTime}
              onChange={(event) => updateField("eventTime", event.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="whatsapp">Numero WhatsApp RSVP</label>
          <input
            id="whatsapp"
            value={draft.whatsappNumber}
            onChange={(event) => updateField("whatsappNumber", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="story">Racconto</label>
          <textarea
            id="story"
            value={draft.story}
            onChange={(event) => updateField("story", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="dressCode">Dress code</label>
          <input
            id="dressCode"
            value={draft.dressCode}
            onChange={(event) => updateField("dressCode", event.target.value)}
          />
        </div>

        <h3>Testi blocchi invito</h3>
        {(Object.keys(sectionLabels) as InvitationSectionKey[]).map((section) => {
          const isActive = draft.activeSections.includes(section);

          return (
            <div className="nested-fields block-editor" key={section}>
              <div className="block-editor-head">
                <div>
                  <span>{isActive ? "Visibile nel link" : "Nascosto dal link"}</span>
                  <strong>{sectionLabels[section]}</strong>
                </div>
                <label className="toggle-item compact">
                  <input
                    checked={isActive}
                    type="checkbox"
                    onChange={() => toggleSection(section)}
                  />
                  <span>Attivo</span>
                </label>
              </div>
              <div className="field">
                <label>{blockTextHelpers[section]}</label>
                <textarea
                  value={draft.blockTexts[section]}
                  onChange={(event) => updateBlockText(section, event.target.value)}
                />
              </div>
            </div>
          );
        })}

        <h3>Geolocalizzazione</h3>
        {draft.locations.map((location) => (
          <div className="nested-fields" key={location.id}>
            <div className="field-row">
              <div className="field">
                <label>Tipo</label>
                <select
                  value={location.type}
                  onChange={(event) =>
                    updateLocation(location.id, {
                      type: event.target.value as InvitationLocation["type"]
                    })
                  }
                >
                  <option value="church">Chiesa</option>
                  <option value="ceremony">Cerimonia</option>
                  <option value="reception">Ricevimento</option>
                  <option value="main">Location principale</option>
                  <option value="other">Altro</option>
                </select>
              </div>
              <div className="field">
                <label>Nome luogo</label>
                <input
                  value={location.name}
                  onChange={(event) =>
                    updateLocation(location.id, { name: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Indirizzo</label>
              <input
                value={location.address}
                onChange={(event) =>
                  updateLocation(location.id, {
                    address: event.target.value,
                    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      event.target.value
                    )}`
                  })
                }
              />
            </div>
          </div>
        ))}

        <h3>Foto e video</h3>
        {draft.media.map((item) => (
          <div className="nested-fields" key={item.id}>
            <div className="field-row">
              <div className="field">
                <label>Tipo media</label>
                <select
                  value={item.type}
                  onChange={(event) =>
                    updateMedia(item.id, {
                      type: event.target.value as InvitationMedia["type"]
                    })
                  }
                >
                  <option value="photo">Foto</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div className="field">
                <label>Titolo</label>
                <input
                  value={item.title}
                  onChange={(event) =>
                    updateMedia(item.id, { title: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Link file o asset caricato</label>
              <input
                placeholder="Upload Supabase Storage nel prossimo step"
                value={item.url}
                onChange={(event) => updateMedia(item.id, { url: event.target.value })}
              />
            </div>
          </div>
        ))}

        <h3>Personalizza il template</h3>
        <div className="field-row">
          <div className="field">
            <label>Stile font</label>
            <select
              value={draft.theme.fontStyle}
              onChange={(event) =>
                updateTheme({
                  fontStyle: event.target.value as InvitationTheme["fontStyle"]
                })
              }
            >
              <option value="serif">Elegante serif</option>
              <option value="modern">Moderno</option>
              <option value="script">Calligrafico</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Colore principale</label>
            <input
              type="color"
              value={draft.theme.primaryColor}
              onChange={(event) => updateTheme({ primaryColor: event.target.value })}
            />
          </div>
          <div className="field">
            <label>Colore accento</label>
            <input
              type="color"
              value={draft.theme.accentColor}
              onChange={(event) => updateTheme({ accentColor: event.target.value })}
            />
          </div>
        </div>

        <button className="button" type="button" onClick={handleSave}>
          Salva bozza
        </button>
        {savedMessage ? (
          <div className="success-box">
            <p>{savedMessage}</p>
            <span>{publicPath}</span>
            <a className="button" href={publicPath}>
              Apri anteprima
            </a>
          </div>
        ) : null}
      </form>

      <aside className="phone-preview-column" aria-label="Anteprima invito in tempo reale">
        <div className="phone-preview-heading">
          <div>
            <span>Anteprima telefono</span>
            <strong>Aggiornamento in tempo reale</strong>
          </div>
          <span className="live-preview-badge">Live</span>
        </div>
        <div
          className={`preview-phone theme-${draft.theme.template} preview-font-${draft.theme.fontStyle}`}
          style={{
            background: `linear-gradient(180deg, ${draft.theme.accentColor} 0%, ${draft.theme.primaryColor} 38%, ${draft.theme.primaryColor} 100%)`
          }}
        >
          <div className="phone-notch" aria-hidden="true" />
          <div className="phone-screen">
            <header className="phone-hero-preview">
              <p className="phone-kicker">Il nostro invito</p>
              <h2>{draft.title || "Titolo invito"}</h2>
              <p>{draft.subtitle || "Il sottotitolo apparirà qui"}</p>
              <div className="phone-meta">
                <span>{draft.eventDate || "Data"}</span>
                <span>{draft.eventTime || "Ora"}</span>
              </div>
            </header>

            {draft.story ? (
              <section className="phone-slot phone-story-slot">
                <span className="phone-slot-label">La storia</span>
                <p>{draft.story}</p>
              </section>
            ) : null}

            {draft.activeSections.length > 0 ? (
              draft.activeSections.map((section) => (
                <PreviewSection draft={draft} key={section} section={section} />
              ))
            ) : (
              <div className="phone-no-slots">
                <strong>Nessuno slot attivo</strong>
                <span>Attiva una sezione per vederla subito qui.</span>
              </div>
            )}

            <footer className="phone-preview-footer">{publicPath}</footer>
          </div>
        </div>
        <p className="phone-preview-help">Scorri dentro il telefono per vedere tutti gli slot.</p>
      </aside>
    </div>
  );
}
