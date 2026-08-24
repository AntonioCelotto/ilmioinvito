"use client";

import { useEffect } from "react";

function extractUrl(backgroundImage: string) {
  const match = backgroundImage.match(/url\(["']?(.*?)["']?\)/);
  return match?.[1] ?? "";
}

export function BackgroundColorEnhancer() {
  useEffect(() => {
    const sync = () => {
      const preview = document.querySelector<HTMLElement>(".preview-phone");
      if (!preview) return;

      const video = preview.querySelector<HTMLVideoElement>(".phone-hero-video");
      if (video) {
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";
        video.style.objectPosition = "50% 50%";
        return;
      }

      const colorControl = Array.from(document.querySelectorAll<HTMLElement>(".color-control")).find(
        (node) => node.textContent?.includes("Colore sfondo")
      );
      const colorInput = colorControl?.querySelector<HTMLInputElement>('input[type="color"]');
      if (!colorInput) return;

      const color = colorInput.value;
      const imageUrl = extractUrl(preview.style.backgroundImage);
      preview.style.backgroundColor = color;

      if (imageUrl) {
        preview.style.backgroundImage = `linear-gradient(color-mix(in srgb, ${color} 42%, transparent), color-mix(in srgb, ${color} 42%, transparent)), url("${imageUrl}")`;
      }
    };

    sync();
    const timer = window.setInterval(sync, 180);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
