"use client";

import { useMemo, useState } from "react";
import { uploadCustomTemplateImage } from "@/lib/supabase/drafts";
import {
  customTemplateStorageKey,
  invitationTemplates,
  selectedTemplateStorageKey,
  templateHasStyle,
  type InvitationTemplate,
  type TemplateStyle
} from "@/lib/template-catalog";

const eighteenTemplateIds = new Set([
  "compleanno-diciotto-celeste",
  "compleanno-diciotto-rame",
  "compleanno-diciotto-rosa",
  "compleanno-casino-diciotto",
  "compleanno-diciotto-ghiaccio"
]);

const imageStyleGroups: Array<{
  id: TemplateStyle;
  label: string;
  description: string;
}> = [
  { id: "eleganti-lusso", label: "Eleganti & Lusso", description: "Atmosfere raffinate, dettagli preziosi e composizioni scenografiche." },
  { id: "naturali-delicati", label: "Naturali & Delicati", description: "Fiori, natura, tonalità morbide e ambientazioni romantiche." },
  { id: "minimal-moderni", label: "Minimal & Moderni", description: "Linee pulite, grafica contemporanea e stile essenziale." },
  { id: "colorati-creativi", label: "Colorati & Creativi", description: "Palette vivaci, feste e proposte dal carattere più giocoso." },
  { id: "illustrati-tematici", label: "Illustrati & Tematici", description: "Illustrazioni e soggetti pensati per occasioni e temi specifici." },
  { id: "professionali-corporate", label: "Professionali & Corporate", description: "Soluzioni sobrie e d'impatto per eventi aziendali e professionali." }
];

function TemplateCard({ template, onSelect }: { template: InvitationTemplate; onSelect: (template: InvitationTemplate) => void; }) {
  function tryPlayVideo(video: HTMLVideoElement) {
    video.muted = true;
    const playPromise = video.play();
    if (playPromise) playPromise.catch(() => {});
  }

  return (
    <article className={`template-card template-card-${template.theme.template}`}>
      <div
        className="template-card-preview"
        aria-label={`Anteprima del template ${template.name}`}
        style={{
          backgroundColor: template.theme.primaryColor,
          backgroundImage: template.theme.backgroundImage ? `url("${template.theme.backgroundImage}")` : `linear-gradient(155deg, ${template.theme.accentColor}, ${template.theme.primaryColor} 58%)`,
          backgroundPosition: "center",
          backgroundSize: "cover"
        }}
      >
        {template.theme.backgroundVideo ? (
          <video
            aria-label={`Anteprima video ${template.name}`}
            autoPlay
            className="template-preview-video"
            loop
            muted
            playsInline
            poster={template.theme.backgroundImage}
            preload="auto"
            src={template.theme.backgroundVideo}
            onCanPlay={(event) => tryPlayVideo(event.currentTarget)}
            onLoadedData={(event) => tryPlayVideo(event.currentTarget)}
            onClick={(event) => {
              const video = event.currentTarget;
              if (video.paused) tryPlayVideo(video);
              else video.pause();
            }}
          />
        ) : null}
      </div>
      <div className="template-card-body">
        <div>
          <h3 style={{ fontSize: "17px", lineHeight: 1.2 }}>{template.name}</h3>
          <p>{template.description}</p>
        </div>
        <button className="button" type="button" onClick={() => onSelect(template)}>
          Scegli questo template
        </button>
      </div>
    </article>
  );
}

