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
    const sync = () => {
      Object.entries(ids).forEach(([key, section]) => {
        const input = document.querySelector<HTMLTextAreaElement>(`#block-text-${key}`) ?? document.querySelector<HTMLTextAreaElement>(`textarea[name="blockTexts.${key}"]`);
        if (!input) return;
        input.dataset.allowEmpty = "true";
        const preview = document.querySelector<HTMLElement>(`.preview-phone [data-preview-section="${section}"]`);
        if (!preview) return;
        const paragraphs = Array.from(preview.children).filter((node): node is HTMLElement => node instanceof HTMLElement && node.tagName === "P");
        const intro = paragraphs[0];
        if (intro) {
          if (input.value.trim()) {
            intro.textContent = input.value;
            intro.style.display = "";
          } else {
            intro.textContent = "";
            intro.style.display = "none";
          }
        }
      });
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
