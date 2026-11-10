"use client";

import { type ReactNode, useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/supabase/drafts";

type AuthGateProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  returnTo?: string;
  allowRegistration?: boolean;
};

export function AuthGate({ children, title, description, returnTo, allowRegistration = true }: AuthGateProps) {
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
        <h2>{title ?? "Registrati prima di scegliere il tuo template."}</h2>
        <p className="muted">
          {description ?? "Per scegliere un template e salvare il tuo invito serve un account cliente."}
        </p>
        <div className="auth-actions">
          {allowRegistration ? <a className="button" href="/registrati">Registrati</a> : null}
          <a className="button light" href={returnTo ? `/login?ritorno=${encodeURIComponent(returnTo)}` : "/login"}>
            Accedi
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
