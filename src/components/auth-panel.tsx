"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "@/lib/supabase/drafts";

type AuthPanelProps = {
  compact?: boolean;
};

export function AuthPanel({ compact = false }: AuthPanelProps) {
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((user) => {
      setUserEmail(user?.email ?? "");
      setLoading(false);
    });
  }, []);

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
        <strong>Registrati prima di entrare</strong>
      </div>
      <div className="auth-actions">
        <a className="button" href="/registrati">
          Registrati
        </a>
        <a className="button light" href="/login">
          Accedi
        </a>
      </div>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
