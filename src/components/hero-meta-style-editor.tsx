"use client";

import { useEffect, useState } from "react";
import { readDrafts, readEditingDraft, saveDraft, setEditingDraft, type InvitationDraft, type InvitationTheme } from "@/lib/draft-storage";
import { saveDraftToSupabase } from "@/lib/supabase/drafts";

type MetaStyle = NonNullable<InvitationTheme["heroMetaStyle"]>;
const options: Array<{value: MetaStyle; label: string}> = [
  { value: "pills", label: "Pillole" },
  { value: "minimal", label: "Minimal" },
  { value: "cards", label: "Card eleganti" },
  { value: "editorial", label: "Editoriale" }
];

function currentDraft() {
  const editing = readEditingDraft();
  const editId = new URLSearchParams(window.location.search).get("edit");
  if (editId && editing?.id === editId) return editing;
  const title = document.querySelector<HTMLInputElement>("#title")?.value.trim();
  return readDrafts().find((draft) => draft.title.trim() === title) ?? editing;
}

function apply(style: MetaStyle) {
  const meta = document.querySelector<HTMLElement>(".preview-phone .phone-meta");
  if (!meta) return;
  meta.dataset.metaStyle = style;
}

export function HeroMetaStyleEditor() {
  const [style, setStyle] = useState<MetaStyle>("pills");
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const setup = () => {
      const date = document.querySelector<HTMLInputElement>("#eventDate");
      const field = date?.closest<HTMLElement>(".field-row") ?? date?.parentElement?.parentElement ?? null;
      if (field) setTarget(field as HTMLElement);
      const saved = currentDraft()?.theme.heroMetaStyle ?? "pills";
      setStyle(saved);
      apply(saved);
    };
    setup();
    const timer = window.setTimeout(setup, 500);
    const css = document.createElement("style");
    css.dataset.heroMetaStyle = "true";
    css.textContent = `
      .hero-meta-style-editor{grid-column:1/-1;display:grid;gap:9px;margin-top:8px}.hero-meta-style-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.hero-meta-style-options button{padding:11px 12px;border:1px solid rgba(166,109,112,.32);border-radius:14px;background:#fff;color:#5c383a;font-weight:700}.hero-meta-style-options button.active{background:#a66d70;color:#fff;border-color:#a66d70}
      .preview-phone .phone-meta[data-meta-style="minimal"] span{border:0!important;background:transparent!important;border-radius:0!important;padding:3px 8px!important;border-bottom:1px solid currentColor!important}
      .preview-phone .phone-meta[data-meta-style="cards"]{gap:9px!important}.preview-phone .phone-meta[data-meta-style="cards"] span{border:0!important;border-radius:12px!important;padding:10px 13px!important;background:rgba(255,255,255,.78)!important;box-shadow:0 5px 18px rgba(0,0,0,.10)!important}
      .preview-phone .phone-meta[data-meta-style="editorial"]{gap:0!important;border-top:1px solid currentColor;border-bottom:1px solid currentColor;padding:8px 0!important}.preview-phone .phone-meta[data-meta-style="editorial"] span{border:0!important;border-radius:0!important;background:transparent!important;padding:2px 12px!important}.preview-phone .phone-meta[data-meta-style="editorial"] span+span{border-left:1px solid currentColor!important}
    `;
    document.head.appendChild(css);
    return () => { window.clearTimeout(timer); css.remove(); };
  }, []);

  async function choose(value: MetaStyle) {
    setStyle(value); apply(value);
    const draft = currentDraft();
    if (!draft) return;
    const next: InvitationDraft = {...draft, theme:{...draft.theme, heroMetaStyle:value}, updatedAt:new Date().toISOString()};
    saveDraft(next); setEditingDraft(next); await saveDraftToSupabase(next);
  }

  if (!target) return null;
  return <div className="hero-meta-style-editor"><strong>Grafica data e orario</strong><div className="hero-meta-style-options">{options.map(option=><button className={style===option.value?"active":""} key={option.value} type="button" onClick={()=>void choose(option.value)}>{option.label}</button>)}</div></div>;
}
