"use client";

import { useEffect } from "react";
import { getCurrentUser } from "@/lib/supabase/drafts";

export default function AccountActivePage() {
  useEffect(() => {
    void getCurrentUser();
  }, []);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand" href="/">
          ilmioinvito
        </a>
        <div>
          <p className="eyebrow">Registrazione completata</p>
          <h1>Grazie per la registrazione</h1>
          <p className="muted">
            Il tuo account è attivo. Ora puoi scegliere il template e creare il
            tuo invito digitale.
          </p>
        </div>
        <a className="button" href="/templates">
          Continua
        </a>
        <p className="auth-switch">
          Preferisci accedere? <a href="/login">Vai al login</a>
        </p>
      </section>
    </main>
  );
}
