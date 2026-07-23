"use client";

import { type ReactNode, useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/supabase/drafts";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      setIsLoggedIn(Boolean(user));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="muted">Controllo accesso...</p>;
  }

  if (!isLoggedIn) {
    return (
      <div className="auth-required">
        <p className="eyebrow">Area riservata</p>
        <h2>Registrati prima di scegliere il tuo template.</h2>
        <p className="muted">
          Per scegliere un template e salvare il tuo invito serve un account cliente.
        </p>
        <div className="auth-actions">
          <a className="button" href="/registrati">
            Registrati
          </a>
          <a className="button light" href="/login">
            Accedi
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
