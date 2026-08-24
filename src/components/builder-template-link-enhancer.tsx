"use client";

import { useEffect } from "react";

export function BuilderTemplateLinkEnhancer() {
  useEffect(() => {
    const sync = () => {
      const editingId = new URLSearchParams(window.location.search).get("edit");
      const link = document.querySelector<HTMLAnchorElement>(
        '.selected-template-panel a[href^="/templates"]'
      );

      if (!link) return;
      link.href = editingId
        ? `/templates?edit=${encodeURIComponent(editingId)}`
        : "/templates";
    };

    sync();
    const timer = window.setInterval(sync, 300);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
