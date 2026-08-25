"use client";

import { useEffect } from "react";

const ids: Record<string,string> = {
  countdown: "countdown",
  ceremony: "ceremony",
  reception: "ceremony",
  program: "program",
  dressCode: "dressCode",
  giftInfo: "giftInfo",
  gallery: "gallery",
  video: "gallery",
  rsvp: "rsvp"
};

export function EmptyBlockTextEnhancer() {
  useEffect(() => {
    const syncInputToPreview = (input: HTMLTextAreaElement, section: string) => {
      input.dataset.allowEmpty = "true";
      const preview = document.querySelector<HTMLElement>(`.preview-phone [data-preview-section="${section}"]`);
      if (!preview) return;
      const paragraphs = Array.from(preview.children).filter(
        (node): node is HTMLElement => node instanceof HTMLElement && node.tagName === "P"
      );
      const intro = paragraphs[0];
      if (!intro) return;

      if (input.value.trim()) {
        intro.textContent = input.value;
        intro.style.display = "";
      } else {
        intro.textContent = "";
        intro.style.display = "none";
      }
    };

    const sync = () => {
      Object.entries(ids).forEach(([key, section]) => {
        const input =
          document.querySelector<HTMLTextAreaElement>(`#block-text-${key}`) ??
          document.querySelector<HTMLTextAreaElement>(`textarea[name="blockTexts.${key}"]`);
        if (input) syncInputToPreview(input, section);
      });

      // Il textarea del blocco Luoghi non ha id/name dedicato nel builder.
      // Lo individuiamo direttamente nel suo editor e rispettiamo anche il valore vuoto.
      const locationEditor = document.querySelector<HTMLElement>(".location-block-editor");
      const locationIntro = locationEditor?.querySelector<HTMLTextAreaElement>(":scope > .field textarea");
      if (locationIntro) syncInputToPreview(locationIntro, "ceremony");
    };

    const handler = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLTextAreaElement && target.dataset.allowEmpty === "true") {
        target.dataset.userEdited = "true";
      }
      window.setTimeout(sync, 0);
    };

    sync();
    const timer = window.setInterval(sync, 500);
    document.addEventListener("input", handler, true);
    document.addEventListener("change", handler, true);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("input", handler, true);
      document.removeEventListener("change", handler, true);
    };
  }, []);

  return null;
}
