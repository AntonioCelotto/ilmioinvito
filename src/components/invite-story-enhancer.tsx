"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

type StoryMedia = {
  id: string;
  image_url: string;
  caption: string | null;
};

type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;

export function InviteStoryEnhancer({ slug }: { slug: string }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [section, setSection] = useState<HTMLElement | null>(null);
  const [title, setTitle] = useState("La nostra storia");
  const [media, setMedia] = useState<StoryMedia[]>([]);
  const [position, setPosition] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const heading = Array.from(document.querySelectorAll(".invite-section h2")).find(
        (node) =>
          node.textContent?.trim() === "Un invito pensato per essere personale." ||
          node.textContent?.trim() === title
      ) as HTMLElement | undefined;

      if (!heading) return;
      heading.textContent = title;
      const container = heading.parentElement as HTMLElement | null;
      const storySection = container?.closest<HTMLElement>(".invite-section") ?? null;
      if (container) setTarget(container);
      if (storySection) {
        setSection(storySection);
        storySection.style.display = enabled ? "" : "none";
        storySection.style.order = String(position);
      }
    }, 150);

    return () => window.clearInterval(timer);
  }, [title, position, enabled]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    async function load(client: SupabaseClient) {
      const { data: invitation } = await client
        .from("invitations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!invitation || !active) return;

      const [{ data: content }, { data: rows }, { data: storySection }] = await Promise.all([
        client
          .from("invitation_content")
          .select("story_title, story_position")
          .eq("invitation_id", invitation.id)
          .maybeSingle(),
        client
          .from("invitation_story_media")
          .select("id, image_url, caption")
          .eq("invitation_id", invitation.id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        client
          .from("invitation_sections")
          .select("enabled, sort_order")
          .eq("invitation_id", invitation.id)
          .eq("type", "story")
          .maybeSingle()
      ]);

      if (!active) return;
      if (content?.story_title) setTitle(content.story_title);
      const savedPosition = Number(content?.story_position ?? storySection?.sort_order ?? 0);
      setPosition(Number.isFinite(savedPosition) ? Math.max(0, savedPosition) : 0);
      setEnabled(storySection?.enabled ?? true);
      setMedia((rows ?? []) as StoryMedia[]);
    }

    void load(supabase);
    return () => {
      active = false;
    };
  }, [slug, supabase]);

  useEffect(() => {
    if (!section) return;
    section.style.display = enabled ? "" : "none";
    section.style.order = String(position);
  }, [section, enabled, position]);

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
            background: "color-mix(in srgb, var(--invitation-primary-color) 36%, transparent)",
            border: "1px solid color-mix(in srgb, var(--invitation-text-color) 18%, transparent)",
            color: "var(--invitation-text-color)",
            backdropFilter: "blur(4px)"
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
            <figcaption
              style={{
                padding: "10px 12px",
                fontSize: ".92rem",
                color: "var(--invitation-text-color)"
              }}
            >
              {item.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>,
    target
  );
}
