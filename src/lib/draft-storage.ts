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
    return JSON.parse(raw) as InvitationDraft[];
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
