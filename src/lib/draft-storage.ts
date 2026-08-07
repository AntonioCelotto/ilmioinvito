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
  description: string;
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

export type InvitationProgramItem = {
  id: string;
  time: string;
  description: string;
};

export type InvitationGiftWish = {
  id: string;
  title: string;
};

export type InvitationTheme = {
  template: "darkLuxury" | "classicLight" | "botanical" | "minimal";
  primaryColor: string;
  accentColor: string;
  fontStyle: "serif" | "modern" | "script";
  backgroundImage?: string;
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
  giftIban: string;
  giftWishes: InvitationGiftWish[];
  blockTexts: InvitationBlockTexts;
  activeSections: InvitationSectionKey[];
  locations: InvitationLocation[];
  program: InvitationProgramItem[];
  media: InvitationMedia[];
  theme: InvitationTheme;
  updatedAt: string;
};

export const draftStorageKey = "ilmioinvito:drafts";
export const editingDraftStorageKey = "ilmioinvito:editing-draft";

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
  gallery: "Condividete con noi le vostre foto, i vostri video e una dedica speciale.",
  video: "Condividete con noi le vostre foto, i vostri video e una dedica speciale.",
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
        description: location.description ?? "",
        enabled: location.enabled ?? true,
        imageUrl: location.imageUrl ?? ""
      })),
      program: (draft.program ?? []).map((item, index) => ({
        id: item.id || `program-${index + 1}`,
        time: item.time ?? "",
        description: item.description ?? ""
      })),
      giftIban: draft.giftIban ?? "",
      giftWishes: (draft.giftWishes ?? []).map((wish, index) => ({
        id: wish.id || `wish-${index + 1}`,
        title: wish.title ?? ""
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


export function removeDraft(draftId: string) {
  const nextDrafts = readDrafts().filter((draft) => draft.id !== draftId);
  window.localStorage.setItem(draftStorageKey, JSON.stringify(nextDrafts));
  return nextDrafts;
}

export function setEditingDraft(draft: InvitationDraft) {
  window.localStorage.setItem(editingDraftStorageKey, JSON.stringify(draft));
}

export function readEditingDraft(): InvitationDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(editingDraftStorageKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as InvitationDraft;
  } catch {
    return null;
  }
}
