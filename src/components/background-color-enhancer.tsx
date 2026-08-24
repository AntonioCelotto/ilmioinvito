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
      const hero = preview?.querySelector<HTMLElement>(".phone-hero-preview");
      if (!preview || !hero) return;

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

      // La grafica scelta resta intatta esclusivamente nella prima schermata.
      if (lastImageUrl) {
        hero.style.backgroundImage = `url("${lastImageUrl}")`;
        hero.style.backgroundPosition = "center center";
        hero.style.backgroundSize = "cover";
        hero.style.backgroundRepeat = "no-repeat";
      }

      // Dopo la copertina si usa solo la palette scelta, come nei template video.
      preview.style.backgroundImage = "none";
      preview.style.backgroundColor = color;
    };

    sync();
    const timer = window.setInterval(sync, 180);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
