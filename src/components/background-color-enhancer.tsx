"use client";

import { useEffect } from "react";
import { readSelectedTemplate } from "@/lib/template-catalog";

export function BackgroundColorEnhancer() {
  useEffect(() => {
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

    // Per i template immagine usiamo direttamente il template selezionato,
    // invece di leggere lo sfondo precedente del contenitore. In questo modo
    // il cambio immagine segue sempre la scelta effettuata nella galleria.
    const selectedTemplate = readSelectedTemplate();
    const selectedImage = selectedTemplate.theme.backgroundImage;

    if (selectedImage) {
      hero.style.backgroundImage = `url("${selectedImage}")`;
      hero.style.backgroundPosition = "center center";
      hero.style.backgroundSize = "cover";
      hero.style.backgroundRepeat = "no-repeat";
    } else {
      hero.style.backgroundImage = "none";
    }

    const applyColor = () => {
      const colorControl = Array.from(document.querySelectorAll<HTMLElement>(".color-control")).find(
        (node) => node.textContent?.includes("Colore sfondo")
      );
      const colorInput = colorControl?.querySelector<HTMLInputElement>('input[type="color"]');
      if (!colorInput) return;

      preview.style.backgroundImage = "none";
      preview.style.backgroundColor = colorInput.value;
    };

    applyColor();
    document.addEventListener("input", applyColor);
    document.addEventListener("change", applyColor);

    return () => {
      document.removeEventListener("input", applyColor);
      document.removeEventListener("change", applyColor);
    };
  }, []);

  return null;
}
