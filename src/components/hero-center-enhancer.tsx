"use client";

import { useEffect } from "react";

export function HeroCenterEnhancer() {
  useEffect(() => {
    const sync = () => {
      const hero = document.querySelector<HTMLElement>(".phone-hero-preview");
      if (!hero) return;

      const video = hero.querySelector("video");
      const videoData = hero.querySelector<HTMLElement>(".phone-video-data");

      if (video) {
        hero.style.removeProperty("display");
        hero.style.removeProperty("flex-direction");
        hero.style.removeProperty("align-items");
        hero.style.removeProperty("justify-content");
        hero.style.removeProperty("padding-left");
        hero.style.removeProperty("padding-right");
        hero.style.removeProperty("text-align");

        if (videoData) {
          videoData.style.removeProperty("position");
          videoData.style.removeProperty("inset");
          videoData.style.removeProperty("display");
          videoData.style.removeProperty("flex-direction");
          videoData.style.removeProperty("align-items");
          videoData.style.removeProperty("justify-content");
          videoData.style.removeProperty("text-align");
          videoData.style.removeProperty("width");
          videoData.style.removeProperty("padding");
          videoData.style.removeProperty("z-index");
        }
        return;
      }

      hero.style.textAlign = "center";

      Array.from(hero.children).forEach((child) => {
        const element = child as HTMLElement;
        if (element.dataset.celebrationNumberPreview === "true") return;
        element.style.textAlign = "center";
        element.style.marginLeft = "auto";
        element.style.marginRight = "auto";
      });

      const title = hero.querySelector<HTMLElement>("h2");
      const kicker = hero.querySelector<HTMLElement>(".phone-kicker");
      const subtitle = Array.from(hero.children).find(
        (child) => child.tagName === "P" && !child.classList.contains("phone-kicker")
      ) as HTMLElement | undefined;
      const meta = hero.querySelector<HTMLElement>(".phone-meta");

      [title, kicker, subtitle, meta].forEach((element) => {
        if (!element) return;
        element.style.width = "100%";
        element.style.maxWidth = "100%";
        element.style.textAlign = "center";
        element.style.marginLeft = "auto";
        element.style.marginRight = "auto";
      });

      if (meta) {
        meta.style.justifyContent = "center";
      }
    };

    sync();
    const timer = window.setInterval(sync, 400);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
