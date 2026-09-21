"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/supabase/drafts";

export function PasswordUpdateForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("Verifica del link in corso...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Servizio di accesso non configurato.");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
      setMessage(data.session ? "" : "Il link non è valido o è scaduto. Richiedine uno nuovo.");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setMessage("");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) return setMessage("La password deve contenere almeno 8 caratteri.");
    if (password !== confirmPassword) return setMessage("Le due password non coincidono.");
    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (result.error) return setMessage("Non è stato possibile aggiornare la password. Richiedi un nuovo link.");
    setMessage("Password aggiornata. Ora puoi accedere.");
    setReady(false);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {ready ? <>
        <div className="field"><label htmlFor="new-password">Nuova password</label><input id="new-password" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        <div className="field"><label htmlFor="confirm-password">Ripeti la password</label><input id="confirm-password" type="password" minLength={8} required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
        <button className="button" disabled={loading} type="submit">{loading ? "Aggiornamento..." : "Salva nuova password"}</button>
      </> : null}
      {message ? <p className="auth-message" role="status">{message}</p> : null}
      {!ready ? <a className="auth-help-link" href="/recupera-password">Richiedi un nuovo link</a> : null}
    </form>
  );
}
