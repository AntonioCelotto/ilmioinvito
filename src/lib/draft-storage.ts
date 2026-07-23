export type InvitationSectionKey =
  | "countdown"
  | "ceremony"
  | "reception"
  | "rsvp"
  | "gallery"
  | "video"
  | "program"
  | "dressCode"
  | "giftInfo";

export type InvitationLocation = {
  id: string;
  type: "main" | "ceremony" | "reception" | "church" | "other";
  name: string;
  address: string;
  mapsUrl: string;
  enabled: boolean;
  imageUrl: string;
};

export type InvitationMedia = {
  id: string;
  type: "photo" | "video";
  title: string;
  url: string;
};

export type InvitationTheme = {
  template: "darkLuxury" | "classicLight" | "botanical" | "minimal";
  primaryColor: string;
  accentColor: string;
  fontStyle: "serif" | "modern" | "script";
};

export type InvitationBlockTexts = Record<InvitationSectionKey, string>;

export type InvitationDraft = {
  id: string;
  slug: string;
  status: "draft" | "published";
  title: string;
  subtitle: string;
  hostName: string;
  eventDate: string;
  eventTime: string;
  whatsappNumber: string;
  story: string;
  dressCode: string;
  blockTexts: InvitationBlockTexts;
  activeSections: InvitationSectionKey[];
  locations: InvitationLocation[];
  media: InvitationMedia[];
  theme: InvitationTheme;
  updatedAt: string;
};

export const draftStorageKey = "ilmioinvito:drafts";

export const defaultSections: InvitationSectionKey[] = [
  "countdown",
  "ceremony",
  "reception",
  "rsvp",
  "gallery",
  "dressCode"
];

export const defaultBlockTexts: InvitationBlockTexts = {
  countdown: "Il conto alla rovescia e iniziato: manca sempre meno al grande giorno.",
  ceremony: "La cerimonia sara il primo momento da vivere insieme, con tutte le persone piu importanti.",
  reception: "Dopo la cerimonia continueremo a festeggiare nella location scelta per il ricevimento.",
  rsvp: "Conferma la tua presenza e indicaci eventuali accompagnatori o note utili.",
  gallery: "Qui potremo raccogliere foto, video e ricordi collegati all'invito.",
  video: "Uno spazio dedicato al video invito o a un messaggio speciale per gli ospiti.",
  program: "Il programma della giornata sara aggiornato con orari, momenti principali e indicazioni utili.",
  dressCode: "Segui le indicazioni di stile pensate per rendere l'evento ancora piu armonioso.",
  giftInfo: "Qui puoi inserire indicazioni su regalo, lista nozze, IBAN o altre informazioni utili."
};

export function makeSlug(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "nuovo-invito";
}

export function readDrafts(): InvitationDraft[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(draftStorageKey);

  if (!raw) {
    return [];
  }

  try {
    const drafts = JSON.parse(raw) as InvitationDraft[];

    return drafts.map((draft) => ({
      ...draft,
      locations: (draft.locations ?? []).map((location) => ({
        ...location,
        enabled: location.enabled ?? true,
        imageUrl: location.imageUrl ?? ""
      })),
      blockTexts: {
        ...defaultBlockTexts,
        ...(draft.blockTexts ?? {})
      }
    }));
  } catch {
    return [];
  }
}

export function findDraftBySlug(slug: string) {
  return readDrafts().find((draft) => draft.slug === slug);
}

export function saveDraft(draft: InvitationDraft) {
  const drafts = readDrafts();
  const nextDrafts = [
    draft,
    ...drafts.filter((item) => item.id !== draft.id)
  ];

  window.localStorage.setItem(draftStorageKey, JSON.stringify(nextDrafts));

  return nextDrafts;
}
