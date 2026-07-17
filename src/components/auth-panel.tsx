"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, signInWithEmail, signOut } from "@/lib/supabase/drafts";

type AuthPanelProps = {
  compact?: boolean;
};

export function AuthPanel({ compact = false }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((user) => {
      setUserEmail(user?.email ?? "");
      setLoading(false);
    });
  }, []);

  async function handleLogin() {
    setMessage("");
    const { error } = await signInWithEmail(email);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Controlla la tua email: ti ho inviato il link di accesso.");
  }

  async function handleSignOut() {
    await signOut();
    setUserEmail("");
    setMessage("Sei uscito dall'account.");
  }

  if (loading) {
    return <p className="muted">Controllo accesso...</p>;
  }

  if (userEmail) {
    return (
      <div className={compact ? "auth-panel compact" : "auth-panel"}>
        <div>
          <span>Account collegato</span>
          <strong>{userEmail}</strong>
        </div>
        <button className="button secondary" type="button" onClick={handleSignOut}>
          Esci
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? "auth-panel compact" : "auth-panel"}>
      <div>
        <span>Accesso cliente</span>
        <strong>Salva bozze su Supabase</strong>
      </div>
      <div className="auth-actions">
        <input
          aria-label="Email accesso cliente"
          placeholder="email cliente"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button className="button" type="button" onClick={handleLogin}>
          Entra
        </button>
      </div>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
