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
export const customTemplateStorageKey = "ilmioinvito:custom-template";

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

export type TemplateStyle =
  | "minimal-moderni"
  | "eleganti-lusso"
  | "naturali-delicati"
  | "colorati-creativi"
  | "illustrati-tematici"
  | "professionali-corporate";

export const templateStyleFilters: Array<{
  id: TemplateStyle | "tutti";
  label: string;
}> = [
  { id: "tutti", label: "Tutti" },
  { id: "minimal-moderni", label: "Minimal & Moderni" },
  { id: "eleganti-lusso", label: "Eleganti & Lusso" },
  { id: "naturali-delicati", label: "Naturali & Delicati" },
  { id: "colorati-creativi", label: "Colorati & Creativi" },
  { id: "illustrati-tematici", label: "Illustrati & Tematici" },
  { id: "professionali-corporate", label: "Professionali & Corporate" }
];

const templateStyleAssignments: Record<string, TemplateStyle[]> = {
  "matrimonio-rosa-perla": ["eleganti-lusso", "naturali-delicati"],
  "matrimonio-classico": ["eleganti-lusso", "minimal-moderni"],
  "matrimonio-botanico": ["naturali-delicati", "illustrati-tematici"],
  "compleanno-diciotto-celeste": ["eleganti-lusso", "colorati-creativi"],
  "compleanno-diciotto-rame": ["eleganti-lusso"],
  "battesimo-promessa-fiori": ["naturali-delicati", "illustrati-tematici"],
  "battesimo-cascata-fiori": ["naturali-delicati", "illustrati-tematici"],
  "comunione-seta-bianca": ["eleganti-lusso", "minimal-moderni"],
  "laurea-festa-colori": ["colorati-creativi", "illustrati-tematici"],
  "evento-privato-oro-assoluto": ["eleganti-lusso"],
  "evento-aziendale-notte-zaffiro": ["eleganti-lusso", "professionali-corporate"],
  "matrimonio-limoni-amalfi": ["colorati-creativi", "illustrati-tematici"],
  "evento-armonia-astratta": ["minimal-moderni", "professionali-corporate"],
  "evento-geometria-noir": ["minimal-moderni", "professionali-corporate"],
  "compleanno-dolce-festa": ["colorati-creativi", "illustrati-tematici"],
  "battesimo-orsetto-miele": ["naturali-delicati", "illustrati-tematici"],
  "battesimo-piccolo-oceano": ["colorati-creativi", "illustrati-tematici"],
  "compleanno-carosello-incantato": ["eleganti-lusso", "illustrati-tematici"],
  "compleanno-piccoli-supereroi": ["colorati-creativi", "illustrati-tematici"],
  "battesimo-ninna-nanna": ["naturali-delicati", "illustrati-tematici"],
  "battesimo-safari-dolce": ["naturali-delicati", "illustrati-tematici"],
  "compleanno-dinosauri-gentili": ["naturali-delicati", "illustrati-tematici"],
  "battesimo-sogni-mongolfiera": ["naturali-delicati", "illustrati-tematici"],
  "evento-linee-argento": ["minimal-moderni", "professionali-corporate"],
  "evento-blu-elettrico": ["eleganti-lusso", "minimal-moderni"],
  "compleanno-piccolo-aviatore": ["naturali-delicati", "illustrati-tematici"],
  "compleanno-disco-crystal": ["eleganti-lusso", "colorati-creativi"],
  "evento-anni-settanta": ["colorati-creativi", "illustrati-tematici"],
  "evento-verde-contemporaneo": ["minimal-moderni", "professionali-corporate"],
  "evento-minimal-charcoal": ["minimal-moderni", "professionali-corporate"],
  "evento-corallo-notturno": ["eleganti-lusso", "colorati-creativi"],
  "compleanno-diciotto-rosa": ["eleganti-lusso", "naturali-delicati"],
  "compleanno-casino-diciotto": ["eleganti-lusso", "illustrati-tematici"],
  "compleanno-diciotto-ghiaccio": ["eleganti-lusso", "colorati-creativi"],
  "matrimonio-cielo-stellato": ["eleganti-lusso", "illustrati-tematici"],
  "matrimonio-maiolica-fiore": ["colorati-creativi", "illustrati-tematici"]
};

export function templateHasStyle(templateId: string, style: TemplateStyle) {
  return templateStyleAssignments[templateId]?.includes(style) ?? false;
}

