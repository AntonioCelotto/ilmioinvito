import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DashboardRsvp } from "@/lib/supabase/rsvps";

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function downloadGuestPdf(invitationTitle: string, guests: DashboardRsvp[]) {
  const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const generatedAt = new Intl.DateTimeFormat("it-IT", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date());

  document.setFont("helvetica", "bold");
  document.setFontSize(20);
  document.text("Lista invitati", 14, 17);
  document.setFont("helvetica", "normal");
  document.setFontSize(11);
  document.text(invitationTitle, 14, 24);
  document.setFontSize(9);
  document.setTextColor(90);
  document.text(`Generato il ${generatedAt} - Totale invitati: ${guests.length}`, 14, 30);

  autoTable(document, {
    startY: 36,
    head: [["N.", "Invitato", "Telefono gruppo", "Allergie e informazioni", "Confermato il"]],
    body: guests.map((guest, index) => [
      String(index + 1),
      guest.guestName,
      guest.contactPhone || "-",
      guest.additionalInfo || "Nessuna",
      new Intl.DateTimeFormat("it-IT", {
        dateStyle: "short",
        timeStyle: "short"
      }).format(new Date(guest.createdAt))
    ]),
    styles: {
      cellPadding: 3,
      font: "helvetica",
      fontSize: 9,
      overflow: "linebreak",
      valign: "top"
    },
    headStyles: {
      fillColor: [21, 19, 19],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    alternateRowStyles: { fillColor: [248, 245, 240] },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 50 },
      2: { cellWidth: 38 },
      3: { cellWidth: 120 },
      4: { cellWidth: 39 }
    },
    margin: { left: 14, right: 14 }
  });

  const pageCount = document.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page);
    document.setFontSize(8);
    document.setTextColor(120);
    document.text(
      `ilmioinvito.com - Pagina ${page} di ${pageCount}`,
      document.internal.pageSize.getWidth() - 14,
      document.internal.pageSize.getHeight() - 8,
      { align: "right" }
    );
  }

  document.save(`lista-invitati-${safeFilename(invitationTitle) || "evento"}.pdf`);
}
