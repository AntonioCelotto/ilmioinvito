"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { readDrafts, readEditingDraft, type InvitationDraft } from "@/lib/draft-storage";

type SupabaseClient = NonNullable<ReturnType<typeof createClient>>;
const DEFAULT_COLOR = "#d6ad60";
const COLOR_PRESETS = ["#d6ad60", "#ffffff", "#111111", "#c7c7c7", "#b76e79", "#7d2235", "#1f5f99", "#2f6b4f"];

function currentBuilderTitle() {
  if (typeof document === "undefined") return "";
  return document.querySelector<HTMLInputElement>("#title")?.value.trim() ?? "";
}

function resolveCurrentDraft(): InvitationDraft | null {
  if (typeof window === "undefined") return null;
  const editingId = new URLSearchParams(window.location.search).get("edit");
  const editingDraft = readEditingDraft();
  if (editingId && editingDraft?.id === editingId) return editingDraft;
  if (!editingId && editingDraft) {
    const title = currentBuilderTitle();
    if (!title || editingDraft.title.trim() === title) return editingDraft;
  }
  const drafts = readDrafts();
  if (editingId) return drafts.find((draft) => draft.id === editingId) ?? null;
  const title = currentBuilderTitle();
  return title ? drafts.find((draft) => draft.title.trim() === title) ?? null : null;
}

export function CelebrationNumberEditor() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [previewTarget, setPreviewTarget] = useState<HTMLElement | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [videoDataVisible, setVideoDataVisible] = useState(false);
  const [draft, setDraft] = useState<InvitationDraft | null>(null);
  const [number, setNumber] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [message, setMessage] = useState("");
  const supabase = useMemo(() => createClient(), []);

  async function findInvitationId(currentDraft: InvitationDraft | null, client: SupabaseClient) {
    if (currentDraft?.id) {
      const { data } = await client.from("invitations").select("id").eq("id", currentDraft.id).maybeSingle();
      if (data?.id) return data.id as string;
    }
    const title = currentBuilderTitle();
    if (!title) return null;
    const { data } = await client.from("invitations").select("id").eq("title", title).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    return (data?.id as string | undefined) ?? null;
  }

  async function load(currentDraft: InvitationDraft | null, client: SupabaseClient) {
    const invitationId = await findInvitationId(currentDraft, client);
    if (!invitationId) return;
    const { data } = await client.from("invitation_celebration_number").select("celebration_number, celebration_color").eq("invitation_id", invitationId).maybeSingle();
    setNumber(data?.celebration_number ?? "");
    setColor(data?.celebration_color ?? DEFAULT_COLOR);
  }

  useEffect(() => {
    let lastId = "";
    const sync = () => {
      const eventDate = document.querySelector<HTMLInputElement>("#date");
      if (eventDate?.parentElement) setTarget(eventDate.parentElement.parentElement ?? eventDate.parentElement);
      const hero = document.querySelector<HTMLElement>(".phone-hero-preview");
      if (hero) {
        hero.style.position = "relative";
        setPreviewTarget(hero);
        const video = Boolean(hero.querySelector("video"));
        setHasVideo(video);
        setVideoDataVisible(Boolean(hero.querySelector(".phone-video-data")));
      }
      const current = resolveCurrentDraft();
      setDraft(current);
      const id = current?.id ?? currentBuilderTitle();
      if (id !== lastId) {
        lastId = id;
        if (supabase) void load(current, supabase);
      }
    };
    sync();
    const timer = window.setInterval(sync, 250);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
    };
  }, [supabase]);

  async function save(nextNumber = number, nextColor = color) {
    const clean = nextNumber.replace(/[^0-9]/g, "").slice(0, 3);
    setNumber(clean);
    setColor(nextColor);
    const client = supabase;
    if (!client) { setMessage("Servizio di salvataggio non disponibile."); return; }
    const invitationId = await findInvitationId(draft, client);
    if (!invitationId) { setMessage("Salva prima la bozza dell'invito."); return; }
    const { error } = await client.from("invitation_celebration_number").upsert({ invitation_id: invitationId, celebration_number: clean, celebration_color: nextColor, updated_at: new Date().toISOString() });
    setMessage(error ? error.message : clean ? "Numero e colore salvati." : "Numero rimosso.");
  }

  if (!target) return null;

  const editor = createPortal(
    <div className="field" style={{ marginTop: 12 }}>
      <label htmlFor="celebration-number">Età / Numero compleanno</label>
      <input id="celebration-number" inputMode="numeric" maxLength={3} placeholder="Es. 18, 40, 50" value={number} onChange={(event) => { setNumber(event.target.value.replace(/[^0-9]/g, "").slice(0, 3)); setMessage(""); }} onBlur={() => void save()} />
      <div style={{ marginTop: 10 }}>
        <label style={{ display: "block", marginBottom: 7 }}>Colore del numero</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {COLOR_PRESETS.map((preset) => (
            <button key={preset} type="button" title={preset} aria-label={`Colore ${preset}`} onClick={() => { setColor(preset); setMessage(""); void save(number, preset); }} style={{ width: 30, height: 30, borderRadius: "50%", border: color === preset ? "3px solid #6f3f3f" : "1px solid #b9aaa0", background: preset, cursor: "pointer", boxShadow: preset === "#ffffff" ? "inset 0 0 0 1px #ddd" : "none" }} />
          ))}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
            <input type="color" value={color} onChange={(event) => { setColor(event.target.value); setMessage(""); }} onBlur={() => void save(number, color)} style={{ width: 36, height: 32, padding: 0, cursor: "pointer" }} />
            <span>Personalizzato</span>
          </label>
        </div>
      </div>
      <small style={{ display: "block", marginTop: 8 }}>Opzionale. Il numero compare sulla copertina e puoi adattarne il colore alla grafica scelta.</small>
      {message ? <small style={{ display: "block", marginTop: 5 }}>{message}</small> : null}
    </div>, target
  );

  const showPreviewNumber = number && (!hasVideo || videoDataVisible);
  const preview = previewTarget && showPreviewNumber ? createPortal(
    <div data-celebration-number-preview="true" style={{ position: "absolute", left: "50%", top: hasVideo ? "10%" : "calc(-3% + 12px)", transform: "translateX(-50%)", zIndex: 20, width: "88%", textAlign: "center", pointerEvents: "none", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: "clamp(54px, 17vw, 100px)", lineHeight: ".82", letterSpacing: "-.05em", color, WebkitTextStroke: "1px rgba(255,255,255,.28)", textShadow: "0 2px 2px rgba(0,0,0,.22), 0 6px 16px rgba(0,0,0,.30)" }}>
      {number}
    </div>, previewTarget
  ) : null;

  return <>{editor}{preview}</>;
}
