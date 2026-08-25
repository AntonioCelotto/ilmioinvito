"use client";

import { useEffect } from "react";
import { readDrafts, setEditingDraft } from "@/lib/draft-storage";

export function BuilderTemplateLinkEnhancer() {
  useEffect(() => {
    const sync = () => {
      const editingId = new URLSearchParams(window.location.search).get("edit");

      document.querySelectorAll<HTMLAnchorElement>('a[href^="/templates"]').forEach((link) => {
        if (editingId) {
          link.href = `/templates?edit=${encodeURIComponent(editingId)}`;
          return;
        }

        if (link.dataset.preserveInviteBound === "true") return;
        link.dataset.preserveInviteBound = "true";

        link.addEventListener("click", (event) => {
          event.preventDefault();

          const saveButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
            button.textContent?.includes("Salva bozza")
          );
          saveButton?.click();

          window.setTimeout(() => {
            const title = document.querySelector<HTMLInputElement>("#title")?.value.trim();
            const draft = readDrafts().find((item) => item.title.trim() === title) ?? readDrafts()[0];
            if (draft) {
              setEditingDraft(draft);
              window.location.href = `/templates?edit=${encodeURIComponent(draft.id)}`;
            } else {
              window.location.href = "/templates";
            }
          }, 180);
        });
      });
    };

    sync();
    const timer = window.setInterval(sync, 300);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
