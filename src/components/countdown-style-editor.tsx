"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { readEditingDraft, readDrafts, saveDraft, setEditingDraft, type InvitationDraft } from "@/lib/draft-storage";
import { saveDraftToSupabase } from "@/lib/supabase/drafts";

type CountdownStyle = "classic" | "cards" | "minimal" | "circles";

const options: Array<{ id: CountdownStyle; label: string }> = [
  { id: "classic", label: "Classico" },
  { id: "cards", label: "Cards" },
  { id: "minimal", label: "Minimal" },
  { id: "circles", label: "Cerchi" }
];

function currentDraft(): InvitationDraft | null {
  const editId = new URLSearchParams(window.location.search).get("edit");
  const editing = readEditingDraft();
  if (editId && editing?.id === editId) return editing;
  const title = document.querySelector<HTMLInputElement>("#title")?.value.trim();
  return readDrafts().find((draft) => draft.title.trim() === title) ?? editing;
}

function applyStyle(style: CountdownStyle) {
  const countdown = document.querySelector<HTMLElement>(".phone-countdown");
  if (!countdown) return;
  countdown.classList.remove("countdown-classic", "countdown-cards", "countdown-minimal", "countdown-circles");
  countdown.classList.add(`countdown-${style}`);
  const section = countdown.closest<HTMLElement>('[data-preview-section="countdown"]');
  const paragraph = section?.querySelector<HTMLParagraphElement>(":scope > p");
  if (paragraph) paragraph.style.display = paragraph.textContent?.trim() ? "" : "none";
}

export function CountdownStyleEditor() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [style, setStyle] = useState<CountdownStyle>("classic");

  async function choose(next: CountdownStyle) {
    setStyle(next);
    applyStyle(next);
    const draft = currentDraft();
    if (!draft) return;
    const updated = {
      ...draft,
      theme: { ...draft.theme, countdownStyle: next },
      updatedAt: new Date().toISOString()
    } as InvitationDraft;
    saveDraft(updated);
    setEditingDraft(updated);
    await saveDraftToSupabase(updated);
  }

  useEffect(() => {
    const sync = () => {
      const countdownLabel = Array.from(document.querySelectorAll<HTMLElement>(".block-editor-head strong"))
        .find((node) => node.textContent?.trim() === "Countdown");
      const block = countdownLabel?.closest<HTMLElement>(".block-editor");
      if (!block) return;
      let mount = block.querySelector<HTMLElement>("[data-countdown-style-mount]");
      if (!mount) {
        mount = document.createElement("div");
        mount.dataset.countdownStyleMount = "true";
        const firstRow = block.querySelector(".field-row");
        if (firstRow) firstRow.insertAdjacentElement("afterend", mount);
        else block.appendChild(mount);
      }
      setTarget(mount);
      const draft = currentDraft();
      const saved = (draft?.theme.countdownStyle ?? "classic") as CountdownStyle;
      setStyle(saved);
      applyStyle(saved);
    };

    sync();
    const timer = window.setInterval(sync, 500);

    const css = document.createElement("style");
    css.textContent = `
      .countdown-style-picker{margin:12px 0 14px}.countdown-style-picker>strong{display:block;margin-bottom:9px}.countdown-style-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.countdown-style-options button{min-height:44px;border:1px solid rgba(63,41,42,.16);border-radius:12px;background:#fff;cursor:pointer;font-weight:650}.countdown-style-options button.active{border:2px solid var(--accent);background:#fff8f6}.phone-countdown.countdown-cards>div{background:rgba(255,255,255,.82);border-radius:12px;padding:10px 6px;box-shadow:0 4px 18px rgba(0,0,0,.08)}.phone-countdown.countdown-minimal{background:transparent!important;border:0!important;box-shadow:none!important}.phone-countdown.countdown-minimal>div{border-right:1px solid rgba(0,0,0,.12)}.phone-countdown.countdown-minimal>div:last-child{border-right:0}.phone-countdown.countdown-circles>div{aspect-ratio:1;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.76);border:1px solid rgba(0,0,0,.10)}@media(max-width:760px){.countdown-style-options{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(css);

    return () => {
      window.clearInterval(timer);
      css.remove();
    };
  }, []);

  if (!target) return null;

  return createPortal(
    <div className="countdown-style-picker">
      <strong>Grafica countdown</strong>
      <div className="countdown-style-options">
        {options.map((option) => (
          <button
            key={option.id}
            className={style === option.id ? "active" : ""}
            type="button"
            onClick={() => void choose(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>,
    target
  );
}
