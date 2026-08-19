"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;

export function InviteCelebrationNumber({ slug }: { slug: string }) {
  const [number, setNumber] = useState("");
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
      const { data: invitation } = await client.from("invitations").select("id").eq("slug", slug).maybeSingle();
      if (!invitation || !active) return;
      const { data } = await client
        .from("invitation_celebration_number")
        .select("celebration_number")
        .eq("invitation_id", invitation.id)
        .maybeSingle();
      if (active) setNumber(data?.celebration_number ?? "");
    }
    void load(supabase);
    return () => { active = false; };
  }, [slug, supabase]);

  if (!target || !number) return null;

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
        color: "#d6ad60",
        textShadow: "0 2px 0 #fff2b8, 0 6px 18px rgba(0,0,0,.52)"
      }}
    >
      {number}
    </div>,
    target
  );
}
