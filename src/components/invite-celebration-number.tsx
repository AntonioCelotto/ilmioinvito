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
  const [mode, setMode] = useState<"number" | "logo" | "text">("number");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoScale, setLogoScale] = useState(1);
  const [numberScale, setNumberScale] = useState(1);
  const [coverText, setCoverText] = useState("");
  const [coverTextScale, setCoverTextScale] = useState(1);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const heroContent = document.querySelector<HTMLElement>(".invite-hero > div");
      if (heroContent) {
        setTarget(heroContent);
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
        setNumberScale(draft.theme.coverNumberScale ?? 1);
        setCoverText(draft.theme.coverText ?? "");
        setCoverTextScale(draft.theme.coverTextScale ?? 1);
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

  return createPortal(
    <div aria-label="Elementi personalizzati della copertina" style={{alignItems:"center",display:"flex",flexDirection:"column",gap:"clamp(8px,1.5vw,16px)",margin:"0 auto clamp(18px,3vw,34px)",pointerEvents:"none",width:"min(88vw,720px)"}}>
      {logoUrl ? <div aria-label="Logo evento" style={{alignItems:"center",display:"flex",height:`clamp(62px,${Math.round(10*logoScale)}vw,${Math.round(130*logoScale)}px)`,justifyContent:"center",width:`${Math.min(76,Math.round(34*logoScale))}%`}}><img src={logoUrl} alt="Logo evento" style={{display:"block",height:"100%",objectFit:"contain",width:"100%"}} /></div> : null}
      {number ? <div aria-label={`Numero compleanno ${number}`} style={{color,fontFamily:"Georgia, 'Times New Roman', serif",fontSize:`clamp(${Math.round(68*numberScale)}px,${Math.round(15*numberScale)}vw,${Math.round(154*numberScale)}px)`,fontWeight:700,letterSpacing:"-.04em",lineHeight:.82,textAlign:"center",textShadow:"0 2px 0 #fff2b8, 0 6px 18px rgba(0,0,0,.42)",width:"100%"}}>{number}</div> : null}
      {coverText.trim() ? <div aria-label="Testo copertina" style={{color,fontFamily:"Georgia, 'Times New Roman', serif",fontSize:`clamp(${Math.round(30*coverTextScale)}px, ${Math.round(7*coverTextScale)}vw, ${Math.round(76*coverTextScale)}px)`,fontWeight:700,lineHeight:1,overflowWrap:"anywhere",textAlign:"center",textShadow:"0 2px 0 rgba(255,255,255,.45), 0 6px 18px rgba(0,0,0,.22)",width:"100%"}}>{coverText}</div> : null}
    </div>,
    target
  );
}
