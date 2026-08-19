"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import { readDrafts, readEditingDraft, type InvitationDraft } from "@/lib/draft-storage";

type StoryMedia = {
  id: string;
  invitation_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

const panelStyle: CSSProperties = {
  marginTop: "14px",
  padding: "18px",
  borderRadius: "18px",
  border: "1px solid rgba(63,41,42,.12)",
  background: "rgba(255,255,255,.72)"
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
  gap: "12px",
  marginTop: "14px"
};

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
  if (!title) return null;

  return drafts.find((draft) => draft.title.trim() === title) ?? null;
}

export function StoryEditor() {
  const [draft, setDraft] = useState<InvitationDraft | null>(null);
  const [storyTitle, setStoryTitle] = useState("La nostra storia");
  const [media, setMedia] = useState<StoryMedia[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const supabase = useMemo(() => createClient(), []);

  async function loadStory(currentDraft: InvitationDraft | null) {
    const client = supabase;
    if (!currentDraft || !client) {
      setMedia([]);
      return;
    }

    const { data: invitation } = await client
      .from("invitations")
      .select("id")
      .eq("id", currentDraft.id)
      .maybeSingle();

    if (!invitation) {
      setMedia([]);
      setMessage("Salva prima la bozza dell'invito. Dopo il salvataggio potrai aggiungere titolo e foto alla storia.");
      return;
    }

    const [{ data: content }, { data: rows, error }] = await Promise.all([
      client
        .from("invitation_content")
        .select("story_title")
        .eq("invitation_id", currentDraft.id)
        .maybeSingle(),
      client
        .from("invitation_story_media")
        .select("id, invitation_id, image_url, caption, sort_order")
        .eq("invitation_id", currentDraft.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setStoryTitle(content?.story_title || "La nostra storia");
    setMedia((rows ?? []) as StoryMedia[]);
    setMessage("");
  }

  useEffect(() => {
    let lastDraftId = "";

    const sync = () => {
      const storyTextarea = document.querySelector<HTMLTextAreaElement>("#story");
      const label = document.querySelector<HTMLLabelElement>('label[for="story"]');

      if (label) label.textContent = "La nostra storia / La mia storia";
      if (storyTextarea?.parentElement) setTarget(storyTextarea.parentElement);

      const current = resolveCurrentDraft();
      setDraft(current);
      const nextId = current?.id ?? "";
      if (nextId !== lastDraftId) {
        lastDraftId = nextId;
        void loadStory(current);
      }
    };

    sync();
    const timer = window.setInterval(sync, 800);
    window.addEventListener("focus", sync);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
    };
  }, []);

  async function saveTitle(value = storyTitle) {
    const client = supabase;
    if (!draft || !client) {
      setMessage("Prima premi Salva bozza nel builder.");
      return;
    }

    const cleanTitle = value.trim() || "La nostra storia";
    const { data: invitation } = await client
      .from("invitations")
      .select("id")
      .eq("id", draft.id)
      .maybeSingle();

    if (!invitation) {
      setMessage("Prima premi Salva bozza nel builder.");
      return;
    }

    const { error } = await client
      .from("invitation_content")
      .update({ story_title: cleanTitle, updated_at: new Date().toISOString() })
      .eq("invitation_id", draft.id);

    setStoryTitle(cleanTitle);
    setMessage(error ? error.message : "Titolo della storia salvato.");
  }

  async function uploadPhoto(file?: File) {
    const client = supabase;
    if (!file || !draft || !client) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Carica una foto JPG, PNG o WebP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage("La foto non può superare 8 MB.");
      return;
    }

    setUploading(true);
    setMessage("Caricamento foto della storia...");

    const { data: userData } = await client.auth.getUser();
    if (!userData.user) {
      setUploading(false);
      setMessage("Accedi prima di caricare le foto.");
      return;
    }

    const { data: invitation } = await client
      .from("invitations")
      .select("id")
      .eq("id", draft.id)
      .maybeSingle();

    if (!invitation) {
      setUploading(false);
      setMessage("Prima premi Salva bozza nel builder.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${userData.user.id}/${draft.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage
      .from("invitation-story-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setUploading(false);
      setMessage(uploadError.message);
      return;
    }

    const { data: publicUrl } = client.storage
      .from("invitation-story-images")
      .getPublicUrl(path);

    const { error: insertError } = await client
      .from("invitation_story_media")
      .insert({
        invitation_id: draft.id,
        image_url: publicUrl.publicUrl,
        caption: "",
        sort_order: media.length
      });

    setUploading(false);
    if (insertError) {
      setMessage(insertError.message);
      return;
    }

    setMessage("Foto aggiunta alla storia.");
    await loadStory(draft);
  }

  async function updateCaption(item: StoryMedia, caption: string) {
    const client = supabase;
    if (!client) return;

    setMedia((current) => current.map((row) => row.id === item.id ? { ...row, caption } : row));
    const { error } = await client
      .from("invitation_story_media")
      .update({ caption, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) setMessage(error.message);
  }

  async function removePhoto(item: StoryMedia) {
    const client = supabase;
    if (!client || !draft) return;

    const { error } = await client.from("invitation_story_media").delete().eq("id", item.id);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Foto rimossa dalla storia.");
    await loadStory(draft);
  }

  if (!target) return null;

  return createPortal(
    <section style={panelStyle} aria-labelledby="story-editor-title">
      <h3 id="story-editor-title" style={{ margin: "0 0 6px", fontSize: "18px" }}>Personalizza la storia</h3>
      <p className="muted" style={{ margin: "0 0 14px" }}>
        Scegli il titolo della sezione e aggiungi le fotografie che accompagneranno il racconto.
      </p>

      <div className="field">
        <label htmlFor="story-title-custom">Titolo della sezione</label>
        <input
          id="story-title-custom"
          value={storyTitle}
          onChange={(event) => setStoryTitle(event.target.value)}
          onBlur={() => void saveTitle()}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <button className="button light" type="button" onClick={() => void saveTitle("La nostra storia")}>La nostra storia</button>
          <button className="button light" type="button" onClick={() => void saveTitle("La mia storia")}>La mia storia</button>
          <button className="button light" type="button" onClick={() => void saveTitle()}>Salva titolo</button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Fotografie della storia</strong>
        <p className="muted" style={{ margin: "4px 0 10px" }}>JPG, PNG o WebP. Puoi aggiungere più immagini e una didascalia per ciascuna.</p>
        <label className="button light" style={{ cursor: uploading ? "wait" : "pointer" }}>
          {uploading ? "Caricamento..." : "+ Aggiungi foto"}
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            type="file"
            style={{ display: "none" }}
            onChange={(event) => {
              void uploadPhoto(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {media.length > 0 ? (
        <div style={gridStyle}>
          {media.map((item) => (
            <article key={item.id} style={{ border: "1px solid rgba(63,41,42,.12)", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
              <img src={item.image_url} alt={item.caption || "Foto della storia"} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }} />
              <div style={{ padding: 10 }}>
                <input
                  aria-label="Didascalia foto"
                  placeholder="Didascalia opzionale"
                  value={item.caption ?? ""}
                  onChange={(event) => void updateCaption(item, event.target.value)}
                />
                <button className="editor-remove-button" type="button" style={{ marginTop: 8 }} onClick={() => void removePhoto(item)}>Rimuovi foto</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!draft ? (
        <p className="muted" style={{ margin: "12px 0 0" }}>Premi prima “Salva bozza” per attivare titolo e caricamento foto.</p>
      ) : null}

      {message ? <p className="muted" style={{ margin: "12px 0 0" }}>{message}</p> : null}
    </section>,
    target
  );
}
