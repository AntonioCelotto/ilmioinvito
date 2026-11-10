import "server-only";
import { NextResponse } from "next/server";
import { createServerAuthClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { isProjectAdmin } from "@/lib/admin-role";

export async function operatorContext(request: Request, requireAdmin = false) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = createServerAuthClient();
  const db = createSupabaseAdminClient();
  if (!auth || !db) return { response: NextResponse.json({ error: "Servizio non configurato." }, { status: 503 }) };
  if (!token) return { response: NextResponse.json({ error: "Accesso richiesto." }, { status: 401 }) };
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user) return { response: NextResponse.json({ error: "Sessione non valida. Accedi nuovamente." }, { status: 401 }) };
  if (requireAdmin && !isProjectAdmin(data.user)) return { response: NextResponse.json({ error: "Operazione riservata agli amministratori." }, { status: 403 }) };
  return { db, user: data.user };
}
export const noStore = { headers: { "Cache-Control": "no-store" } };
export const validUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
