"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { readDrafts, readEditingDraft, type InvitationDraft } from "@/lib/draft-storage";

type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;
const DEFAULT_COLOR = "#d6ad60";
const COLOR_PRESETS = ["#d6ad60", "#ffffff", "#111111", "#c7c7c7", "#b76e79", "#7d2235", "#1f5f99", "#2f6b4f"];

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
    badge.style.top = "2.5%";
    badge.style.transform = "translateX(-50%)";
    badge.style.zIndex = "6";
    badge.style.width = "88%";
    badge.style.textAlign = "center";
    badge.style.pointerEvents = "none";
    badge.style.fontFamily = "Georgia, 'Times New Roman', serif";
    badge.style.fontWeight = "700";
    badge.style.fontSize = "clamp(54px, 17vw, 100px)";
    badge.style.lineHeight = ".82";
    badge.style.letterSpacing = "-.05em";
    badge.style.webkitTextStroke = "1px rgba(255,255,255,.28)";
    badge.style.textShadow = "0 2px 2px rgba(0,0,0,.22), 0 6px 16px rgba(0,0,0,.30)";
    hero.style.position = "relative";
    hero.appendChild(badge);
  }
  return badge;
}

function previewOverlay(number: string, color: string) {
  const badge = ensurePreviewBadge();
  if (!badge) return;
  badge.style.color = color || DEFAULT_COLOR;
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
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [message, setMessage] = useState("");
  const supabase = useMemo(() => createClient(), []);

  async function load(currentDraft: InvitationDraft | null, client: SupabaseClient) {
    if (!currentDraft) {
      setNumber("");
      setColor(DEFAULT_COLOR);
      previewOverlay("", DEFAULT_COLOR);
      return;
    }
    const { data } = await client
      .from("invitation_celebration_number")
      .select("celebration_number, celebration_color")
      .eq("invitation_id", currentDraft.id)
      .maybeSingle();
    const value = data?.celebration_number ?? "";
    const savedColor = data?.celebration_color ?? DEFAULT_COLOR;
    setNumber(value);
    setColor(savedColor);
    previewOverlay(value, savedColor);
  }

  useEffect(() => {
    let lastId = "";
    const sync = () => {
      const eventDate = document.querySelector<HTMLInputElement>("#date");
      if (eventDate?.parentElement) setTarget(eventDate.parentElement.parentElement ?? eventDate.parentElement);
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
    previewOverlay(number, color);
  }, [number, color]);

  async function save(nextNumber = number, nextColor = color) {
    const clean = nextNumber.replace(/[^0-9]/g, "").slice(0, 3);
    setNumber(clean);
    setColor(nextColor);
    previewOverlay(clean, nextColor);
    const client = supabase;
    if (!draft || !client) {
      setMessage("Salva prima la bozza dell'invito.");
      return;
    }
    const { data: invitation } = await client.from("invitations").select("id").eq("id", draft.id).maybeSingle();
    if (!invitation) {
      setMessage("Salva prima la bozza dell'invito.");
      return;
    }
    const { error } = await client.from("invitation_celebration_number").upsert({
      invitation_id: draft.id,
      celebration_number: clean,
      celebration_color: nextColor,
      updated_at: new Date().toISOString()
    });
    setMessage(error ? error.message : clean ? "Numero e colore salvati." : "Numero rimosso.");
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
          setNumber(event.target.value.replace(/[^0-9]/g, "").slice(0, 3));
          setMessage("");
        }}
        onBlur={() => void save()}
      />
      <div style={{ marginTop: 10 }}>
        <label style={{ display: "block", marginBottom: 7 }}>Colore del numero</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              title={preset}
              aria-label={`Colore ${preset}`}
              onClick={() => {
                setColor(preset);
                setMessage("");
                void save(number, preset);
              }}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: color === preset ? "3px solid #6f3f3f" : "1px solid #b9aaa0",
                background: preset,
                cursor: "pointer",
                boxShadow: preset === "#ffffff" ? "inset 0 0 0 1px #ddd" : "none"
              }}
            />
          ))}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
            <input
              type="color"
              value={color}
              onChange={(event) => {
                setColor(event.target.value);
                setMessage("");
              }}
              onBlur={() => void save(number, color)}
              style={{ width: 36, height: 32, padding: 0, cursor: "pointer" }}
            />
            <span>Personalizzato</span>
          </label>
        </div>
      </div>
      <small style={{ display: "block", marginTop: 8 }}>Opzionale. Il numero compare sulla copertina e puoi adattarne il colore alla grafica scelta.</small>
      {message ? <small style={{ display: "block", marginTop: 5 }}>{message}</small> : null}
    </div>,
    target
  );
}
