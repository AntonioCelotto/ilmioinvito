"use client";

import { useEffect } from "react";

function extractUrl(backgroundImage: string) {
  const match = backgroundImage.match(/url\(["']?(.*?)["']?\)/);
  return match?.[1] ?? "";
}

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

    const originalImageUrl = extractUrl(preview.style.backgroundImage);
    if (originalImageUrl) {
      hero.style.backgroundImage = `url("${originalImageUrl}")`;
      hero.style.backgroundPosition = "center center";
      hero.style.backgroundSize = "cover";
      hero.style.backgroundRepeat = "no-repeat";
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
    const observer = new MutationObserver(applyColor);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["value"] });
    document.addEventListener("input", applyColor);
    document.addEventListener("change", applyColor);

    return () => {
      observer.disconnect();
      document.removeEventListener("input", applyColor);
      document.removeEventListener("change", applyColor);
    };
  }, []);

  return null;
}
