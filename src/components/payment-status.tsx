"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "success" | "pending" | "error";

export function PaymentStatus({ sessionId }: { sessionId?: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function check(attempt = 0) {
      if (!sessionId) return setStatus("error");
      const supabase = createClient();
      const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
      if (!data.session) return setStatus("error");
      const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: "no-store" });
      const result = await response.json() as { paid?: boolean; published?: boolean; slug?: string | null };
      if (cancelled) return;
      if (!response.ok || !result.paid) return setStatus("error");
      if (result.published) { setSlug(result.slug ?? null); return setStatus("success"); }
      setStatus("pending");
      if (attempt < 5) window.setTimeout(() => check(attempt + 1), 1500);
    }
    check();
    return () => { cancelled = true; };
  }, [sessionId]);
  if (status === "checking") return <><p className="eyebrow">Verifica pagamento</p><h1>Controllo in corso...</h1><p>Stiamo verificando la conferma sicura inviata da Stripe.</p></>;
  if (status === "error") return <><p className="eyebrow">Pagamento non verificato</p><h1>Non possiamo confermare il pagamento</h1><p>Accedi con lo stesso account usato per l’acquisto oppure torna alla dashboard.</p><div className="actions"><a className="button" href="/login">Accedi</a><a className="button light" href="/dashboard">Dashboard</a></div></>;
  if (status === "pending") return <><p className="eyebrow">Pagamento ricevuto</p><h1>Pubblicazione in corso</h1><p>Stripe ha confermato il pagamento. La pubblicazione può richiedere ancora qualche secondo.</p><div className="actions"><a className="button" href="/dashboard">Controlla dalla dashboard</a></div></>;
  return <><span className="payment-check" aria-hidden="true">✓</span><p className="eyebrow">Pagamento verificato</p><h1>Il tuo invito è pubblicato</h1><p>Pagamento confermato e invito attivato correttamente.</p><div className="actions">{slug ? <a className="button" href={`/i/${slug}`}>Apri il mio invito</a> : null}<a className="button light" href="/dashboard">Vai alla dashboard</a></div></>;
}
