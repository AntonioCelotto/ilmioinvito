import { cache } from "react";
import { createServerAuthClient } from "@/lib/supabase/server";

type SocialTheme = {
  backgroundImage?: string;
  coverText?: string;
};

export type PublicInvitationSocial = {
  slug: string;
  title: string;
  subtitle: string;
  eventDate: string;
  eventTime: string;
  kicker: string;
  backgroundImage: string;
  celebrationNumber: string;
  coverText: string;
  updatedAt: string;
};

export const loadPublicInvitationSocial = cache(async (slug: string): Promise<PublicInvitationSocial | null> => {
  const supabase = createServerAuthClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("invitations")
    .select("slug,title,subtitle,event_date,event_time,updated_at,invitation_content(hero_kicker,theme),invitation_celebration_number(celebration_number)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;

  const content = Array.isArray(data.invitation_content)
    ? data.invitation_content[0]
    : data.invitation_content;
  const celebration = Array.isArray(data.invitation_celebration_number)
    ? data.invitation_celebration_number[0]
    : data.invitation_celebration_number;
  const theme = content?.theme && typeof content.theme === "object"
    ? content.theme as SocialTheme
    : {};

  return {
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle ?? "Sei invitato a condividere con noi un momento speciale.",
    eventDate: data.event_date ?? "",
    eventTime: data.event_time?.slice(0, 5) ?? "",
    kicker: content?.hero_kicker || "Il nostro evento",
    backgroundImage: theme.backgroundImage ?? "",
    celebrationNumber: celebration?.celebration_number ?? "",
    coverText: theme.coverText ?? "",
    updatedAt: data.updated_at
  };
});
