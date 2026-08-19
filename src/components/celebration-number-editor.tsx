"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { readDrafts, readEditingDraft, type InvitationDraft } from "@/lib/draft-storage";

type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;

function resolveCurrentDraft(): InvitationDraft | null {
  if (typeof window === "undefined") return null;
  const editingId = new URLSearchParams(window.location.search).get("edit");
  const editingDraft = readEditingDraft();
  if (editingId && editingDraft?.id === editingId) return editingDraft;
  const drafts = readDrafts();
  if (editingId) return drafts.find((draft) => draft.id === editingId) ?? null;
  const title = document.querySelector<HTMLInputElement>("#title")?.value.trim() ?? "";
  return title ? drafts.find((draft) => draft.title.trim() === title) ?? null : null;
}

function ensurePreviewBadge() {
  const hero = document.querySelector<HTMLElement>(".phone-hero-preview");
  if (!hero) return null;

  let badge = hero.querySelector<HTMLElement>("[data-celebration-number-preview]");
  if (!badge) {
    badge = document.createElement("div");
    badge.dataset.celebrationNumberPreview = "true";
    badge.style.position = "absolute";
    badge.style.left = "50%";
    badge.style.top = "7%";
    badge.style.transform = "translateX(-50%)";
    badge.style.zIndex = "6";
    badge.style.width = "88%";
    badge.style.textAlign = "center";
    badge.style.pointerEvents = "none";
    badge.style.fontFamily = "Georgia, 'Times New Roman', serif";
    badge.style.fontWeight = "700";
    badge.style.fontSize = "clamp(58px, 18vw, 108px)";
    badge.style.lineHeight = ".82";
    badge.style.letterSpacing = "-.05em";
    badge.style.color = "#d6ad60";
    badge.style.webkitTextStroke = "1px rgba(255,242,184,.45)";
    badge.style.textShadow = "0 2px 0 rgba(255,242,184,.75), 0 6px 16px rgba(0,0,0,.48)";
    hero.style.position = "relative";
    hero.appendChild(badge);
  }
  return badge;
}

function previewOverlay(number: string) {
  const badge = ensurePreviewBadge();
  if (!badge) return;
  if (!number) {
    badge.style.display = "none";
    badge.textContent = "";
    return;
  }
  badge.style.display = "block";
  badge.textContent = number;
}

export function CelebrationNumberEditor() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState<InvitationDraft | null>(null);
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const supabase = useMemo(() => createClient(), []);

  async function load(currentDraft: InvitationDraft | null, client: SupabaseClient) {
    if (!currentDraft) {
      setNumber("");
      previewOverlay("");
      return;
    }

    const { data } = await client
      .from("invitation_celebration_number")
      .select("celebration_number")
      .eq("invitation_id", currentDraft.id)
      .maybeSingle();

    const value = data?.celebration_number ?? "";
    setNumber(value);
    previewOverlay(value);
  }

  useEffect(() => {
    let lastId = "";

    const sync = () => {
      const eventDate = document.querySelector<HTMLInputElement>("#date");
      if (eventDate?.parentElement) {
        setTarget(eventDate.parentElement.parentElement ?? eventDate.parentElement);
      }

      const current = resolveCurrentDraft();
      setDraft(current);
      const id = current?.id ?? "";

      if (id !== lastId) {
        lastId = id;
        if (supabase) void load(current, supabase);
      }
    };

    sync();
    const timer = window.setInterval(sync, 500);
    window.addEventListener("focus", sync);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
    };
  }, [supabase]);

  useEffect(() => {
    previewOverlay(number);
  }, [number]);

  async function save(value: string) {
    const clean = value.replace(/[^0-9]/g, "").slice(0, 3);
    setNumber(clean);
    previewOverlay(clean);

    const client = supabase;
    if (!draft || !client) {
      setMessage("Salva prima la bozza dell'invito.");
      return;
    }

    const { data: invitation } = await client
      .from("invitations")
      .select("id")
      .eq("id", draft.id)
      .maybeSingle();

    if (!invitation) {
      setMessage("Salva prima la bozza dell'invito.");
      return;
    }

    const { error } = await client.from("invitation_celebration_number").upsert({
      invitation_id: draft.id,
      celebration_number: clean,
      updated_at: new Date().toISOString()
    });

    setMessage(error ? error.message : clean ? `Numero ${clean} salvato.` : "Numero rimosso.");
  }

  if (!target) return null;

  return createPortal(
    <div className="field" style={{ marginTop: 12 }}>
      <label htmlFor="celebration-number">Età / Numero compleanno</label>
      <input
        id="celebration-number"
        inputMode="numeric"
        maxLength={3}
        placeholder="Es. 18, 40, 50"
        value={number}
        onChange={(event) => {
          const value = event.target.value.replace(/[^0-9]/g, "").slice(0, 3);
          setNumber(value);
          setMessage("");
        }}
        onBlur={() => void save(number)}
      />
      <small>Opzionale. Il numero compare in grande sulla copertina dell'invito e si aggiorna subito nell'anteprima telefono.</small>
      {message ? <small style={{ display: "block", marginTop: 5 }}>{message}</small> : null}
    </div>,
    target
  );
}
