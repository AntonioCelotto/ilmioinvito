"use client";

import { useEffect } from "react";

function extractUrl(backgroundImage: string) {
  const match = backgroundImage.match(/url\(["']?(.*?)["']?\)/);
  return match?.[1] ?? "";
}

export function BackgroundColorEnhancer() {
  useEffect(() => {
    let lastImageUrl = "";

    const sync = () => {
      const preview = document.querySelector<HTMLElement>(".preview-phone");
      const screen = preview?.querySelector<HTMLElement>(".phone-screen");
      const hero = preview?.querySelector<HTMLElement>(".phone-hero-preview");
      if (!preview || !screen || !hero) return;

      const video = preview.querySelector<HTMLVideoElement>(".phone-hero-video");
      if (video) {
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        video.style.objectPosition = "50% 50%";
        return;
      }

      const currentImageUrl = extractUrl(preview.style.backgroundImage);
      if (currentImageUrl) lastImageUrl = currentImageUrl;

      const colorControl = Array.from(document.querySelectorAll<HTMLElement>(".color-control")).find(
        (node) => node.textContent?.includes("Colore sfondo")
      );
      const colorInput = colorControl?.querySelector<HTMLInputElement>('input[type="color"]');
      if (!colorInput) return;

      const color = colorInput.value;
      const firstScreenHeight = Math.max(330, screen.clientHeight);

      if (lastImageUrl) {
        hero.style.backgroundImage = `url("${lastImageUrl}")`;
        hero.style.backgroundPosition = "center center";
        hero.style.backgroundSize = "cover";
        hero.style.backgroundRepeat = "no-repeat";
        hero.style.width = "calc(100% + 44px)";
        hero.style.marginLeft = "-22px";
        hero.style.marginRight = "-22px";
        hero.style.minHeight = `${firstScreenHeight}px`;
        hero.style.boxSizing = "border-box";
      }

      preview.style.backgroundImage = "none";
      preview.style.backgroundColor = color;
    };

    sync();
    const timer = window.setInterval(sync, 180);
    window.addEventListener("resize", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return null;
}
