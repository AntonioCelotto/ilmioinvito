"use client";

import { useEffect } from "react";

export function HeroCenterEnhancer() {
  useEffect(() => {
    const sync = () => {
      const hero = document.querySelector<HTMLElement>(".phone-hero-preview");
      if (!hero) return;

      hero.style.textAlign = "center";

      const videoData = hero.querySelector<HTMLElement>(".phone-video-data");
      if (videoData) {
        videoData.style.position = "absolute";
        videoData.style.inset = "0";
        videoData.style.display = "flex";
        videoData.style.flexDirection = "column";
        videoData.style.alignItems = "center";
        videoData.style.justifyContent = "center";
        videoData.style.textAlign = "center";
        videoData.style.width = "100%";
        videoData.style.padding = "28px 20px";
        videoData.style.zIndex = "5";
        return;
      }

      if (!hero.querySelector("video")) {
        hero.style.display = "flex";
        hero.style.flexDirection = "column";
        hero.style.alignItems = "center";
        hero.style.justifyContent = "center";
        hero.style.textAlign = "center";
        hero.style.paddingLeft = "20px";
        hero.style.paddingRight = "20px";
      }
    };

    sync();
    const timer = window.setInterval(sync, 400);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
