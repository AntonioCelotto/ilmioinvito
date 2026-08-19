"use client";

import { useEffect, useMemo, useState } from "react";
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
  marginTop: "28px",
  padding: "24px",
  borderRadius: "24px",
  border: "1px solid rgba(63,41,42,.12)",
  background: "rgba(255,255,255,.9)",
  boxShadow: "0 12px 40px rgba(63,41,42,.06)"
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: "14px",
  marginTop: "16px"
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
  const supabase = useMemo(() => createClient(), []);

  async function loadStory(currentDraft: InvitationDraft | null) {
    if (!currentDraft || !supabase) {
      setMedia([]);
      return;
    }

    const { data: invitation } = await supabase
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
      supabase
        .from("invitation_content")
        .select("story_title")
        .eq("invitation_id", currentDraft.id)
        .maybeSingle(),
      supabase
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
    const label = document.querySelector<HTMLLabelElement>('label[for="story"]');
    if (label) label.textContent = "La nostra storia / La mia storia";

    let lastDraftId = "";
    const sync = () => {
      const current = resolveCurrentDraft();
      setDraft(current);
      const nextId = current?.id ?? "";
      if (nextId !== lastDraftId) {
        lastDraftId = nextId;
        void loadStory(current);
      }
    };

    sync();
    const timer = window.setInterval(sync, 1000);
    window.addEventListener("focus", sync);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
    };
  }, []);

  async function saveTitle(value = storyTitle) {
    if (!draft || !supabase) {
      setMessage("Prima premi Salva bozza nel builder.");
      return;
    }

    const cleanTitle = value.trim() || "La nostra storia";
    const { data: invitation } = await supabase
      .from("invitations")
      .select("id")
      .eq("id", draft.id)
      .maybeSingle();

    if (!invitation) {
      setMessage("Prima premi Salva bozza nel builder.");
      return;
    }

    const { error } = await supabase
      .from("invitation_content")
      .update({ story_title: cleanTitle, updated_at: new Date().toISOString() })
      .eq("invitation_id", draft.id);

    setStoryTitle(cleanTitle);
    setMessage(error ? error.message : "Titolo della storia salvato.");
  }

  async function uploadPhoto(file?: File) {
    if (!file || !draft || !supabase) return;

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

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setUploading(false);
      setMessage("Accedi prima di caricare le foto.");
      return;
    }

    const { data: invitation } = await supabase
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
    const { error: uploadError } = await supabase.storage
      .from("invitation-story-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setUploading(false);
      setMessage(uploadError.message);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("invitation-story-images")
      .getPublicUrl(path);

    const { error: insertError } = await supabase
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
    if (!supabase) return;
    setMedia((current) => current.map((row) => row.id === item.id ? { ...row, caption } : row));
    const { error } = await supabase
      .from("invitation_story_media")
      .update({ caption, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) setMessage(error.message);
  }

  async function removePhoto(item: StoryMedia) {
    if (!supabase || !draft) return;
    const { error } = await supabase.from("invitation_story_media").delete().eq("id", item.id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Foto rimossa dalla storia.");
    await loadStory(draft);
  }

  return (
    <section style={panelStyle} aria-labelledby="story-editor-title">
      <p className="eyebrow">Sezione personale</p>
      <h3 id="story-editor-title" style={{ marginTop: 4 }}>La nostra storia / La mia storia</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        Scrivi il racconto nel campo “La nostra storia / La mia storia” sopra. Salva la bozza, poi aggiungi qui il titolo e le fotografie.
      </p>

      {!draft ? (
        <p className="muted">Dopo il primo salvataggio della bozza compariranno qui i controlli della storia.</p>
      ) : (
        <>
          <div className="field" style={{ marginTop: 18 }}>
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

          <div style={{ marginTop: 20 }}>
            <strong>Fotografie della storia</strong>
            <p className="muted" style={{ marginTop: 4 }}>Aggiungi più foto e, se vuoi, una breve didascalia per ciascuna.</p>
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
                <article key={item.id} style={{ border: "1px solid rgba(63,41,42,.12)", borderRadius: 18, overflow: "hidden", background: "#fff" }}>
                  <img src={item.image_url} alt={item.caption || "Foto della storia"} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }} />
                  <div style={{ padding: 12 }}>
                    <input
                      aria-label="Didascalia foto"
                      placeholder="Didascalia opzionale"
                      value={item.caption ?? ""}
                      onChange={(event) => void updateCaption(item, event.target.value)}
                    />
                    <button className="editor-remove-button" type="button" style={{ marginTop: 10 }} onClick={() => void removePhoto(item)}>Rimuovi foto</button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </>
      )}

      {message ? <p className="muted" style={{ marginBottom: 0, marginTop: 14 }}>{message}</p> : null}
    </section>
  );
}
