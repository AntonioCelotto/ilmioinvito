"use client";

import { useMemo, useState } from "react";
import { demoInvitation } from "@/lib/demo-data";
import {
  defaultSections,
  InvitationDraft,
  InvitationLocation,
  InvitationMedia,
  InvitationSectionKey,
  InvitationTheme,
  makeSlug,
  saveDraft
} from "@/lib/draft-storage";

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

const initialTheme: InvitationTheme = {
  template: "darkLuxury",
  primaryColor: "#151313",
  accentColor: "#b87333",
  fontStyle: "serif"
};

export function BuilderClient() {
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
    theme: initialTheme,
    updatedAt: new Date().toISOString()
  });

  const publicPath = useMemo(() => `/i/${makeSlug(draft.title)}`, [draft.title]);

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

  function updateTheme(patch: Partial<InvitationTheme>) {
    setDraft((current) => ({
      ...current,
      theme: { ...current.theme, ...patch }
    }));
  }

  function handleSave() {
    const nextDraft = {
      ...draft,
      slug: makeSlug(draft.title),
      updatedAt: new Date().toISOString()
    };

    saveDraft(nextDraft);
    setDraft(nextDraft);
    setSavedMessage("Bozza salvata. Link anteprima creato automaticamente.");
  }

  return (
    <div className="builder builder-wide">
      <form className="form-panel">
        <h3>Dati invito</h3>
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

        <h3>Sezioni attive</h3>
        <div className="toggle-grid">
          {(Object.keys(sectionLabels) as InvitationSectionKey[]).map((section) => (
            <label className="toggle-item" key={section}>
              <input
                checked={draft.activeSections.includes(section)}
                type="checkbox"
                onChange={() => toggleSection(section)}
              />
              <span>{sectionLabels[section]}</span>
            </label>
          ))}
        </div>

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

        <h3>Grafica cliente</h3>
        <div className="field-row">
          <div className="field">
            <label>Template</label>
            <select
              value={draft.theme.template}
              onChange={(event) =>
                updateTheme({
                  template: event.target.value as InvitationTheme["template"]
                })
              }
            >
              <option value="darkLuxury">Dark luxury</option>
              <option value="classicLight">Classico chiaro</option>
              <option value="botanical">Botanico</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
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

      <div
        className={`preview-phone theme-${draft.theme.template}`}
        style={{
          background: `linear-gradient(180deg, transparent, ${draft.theme.primaryColor}), ${draft.theme.accentColor}`
        }}
        aria-label="Anteprima invito"
      >
        <div>
          <p className="eyebrow">Anteprima</p>
          <h2>{draft.title}</h2>
          <p>{draft.subtitle}</p>
          <div className="invite-meta">
            <span>{draft.eventDate}</span>
            <span>{draft.eventTime}</span>
          </div>
          <div className="mini-section-list">
            {draft.activeSections.slice(0, 5).map((section) => (
              <span key={section}>{sectionLabels[section]}</span>
            ))}
          </div>
          <p className="muted">Link previsto: {publicPath}</p>
        </div>
      </div>
    </div>
  );
}
