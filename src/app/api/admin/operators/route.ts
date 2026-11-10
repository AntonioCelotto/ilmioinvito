import { NextResponse } from "next/server";
import { operatorContext, noStore, validUuid } from "@/lib/operators/server";
import { operatorPackages, availableCredits, type OperatorGrant } from "@/lib/operators/types";
import { allowRequest } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ctx = await operatorContext(request, true);
  if (ctx.response) return ctx.response;
  const [accounts, grants, usages] = await Promise.all([
    ctx.db.from("operator_accounts").select("*").order("created_at", { ascending: false }),
    ctx.db.from("operator_credit_grants").select("*").order("created_at", { ascending: false }),
    ctx.db.from("operator_event_activations").select("invitation_id,operator_id,invitation_title,created_at").order("created_at", { ascending: false })
  ]);
  if (accounts.error || grants.error || usages.error) return NextResponse.json({ error: "Caricamento operatori non riuscito." }, { status: 500 });
  return NextResponse.json({ operators: accounts.data.map(account => ({
    account,
    grants: grants.data.filter(grant => grant.operator_id === account.user_id),
    usages: usages.data.filter(usage => usage.operator_id === account.user_id),
    available: availableCredits(grants.data.filter(grant => grant.operator_id === account.user_id) as OperatorGrant[])
  })) }, noStore);
}

export async function POST(request: Request) {
  const ctx = await operatorContext(request, true);
  if (ctx.response) return ctx.response;
  if (!allowRequest(`operator-admin:${ctx.user.id}`, 40, 10 * 60_000)) return NextResponse.json({ error: "Troppe richieste. Attendi qualche minuto." }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (!validUuid(body?.operatorId)) return NextResponse.json({ error: "Operatore non valido." }, { status: 400 });
  if (body.action === "status" && ["active", "suspended"].includes(body.status)) {
    const { data, error } = await ctx.db.from("operator_accounts").update({ status: body.status, reviewed_by: ctx.user.id, reviewed_at: new Date().toISOString() }).eq("user_id", body.operatorId).select("user_id").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Aggiornamento operatore non riuscito." }, { status: 409 });
    return NextResponse.json({ ok: true }, noStore);
  }
  const pack = operatorPackages.find(item => item.key === body.packageKey);
  if (body.action !== "grant" || !pack || !validUuid(body.requestId) || typeof body.note !== "string" || body.note.length > 500) {
    return NextResponse.json({ error: "Pacchetto o riferimento non valido." }, { status: 400 });
  }
  const { data: account } = await ctx.db.from("operator_accounts").select("status").eq("user_id", body.operatorId).maybeSingle();
  if (account?.status !== "active") return NextResponse.json({ error: "Abilita l’operatore prima di assegnare il pacchetto." }, { status: 409 });
  const expiresAt = new Date();
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
  const { error } = await ctx.db.from("operator_credit_grants").insert({
    id: body.requestId, operator_id: body.operatorId, event_count: pack.events,
    package_name: pack.name, amount_cents: pack.price * 100, note: body.note.trim(),
    granted_by: ctx.user.id, expires_at: expiresAt.toISOString()
  });
  if (error && error.code !== "23505") return NextResponse.json({ error: "Assegnazione crediti non riuscita." }, { status: 500 });
  return NextResponse.json({ ok: true }, noStore);
}
