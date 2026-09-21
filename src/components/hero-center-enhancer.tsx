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
        hero.style.removeProperty("min-height");
        hero.style.removeProperty("place-content");
        hero.style.removeProperty("align-content");
        hero.style.removeProperty("width");
        hero.style.removeProperty("margin-left");
        hero.style.removeProperty("margin-right");
        hero.style.removeProperty("margin-top");
        return;
      }

      const phoneScreen = hero.closest<HTMLElement>(".phone-screen");
      if (phoneScreen) {
        const styles = window.getComputedStyle(phoneScreen);
        const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
        const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
        const paddingRight = Number.parseFloat(styles.paddingRight) || 0;

        hero.style.minHeight = `${Math.max(330, phoneScreen.clientHeight)}px`;
        hero.style.width = `calc(100% + ${paddingLeft + paddingRight}px)`;
        hero.style.marginLeft = `${-paddingLeft}px`;
        hero.style.marginRight = `${-paddingRight}px`;
        hero.style.marginTop = `${-paddingTop}px`;
      }

      hero.style.position = "relative";
      hero.style.textAlign = "center";
      hero.style.placeContent = "center";
      hero.style.alignContent = "center";

      const title = hero.querySelector<HTMLElement>("h2");
      const kicker = hero.querySelector<HTMLElement>(".phone-kicker");
      const subtitle = Array.from(hero.children).find(
        (child) => child.tagName === "P" && !child.classList.contains("phone-kicker")
      ) as HTMLElement | undefined;
      const meta = hero.querySelector<HTMLElement>(".phone-meta");

      [kicker, title, subtitle, meta].forEach((element) => {
        if (!element) return;
        element.style.position = "relative";
        element.style.top = "0";
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
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return null;
}
