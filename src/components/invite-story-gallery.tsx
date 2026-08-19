"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type StoryMedia = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;

export function InviteStoryGallery({ invitationId }: { invitationId: string }) {
  const [title, setTitle] = useState("La nostra storia");
  const [media, setMedia] = useState<StoryMedia[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!supabase || !invitationId || invitationId === "demo") return;

    let active = true;

    async function load(client: SupabaseClient) {
      const [{ data: content }, { data: rows }] = await Promise.all([
        client
          .from("invitation_content")
          .select("story_title")
          .eq("invitation_id", invitationId)
          .maybeSingle(),
        client
          .from("invitation_story_media")
          .select("id, image_url, caption, sort_order")
          .eq("invitation_id", invitationId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      ]);

      if (!active) return;
      if (content?.story_title) setTitle(content.story_title);
      setMedia((rows ?? []) as StoryMedia[]);
    }

    void load(supabase);
    return () => { active = false; };
  }, [invitationId, supabase]);

  if (invitationId === "demo" && media.length === 0) return null;

  return (
    <>
      <h2>{title}</h2>
      {media.length > 0 ? (
        <div className="story-photo-grid">
          {media.map((item) => (
            <figure className="story-photo-card" key={item.id}>
              <img loading="lazy" src={item.image_url} alt={item.caption || title} />
              {item.caption ? <figcaption>{item.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      ) : null}
    </>
  );
}
