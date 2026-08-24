"use client";

import { useEffect } from "react";

export function BuilderTemplateLinkEnhancer() {
  useEffect(() => {
    const sync = () => {
      const editingId = new URLSearchParams(window.location.search).get("edit");
      if (!editingId) return;

      document.querySelectorAll<HTMLAnchorElement>('a[href="/templates"]').forEach((link) => {
        link.href = `/templates?edit=${encodeURIComponent(editingId)}`;
      });
    };

    sync();
    const timer = window.setInterval(sync, 300);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
