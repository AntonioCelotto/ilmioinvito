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
  },
  {
    id: "matrimonio-limoni-amalfi",
    category: "matrimonio",
    name: "Limoni di Amalfi",
    description: "Maioliche, limoni e fiori mediterranei.",
    occasionLabel: "Matrimonio",
    previewTitle: "Chiara & Luca",
    previewSubtitle: "Un amore dal profumo mediterraneo",
    theme: { template: "classicLight", primaryColor: "#fffdf7", accentColor: "#315f9e", fontStyle: "script", backgroundImage: "/templates/limoni-di-amalfi.webp" }
  },
  {
    id: "evento-armonia-astratta",
    category: "evento-aziendale",
    name: "Armonia astratta",
    description: "Curve morbide e minimalismo contemporaneo.",
    occasionLabel: "Evento aziendale",
    previewTitle: "Design Meeting",
    previewSubtitle: "Idee che prendono forma",
    theme: { template: "classicLight", primaryColor: "#f6f2ed", accentColor: "#202020", fontStyle: "modern", backgroundImage: "/templates/armonia-astratta.webp" }
  },
  {
    id: "evento-geometria-noir",
    category: "evento-aziendale",
    name: "Geometria Noir",
    description: "Linee rigorose per eventi moderni e professionali.",
    occasionLabel: "Evento aziendale",
    previewTitle: "Vision 2027",
    previewSubtitle: "Connessioni, persone, futuro",
    theme: { template: "classicLight", primaryColor: "#f8f5ef", accentColor: "#171717", fontStyle: "modern", backgroundImage: "/templates/geometria-noir.webp" }
  },
  {
    id: "compleanno-dolce-festa",
    category: "compleanno",
    name: "Dolce festa",
    description: "Caramelle e colori pastello per una festa dolcissima.",
    occasionLabel: "Compleanno",
    previewTitle: "La festa di Sofia",
    previewSubtitle: "Una giornata piena di dolcezza",
    theme: { template: "classicLight", primaryColor: "#fff8f3", accentColor: "#d9819d", fontStyle: "script", backgroundImage: "/templates/dolce-festa.webp" }
  },
  {
    id: "battesimo-orsetto-miele",
    category: "battesimo",
    name: "Orsetto Miele",
    description: "Un tenero orsetto tra api, miele e natura.",
    occasionLabel: "Battesimo",
    previewTitle: "Il Battesimo di Tommaso",
    previewSubtitle: "Un giorno dolce da condividere",
    theme: { template: "classicLight", primaryColor: "#fffaf0", accentColor: "#c68a24", fontStyle: "script", backgroundImage: "/templates/orsetto-miele.webp" }
  },
  {
    id: "battesimo-piccolo-oceano",
    category: "battesimo",
    name: "Piccolo Oceano",
    description: "Pesci, conchiglie e colori marini delicati.",
    occasionLabel: "Battesimo",
    previewTitle: "Il Battesimo di Edoardo",
    previewSubtitle: "Un mare di gioia",
    theme: { template: "classicLight", primaryColor: "#effbff", accentColor: "#4aa8c5", fontStyle: "script", backgroundImage: "/templates/piccolo-oceano.webp" }
  },
  {
    id: "compleanno-carosello-incantato",
    category: "compleanno",
    name: "Carosello incantato",
    description: "Atmosfera fiabesca con cavallino e luci soffuse.",
    occasionLabel: "Compleanno",
    previewTitle: "Il primo anno di Emma",
    previewSubtitle: "Entra nella nostra piccola favola",
    theme: { template: "classicLight", primaryColor: "#fffaf3", accentColor: "#c9a46b", fontStyle: "script", backgroundImage: "/templates/carosello-incantato.webp" }
  },
  {
    id: "compleanno-piccoli-supereroi",
    category: "compleanno",
    name: "Piccoli Supereroi",
    description: "Energia, colore e avventure per una festa speciale.",
    occasionLabel: "Compleanno",
    previewTitle: "Matteo compie 7 anni",
    previewSubtitle: "Super amici, vi aspettiamo!",
    theme: { template: "classicLight", primaryColor: "#fff9e8", accentColor: "#398fa2", fontStyle: "modern", backgroundImage: "/templates/piccoli-supereroi.webp" }
  },
  {
    id: "battesimo-ninna-nanna",
    category: "battesimo",
    name: "Ninna Nanna",
    description: "Orsetto, luna e nuvole in tonalità celesti.",
    occasionLabel: "Battesimo",
    previewTitle: "Benvenuto Leonardo",
    previewSubtitle: "Una nuova stella è arrivata",
    theme: { template: "classicLight", primaryColor: "#fffdf8", accentColor: "#83aabe", fontStyle: "script", backgroundImage: "/templates/ninna-nanna.webp" }
  },
  {
    id: "battesimo-safari-dolce",
    category: "battesimo",
    name: "Safari dolce",
    description: "Piccoli animali della savana in stile acquerello.",
    occasionLabel: "Battesimo",
    previewTitle: "Il Battesimo di Gabriele",
    previewSubtitle: "Inizia una meravigliosa avventura",
    theme: { template: "classicLight", primaryColor: "#fffaf0", accentColor: "#a87b45", fontStyle: "script", backgroundImage: "/templates/safari-dolce.webp" }
  },
  {
    id: "compleanno-dinosauri-gentili",
    category: "compleanno",
    name: "Dinosauri gentili",
    description: "Un mondo preistorico tenero e naturale.",
    occasionLabel: "Compleanno",
    previewTitle: "Riccardo compie 5 anni",
    previewSubtitle: "Una festa gigantesca!",
    theme: { template: "classicLight", primaryColor: "#fffaf0", accentColor: "#668c70", fontStyle: "modern", backgroundImage: "/templates/dinosauri-gentili.webp" }
  },
  {
    id: "battesimo-sogni-mongolfiera",
    category: "battesimo",
    name: "Sogni in mongolfiera",
    description: "Nuvole e mongolfiere nei toni rosa e celeste.",
    occasionLabel: "Battesimo",
    previewTitle: "Il Battesimo di Alice",
    previewSubtitle: "In volo verso un giorno speciale",
    theme: { template: "classicLight", primaryColor: "#fffaf7", accentColor: "#9ab7c7", fontStyle: "script", backgroundImage: "/templates/sogni-in-mongolfiera.webp" }
  },
  {
    id: "evento-linee-argento",
    category: "evento-aziendale",
    name: "Linee d'argento",
    description: "Design sobrio, materico e istituzionale.",
    occasionLabel: "Evento aziendale",
    previewTitle: "Executive Dinner",
    previewSubtitle: "Una serata dedicata alle relazioni",
    theme: { template: "classicLight", primaryColor: "#f2f0eb", accentColor: "#333333", fontStyle: "modern", backgroundImage: "/templates/linee-dargento.webp" }
  },
  {
    id: "evento-blu-elettrico",
    category: "evento-privato",
    name: "Blu elettrico",
    description: "Nero profondo, metallo e riflessi blu.",
    occasionLabel: "Evento privato",
    previewTitle: "Blue Night",
    previewSubtitle: "Una notte fuori dall'ordinario",
    theme: { template: "darkLuxury", primaryColor: "#05070c", accentColor: "#1767ff", fontStyle: "modern", backgroundImage: "/templates/blu-elettrico.webp" }
  },
  {
    id: "compleanno-piccolo-aviatore",
    category: "compleanno",
    name: "Piccolo Aviatore",
    description: "Un orsetto pilota tra nuvole e sogni.",
    occasionLabel: "Compleanno",
    previewTitle: "Nicolò compie 3 anni",
    previewSubtitle: "Pronti al decollo?",
    theme: { template: "classicLight", primaryColor: "#fffaf0", accentColor: "#6989a0", fontStyle: "script", backgroundImage: "/templates/piccolo-aviatore.webp" }
  },
  {
    id: "compleanno-disco-crystal",
    category: "compleanno",
    name: "Disco Crystal",
    description: "Luci viola, cristalli e atmosfera da dance floor.",
    occasionLabel: "Compleanno",
    previewTitle: "Dora 40",
    previewSubtitle: "Dance all night",
    theme: { template: "darkLuxury", primaryColor: "#12051d", accentColor: "#db38ff", fontStyle: "modern", backgroundImage: "/templates/disco-crystal.webp" }
  },
  {
    id: "evento-anni-settanta",
    category: "evento-privato",
    name: "Anni Settanta",
    description: "Geometrie rétro e colori pieni di personalità.",
    occasionLabel: "Evento privato",
    previewTitle: "Retro Party",
    previewSubtitle: "Back to the seventies",
    theme: { template: "classicLight", primaryColor: "#fff4d7", accentColor: "#e46822", fontStyle: "modern", backgroundImage: "/templates/anni-settanta.webp" }
  },
  {
    id: "evento-verde-contemporaneo",
    category: "evento-aziendale",
    name: "Verde contemporaneo",
    description: "Geometrie lime, nero e accenti metallici.",
    occasionLabel: "Evento aziendale",
    previewTitle: "Green Vision",
    previewSubtitle: "Innovazione e sostenibilità",
    theme: { template: "classicLight", primaryColor: "#f4f1e9", accentColor: "#92b800", fontStyle: "modern", backgroundImage: "/templates/verde-contemporaneo.webp" }
  },
  {
    id: "evento-minimal-charcoal",
    category: "evento-aziendale",
    name: "Minimal Charcoal",
    description: "Nero, avorio e linee architettoniche raffinate.",
    occasionLabel: "Evento aziendale",
    previewTitle: "Private Preview",
    previewSubtitle: "Un appuntamento esclusivo",
    theme: { template: "classicLight", primaryColor: "#f2f0eb", accentColor: "#202020", fontStyle: "modern", backgroundImage: "/templates/minimal-charcoal.webp" }
  },
  {
    id: "evento-corallo-notturno",
    category: "evento-privato",
    name: "Corallo notturno",
    description: "Nero elegante con forme corallo e dettagli rame.",
    occasionLabel: "Evento privato",
    previewTitle: "Save the date",
    previewSubtitle: "Una serata da ricordare",
    theme: { template: "darkLuxury", primaryColor: "#111111", accentColor: "#e95e66", fontStyle: "serif", backgroundImage: "/templates/corallo-notturno.webp" }
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
