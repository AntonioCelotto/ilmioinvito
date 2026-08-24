"use client";

import { useEffect } from "react";

const labelToSection: Record<string, string> = {
  Countdown: "countdown",
  "Conferma partecipazione": "rsvp",
  Programma: "program",
  "Dress code": "dressCode",
  "Regalo / info utili": "giftInfo",
  Social: "gallery"
};

function moveTemplateCustomizationUp() {
  const form = document.querySelector<HTMLElement>(".form-panel");
  if (!form) return;

  const headings = Array.from(form.querySelectorAll<HTMLHeadingElement>("h3"));
  const customizationHeading = headings.find(
    (heading) => heading.textContent?.trim() === "Personalizza il template"
  );
  const blocksHeading = headings.find(
    (heading) => heading.textContent?.trim() === "Testi blocchi invito"
  );

  if (!customizationHeading || !blocksHeading) return;
  if (customizationHeading.compareDocumentPosition(blocksHeading) & Node.DOCUMENT_POSITION_FOLLOWING) {
    const nodes: Element[] = [customizationHeading];
    let next = customizationHeading.nextElementSibling;
    while (next && next !== blocksHeading && !next.matches("h3")) {
      nodes.push(next);
      next = next.nextElementSibling;
    }

    nodes.forEach((node) => form.insertBefore(node, blocksHeading));
  }
}

function getSectionForEditor(editor: HTMLElement) {
  if (editor.classList.contains("location-block-editor")) return "ceremony";
  if (editor.querySelector('[id^="gift-wish-"]') || editor.querySelector("#gift-iban")) return "giftInfo";
  if (editor.querySelector('[id^="program-time-"]')) return "program";
  if (editor.querySelector("#countdown-date")) return "countdown";
  if (editor.querySelector("#rsvp-whatsapp")) return "rsvp";
  if (editor.querySelector("#dressCode")) return "dressCode";

  const title = editor.querySelector<HTMLElement>(".block-editor-head strong")?.textContent?.trim();
  return title ? labelToSection[title] : undefined;
}

function scrollPreviewTo(section: string) {
  const preview = document.querySelector<HTMLElement>(".phone-screen");
  const target = preview?.querySelector<HTMLElement>(`[data-preview-section="${section}"]`);
  if (!preview || !target) return;

  preview.scrollTo({
    top: Math.max(0, target.offsetTop - 54),
    behavior: "smooth"
  });

  target.classList.remove("preview-anchor-highlight");
  void target.offsetWidth;
  target.classList.add("preview-anchor-highlight");
  window.setTimeout(() => target.classList.remove("preview-anchor-highlight"), 1300);
}

export function BuilderPreviewAnchorEnhancer() {
  useEffect(() => {
    moveTemplateCustomizationUp();

    const style = document.createElement("style");
    style.dataset.builderPreviewAnchor = "true";
    style.textContent = `
      .preview-anchor-highlight {
        outline: 2px solid rgba(166, 109, 112, .72);
        outline-offset: 4px;
        border-radius: 14px;
        transition: outline-color .2s ease;
      }
      .block-editor {
        scroll-margin-top: 24px;
      }
    `;
    document.head.appendChild(style);

    const handleInteraction = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const editor = target?.closest<HTMLElement>(".block-editor");
      if (!editor) return;
      const section = getSectionForEditor(editor);
      if (section) scrollPreviewTo(section);
    };

    document.addEventListener("focusin", handleInteraction);
    document.addEventListener("click", handleInteraction);

    const observer = new MutationObserver(() => moveTemplateCustomizationUp());
    const form = document.querySelector<HTMLElement>(".form-panel");
    if (form) observer.observe(form, { childList: true });

    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", handleInteraction);
      document.removeEventListener("click", handleInteraction);
      style.remove();
    };
  }, []);

  return null;
}
