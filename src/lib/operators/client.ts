import { createClient } from "@/lib/supabase/client";
import type { OperatorSummary } from "./types";

export async function operatorRequest<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const client = createClient();
  const { data } = client ? await client.auth.getSession() : { data: { session: null } };
  if (!data.session) throw new Error("Accedi con email e password per continuare.");
  const response = await fetch(path, {
    method: body === undefined ? "GET" : method,
    headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store"
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Operazione non riuscita. Riprova.");
  return result as T;
}
export const loadOperatorSummary = () => operatorRequest<OperatorSummary>("/api/operators");
export async function publishInvitationAsOperator(invitationId: string) {
  try {
    const result = await operatorRequest<{ message: string }>("/api/operators/publish", { invitationId });
    return { ok: true, message: result.message };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Pubblicazione non riuscita." };
  }
}
