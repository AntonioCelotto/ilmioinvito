import { DraftInviteClient } from "@/components/draft-invite-client";

type InvitePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { slug } = await params;

  return <DraftInviteClient slug={slug} />;
}