function TemplateSection({ title, description, templates, onSelect }: { title: string; description?: string; templates: InvitationTemplate[]; onSelect: (template: InvitationTemplate) => void; }) {
  if (templates.length === 0) return null;

  return (
    <section style={{ marginBottom: "3.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ marginBottom: description ? ".35rem" : 0 }}>{title}</h2>
        {description ? <p style={{ margin: 0, maxWidth: "760px" }}>{description}</p> : null}
      </div>
      <div className="template-grid">
        {templates.map((template) => <TemplateCard key={template.id} template={template} onSelect={onSelect} />)}
      </div>
    </section>
  );
}

function CustomTemplateUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  function handleFile(selectedFile?: File) {
    setMessage("");
    if (!selectedFile) { setFile(null); setPreviewUrl(""); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedFile.type)) { setMessage("Carica un'immagine JPG, PNG o WebP."); return; }
    if (selectedFile.size > 8 * 1024 * 1024) { setMessage("L'immagine non può superare 8 MB."); return; }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result ?? ""));
    reader.readAsDataURL(selectedFile);
  }

  async function useCustomTemplate() {
    if (!file) { setMessage("Seleziona prima un'immagine."); return; }
    setUploading(true);
    setMessage("Caricamento della grafica in corso...");
    const result = await uploadCustomTemplateImage(file);
    if (result.status === "error") { setUploading(false); setMessage(result.message); return; }

    const customTemplate: InvitationTemplate = {
      id: "custom-upload", category: "evento-privato", name: "La tua grafica",
      description: "Template creato con l'immagine caricata da te.", occasionLabel: "Template personale",
      previewTitle: "Il tuo evento", previewSubtitle: "Personalizza testi, colori e contenuti",
      theme: { template: "classicLight", primaryColor: "#fffaf2", accentColor: "#b87333", fontStyle: "serif", backgroundImage: result.url }
    };
    window.localStorage.setItem(customTemplateStorageKey, JSON.stringify(customTemplate));
    window.localStorage.setItem(selectedTemplateStorageKey, customTemplate.id);
    window.location.href = "/builder";
  }

  return (
    <section className="custom-template-upload" id="carica-template" aria-labelledby="custom-template-title">
      <div className="custom-template-copy">
        <p className="eyebrow">Il tuo stile</p>
        <h2 id="custom-template-title">Carica la tua grafica</h2>
        <p>Usa un'immagine personale come sfondo del tuo invito. Per il risultato migliore scegli un formato verticale 9:16.</p>
        <label className="custom-template-file">
          <span>{file ? "Cambia immagine" : "Scegli un'immagine"}</span>
          <input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>
        <small>JPG, PNG o WebP, massimo 8 MB.</small>
        {message ? <p className="custom-template-message" aria-live="polite">{message}</p> : null}
        <button className="button" disabled={!file || uploading} type="button" onClick={useCustomTemplate}>
          {uploading ? "Caricamento..." : "Usa la mia grafica"}
        </button>
      </div>
      <div className={`custom-template-preview${previewUrl ? " has-image" : ""}`} style={previewUrl ? { backgroundImage: `url("${previewUrl}")` } : undefined} aria-label="Anteprima della grafica personale">
        {previewUrl ? null : <div><span aria-hidden="true">＋</span><strong>Anteprima immagine</strong></div>}
      </div>
    </section>
  );
}

export function TemplateGallery() {
  const { videoTemplates, imageGroups, ungroupedImages } = useMemo(() => {
    const availableTemplates = invitationTemplates.filter((template) => !eighteenTemplateIds.has(template.id));
    const videos = availableTemplates.filter((template) => Boolean(template.theme.backgroundVideo));
    const images = availableTemplates.filter((template) => !template.theme.backgroundVideo);
    const assigned = new Set<string>();
    const groups = imageStyleGroups.map((group) => {
      const groupedTemplates = images.filter((template) => {
        if (assigned.has(template.id) || !templateHasStyle(template.id, group.id)) return false;
        assigned.add(template.id);
        return true;
      });
      return { ...group, templates: groupedTemplates };
    });
    return { videoTemplates: videos, imageGroups: groups, ungroupedImages: images.filter((template) => !assigned.has(template.id)) };
  }, []);

  function selectTemplate(template: InvitationTemplate) {
    window.localStorage.setItem(selectedTemplateStorageKey, template.id);
    window.location.href = "/builder";
  }

  return (
    <>
      <div className="template-gallery-actions">
        <a className="template-upload-jump" href="#carica-template">Carica il tuo template<span aria-hidden="true">↓</span></a>
      </div>

      <TemplateSection
        title="Inviti video"
        description="Template animati: le anteprime partono automaticamente senza audio. Se il browser blocca l'avvio, basta toccare il video."
        templates={videoTemplates}
        onSelect={selectTemplate}
      />

      {imageGroups.map((group) => (
        <TemplateSection key={group.id} title={group.label} description={group.description} templates={group.templates} onSelect={selectTemplate} />
      ))}

      <TemplateSection title="Altri stili" description="Altre proposte grafiche disponibili nel catalogo." templates={ungroupedImages} onSelect={selectTemplate} />
      <CustomTemplateUpload />
    </>
  );
}
