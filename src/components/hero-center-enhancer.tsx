"use client";

import { useEffect } from "react";

export function HeroCenterEnhancer() {
  useEffect(() => {
    const sync = () => {
      const hero = document.querySelector<HTMLElement>(".phone-hero-preview");
      if (!hero) return;

      const video = hero.querySelector("video");
      if (video) {
        hero.style.removeProperty("text-align");
        return;
      }

      hero.style.position = "relative";
      hero.style.textAlign = "center";

      const title = hero.querySelector<HTMLElement>("h2");
      const kicker = hero.querySelector<HTMLElement>(".phone-kicker");
      const subtitle = Array.from(hero.children).find(
        (child) => child.tagName === "P" && !child.classList.contains("phone-kicker")
      ) as HTMLElement | undefined;
      const meta = hero.querySelector<HTMLElement>(".phone-meta");

      [kicker, title, subtitle, meta].forEach((element) => {
        if (!element) return;
        element.style.position = "relative";
        element.style.top = "58px";
        element.style.width = "100%";
        element.style.maxWidth = "100%";
        element.style.boxSizing = "border-box";
        element.style.textAlign = "center";
        element.style.marginLeft = "auto";
        element.style.marginRight = "auto";
      });

      if (meta) {
        meta.style.display = "flex";
        meta.style.justifyContent = "center";
        meta.style.alignItems = "center";
      }
    };

    sync();
    const timer = window.setInterval(sync, 400);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
