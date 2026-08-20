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
  const [orderMount, setOrderMount] = useState<HTMLElement | null>(null);
  const [editorMount, setEditorMount] = useState<HTMLElement | null>(null);
  const [invitationId, setInvitationId] = useState("");
  const [position, setPosition] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [blockCount, setBlockCount] = useState(0);
  const draggingStory = useRef(false);

  async function resolveInvitationId() {
    if (!supabase) return "";
    const draft = resolveCurrentDraft();
    if (draft?.id) {
      const { data } = await supabase.from("invitations").select("id").eq("id", draft.id).maybeSingle();
      if (data?.id) return data.id as string;
    }
    const title = currentBuilderTitle();
    if (!title) return "";
    const { data } = await supabase
      .from("invitations")
      .select("id")
      .eq("title", title)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.id as string | undefined) ?? "";
  }

  async function loadState(id: string) {
    if (!supabase || !id) return;
    const [{ data: content }, { data: story }] = await Promise.all([
      supabase.from("invitation_content").select("story_position").eq("invitation_id", id).maybeSingle(),
      supabase.from("invitation_sections").select("enabled").eq("invitation_id", id).eq("type", "story").maybeSingle()
    ]);
    const stored = Number(content?.story_position ?? 0);
    setPosition(Number.isFinite(stored) ? Math.max(0, stored) : 0);
    setEnabled(story?.enabled ?? true);
  }

  function placeOrderMount(nextPosition: number) {
    const list = document.querySelector<HTMLElement>(".block-order-list");
    const target = list?.querySelector<HTMLElement>("[data-story-order-mount]");
    if (!list || !target) return;

    const nativeItems = Array.from(list.children).filter(
      (child) => !(child as HTMLElement).dataset.storyOrderMount
    ) as HTMLElement[];
    const safe = Math.max(0, Math.min(nextPosition, nativeItems.length));
    const before = nativeItems[safe] ?? null;
    list.insertBefore(target, before);
  }

  async function persistPosition(next: number) {
    const safe = Math.max(0, Math.min(blockCount, next));
    setPosition(safe);
    placeOrderMount(safe);
    if (!supabase || !invitationId) return;
    await Promise.all([
      supabase
        .from("invitation_content")
        .update({ story_position: safe, updated_at: new Date().toISOString() })
        .eq("invitation_id", invitationId),
      supabase
        .from("invitation_sections")
        .update({ sort_order: safe })
        .eq("invitation_id", invitationId)
        .eq("type", "story")
    ]);
  }

  async function persistEnabled(next: boolean) {
    setEnabled(next);
    const previewStory = document.querySelector<HTMLElement>('[data-preview-section="story"]');
    if (previewStory) previewStory.style.display = next ? "" : "none";
    if (!supabase || !invitationId) return;
    await supabase
      .from("invitation_sections")
      .update({ enabled: next })
      .eq("invitation_id", invitationId)
      .eq("type", "story");
  }

  useEffect(() => {
    let active = true;
    let lastId = "";

    const sync = async () => {
      const list = document.querySelector<HTMLElement>(".block-order-list");
      const panel = document.querySelector<HTMLElement>(".block-order-panel");
      if (!list || !panel) return;

      let target = list.querySelector<HTMLElement>("[data-story-order-mount]");
      if (!target) {
        target = document.createElement("div");
        target.dataset.storyOrderMount = "true";
      }

      const nativeItems = Array.from(list.children).filter(
        (child) => !(child as HTMLElement).dataset.storyOrderMount
      ) as HTMLElement[];
      setBlockCount(nativeItems.length);
      const safePosition = Math.max(0, Math.min(position, nativeItems.length));
      const before = nativeItems[safePosition] ?? null;
      if (target.parentElement !== list || target.nextElementSibling !== before) {
        list.insertBefore(target, before);
      }
      setOrderMount(target);

      let editorTarget = document.querySelector<HTMLElement>("[data-story-block-editor-mount]");
      if (!editorTarget) {
        editorTarget = document.createElement("div");
        editorTarget.dataset.storyBlockEditorMount = "true";
        panel.insertAdjacentElement("afterend", editorTarget);
      }
      setEditorMount(editorTarget);

      const previewStory = document.querySelector<HTMLElement>('[data-preview-section="story"]');
      if (previewStory) previewStory.style.display = enabled ? "" : "none";

      const id = await resolveInvitationId();
      if (!active || !id || id === lastId) return;
      lastId = id;
      setInvitationId(id);
      await loadState(id);
    };

    void sync();
    const timer = window.setInterval(() => void sync(), 400);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [supabase, position, enabled]);

  useEffect(() => {
    const list = document.querySelector<HTMLElement>(".block-order-list");
    if (!list) return;

    const prevent = (event: DragEvent) => {
      if (!draggingStory.current) return;
      event.preventDefault();
    };

    const drop = (event: DragEvent) => {
      if (!draggingStory.current) return;
      event.preventDefault();
      draggingStory.current = false;

      const item = (event.target as HTMLElement | null)?.closest<HTMLElement>(".block-order-item");
      if (!item) return;
      const wrapper = item.parentElement;
      if (!wrapper || wrapper.dataset.storyOrderMount === "true") return;

      const nativeWrappers = Array.from(list.children).filter(
        (child) => !(child as HTMLElement).dataset.storyOrderMount
      );
      const targetIndex = nativeWrappers.indexOf(wrapper);
      if (targetIndex >= 0) void persistPosition(targetIndex);
    };

    list.addEventListener("dragover", prevent);
    list.addEventListener("drop", drop);
    return () => {
      list.removeEventListener("dragover", prevent);
      list.removeEventListener("drop", drop);
    };
  }, [invitationId, blockCount]);

  const orderControl = orderMount
    ? createPortal(
        <div
          className="block-order-item"
          data-story-order-control
          draggable
          onDragEnd={() => {
            draggingStory.current = false;
          }}
          onDragStart={() => {
            draggingStory.current = true;
          }}
        >
          <span className="block-drag-handle" aria-hidden="true">⋮⋮</span>
          <strong>La nostra storia</strong>
          <div className="block-order-actions">
            <button
              aria-label="Sposta La nostra storia in alto"
              disabled={position <= 0}
              type="button"
              onClick={() => void persistPosition(position - 1)}
            >
              ↑
            </button>
            <button
              aria-label="Sposta La nostra storia in basso"
              disabled={position >= blockCount}
              type="button"
              onClick={() => void persistPosition(position + 1)}
            >
              ↓
            </button>
          </div>
        </div>,
        orderMount
      )
    : null;

  const blockEditor = editorMount
    ? createPortal(
        <div className="nested-fields block-editor">
          <div className="block-editor-head">
            <div>
              <span>{enabled ? "Visibile nel link" : "Nascosto dal link"}</span>
              <strong>La nostra storia</strong>
            </div>
            <label className="toggle-item compact">
              <input
                checked={enabled}
                type="checkbox"
                onChange={(event) => void persistEnabled(event.target.checked)}
              />
              <span>Attivo</span>
            </label>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            Titolo, racconto, fotografie e didascalie si modificano nella sezione “Personalizza la storia” qui sopra.
          </p>
        </div>,
        editorMount
      )
    : null;

  return <>{orderControl}{blockEditor}</>;
}
