"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { findDraftBySlug } from "@/lib/draft-storage";
import { findDraftBySlugFromSupabase } from "@/lib/supabase/drafts";

type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;

function newestDraft<T extends { updatedAt?: string }>(local: T | undefined, remote: T | null) {
  if (!local) return remote;
  if (!remote) return local;
  const localTime = Date.parse(local.updatedAt || "") || 0;
  const remoteTime = Date.parse(remote.updatedAt || "") || 0;
  return localTime >= remoteTime ? local : remote;
}

export function InviteCelebrationNumber({ slug }: { slug: string }) {
  const [number, setNumber] = useState("");
  const [color, setColor] = useState("#d6ad60");
  const [mode, setMode] = useState<"number" | "logo">("number");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoScale, setLogoScale] = useState(1);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const hero = document.querySelector<HTMLElement>(".invite-hero");
      if (hero) {
        hero.style.position = "relative";
        setTarget(hero);
        window.clearInterval(timer);
      }
    }, 120);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    async function load(client: SupabaseClient) {
      const localDraft = findDraftBySlug(slug);
      const remoteDraft = await findDraftBySlugFromSupabase(slug);
      const draft = newestDraft(localDraft, remoteDraft);

      if (draft && active) {
        setMode(draft.theme.coverElement ?? "number");
        setLogoUrl(draft.theme.coverLogoUrl ?? "");
        setLogoScale(draft.theme.coverLogoScale ?? 1);
      }

      const { data: invitation } = await client
        .from("invitations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!invitation || !active) return;

      const { data } = await client
        .from("invitation_celebration_number")
        .select("celebration_number, celebration_color")
        .eq("invitation_id", invitation.id)
        .maybeSingle();

      if (active) {
        setNumber(data?.celebration_number ?? "");
        setColor(data?.celebration_color ?? "#d6ad60");
      }
    }

    void load(supabase);
    return () => {
      active = false;
    };
  }, [slug, supabase]);

  if (!target) return null;

  if (mode === "logo" && logoUrl) {
    return createPortal(
      <div
        aria-label="Logo evento"
        style={{
          position: "absolute",
          left: "50%",
          top: "13%",
          transform: "translateX(-50%)",
          zIndex: 4,
          width: `${Math.round(34 * logoScale)}%`,
          height: "clamp(80px, 12vw, 150px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none"
        }}
      >
        <img
          src={logoUrl}
          alt="Logo evento"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>,
      target
    );
  }

  if (!number) return null;

  return createPortal(
    <div
      aria-label={`Numero compleanno ${number}`}
      style={{
        position: "absolute",
        inset: "15% 0 auto",
        zIndex: 4,
        textAlign: "center",
        pointerEvents: "none",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontWeight: 700,
        fontSize: "clamp(92px, 22vw, 240px)",
        lineHeight: ".82",
        letterSpacing: "-.06em",
        color,
        textShadow: "0 2px 0 #fff2b8, 0 6px 18px rgba(0,0,0,.52)"
      }}
    >
      {number}
    </div>,
    target
  );
}
