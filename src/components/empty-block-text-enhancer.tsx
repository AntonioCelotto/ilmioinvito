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
        const preview = document.querySelector<HTMLElement>(`.preview-phone [data-preview-section="${section}"]`);
        const intro = preview?.querySelector<HTMLElement>(":scope > p");
        if (intro) intro.style.display = input.value.trim() ? "" : "none";
      });
    };
    const handler = () => window.setTimeout(sync, 0);
    sync();
    const timer = window.setTimeout(sync, 600);
    document.addEventListener("input", handler);
    document.addEventListener("change", handler);
    return () => { window.clearTimeout(timer); document.removeEventListener("input", handler); document.removeEventListener("change", handler); };
  }, []);
  return null;
}
