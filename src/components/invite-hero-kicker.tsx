"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;

export function InviteHeroKicker({ slug }: { slug: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!supabase) return;
    const client: SupabaseClient = supabase;
    let active = true;

    async function load() {
      const { data: invitation } = await client
        .from("invitations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!invitation || !active) return;

      const { data } = await client
        .from("invitation_content")
        .select("hero_kicker")
        .eq("invitation_id", invitation.id)
        .maybeSingle();

      if (active) setValue(data?.hero_kicker ?? "");
    }

    void load();
    return () => {
      active = false;
    };
  }, [slug, supabase]);

  useEffect(() => {
    const apply = () => {
      document.querySelectorAll<HTMLElement>(".invite-kicker").forEach((node) => {
        node.textContent = value;
        node.style.display = value.trim() ? "" : "none";
      });
    };

    apply();
    const timer = window.setInterval(apply, 250);
    return () => window.clearInterval(timer);
  }, [value]);

  return null;
}
