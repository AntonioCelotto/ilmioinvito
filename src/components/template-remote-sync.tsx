"use client";

import { useEffect } from "react";
import { readEditingDraft } from "@/lib/draft-storage";
import { saveDraftToSupabase } from "@/lib/supabase/drafts";

export function TemplateRemoteSync() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editingId = params.get("edit");
    const templateId = params.get("template");
    if (!editingId || !templateId) return;

    const draft = readEditingDraft();
    if (!draft || draft.id !== editingId) return;

    void saveDraftToSupabase(draft);
  }, []);

  return null;
}
