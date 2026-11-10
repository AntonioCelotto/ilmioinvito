"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/supabase/drafts";
import { isProjectAdmin } from "@/lib/admin-role";
import { loadOperatorSummary, operatorRequest } from "@/lib/operators/client";
import { operatorPackages, type OperatorSummary } from "@/lib/operators/types";

const formatDate = (date: string) => new Date(date).toLocaleDateString("it-IT");
export function OperatorPanel() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [summary, setSummary] = useState<OperatorSummary | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");

  async function refresh() {
    const result = await loadOperatorSummary();
    setSummary(result);
  }
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const user = await getCurrentUser();
        if (!active) return;
        setLoggedIn(Boolean(user));
        setAdmin(isProjectAdmin(user));
        setName(user?.user_metadata?.full_name ?? "");
        if (user) {
          const result = await loadOperatorSummary();
          if (active) setSummary(result);
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Caricamento non riuscito.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      await operatorRequest("/api/operators", { ...Object.fromEntries(values.entries()), accepted: values.get("accepted") === "on" });
      await refresh();
      setMessage("Richiesta inviata. Antonio o Mirko potranno abilitare il tuo account.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Richiesta non riuscita."); }
    finally { setBusy(false); }
  }

  if (loading) return <p role="status">Caricamento area operatori…</p>;
  if (!loggedIn) return <div className="operator-intro-grid">
    <section className="panel"><p className="eyebrow">Per i professionisti degli eventi</p><h2>I tuoi clienti, un’unica area di lavoro.</h2><p>Crea inviti dai nostri modelli o carica la tua grafica. Gestisci eventi e conferme dalla tua dashboard.</p><ol className="operator-steps"><li>Crea il tuo account e invia i dati dell’attività.</li><li>Attendi l’abilitazione dell’amministratore.</li><li>Pubblica con i crediti assegnati, senza pagare ogni singolo invito.</li></ol><p className="muted">Hai già un account cliente? Usa le stesse credenziali per richiedere l’abilitazione.</p></section>
    <section className="panel"><h2>{authMode === "register" ? "Crea il tuo account" : "Accedi"}</h2><AuthForm mode={authMode} returnTo="/operatori" /><button className="operator-text-button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "register" ? "Hai già un account? Accedi" : "Non hai un account? Registrati"}</button></section>
  </div>;

  const account = summary?.account;
  return <>
    {admin ? <section className="panel operator-banner"><div><strong>Gestione amministratore</strong><p>Abilita gli operatori e assegna i pacchetti acquistati.</p></div><a className="button" href="/admin/operatori">Gestisci operatori</a></section> : null}
    {message ? <p className="operator-message" role="status">{message}</p> : null}
    {!summary ? <section className="panel"><p>Impossibile caricare i dati dell’account.</p><button className="button" onClick={() => window.location.reload()}>Riprova</button></section> : !account ? <section className="panel"><p className="eyebrow">Richiesta di abilitazione</p><h2>Presentaci la tua attività</h2><p className="muted">L’account operatore viene abilitato da Antonio o Mirko. La richiesta non attiva acquisti o abbonamenti.</p>
      <form className="auth-form operator-form" onSubmit={submit}>
        <label className="field">Nome e cognome<input name="full_name" defaultValue={name} required maxLength={150} autoComplete="name" /></label>
        <label className="field">Azienda / ragione sociale<input name="company_name" required maxLength={200} autoComplete="organization" /></label>
        <label className="field">Telefono<input name="phone" type="tel" required maxLength={50} autoComplete="tel" /></label>
        <label className="field">Partita IVA / codice fiscale<input name="vat_number" required maxLength={50} /></label>
        <label className="field operator-full-width">Indirizzo completo di fatturazione<input name="billing_address" required maxLength={500} autoComplete="street-address" /></label>
        <label className="check-row operator-full-width"><input name="accepted" type="checkbox" required /><span>Accetto le <a href="/operatori/condizioni" target="_blank" rel="noreferrer">condizioni operatori</a> e ho letto la <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span></label>
        <button className="button" disabled={busy}>{busy ? "Invio…" : "Richiedi abilitazione"}</button>
      </form></section> : <>
      <section className="panel operator-banner"><div><p className="eyebrow">{account.company_name}</p><h2>{account.status === "active" ? "Il tuo spazio professionale" : account.status === "pending" ? "Richiesta in attesa di abilitazione" : "Account sospeso"}</h2><p>{account.status === "active" ? "Ogni prima pubblicazione utilizza un credito Firma. Modifiche e bozze non consumano crediti." : account.status === "pending" ? "L’amministratore deve verificare la tua richiesta. Puoi già preparare le bozze." : "Contatta l’amministratore per riattivare le nuove pubblicazioni. Gli inviti già pubblicati restano disponibili."}</p></div><div className="operator-credit-count"><strong>{summary.available}</strong><span>crediti disponibili</span></div></section>
      <div className="operator-actions"><a className="button" href="/templates">Crea un invito</a><a className="button light" href="/dashboard">Gestisci inviti e conferme</a><a className="button light" href="/operatori/condizioni">Condizioni operatori</a></div>
      <section className="panel"><h2>I tuoi pacchetti</h2>{summary.grants.length === 0 ? <p className="muted">Nessun pacchetto assegnato. Dopo l’acquisto l’amministratore caricherà i crediti sul tuo account.</p> : <div className="operator-table-wrap"><table className="operator-table"><thead><tr><th>Pacchetto</th><th>Utilizzati</th><th>Residui</th><th>Attivabile entro</th></tr></thead><tbody>{summary.grants.map(grant => <tr key={grant.id}><td>{grant.package_name}</td><td>{grant.used_count} / {grant.event_count}</td><td>{Date.parse(grant.expires_at) > Date.now() ? grant.event_count - grant.used_count : "Scaduto"}</td><td>{formatDate(grant.expires_at)}</td></tr>)}</tbody></table></div>}</section>
      <section className="panel"><h2>Storico pubblicazioni</h2>{summary.usages.length ? <ul className="operator-history">{summary.usages.map(usage => <li key={usage.invitation_id}><strong>{usage.invitation_title}</strong><span>{formatDate(usage.created_at)} · 1 credito</span></li>)}</ul> : <p className="muted">Nessun credito ancora utilizzato.</p>}</section>
    </>}
    <section className="panel"><p className="eyebrow">Licenze Firma per professionisti</p><h2>Scegli quanti eventi preparare</h2><p>Tutti i pacchetti includono grafica propria e invitati illimitati. Il servizio di realizzazione grafica è separato.</p><div className="operator-package-grid">{operatorPackages.map(pack => <article key={pack.key}><h3>{pack.events === 1 ? "Evento pilota" : `${pack.events} eventi`}</h3><strong>{pack.price.toLocaleString("it-IT")} € <small>+ IVA</small></strong><p>{pack.price / pack.events} € + IVA per evento</p></article>)}</div><p className="muted">Per acquistare un pacchetto contatta l’amministratore. I crediti vengono assegnati manualmente dopo il pagamento, sono utilizzabili entro 12 mesi e non si rinnovano automaticamente.</p></section>
  </>;
}
