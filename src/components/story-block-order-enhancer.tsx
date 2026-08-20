"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export function StoryBlockOrderEnhancer() {
  const supabase = useMemo(() => createClient(), []);
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [editorMount, setEditorMount] = useState<HTMLElement | null>(null);
  const [invitationId, setInvitationId] = useState("");
  const [position, setPosition] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [blockCount, setBlockCount] = useState(0);
  const loadedIdRef = useRef("");
  const positionRef = useRef(0);
  const enabledRef = useRef(true);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  async function resolveInvitationId() {
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

  async function loadState(id: string) {
    if (!supabase || !id) return;
    const [{ data: content }, { data: story }] = await Promise.all([
      supabase.from("invitation_content").select("story_position").eq("invitation_id", id).maybeSingle(),
      supabase.from("invitation_sections").select("enabled, sort_order").eq("invitation_id", id).eq("type", "story").maybeSingle()
    ]);
    const stored = Number(content?.story_position ?? story?.sort_order ?? 0);
    const safe = Number.isFinite(stored) ? Math.max(0, stored) : 0;
    positionRef.current = safe;
    enabledRef.current = story?.enabled ?? true;
    setPosition(safe);
    setEnabled(story?.enabled ?? true);
  }

  async function persistPosition(next: number) {
    const safe = Math.max(0, Math.min(blockCount, next));
    positionRef.current = safe;
    setPosition(safe);
    if (!supabase || !invitationId) return;
    await Promise.all([
      supabase.from("invitation_content").update({ story_position: safe, updated_at: new Date().toISOString() }).eq("invitation_id", invitationId),
      supabase.from("invitation_sections").update({ sort_order: safe }).eq("invitation_id", invitationId).eq("type", "story")
    ]);
  }

  async function persistEnabled(next: boolean) {
    enabledRef.current = next;
    setEnabled(next);
    if (!supabase || !invitationId) return;
    await supabase.from("invitation_sections").update({ enabled: next }).eq("invitation_id", invitationId).eq("type", "story");
  }

  useEffect(() => {
    let active = true;

    const sync = async () => {
      const list = document.querySelector<HTMLElement>(".block-order-list");
      if (list) {
        let target = list.querySelector<HTMLElement>("[data-story-order-mount]");
        if (!target) {
          target = document.createElement("div");
          target.dataset.storyOrderMount = "true";
          target.style.display = "contents";
        }

        const nativeItems = Array.from(list.children).filter(
          (child) => !(child as HTMLElement).dataset.storyOrderMount
        ) as HTMLElement[];
        const count = nativeItems.length;
        setBlockCount(count);
        const safePosition = Math.max(0, Math.min(positionRef.current, count));
        const before = nativeItems[safePosition] ?? null;
        if (target.parentElement !== list || target.nextElementSibling !== before) {
          list.insertBefore(target, before);
        }
        setMount(target);
      }

      const fixedLegacyStory = document.querySelector<HTMLElement>(".phone-story-slot");
      if (fixedLegacyStory) fixedLegacyStory.style.display = "none";

      const phoneScreen = document.querySelector<HTMLElement>(".phone-screen");
      const storyPreviewMount = phoneScreen?.querySelector<HTMLElement>("[data-story-preview-mount]");
      if (phoneScreen && storyPreviewMount) {
        const previewBlocks = Array.from(phoneScreen.children).filter((child) => {
          const element = child as HTMLElement;
          return element.classList.contains("phone-slot") &&
            !element.classList.contains("phone-story-slot") &&
            element !== storyPreviewMount;
        }) as HTMLElement[];
        const safePosition = Math.max(0, Math.min(positionRef.current, previewBlocks.length));
        const before = previewBlocks[safePosition] ?? phoneScreen.querySelector<HTMLElement>(".phone-preview-footer");
        if (storyPreviewMount.nextElementSibling !== before || storyPreviewMount.parentElement !== phoneScreen) {
          phoneScreen.insertBefore(storyPreviewMount, before ?? null);
        }
        storyPreviewMount.style.display = enabledRef.current ? "" : "none";
      }

      const storyTitleMount = document.querySelector<HTMLElement>("[data-story-title-mount]");
      if (storyTitleMount?.parentElement) {
        let control = storyTitleMount.parentElement.querySelector<HTMLElement>("[data-story-editor-toggle-mount]");
        if (!control) {
          control = document.createElement("div");
          control.dataset.storyEditorToggleMount = "true";
          storyTitleMount.insertAdjacentElement("afterend", control);
        }
        setEditorMount(control);
      }

      const id = await resolveInvitationId();
      if (!active || !id) return;
      setInvitationId(id);
      if (loadedIdRef.current !== id) {
        loadedIdRef.current = id;
        await loadState(id);
      }
    };

    void sync();
    const timer = window.setInterval(() => void sync(), 300);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [supabase]);

  const orderControl = mount ? createPortal(
    <div
      className="block-order-item"
      draggable
      data-story-order-control
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", "story");
      }}
    >
      <span className="block-drag-handle" aria-hidden="true">⋮⋮</span>
      <strong>La nostra storia</strong>
      <div className="block-order-actions">
        <button aria-label="Sposta La nostra storia in alto" disabled={position <= 0} type="button" onClick={() => void persistPosition(position - 1)}>↑</button>
        <button aria-label="Sposta La nostra storia in basso" disabled={position >= blockCount} type="button" onClick={() => void persistPosition(position + 1)}>↓</button>
      </div>
    </div>,
    mount
  ) : null;

  const activeControl = editorMount ? createPortal(
    <div className="nested-fields block-editor" style={{ marginTop: 14 }}>
      <div className="block-editor-head">
        <div>
          <span>{enabled ? "Visibile nel link" : "Nascosto dal link"}</span>
          <strong>La nostra storia</strong>
        </div>
        <label className="toggle-item compact">
          <input checked={enabled} type="checkbox" onChange={(event) => void persistEnabled(event.target.checked)} />
          <span>Attivo</span>
        </label>
      </div>
    </div>,
    editorMount
  ) : null;

  return <>{orderControl}{activeControl}</>;
}
