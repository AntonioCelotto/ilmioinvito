import {
  defaultBlockTexts,
  InvitationDraft,
  InvitationLocation,
  InvitationMedia,
  InvitationSectionKey,
  InvitationTheme
} from "@/lib/draft-storage";
import { createClient } from "@/lib/supabase/client";

type SaveResult =
  | { status: "remote"; message: string }
  | { status: "local"; message: string }
  | { status: "error"; message: string };

type UploadResult =
  | { status: "remote"; url: string; message: string }
  | { status: "error"; message: string };

const sectionToDb: Record<InvitationSectionKey, string> = {
  countdown: "countdown",
  ceremony: "ceremony",
  reception: "reception",
  rsvp: "rsvp",
  gallery: "gallery",
  video: "video",
  program: "program",
  dressCode: "dress_code",
  giftInfo: "gift_info"
};

const dbToSection: Record<string, InvitationSectionKey> = {
  countdown: "countdown",
  ceremony: "ceremony",
  reception: "reception",
  rsvp: "rsvp",
  gallery: "gallery",
  video: "video",
  program: "program",
  dress_code: "dressCode",
  gift_info: "giftInfo"
};

function isoDateOrNull(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function timeOrNull(value: string) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value) ? value : null;
}

function themeWithDisplayDate(draft: InvitationDraft) {
  return {
    ...draft.theme,
    blockTexts: {
      ...defaultBlockTexts,
      ...(draft.blockTexts ?? {})
    },
    eventDateLabel: draft.eventDate,
    eventTimeLabel: draft.eventTime
  };
}

function readDisplayTheme(value: unknown) {
  if (value && typeof value === "object") {
    return value as Partial<InvitationTheme> & {
      blockTexts?: Partial<Record<InvitationSectionKey, string>>;
      eventDateLabel?: string;
      eventTimeLabel?: string;
    };
  }

  return {};
}

function rowToDraft(row: any): InvitationDraft {
  const content = Array.isArray(row.invitation_content)
    ? row.invitation_content[0]
    : row.invitation_content;
  const themeRow = Array.isArray(row.invitation_themes)
    ? row.invitation_themes[0]
    : row.invitation_themes;
  const displayTheme = readDisplayTheme(content?.theme);
  const theme: InvitationTheme = {
    template: (themeRow?.template_slug ?? displayTheme.template ?? "darkLuxury") as InvitationTheme["template"],
    primaryColor: themeRow?.primary_color ?? displayTheme.primaryColor ?? "#151313",
    accentColor: themeRow?.accent_color ?? displayTheme.accentColor ?? "#b87333",
    fontStyle: (themeRow?.font_style ?? displayTheme.fontStyle ?? "serif") as InvitationTheme["fontStyle"],
    backgroundImage: displayTheme.backgroundImage,
    textColor: displayTheme.textColor ?? "#ffffff",
    buttonColor:
      displayTheme.buttonColor ??
      themeRow?.accent_color ??
      displayTheme.accentColor ??
      "#b87333",
    buttonTextColor: displayTheme.buttonTextColor ?? "#ffffff",
    fontScale:
      typeof displayTheme.fontScale === "number" ? displayTheme.fontScale : 1
  };

  const locations: InvitationLocation[] = (row.invitation_locations ?? []).map(
    (location: any) => ({
      id: location.id,
      type: location.type,
      name: location.name ?? "",
      address: location.address ?? "",
      description: location.description ?? "",
      mapsUrl: location.maps_url ?? "",
      enabled: location.enabled ?? true,
      imageUrl: location.image_url ?? ""
    })
  );

  const media: InvitationMedia[] = (row.invitation_media ?? []).map((item: any) => ({
    id: item.id,
    type: item.type,
    title: item.title ?? "",
    url: item.external_url ?? item.storage_path ?? ""
  }));

  const activeSections = (row.invitation_sections ?? [])
    .filter((section: any) => section.enabled)
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((section: any) => dbToSection[section.type])
    .filter(Boolean);

  return {
    id: row.id,
    slug: row.slug,
    status: row.status === "published" ? "published" : "draft",
    title: row.title,
    subtitle: row.subtitle ?? "",
    hostName: row.host_name ?? "",
    eventDate: displayTheme.eventDateLabel ?? row.event_date ?? "",
    eventTime: displayTheme.eventTimeLabel ?? row.event_time?.slice(0, 5) ?? "",
    whatsappNumber: row.whatsapp_number ?? "",
    story: content?.story ?? "",
    dressCode: content?.dress_code ?? "",
    giftIban: content?.gift_iban ?? "",
    giftWishes: Array.isArray(content?.gift_wishes)
      ? content.gift_wishes.map((wish: any, index: number) => ({
          id: wish.id ?? `wish-${index + 1}`,
          title: wish.title ?? ""
        }))
      : [],
    program: Array.isArray(content?.program)
      ? content.program.map((item: any, index: number) => ({
          id: item.id ?? `program-${index + 1}`,
          time: item.time ?? "",
          description: item.description ?? ""
        }))
      : [],
    blockTexts: {
      ...defaultBlockTexts,
      ...(displayTheme.blockTexts ?? {})
    },
    activeSections,
    locations,
    media,
    theme,
    updatedAt: row.updated_at
  };
}

