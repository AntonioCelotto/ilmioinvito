"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function InviteHeroKicker({ slug }: { slug: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function load() {
      const { data: invitation } = await supabase.from("invitations").select("id").eq("slug", slug).maybeSingle();
      if (!invitation || !active) return;
      const { data } = await supabase.from("invitation_content").select("hero_kicker").eq("invitation_id", invitation.id).maybeSingle();
      if (active) setValue(data?.hero_kicker ?? "");
    }
    void load();
    return () => { active = false; };
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
