"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  readDrafts,
  readEditingDraft,
  saveDraft,
  setEditingDraft,
  type InvitationDraft
} from "@/lib/draft-storage";
import { saveDraftToSupabase } from "@/lib/supabase/drafts";

const MIN = 0.75;
const MAX = 1.5;
const STEP = 0.05;

function clamp(value: number) {
  return Math.min(MAX, Math.max(MIN, Number(value.toFixed(2))));
}

function currentDraft(): InvitationDraft | null {
  const editId = new URLSearchParams(window.location.search).get("edit");
  const editing = readEditingDraft();
  if (editId && editing?.id === editId) return editing;

  const title = document.querySelector<HTMLInputElement>("#title")?.value.trim();
  if (!title) return editing;
  return readDrafts().find((draft) => draft.title.trim() === title) ?? editing;
}

function readScales(draft: InvitationDraft | null) {
  const theme = (draft?.theme ?? {}) as InvitationDraft["theme"] & {
    titleFontScale?: number;
    textFontScale?: number;
  };
  const fallback = theme.fontScale ?? 1;
  return {
    title: clamp(theme.titleFontScale ?? fallback),
    text: clamp(theme.textFontScale ?? fallback)
  };
}

export function SplitFontScaleEditor() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [titleScale, setTitleScale] = useState(1);
  const [textScale, setTextScale] = useState(1);

  function applyPreview(title: number, text: number) {
    const preview = document.querySelector<HTMLElement>(".preview-phone");
    if (!preview) return;
    preview.style.setProperty("--invitation-title-scale", String(title));
    preview.style.setProperty("--invitation-text-scale", String(text));
  }

  async function persist(title: number, text: number) {
    const draft = currentDraft();
    if (!draft) return;

    const nextDraft = {
      ...draft,
      theme: {
        ...draft.theme,
        fontScale: 1,
        titleFontScale: title,
        textFontScale: text
      },
      updatedAt: new Date().toISOString()
    } as InvitationDraft;

    saveDraft(nextDraft);
    setEditingDraft(nextDraft);
    await saveDraftToSupabase(nextDraft);
  }

  function updateTitle(value: number) {
    const next = clamp(value);
    setTitleScale(next);
    applyPreview(next, textScale);
    void persist(next, textScale);
  }

  function updateText(value: number) {
    const next = clamp(value);
    setTextScale(next);
    applyPreview(titleScale, next);
    void persist(titleScale, next);
  }

  useEffect(() => {
    const findTarget = () => {
      const labels = Array.from(document.querySelectorAll<HTMLLabelElement>(".field label"));
      const oldLabel = labels.find((label) => label.textContent?.includes("Dimensione testi:"));
      const field = oldLabel?.closest<HTMLElement>(".field") ?? null;
      if (!field) return;

      field.style.display = "none";
      const row = field.parentElement;
      if (row) setTarget(row);

      const scales = readScales(currentDraft());
      setTitleScale(scales.title);
      setTextScale(scales.text);
      applyPreview(scales.title, scales.text);
    };

    findTarget();
    const timer = window.setTimeout(findTarget, 350);

    const style = document.createElement("style");
    style.dataset.splitFontScale = "true";
    style.textContent = `
      .preview-phone .phone-hero-preview h2,
      .preview-phone .phone-featured-text,
      .preview-phone .phone-location strong,
      .preview-phone .phone-program-item strong,
      .preview-phone .phone-social-heading strong {
        font-size: calc(30px * var(--invitation-title-scale, 1)) !important;
      }
      .preview-phone .phone-hero-preview p,
      .preview-phone .phone-slot p,
      .preview-phone .phone-location,
      .preview-phone .phone-meta,
      .preview-phone .phone-program-item span,
      .preview-phone .phone-social-heading small {
        font-size: calc(13px * var(--invitation-text-scale, 1)) !important;
      }
      .split-font-scale-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        width: 100%;
      }
      .split-font-scale-card {
        display: grid;
        gap: 8px;
      }
      .split-font-scale-card > label {
        font-weight: 650;
      }
      @media (max-width: 760px) {
        .split-font-scale-grid { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);

    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest("button");
      if (!button) return;
      const label = button.textContent ?? "";
      if (!label.includes("Salva bozza") && !label.includes("Pubblica") && !label.includes("Aggiorna invito")) return;
      window.setTimeout(() => void persist(titleScale, textScale), 1200);
    };
    document.addEventListener("click", onClick);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onClick);
      style.remove();
    };
  }, [titleScale, textScale]);

  if (!target) return null;

  return createPortal(
    <div className="split-font-scale-grid">
      <div className="field split-font-scale-card">
        <label>Dimensione titoli: {Math.round(titleScale * 100)}%</label>
        <div className="font-size-control">
          <button type="button" onClick={() => updateTitle(titleScale - STEP)}>A−</button>
          <input aria-label="Dimensione titoli" min={MIN} max={MAX} step={STEP} type="range" value={titleScale} onChange={(event) => updateTitle(Number(event.target.value))} />
          <button type="button" onClick={() => updateTitle(titleScale + STEP)}>A+</button>
        </div>
      </div>
      <div className="field split-font-scale-card">
        <label>Dimensione testi: {Math.round(textScale * 100)}%</label>
        <div className="font-size-control">
          <button type="button" onClick={() => updateText(textScale - STEP)}>A−</button>
          <input aria-label="Dimensione testi" min={MIN} max={MAX} step={STEP} type="range" value={textScale} onChange={(event) => updateText(Number(event.target.value))} />
          <button type="button" onClick={() => updateText(textScale + STEP)}>A+</button>
        </div>
      </div>
    </div>,
    target
  );
}
