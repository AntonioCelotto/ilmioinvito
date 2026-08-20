"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { readDrafts, readEditingDraft, type InvitationDraft } from "@/lib/draft-storage";

function currentBuilderTitle() {
  if (typeof document === "undefined") return "";
  return document.querySelector<HTMLInputElement>("#title")?.value.trim() ?? "";
}

function resolveCurrentDraft(): InvitationDraft | null {
  if (typeof window === "undefined") return null;
  const editingId = new URLSearchParams(window.location.search).get("edit");
  const editingDraft = readEditingDraft();
  if (editingId && editingDraft?.id === editingId) return editingDraft;
  const drafts = readDrafts();
  if (editingId) return drafts.find((draft) => draft.id === editingId) ?? null;
  const title = currentBuilderTitle();
  return title ? drafts.find((draft) => draft.title.trim() === title) ?? editingDraft : editingDraft;
}

export function HeroKickerEditor() {
  const supabase = useMemo(() => createClient(), []);
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [value, setValue] = useState("");
  const [invitationId, setInvitationId] = useState("");

  async function findInvitationId() {
    if (!supabase) return "";
    const draft = resolveCurrentDraft();
    if (draft?.id) {
      const { data } = await supabase.from("invitations").select("id").eq("id", draft.id).maybeSingle();
      if (data?.id) return data.id as string;
    }
    const title = currentBuilderTitle();
    if (!title) return "";
    const { data } = await supabase.from("invitations").select("id").eq("title", title).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    return (data?.id as string | undefined) ?? "";
  }

  useEffect(() => {
    let active = true;
    let loadedId = "";
    const sync = async () => {
      const titleInput = document.querySelector<HTMLInputElement>("#title");
      const field = titleInput?.closest<HTMLElement>(".field");
      if (field?.parentElement) {
        let target = field.parentElement.querySelector<HTMLElement>("[data-hero-kicker-editor]");
        if (!target) {
          target = document.createElement("div");
          target.dataset.heroKickerEditor = "true";
          field.parentElement.insertBefore(target, field);
        }
        setMount(target);
      }

      document.querySelectorAll<HTMLElement>(".phone-kicker").forEach((node) => {
        node.textContent = value;
        node.style.display = value.trim() ? "" : "none";
      });

      const id = await findInvitationId();
      if (!active || !id) return;
      setInvitationId(id);
      if (loadedId !== id) {
        loadedId = id;
        const { data } = await supabase?.from("invitation_content").select("hero_kicker").eq("invitation_id", id).maybeSingle()!;
        if (!active) return;
        setValue(data?.hero_kicker ?? "");
      }
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 300);
    return () => { active = false; window.clearInterval(timer); };
  }, [supabase, value]);

  async function save(next: string) {
    setValue(next);
    document.querySelectorAll<HTMLElement>(".phone-kicker").forEach((node) => {
      node.textContent = next;
      node.style.display = next.trim() ? "" : "none";
    });
    if (!supabase || !invitationId) return;
    await supabase.from("invitation_content").update({ hero_kicker: next, updated_at: new Date().toISOString() }).eq("invitation_id", invitationId);
  }

  if (!mount) return null;
  return createPortal(
    <div className="field">
      <label htmlFor="hero-kicker-custom">Testo sopra il titolo</label>
      <input
        id="hero-kicker-custom"
        placeholder="Es. Il mio matrimonio, Il nostro evento, Save the date..."
        value={value}
        onChange={(event) => void save(event.target.value)}
      />
      <span className="muted">Facoltativo. Se lo lasci vuoto non comparirà nessuna scritta.</span>
    </div>,
    mount
  );
}
