import type { Metadata } from "next";
import { DraftInviteClient } from "@/components/draft-invite-client";
import { InviteStoryEnhancer } from "@/components/invite-story-enhancer";
import { InviteCelebrationNumber } from "@/components/invite-celebration-number";
import { InviteHeroKicker } from "@/components/invite-hero-kicker";
import { loadPublicInvitationSocial } from "@/lib/supabase/public-invitation-social";
import styles from "@/components/public-invite.module.css";

type InvitePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.ilmioinvito.com";
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await loadPublicInvitationSocial(slug);
  if (!invitation) return { title: "Invito digitale | ilmioinvito.com" };

  const canonicalUrl = `${appUrl()}/i/${encodeURIComponent(slug)}`;
  const imageUrl = `${appUrl()}/api/og/invitation/${encodeURIComponent(slug)}?v=${encodeURIComponent(invitation.updatedAt)}`;
  const title = `${invitation.title} · Il nostro invito`;

  return {
    title,
    description: invitation.subtitle,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: "ilmioinvito.com",
      url: canonicalUrl,
      title,
      description: invitation.subtitle,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `Invito di ${invitation.title}` }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: invitation.subtitle,
      images: [imageUrl]
    }
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { slug } = await params;

  return (
    <div className={styles.publicInvite}>
      <DraftInviteClient slug={slug} />
      <InviteHeroKicker slug={slug} />
      <InviteStoryEnhancer slug={slug} />
      <InviteCelebrationNumber slug={slug} />
    </div>
  );
}
