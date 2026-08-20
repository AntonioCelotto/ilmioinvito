import { DraftInviteClient } from "@/components/draft-invite-client";
import { InviteStoryEnhancer } from "@/components/invite-story-enhancer";
import { InviteCelebrationNumber } from "@/components/invite-celebration-number";
import styles from "@/components/public-invite.module.css";

type InvitePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { slug } = await params;

  return (
    <div className={styles.publicInvite}>
      <DraftInviteClient slug={slug} />
      <InviteStoryEnhancer slug={slug} />
      <InviteCelebrationNumber slug={slug} />
    </div>
  );
}
