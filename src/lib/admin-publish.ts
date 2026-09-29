import { createClient } from "@/lib/supabase/client";

export function isProjectAdmin(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  return user?.app_metadata?.app_role === "admin" && user.app_metadata.project_owner === true;
}

export async function publishInvitationAsAdmin(invitationId: string) {
  const supabase = createClient();
  if (!supabase) return { ok: false, message: "Supabase non è configurato." };

  const { data } = await supabase.auth.getSession();
  if (!data.session) return { ok: false, message: "Accedi con l’account amministratore." };

  const response = await fetch("/api/admin/publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ invitationId })
  });
  const result = (await response.json()) as { published?: boolean; error?: string };
  return response.ok && result.published
    ? { ok: true, message: "Invito pubblicato come amministratore, senza pagamento." }
    : { ok: false, message: result.error ?? "Pubblicazione amministrativa non riuscita." };
}
