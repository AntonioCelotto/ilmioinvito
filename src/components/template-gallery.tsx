"use client";

import { useMemo, useState } from "react";
import {
  invitationTemplates,
  selectedTemplateStorageKey,
  templateCategories,
  type InvitationTemplate,
  type TemplateCategory
} from "@/lib/template-catalog";

type CategoryFilter = TemplateCategory | "tutti";

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
        style={{
          backgroundColor: template.theme.primaryColor,
          backgroundImage: template.theme.backgroundImage
            ? `linear-gradient(rgba(255, 250, 242, 0.08), rgba(255, 250, 242, 0.18)), url("${template.theme.backgroundImage}")`
            : `linear-gradient(155deg, ${template.theme.accentColor}, ${template.theme.primaryColor} 58%)`,
          backgroundPosition: "center",
          backgroundSize: "cover"
        }}
      >
        <span>{template.occasionLabel}</span>
        <div>
          <p>{template.previewSubtitle}</p>
          <h2>{template.previewTitle}</h2>
          <small>Invito digitale</small>
        </div>
      </div>
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

export function TemplateGallery() {
  const [category, setCategory] = useState<CategoryFilter>("tutti");

  const templates = useMemo(
    () =>
      category === "tutti"
        ? invitationTemplates
        : invitationTemplates.filter((template) => template.category === category),
    [category]
  );

  function selectTemplate(template: InvitationTemplate) {
    window.localStorage.setItem(selectedTemplateStorageKey, template.id);
    window.location.href = "/builder";
  }

  return (
    <>
      <div className="template-filters" aria-label="Categorie template">
        {templateCategories.map((item) => (
          <button
            className={category === item.id ? "active" : ""}
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="template-grid">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} onSelect={selectTemplate} />
        ))}
      </div>
    </>
  );
}