export async function getCurrentUser() {
  const supabase = createClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function signInWithEmail(email: string) {
  const supabase = createClient();

  if (!supabase) {
    return { error: { message: "Supabase non e configurato." } };
  }

  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${window.location.origin}/dashboard`
    }
  });
}

export async function registerWithEmailPassword(
  fullName: string,
  email: string,
  password: string
) {
  const supabase = createClient();

  if (!supabase) {
    return { error: { message: "Supabase non e configurato." } };
  }

  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: `${window.location.origin}/dashboard`
    }
  });
}

export async function loginWithEmailPassword(email: string, password: string) {
  const supabase = createClient();

  if (!supabase) {
    return { error: { message: "Supabase non e configurato." } };
  }

  return supabase.auth.signInWithPassword({
    email,
    password
  });
}

export async function signOut() {
  const supabase = createClient();

  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}

export async function uploadLocationImage(
  draftId: string,
  locationId: string,
  file: File
): Promise<UploadResult> {
  const supabase = createClient();

  if (!supabase) {
    return { status: "error", message: "Supabase non è configurato." };
  }

  if (!file.type.startsWith("image/")) {
    return { status: "error", message: "Seleziona un file immagine." };
  }

  if (file.size > 8 * 1024 * 1024) {
    return { status: "error", message: "La foto non può superare 8 MB." };
  }

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { status: "error", message: "Accedi prima di caricare la foto." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userData.user.id}/${draftId}/${locationId}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from("invitation-location-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    return { status: "error", message: error.message };
  }

  const { data } = supabase.storage
    .from("invitation-location-images")
    .getPublicUrl(path);

  return {
    status: "remote",
    url: data.publicUrl,
    message: "Foto caricata. Salva la bozza per confermare la modifica."
  };
}

export async function uploadCustomTemplateImage(
  file: File
): Promise<UploadResult> {
  const supabase = createClient();

  if (!supabase) {
    return { status: "error", message: "Supabase non è configurato." };
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { status: "error", message: "Carica un'immagine JPG, PNG o WebP." };
  }

  if (file.size > 8 * 1024 * 1024) {
    return { status: "error", message: "L'immagine non può superare 8 MB." };
  }

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { status: "error", message: "Accedi prima di caricare la grafica." };
  }

  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userData.user.id}/custom-templates/template-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from("invitation-location-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    return { status: "error", message: error.message };
  }

  const { data } = supabase.storage
    .from("invitation-location-images")
    .getPublicUrl(path);

  return {
    status: "remote",
    url: data.publicUrl,
    message: "Grafica caricata correttamente."
  };
}

export async function saveDraftToSupabase(draft: InvitationDraft): Promise<SaveResult> {
  const supabase = createClient();

  if (!supabase) {
    return {
      status: "local",
      message: "Bozza salvata nel browser. Configura Supabase per il salvataggio account."
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      status: "local",
      message: "Bozza salvata nel browser. Accedi per salvarla anche su Supabase."
    };
  }

  const user = userData.user;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    updated_at: new Date().toISOString()
  });

  if (profileError) {
    return { status: "error", message: profileError.message };
  }

  const { error: invitationError } = await supabase.from("invitations").upsert({
    id: draft.id,
    owner_id: user.id,
    slug: draft.slug,
    status: draft.status,
    title: draft.title,
    subtitle: draft.subtitle,
    host_name: draft.hostName,
    event_date: isoDateOrNull(draft.eventDate),
    event_time: timeOrNull(draft.eventTime),
    venue_name: draft.locations[0]?.name ?? null,
    venue_address: draft.locations[0]?.address ?? null,
    whatsapp_number: draft.whatsappNumber,
    updated_at: new Date().toISOString()
  });

  if (invitationError) {
    return { status: "error", message: invitationError.message };
  }

  const { error: contentError } = await supabase.from("invitation_content").upsert({
    invitation_id: draft.id,
    story: draft.story,
    dress_code: draft.dressCode,
    gift_iban: draft.giftIban || null,
    gift_wishes: draft.giftWishes,
    program: draft.program,
    theme: themeWithDisplayDate(draft),
    updated_at: new Date().toISOString()
  });

  if (contentError) {
    return { status: "error", message: contentError.message };
  }

  await supabase.from("invitation_sections").delete().eq("invitation_id", draft.id);
  await supabase.from("invitation_locations").delete().eq("invitation_id", draft.id);
  await supabase.from("invitation_media").delete().eq("invitation_id", draft.id);

  if (draft.activeSections.length > 0) {
    const { error } = await supabase.from("invitation_sections").insert(
      draft.activeSections.map((section, index) => ({
        invitation_id: draft.id,
        type: sectionToDb[section],
        title: section,
        enabled: true,
        sort_order: index
      }))
    );

    if (error) {
      return { status: "error", message: error.message };
    }
  }

  if (draft.locations.length > 0) {
    const { error } = await supabase.from("invitation_locations").insert(
      draft.locations.map((location, index) => ({
        invitation_id: draft.id,
        type: location.type,
        name: location.name || "Location",
        address: location.address,
        description: location.description,
        maps_url: location.mapsUrl,
        enabled: location.enabled,
        image_url: location.imageUrl || null,
        sort_order: index
      }))
    );

    if (error) {
      return { status: "error", message: error.message };
    }
  }

  if (draft.media.length > 0) {
    const { error } = await supabase.from("invitation_media").insert(
      draft.media.map((item, index) => ({
        invitation_id: draft.id,
        type: item.type,
        title: item.title,
        external_url: item.url,
        sort_order: index
      }))
    );

    if (error) {
      return { status: "error", message: error.message };
    }
  }

  const { error: themeError } = await supabase.from("invitation_themes").upsert({
    invitation_id: draft.id,
    template_slug: draft.theme.template,
    primary_color: draft.theme.primaryColor,
    accent_color: draft.theme.accentColor,
    font_style: draft.theme.fontStyle,
    updated_at: new Date().toISOString()
  });

  if (themeError) {
    return { status: "error", message: themeError.message };
  }

  return { status: "remote", message: "Bozza salvata su Supabase e nel browser." };
}

export async function loadUserDraftsFromSupabase() {
  const supabase = createClient();

  if (!supabase) {
    return { drafts: [], message: "Supabase non configurato." };
  }

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { drafts: [], message: "Accedi per vedere le bozze salvate su Supabase." };
  }

  const { data, error } = await supabase
    .from("invitations")
    .select(
      "*, invitation_content(*), invitation_sections(*), invitation_locations(*), invitation_media(*), invitation_themes(*)"
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return { drafts: [], message: error.message };
  }

  return { drafts: (data ?? []).map(rowToDraft), message: "" };
}

export async function findDraftBySlugFromSupabase(slug: string) {
  const supabase = createClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("invitations")
    .select(
      "*, invitation_content(*), invitation_sections(*), invitation_locations(*), invitation_media(*), invitation_themes(*)"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return rowToDraft(data);
}


export async function deleteDraftFromSupabase(
  draftId: string
): Promise<SaveResult> {
  const supabase = createClient();

  if (!supabase) {
    return {
      status: "local",
      message: "Invito eliminato dal browser."
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return { status: "error", message: userError.message };
  }

  if (!userData.user) {
    return {
      status: "local",
      message: "Invito eliminato dal browser."
    };
  }

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", draftId)
    .eq("owner_id", userData.user.id);

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "remote",
    message: "Invito eliminato definitivamente."
  };
}
