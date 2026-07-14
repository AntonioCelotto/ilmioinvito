export type GuestStatus = "confirmed" | "declined" | "pending";

export type Guest = {
  id: string;
  name: string;
  status: GuestStatus;
  partySize: number;
  note?: string;
};

export type Invitation = {
  slug: string;
  title: string;
  subtitle: string;
  hostName: string;
  eventDate: string;
  eventDateIso: string;
  eventTime: string;
  venueName: string;
  venueAddress: string;
  whatsappNumber: string;
  story: string;
  dressCode: string;
};

export const demoInvitation: Invitation = {
  slug: "dora-lorenzo-demo",
  title: "Dora & Lorenzo",
  subtitle: "Una serata da ricordare, costruita come un invito digitale completo.",
  hostName: "Dora e Lorenzo",
  eventDate: "21 luglio 2026",
  eventDateIso: "2026-07-21T20:30:00+02:00",
  eventTime: "20:30",
  venueName: "Spiaggia Romana",
  venueAddress: "Via Spiaggia Romana, 31, 80070 Bacoli NA",
  whatsappNumber: "3336564297",
  story:
    "Un invito elegante, mobile-first, con racconto, countdown, location e risposta immediata. Questa demo diventa il modello riutilizzabile per tutti i clienti.",
  dressCode: "Elegante estivo"
};

export const demoGuests: Guest[] = [
  {
    id: "g1",
    name: "Maria Esposito",
    status: "confirmed",
    partySize: 2,
    note: "Arriva con accompagnatore"
  },
  {
    id: "g2",
    name: "Luca Romano",
    status: "pending",
    partySize: 1
  },
  {
    id: "g3",
    name: "Anna Russo",
    status: "declined",
    partySize: 0,
    note: "Fuori citta"
  },
  {
    id: "g4",
    name: "Paolo De Luca",
    status: "confirmed",
    partySize: 3,
    note: "Con famiglia"
  }
];
