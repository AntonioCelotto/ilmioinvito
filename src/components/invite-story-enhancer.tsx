"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

type StoryMedia = {
  id: string;
  image_url: string;
  caption: string | null;
};

export function InviteStoryEnhancer({ slug }: { slug: string }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [title, setTitle] = useState("La nostra storia");
  const [media, setMedia] = useState<StoryMedia[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const heading = Array.from(document.querySelectorAll(".invite-section h2")).find(
        (node) => node.textContent?.trim() === "Un invito pensato per essere personale."
      ) as HTMLElement | undefined;

      if (!heading) return;
      heading.textContent = title;
      const container = heading.parentElement as HTMLElement | null;
      if (container) setTarget(container);
      window.clearInterval(timer);
    }, 150);

    return () => window.clearInterval(timer);
  }, [title]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;

    async function load() {
      const { data: invitation } = await client
        .from("invitations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!invitation || !active) return;

      const [{ data: content }, { data: rows }] = await Promise.all([
        client
          .from("invitation_content")
          .select("story_title")
          .eq("invitation_id", invitation.id)
          .maybeSingle(),
        client
          .from("invitation_story_media")
          .select("id, image_url, caption")
          .eq("invitation_id", invitation.id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      ]);

      if (!active) return;
      if (content?.story_title) setTitle(content.story_title);
      setMedia((rows ?? []) as StoryMedia[]);
    }

    void load();
    return () => {
      active = false;
    };
  }, [slug, supabase]);

  if (!target || media.length === 0) return null;

  return createPortal(
    <div
      aria-label={`Foto: ${title}`}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: "14px",
        marginTop: "22px"
      }}
    >
      {media.map((item) => (
        <figure
          key={item.id}
          style={{
            margin: 0,
            overflow: "hidden",
            borderRadius: "20px",
            background: "rgba(255,255,255,.72)"
          }}
        >
          <img
            loading="lazy"
            src={item.image_url}
            alt={item.caption || title}
            style={{
              width: "100%",
              aspectRatio: "4 / 3",
              objectFit: "cover",
              display: "block"
            }}
          />
          {item.caption ? (
            <figcaption style={{ padding: "10px 12px", fontSize: ".92rem" }}>
              {item.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>,
    target
  );
}
