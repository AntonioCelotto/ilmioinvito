"use client";

import { FormEvent, useState } from "react";
import { requestPasswordReset } from "@/lib/supabase/drafts";

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const result = await requestPasswordReset(email.trim());
    setLoading(false);
    setMessage(result.error
      ? "Non è stato possibile inviare il link. Riprova tra qualche minuto."
      : "Se l’indirizzo è registrato, riceverai un link sicuro per impostare una nuova password.");
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="recovery-email">Email</label>
        <input id="recovery-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <button className="button" disabled={loading} type="submit">{loading ? "Invio..." : "Invia link di recupero"}</button>
      {message ? <p className="auth-message" role="status">{message}</p> : null}
    </form>
  );
}
