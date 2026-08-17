"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BillingProductKey } from "@/lib/billing-plans";

export function PricingCheckoutButton({
  productKey,
  label,
  featured = false,
  invitationId
}: {
  productKey: BillingProductKey;
  label: string;
  featured?: boolean;
  invitationId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function startCheckout() {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Il servizio di accesso non è ancora configurato.");
      return;
    }

    setLoading(true);
    setMessage("");
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      window.location.href = "/login?ritorno=/abbonamenti";
      return;
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ productKey, invitationId })
    });
    const result = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !result.url) {
      setLoading(false);
      setMessage(result.error ?? "Pagamento non disponibile. Riprova.");
      return;
    }

    window.location.href = result.url;
  }

  return (
    <>
      <button
        className={`button pricing-button${featured ? " pricing-button-featured" : ""}`}
        disabled={loading}
        type="button"
        onClick={startCheckout}
      >
        {loading ? "Apertura pagamento..." : label}
      </button>
      {message ? <small className="pricing-error" role="alert">{message}</small> : null}
    </>
  );
}
