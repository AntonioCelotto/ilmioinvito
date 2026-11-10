import { NextResponse } from "next/server";
import { operatorContext, noStore, validUuid } from "@/lib/operators/server";
import { allowRequest } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ctx = await operatorContext(request);
  if (ctx.response) return ctx.response;
  if (!allowRequest(`operator-publish:${ctx.user.id}`, 30, 10 * 60_000)) return NextResponse.json({ error: "Troppe richieste. Attendi qualche minuto." }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (!validUuid(body?.invitationId)) return NextResponse.json({ error: "Invito non valido." }, { status: 400 });
  const { data, error } = await ctx.db.rpc("publish_operator_invitation", { target_operator: ctx.user.id, target_invitation: body.invitationId });
  if (error) {
    const messages: Record<string, string> = {
      OPERATOR_NOT_ACTIVE: "Il tuo account operatore deve essere abilitato dall’amministratore.",
      INVITATION_NOT_OWNED: "Invito non trovato o non autorizzato.",
      NO_OPERATOR_CREDITS: "Non hai crediti disponibili. Contatta l’amministratore per un nuovo pacchetto."
    };
    return NextResponse.json({ error: messages[error.message] ?? "Pubblicazione non riuscita. Nessun credito è stato scalato." }, { status: 409 });
  }
  return NextResponse.json({ published: true, message: data.consumed ? "Invito Firma pubblicato: utilizzato 1 credito, senza pagamento aggiuntivo." : "Invito già attivato: pubblicazione confermata senza consumare altri crediti." }, noStore);
}
