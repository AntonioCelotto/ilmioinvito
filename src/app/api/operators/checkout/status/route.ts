import { NextResponse } from "next/server";
import { operatorContext, noStore } from "@/lib/operators/server";
import { retrieveOperatorSession, fulfillOperatorSession } from "@/lib/operators/stripe";
import { allowRequest } from "@/lib/rate-limit";
export async function POST(request: Request) {
  const ctx = await operatorContext(request);
  if (ctx.response) return ctx.response;
  if (!allowRequest(`operator-payment-status:${ctx.user.id}`, 30, 10 * 60_000)) return NextResponse.json({ error: "Attendi qualche minuto prima di verificare nuovamente." }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (typeof body?.sessionId !== "string") return NextResponse.json({ error: "Sessione non valida." }, { status: 400 });
  try {
    const session = await retrieveOperatorSession(body.sessionId);
    if (session.metadata?.operator_id !== ctx.user.id) return NextResponse.json({ error: "Pagamento non autorizzato." }, { status: 403 });
    return NextResponse.json(await fulfillOperatorSession(ctx.db, session), noStore);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Pagamento non verificabile." }, { status: 409 }); }
}
