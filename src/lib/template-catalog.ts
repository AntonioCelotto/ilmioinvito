import type { InvitationTheme } from "@/lib/draft-storage";

export type TemplateCategory =
  | "matrimonio"
  | "compleanno"
  | "battesimo"
  | "comunione"
  | "laurea"
  | "evento-privato"
  | "evento-aziendale";

export type InvitationTemplate = {
  id: string;
  category: TemplateCategory;
  name: string;
  description: string;
  occasionLabel: string;
  previewTitle: string;
  previewSubtitle: string;
  theme: InvitationTheme;
};

export const selectedTemplateStorageKey = "ilmioinvito:selected-template";

export const templateCategories: Array<{
  id: TemplateCategory | "tutti";
  label: string;
}> = [
  { id: "tutti", label: "Tutti" },
  { id: "matrimonio", label: "Matrimonio" },
  { id: "compleanno", label: "Compleanno" },
  { id: "battesimo", label: "Battesimo" },
  { id: "comunione", label: "Comunione" },
  { id: "laurea", label: "Laurea" },
  { id: "evento-privato", label: "Evento privato" },
  { id: "evento-aziendale", label: "Evento aziendale" }
];

export const invitationTemplates: InvitationTemplate[] = [
  {
    id: "matrimonio-dark-luxury",
    category: "matrimonio",
    name: "Notte di rame",
    description: "Elegante, intenso e scenografico.",
    occasionLabel: "Matrimonio",
    previewTitle: "Dora & Lorenzo",
    previewSubtitle: "Il nostro giorno più bello",
    theme: {
      template: "darkLuxury",
      primaryColor: "#151313",
      accentColor: "#b87333",
      fontStyle: "serif"
    }
  },
  {
    id: "matrimonio-classico",
    category: "matrimonio",
    name: "Promessa",
    description: "Chiaro, romantico e senza tempo.",
    occasionLabel: "Matrimonio",
    previewTitle: "Giulia & Andrea",
    previewSubtitle: "Insieme, per sempre",
    theme: {
      template: "classicLight",
      primaryColor: "#fffaf2",
      accentColor: "#b89a62",
      fontStyle: "script",
      backgroundImage: "/templates/wedding-promessa-elegante-v1.webp"
    }
  },
  {
    id: "matrimonio-botanico",
    category: "matrimonio",
    name: "Giardino segreto",
    description: "Verde naturale e dettagli floreali.",
    occasionLabel: "Matrimonio",
    previewTitle: "Elena & Marco",
    previewSubtitle: "Fiorisce una nuova storia",
    theme: {
      template: "botanical",
      primaryColor: "#0b3a30",
      accentColor: "#d2b46c",
      fontStyle: "script",
      backgroundImage: "/templates/wedding-giardino-segreto-v1.webp"
    }
  },
  {
    id: "compleanno-pop",
    category: "compleanno",
    name: "Happy Party",
    description: "Vivace, moderno e pieno di energia.",
    occasionLabel: "Compleanno",
    previewTitle: "Dora compie 40",
    previewSubtitle: "Festeggiamo insieme",
    theme: {
      template: "minimal",
      primaryColor: "#7a245f",
      accentColor: "#ffbf4a",
      fontStyle: "modern"
    }
  },
  {
    id: "compleanno-elegante",
    category: "compleanno",
    name: "Golden Night",
    description: "Una festa importante, in stile luxury.",
    occasionLabel: "Compleanno",
    previewTitle: "Antonio 50",
    previewSubtitle: "Una notte da ricordare",
    theme: {
      template: "darkLuxury",
      primaryColor: "#19172a",
      accentColor: "#d9a441",
      fontStyle: "serif"
    }
  },
  {
    id: "battesimo-celeste",
    category: "battesimo",
    name: "Piccolo cielo",
    description: "Delicato, luminoso e dolcissimo.",
    occasionLabel: "Battesimo",
    previewTitle: "Il Battesimo di Lorenzo",
    previewSubtitle: "Un giorno pieno d'amore",
    theme: {
      template: "classicLight",
      primaryColor: "#eaf4f8",
      accentColor: "#74a9bd",
      fontStyle: "script"
    }
  },
  {
    id: "battesimo-botanico",
    category: "battesimo",
    name: "Dolce natura",
    description: "Toni salvia e atmosfera naturale.",
    occasionLabel: "Battesimo",
    previewTitle: "Benvenuta Sofia",
    previewSubtitle: "Celebriamo questo giorno speciale",
    theme: {
      template: "botanical",
      primaryColor: "#62796b",
      accentColor: "#e6d9bd",
      fontStyle: "serif"
    }
  },
  {
    id: "comunione-luce",
    category: "comunione",
    name: "Luce",
    description: "Essenziale, puro e raffinato.",
    occasionLabel: "Prima Comunione",
    previewTitle: "La Comunione di Emma",
    previewSubtitle: "Con gioia vi aspettiamo",
    theme: {
      template: "classicLight",
      primaryColor: "#fffaf0",
      accentColor: "#c5a663",
      fontStyle: "serif"
    }
  },
  {
    id: "laurea-classica",
    category: "laurea",
    name: "Traguardo",
    description: "Rosso laurea, carattere e prestigio.",
    occasionLabel: "Festa di laurea",
    previewTitle: "Finalmente Dottoressa",
    previewSubtitle: "Un grande traguardo da festeggiare",
    theme: {
      template: "darkLuxury",
      primaryColor: "#2a1015",
      accentColor: "#b42035",
      fontStyle: "serif"
    }
  },
  {
    id: "evento-privato-minimal",
    category: "evento-privato",
    name: "Private",
    description: "Contemporaneo, pulito e versatile.",
    occasionLabel: "Evento privato",
    previewTitle: "Save the date",
    previewSubtitle: "Un incontro riservato",
    theme: {
      template: "minimal",
      primaryColor: "#1d2935",
      accentColor: "#93b7be",
      fontStyle: "modern"
    }
  },
  {
    id: "evento-aziendale",
    category: "evento-aziendale",
    name: "Executive",
    description: "Professionale, autorevole e moderno.",
    occasionLabel: "Evento aziendale",
    previewTitle: "Annual Meeting",
    previewSubtitle: "Idee, persone, futuro",
    theme: {
      template: "minimal",
      primaryColor: "#111827",
      accentColor: "#3b82f6",
      fontStyle: "modern"
    }
  }
];

export function readSelectedTemplate() {
  if (typeof window === "undefined") {
    return invitationTemplates[0];
  }

  const selectedId = window.localStorage.getItem(selectedTemplateStorageKey);

  return (
    invitationTemplates.find((template) => template.id === selectedId) ??
    invitationTemplates[0]
  );
}