export const invitationTemplates: InvitationTemplate[] = [
  {
    id: "matrimonio-rosa-perla",
    category: "matrimonio",
    name: "Rosa Perla",
    description: "Trasparenze rosa e dettagli luminosi per un invito raffinato.",
    occasionLabel: "Matrimonio",
    previewTitle: "Sofia & Lorenzo",
    previewSubtitle: "La nostra promessa d'amore",
    theme: {
      template: "classicLight",
      primaryColor: "#f9e8e2",
      accentColor: "#b97872",
      fontStyle: "script",
      backgroundImage: "/templates/rosa-perla.webp"
    }
  },
  {
    id: "matrimonio-classico",
    category: "matrimonio",
    name: "Promessa",
    description: "Chiaro, romantico e senza tempo.",
    occasionLabel: "Matrimonio",
    previewTitle: "Giulia & Marco",
    previewSubtitle: "Insieme, per sempre",
    theme: {
      template: "classicLight",
      primaryColor: "#fffaf2",
      accentColor: "#b89a62",
      fontStyle: "script",
      backgroundImage: "/templates/custom/promessa.webp"
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
      backgroundImage: "/templates/custom/giardino-segreto.webp"
    }
  },
  {
    id: "compleanno-diciotto-celeste",
    category: "compleanno",
    name: "Diciotto Celeste",
    description: "Marmo azzurro e oro per celebrare i diciotto anni.",
    occasionLabel: "Compleanno",
    previewTitle: "I miei 18 anni",
    previewSubtitle: "Festeggiamo insieme questo traguardo",
    theme: {
      template: "classicLight",
      primaryColor: "#eaf7fb",
      accentColor: "#5996b7",
      fontStyle: "serif",
      backgroundImage: "/templates/diciotto-celeste.webp"
    }
  },
  {
    id: "compleanno-diciotto-rame",
    category: "compleanno",
    name: "Diciotto di Rame",
    description: "Nero e rame per una festa elegante e scenografica.",
    occasionLabel: "Compleanno",
    previewTitle: "18 anni",
    previewSubtitle: "Una notte da ricordare",
    theme: {
      template: "darkLuxury",
      primaryColor: "#19172a",
      accentColor: "#c9896d",
      fontStyle: "serif",
      backgroundImage: "/templates/diciotto-rame.webp"
    }
  },
  {
    id: "battesimo-promessa-fiori",
    category: "battesimo",
    name: "Promessa di Fiori",
    description: "Una cornice floreale delicata e piena di colore.",
    occasionLabel: "Battesimo",
    previewTitle: "Il Battesimo di Lorenzo",
    previewSubtitle: "Un giorno pieno d'amore",
    theme: {
      template: "classicLight",
      primaryColor: "#fffdf8",
      accentColor: "#c77f8f",
      fontStyle: "script",
      backgroundImage: "/templates/promessa-fiori.webp"
    }
  },
  {
    id: "battesimo-cascata-fiori",
    category: "battesimo",
    name: "Cascata di Fiori",
    description: "Fiori azzurri e rosa per un invito dolce e luminoso.",
    occasionLabel: "Battesimo",
    previewTitle: "Benvenuta Sofia",
    previewSubtitle: "Celebriamo questo giorno speciale",
    theme: {
      template: "classicLight",
      primaryColor: "#f7fbff",
      accentColor: "#7d9fc5",
      fontStyle: "script",
      backgroundImage: "/templates/cascata-fiori.webp"
    }
  },
  {
    id: "comunione-seta-bianca",
    category: "comunione",
    name: "Seta Bianca",
    description: "Pura, luminosa e raffinata come una veste di seta.",
    occasionLabel: "Prima Comunione",
    previewTitle: "La Comunione di Emma",
    previewSubtitle: "Con gioia vi aspettiamo",
    theme: {
      template: "classicLight",
      primaryColor: "#fffaf0",
      accentColor: "#c5a663",
      fontStyle: "serif",
      backgroundImage: "/templates/seta-bianca.webp"
    }
  },
  {
    id: "laurea-festa-colori",
    category: "laurea",
    name: "Festa di Colori",
    description: "Acquerelli vivaci per celebrare un grande traguardo.",
    occasionLabel: "Festa di laurea",
    previewTitle: "Finalmente Dottoressa!",
    previewSubtitle: "Un grande traguardo da festeggiare",
    theme: {
      template: "classicLight",
      primaryColor: "#fff8e9",
      accentColor: "#d84c7a",
      fontStyle: "modern",
      backgroundImage: "/templates/festa-colori.webp"
    }
  },
  {
    id: "evento-privato-oro-assoluto",
    category: "evento-privato",
    name: "Oro Assoluto",
    description: "Nero profondo e oro per una serata esclusiva.",
    occasionLabel: "Evento privato",
    previewTitle: "Save the date",
    previewSubtitle: "Una serata esclusiva",
    theme: {
      template: "darkLuxury",
      primaryColor: "#111111",
      accentColor: "#d8a83e",
      fontStyle: "serif",
      backgroundImage: "/templates/oro-assoluto.webp"
    }
  },
  {
    id: "evento-aziendale-notte-zaffiro",
    category: "evento-aziendale",
    name: "Notte di Zaffiro",
    description: "Blu profondo e cristalli per eventi di grande impatto.",
    occasionLabel: "Evento aziendale",
    previewTitle: "Gala Night",
    previewSubtitle: "Un evento che lascia il segno",
    theme: {
      template: "minimal",
      primaryColor: "#061737",
      accentColor: "#7cb2ff",
      fontStyle: "modern",
      backgroundImage: "/templates/notte-zaffiro.webp"
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
    theme: { template: "classicLight", primaryColor: "#f2f0eb", accentColor: "#333333", fontStyle: "modern", backgroundImage: "/templates/custom/linee-argento.webp" }
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
    theme: { template: "classicLight", primaryColor: "#f2f0eb", accentColor: "#202020", fontStyle: "modern", backgroundImage: "/templates/custom/minimal-charcoal.webp" }
  },
  {
    id: "evento-corallo-notturno",
    category: "evento-privato",
    name: "Corallo notturno",
    description: "Nero elegante con forme corallo e dettagli rame.",
    occasionLabel: "Evento privato",
    previewTitle: "Save the date",
    previewSubtitle: "Una serata da ricordare",
    theme: { template: "darkLuxury", primaryColor: "#111111", accentColor: "#e95e66", fontStyle: "serif", backgroundImage: "/templates/custom/corallo-notturno.webp" }
  },
  {
    id: "compleanno-diciotto-rosa",
    category: "compleanno",
    name: "Diciotto Rosa",
    description: "Marmo rosa e oro per un compleanno romantico e luminoso.",
    occasionLabel: "Compleanno",
    previewTitle: "I miei 18 anni",
    previewSubtitle: "Una giornata tutta da vivere",
    theme: { template: "classicLight", primaryColor: "#fff1f2", accentColor: "#c78088", fontStyle: "serif", backgroundImage: "/templates/diciotto-rosa.webp" }
  },
  {
    id: "compleanno-casino-diciotto",
    category: "compleanno",
    name: "Casino 18",
    description: "Tavolo verde, fiches e oro per una festa dal carattere deciso.",
    occasionLabel: "Compleanno",
    previewTitle: "18 anni",
    previewSubtitle: "La fortuna è festeggiare insieme",
    theme: { template: "darkLuxury", primaryColor: "#09271f", accentColor: "#d5a53d", fontStyle: "serif", backgroundImage: "/templates/casino-diciotto.webp" }
  },
  {
    id: "compleanno-diciotto-ghiaccio",
    category: "compleanno",
    name: "Diciotto di Ghiaccio",
    description: "Cristalli e luce artica per un diciottesimo spettacolare.",
    occasionLabel: "Compleanno",
    previewTitle: "18 anni",
    previewSubtitle: "Brilliamo insieme",
    theme: { template: "classicLight", primaryColor: "#ddecff", accentColor: "#4b82c4", fontStyle: "serif", backgroundImage: "/templates/diciotto-ghiaccio.webp" }
  },
  {
    id: "matrimonio-cielo-stellato",
    category: "matrimonio",
    name: "Cielo Stellato",
    description: "Blu notte, luna e costellazioni per un amore infinito.",
    occasionLabel: "Matrimonio",
    previewTitle: "Anna & Matteo",
    previewSubtitle: "Scritto nelle stelle",
    theme: { template: "darkLuxury", primaryColor: "#071a35", accentColor: "#d7b76c", fontStyle: "script", backgroundImage: "/templates/cielo-stellato.webp" }
  },
  {
    id: "matrimonio-maiolica-fiore",
    category: "matrimonio",
    name: "Maiolica in Fiore",
    description: "Ortensie, limoni e maioliche nei colori del Mediterraneo.",
    occasionLabel: "Matrimonio",
    previewTitle: "Beatrice & Andrea",
    previewSubtitle: "Un amore mediterraneo",
    theme: { template: "classicLight", primaryColor: "#fffdf6", accentColor: "#2c65a3", fontStyle: "script", backgroundImage: "/templates/maiolica-fiore.webp" }
  }
];

export function readSelectedTemplate() {
  if (typeof window === "undefined") {
    return invitationTemplates[0];
  }

  const selectedId = window.localStorage.getItem(selectedTemplateStorageKey);

  if (selectedId === "custom-upload") {
    const storedCustomTemplate = window.localStorage.getItem(customTemplateStorageKey);

    if (storedCustomTemplate) {
      try {
        return JSON.parse(storedCustomTemplate) as InvitationTemplate;
      } catch {
        window.localStorage.removeItem(customTemplateStorageKey);
      }
    }
  }

  return (
    invitationTemplates.find((template) => template.id === selectedId) ??
    invitationTemplates[0]
  );
}
