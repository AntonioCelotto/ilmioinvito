"use client";

import { useMemo, useState } from "react";
import { uploadCustomTemplateImage } from "@/lib/supabase/drafts";
import {
  customTemplateStorageKey,
  invitationTemplates,
  selectedTemplateStorageKey,
  templateHasStyle,
  templateStyleFilters,
  type InvitationTemplate,
  type TemplateStyle
} from "@/lib/template-catalog";

type StyleFilter = TemplateStyle | "tutti";

const eighteenTemplateIds = new Set([
  "compleanno-diciotto-celeste",
  "compleanno-diciotto-rame",
  "compleanno-diciotto-rosa",
  "compleanno-casino-diciotto",
  "compleanno-diciotto-ghiaccio"
]);

function galleryOrder(template: InvitationTemplate) {
  return eighteenTemplateIds.has(template.id) ? 0 : 1;
}

function TemplateCard({
  template,
  onSelect
}: {
  template: InvitationTemplate;
  onSelect: (template: InvitationTemplate) => void;
}) {
  return (
    <article className={`template-card template-card-${template.theme.template}`}>
      <div
        className="template-card-preview"
        aria-label={`Anteprima del template ${template.name}`}
        style={{
          backgroundColor: template.theme.primaryColor,
          backgroundImage: template.theme.backgroundImage
            ? `url("${template.theme.backgroundImage}")`
            : `linear-gradient(155deg, ${template.theme.accentColor}, ${template.theme.primaryColor} 58%)`,
          backgroundPosition: "center",
          backgroundSize: "cover"
        }}
      />
      <div className="template-card-body">
        <div>
          <h3>{template.name}</h3>
          <p>{template.description}</p>
        </div>
        <button className="button" type="button" onClick={() => onSelect(template)}>
          Scegli questo template
        </button>
      </div>
    </article>
  );
}

function CustomTemplateUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  function handleFile(selectedFile?: File) {
    setMessage("");

    if (!selectedFile) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedFile.type)) {
      setMessage("Carica un'immagine JPG, PNG o WebP.");
      return;
    }

    if (selectedFile.size > 8 * 1024 * 1024) {
      setMessage("L'immagine non può superare 8 MB.");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result ?? ""));
    reader.readAsDataURL(selectedFile);
  }

  async function useCustomTemplate() {
    if (!file) {
      setMessage("Seleziona prima un'immagine.");
      return;
    }

    setUploading(true);
    setMessage("Caricamento della grafica in corso...");

    const result = await uploadCustomTemplateImage(file);

    if (result.status === "error") {
      setUploading(false);
      setMessage(result.message);
      return;
    }

    const customTemplate: InvitationTemplate = {
      id: "custom-upload",
      category: "evento-privato",
      name: "La tua grafica",
      description: "Template creato con l'immagine caricata da te.",
      occasionLabel: "Template personale",
      previewTitle: "Il tuo evento",
      previewSubtitle: "Personalizza testi, colori e contenuti",
      theme: {
        template: "classicLight",
        primaryColor: "#fffaf2",
        accentColor: "#b87333",
        fontStyle: "serif",
        backgroundImage: result.url
      }
    };

    window.localStorage.setItem(
      customTemplateStorageKey,
      JSON.stringify(customTemplate)
    );
    window.localStorage.setItem(selectedTemplateStorageKey, customTemplate.id);
    window.location.href = "/builder";
  }

  return (
    <section
      className="custom-template-upload"
      id="carica-template"
      aria-labelledby="custom-template-title"
    >
      <div className="custom-template-copy">
        <p className="eyebrow">Il tuo stile</p>
        <h2 id="custom-template-title">Carica la tua grafica</h2>
        <p>
          Usa un'immagine personale come sfondo del tuo invito. Per il risultato
          migliore scegli un formato verticale 9:16.
        </p>
        <label className="custom-template-file">
          <span>{file ? "Cambia immagine" : "Scegli un'immagine"}</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            type="file"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
        <small>JPG, PNG o WebP, massimo 8 MB.</small>
        {message ? (
          <p className="custom-template-message" aria-live="polite">
            {message}
          </p>
        ) : null}
        <button
          className="button"
          disabled={!file || uploading}
          type="button"
          onClick={useCustomTemplate}
        >
          {uploading ? "Caricamento..." : "Usa la mia grafica"}
        </button>
      </div>

      <div
        className={`custom-template-preview${previewUrl ? " has-image" : ""}`}
        style={previewUrl ? { backgroundImage: `url("${previewUrl}")` } : undefined}
        aria-label="Anteprima della grafica personale"
      >
        {previewUrl ? null : (
          <div>
            <span aria-hidden="true">＋</span>
            <strong>Anteprima immagine</strong>
          </div>
        )}
      </div>
    </section>
  );
}

export function TemplateGallery() {
  const [style, setStyle] = useState<StyleFilter>("tutti");

  const templates = useMemo(
    () => {
      const filtered = style === "tutti"
        ? invitationTemplates
        : invitationTemplates.filter((template) => templateHasStyle(template.id, style));

      return filtered
        .map((template, index) => ({ template, index }))
        .sort((a, b) => galleryOrder(a.template) - galleryOrder(b.template) || a.index - b.index)
        .map(({ template }) => template);
    },
    [style]
  );

  function selectTemplate(template: InvitationTemplate) {
    window.localStorage.setItem(selectedTemplateStorageKey, template.id);
    window.location.href = "/builder";
  }

  return (
    <>
      <div className="template-filters" aria-label="Stili template">
        {templateStyleFilters.map((item) => (
          <button
            className={style === item.id ? "active" : ""}
            key={item.id}
            type="button"
            onClick={() => setStyle(item.id)}
          >
            {item.label}
          </button>
        ))}
        <a className="template-upload-jump" href="#carica-template">
          Carica il tuo template
          <span aria-hidden="true">↓</span>
        </a>
      </div>

      <div className="template-grid">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} onSelect={selectTemplate} />
        ))}
      </div>

      <CustomTemplateUpload />
    </>
  );
}
