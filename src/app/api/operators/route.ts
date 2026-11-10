import { NextResponse } from "next/server";
import { operatorContext, noStore } from "@/lib/operators/server";
import { availableCredits, type OperatorGrant } from "@/lib/operators/types";
import { allowRequest } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ctx = await operatorContext(request);
  if (ctx.response) return ctx.response;
  const { db, user } = ctx;
  const [account, grants, usages] = await Promise.all([
    db.from("operator_accounts").select("*").eq("user_id", user.id).maybeSingle(),
    db.from("operator_credit_grants").select("*").eq("operator_id", user.id).order("expires_at"),
    db.from("operator_event_activations").select("invitation_id,operator_id,invitation_title,created_at").eq("operator_id", user.id).order("created_at", { ascending: false })
  ]);
  if (account.error || grants.error || usages.error) return NextResponse.json({ error: "Impossibile caricare l’area operatori. Riprova." }, { status: 500 });
  return NextResponse.json({ account: account.data, grants: grants.data, usages: usages.data, available: availableCredits(grants.data as OperatorGrant[]) }, noStore);
}

export async function POST(request: Request) {
  const ctx = await operatorContext(request);
  if (ctx.response) return ctx.response;
  const { db, user } = ctx;
  if (!allowRequest(`operator-request:${user.id}`, 5, 10 * 60_000)) return NextResponse.json({ error: "Troppe richieste. Attendi qualche minuto." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const fields = ["full_name", "company_name", "phone", "vat_number", "billing_address"] as const;
  if (!body || fields.some((key) => typeof body[key] !== "string" || !body[key].trim() || body[key].length > 500) || body.accepted !== true) {
    return NextResponse.json({ error: "Compila tutti i dati e accetta le condizioni dell’area operatori." }, { status: 400 });
  }
  const { data: existing, error: lookupError } = await db.from("operator_accounts").select("user_id").eq("user_id", user.id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Verifica account non riuscita." }, { status: 500 });
  if (existing) return NextResponse.json({ error: "La richiesta è già presente. Contatta l’amministratore per aggiornare i dati." }, { status: 409 });
  const values = Object.fromEntries(fields.map(key => [key, body[key].trim()]));
  // Approval and credits never come from signup metadata or from the request body.
  const { error } = await db.from("operator_accounts").insert({ ...values, user_id: user.id, email: user.email, status: "pending", terms_version: "2026-11-10" });
  if (error) return NextResponse.json({ error: "Richiesta non registrata. Riprova." }, { status: 500 });
  return NextResponse.json({ ok: true }, noStore);
}
