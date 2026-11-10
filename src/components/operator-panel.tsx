"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/supabase/drafts";
import { isProjectAdmin } from "@/lib/admin-role";
import { loadOperatorSummary, operatorRequest } from "@/lib/operators/client";
import { operatorPackages, type OperatorSummary } from "@/lib/operators/types";

const formatDate = (date: string) => new Date(date).toLocaleDateString("it-IT");
const selectionKey = "operator-package-choice";
export function OperatorPanel() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [summary, setSummary] = useState<OperatorSummary | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [buying, setBuying] = useState("");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("");
  const [stripeAvailable, setStripeAvailable] = useState<boolean | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const confirmation = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (requestSent && confirmation.current && !confirmation.current.open) confirmation.current.showModal();
  }, [requestSent]);

  function choose(key: string) {
    setSelected(key);
    window.sessionStorage.setItem(selectionKey, key);
  }
  async function refresh() { setSummary(await loadOperatorSummary()); }
  useEffect(() => {
    let active = true;
    const choice = new URLSearchParams(window.location.search).get("pacchetto") ?? window.sessionStorage.getItem(selectionKey) ?? "";
    if (choice === "advice" || operatorPackages.some(pack => pack.key === choice)) setSelected(choice);
    void fetch("/api/operators/checkout").then(response => response.json()).then(result => { if (active) setStripeAvailable(result.available === true); }).catch(() => { if (active) setStripeAvailable(false); });
    async function load() {
      try {
        const user = await getCurrentUser();
        if (!active) return;
        setLoggedIn(Boolean(user)); setAdmin(isProjectAdmin(user)); setName(user?.user_metadata?.full_name ?? "");
        if (user) {
          const params = new URLSearchParams(window.location.search);
          const sessionId = params.get("session_id");
          if (sessionId) {
            try {
              const payment = await operatorRequest<{ paid: boolean; credited: boolean }>("/api/operators/checkout/status", { sessionId });
              if (active) setMessage(payment.credited ? "Pagamento confermato: i crediti sono stati caricati sul tuo account." : "Pagamento ancora in elaborazione. I crediti saranno caricati dopo la conferma. Ricarica la pagina per aggiornare lo stato.");
              if (payment.credited) {
                for (const pack of operatorPackages) window.sessionStorage.removeItem(`operator-checkout-${user.id}-${pack.key}`);
                window.history.replaceState(null, "", "/operatori");
              }
            } catch (error) { if (active) setMessage(error instanceof Error ? error.message : "Verifica pagamento non riuscita. Ricarica la pagina."); }
          } else if (params.get("pagamento") === "annullato") {
            if (active) setMessage("Pagamento annullato: nessun credito è stato aggiunto. Puoi scegliere nuovamente il pacchetto.");
            for (const pack of operatorPackages) window.sessionStorage.removeItem(`operator-checkout-${user.id}-${pack.key}`);
          }
          const result = await loadOperatorSummary();
          if (active) setSummary(result);
        }
      } catch (error) { if (active) setMessage(error instanceof Error ? error.message : "Caricamento non riuscito."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) { setMessage("Scegli un pacchetto oppure richiedi un consiglio prima di inviare la richiesta."); return; }
    const values = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      await operatorRequest("/api/operators", { ...Object.fromEntries(values.entries()), requested_package_key: selected, accepted: values.get("accepted") === "on" });
      await refresh(); setRequestSent(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Richiesta non riuscita."); }
    finally { setBusy(false); }
  }
  async function buy(packageKey: string) {
    if (!summary?.account || buying) return;
    setBuying(packageKey); setMessage("");
    const key = `operator-checkout-${summary.account.user_id}-${packageKey}`;
    const requestId = window.sessionStorage.getItem(key) ?? crypto.randomUUID();
    window.sessionStorage.setItem(key, requestId);
    try {
      const result = await operatorRequest<{ url?: string; alreadyPaid?: boolean }>("/api/operators/checkout", { packageKey, requestId });
      if (result.alreadyPaid) {
        window.sessionStorage.removeItem(key); await refresh();
        setMessage("Questo acquisto è già stato accreditato. Per un nuovo pacchetto premi nuovamente Acquista.");
      } else if (result.url) { window.location.href = result.url; return; }
      else throw new Error("Pagamento non disponibile.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Pagamento non disponibile."); }
    setBuying("");
  }

  if (loading) return <p role="status">Caricamento area operatori…</p>;
  const account = summary?.account;
  const requested = operatorPackages.find(pack => pack.key === account?.requested_package_key);
  const choosePackage = !loggedIn || (Boolean(summary) && !account);
  return <>
    {admin ? <section className="panel operator-banner"><div><strong>Gestione amministratore</strong><p>Approva gli operatori: potranno acquistare online. L’assegnazione manuale rimane disponibile per i bonifici.</p></div><a className="button" href="/admin/operatori">Gestisci operatori</a></section> : null}
    {message ? <p className="operator-message" role="status">{message}</p> : null}
    {choosePackage ? <section className="panel"><p className="eyebrow">1 · Scegli il pacchetto</p><h2>Quanti eventi vuoi creare?</h2><p>Tutti i pacchetti Firma includono grafica propria e invitati illimitati. Scegli quello che ti interessa: pagherai soltanto dopo l’approvazione della richiesta.</p><div className="operator-package-grid" role="radiogroup" aria-label="Pacchetto operatore">{operatorPackages.map(pack => <label className={`operator-package-choice${selected === pack.key ? " selected" : ""}`} key={pack.key}><input type="radio" name="operatorPackage" value={pack.key} checked={selected === pack.key} onChange={() => choose(pack.key)} /><h3>{pack.events === 1 ? "Evento pilota" : `${pack.events} eventi`}</h3><strong>{pack.price.toLocaleString("it-IT")} € <small>+ IVA</small></strong><p>{pack.price / pack.events} € + IVA per evento</p><span>{selected === pack.key ? "Selezionato" : "Scegli pacchetto"}</span></label>)}</div><label className="check-row"><input type="radio" name="operatorPackage" checked={selected === "advice"} onChange={() => choose("advice")} /><span>Non so quale scegliere: desidero essere consigliato.</span></label><p className="muted">Pagamento unico, nessun rinnovo automatico. I crediti sono utilizzabili entro 12 mesi.</p></section> : null}
    {!loggedIn ? <div className="operator-intro-grid"><section className="panel"><p className="eyebrow">Il tuo spazio professionale</p><h2>I tuoi clienti, un’unica area di lavoro.</h2><ol className="operator-steps"><li>Scegli il pacchetto e crea il tuo account.</li><li>Invia i dati dell’attività e attendi la nostra approvazione.</li><li>Acquista con Stripe: i crediti arrivano automaticamente dopo il pagamento.</li></ol><p className="muted">Se hai già un account, usa le stesse credenziali per richiedere l’abilitazione.</p></section><section className="panel"><h2>{authMode === "register" ? "2 · Crea il tuo account" : "2 · Accedi"}</h2>{selected ? <AuthForm mode={authMode} returnTo="/operatori" /> : <p className="muted">Seleziona un pacchetto, oppure richiedi un consiglio, per continuare.</p>}<button className="operator-text-button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "register" ? "Hai già un account? Accedi" : "Non hai un account? Registrati"}</button></section></div> : !summary ? <section className="panel"><p>Impossibile caricare i dati dell’account.</p><button className="button" onClick={() => window.location.reload()}>Riprova</button></section> : !account ? <section className="panel"><p className="eyebrow">2 · Richiesta di abilitazione</p><h2>Presentaci la tua attività</h2><p className="muted">Dopo l’approvazione potrai acquistare il pacchetto con Stripe. L’invio della richiesta non comporta addebiti.</p><form className="auth-form operator-form" onSubmit={submit}>
      <label className="field">Nome e cognome<input name="full_name" defaultValue={name} required maxLength={150} autoComplete="name" /></label><label className="field">Azienda / ragione sociale<input name="company_name" required maxLength={200} autoComplete="organization" /></label><label className="field">Telefono<input name="phone" type="tel" required maxLength={50} autoComplete="tel" /></label><label className="field">Partita IVA / codice fiscale<input name="vat_number" required maxLength={50} /></label><label className="field operator-full-width">Indirizzo completo di fatturazione<input name="billing_address" required maxLength={500} autoComplete="street-address" /></label><label className="check-row operator-full-width"><input name="accepted" type="checkbox" required /><span>Accetto le <a href="/operatori/condizioni" target="_blank" rel="noreferrer">condizioni operatori</a> e ho letto la <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span></label><button className="button" disabled={busy || !selected}>{busy ? "Invio…" : "Invia richiesta di abilitazione"}</button></form></section> : <>
      <section className="panel operator-banner"><div><p className="eyebrow">{account.company_name}</p><h2>{account.status === "active" ? "Il tuo spazio professionale" : account.status === "pending" ? "Richiesta inviata · in attesa di approvazione" : "Account sospeso"}</h2><p>{account.status === "active" ? "Puoi acquistare i pacchetti con Stripe. Ogni prima pubblicazione utilizza un credito Firma; bozze e modifiche non consumano crediti." : account.status === "pending" ? "Antonio o Mirko verificheranno la tua richiesta. Dopo l’approvazione potrai procedere al pagamento. Intanto puoi preparare le bozze." : "Contatta l’amministratore per riattivare le nuove pubblicazioni. Gli inviti già pubblicati restano disponibili."}</p>{requested ? <p><strong>Pacchetto richiesto:</strong> {requested.name} · {requested.price.toLocaleString("it-IT")} € + IVA</p> : null}</div><div className="operator-credit-count"><strong>{summary.available}</strong><span>crediti disponibili</span></div></section>
      <div className="operator-actions"><a className="button" href="/templates">Crea un invito</a><a className="button light" href="/dashboard">Gestisci inviti e conferme</a><a className="button light" href="/operatori/condizioni">Condizioni operatori</a><button className="button light" onClick={() => window.location.reload()}>Aggiorna stato</button></div>
      <section className="panel"><p className="eyebrow">Acquisto una tantum</p><h2>Acquista o ricarica i tuoi pacchetti</h2><p>I prezzi sono IVA esclusa. Le imposte applicabili e il totale vengono mostrati su Stripe prima del pagamento. I crediti sono caricati automaticamente dopo la conferma.</p><div className="operator-package-grid">{operatorPackages.map(pack => <article key={pack.key}><h3>{pack.events === 1 ? "Evento pilota" : `${pack.events} eventi`}</h3><strong>{pack.price.toLocaleString("it-IT")} € <small>+ IVA</small></strong><p>{pack.price / pack.events} € + IVA per evento</p><button className="button" disabled={account.status !== "active" || stripeAvailable !== true || Boolean(buying)} onClick={() => void buy(pack.key)}>{buying === pack.key ? "Apertura Stripe…" : `Acquista ${pack.events === 1 ? "1 evento" : `${pack.events} eventi`}`}</button></article>)}</div>{account.status !== "active" ? <p className="muted">L’acquisto si abilita dopo l’approvazione dell’account.</p> : stripeAvailable === false ? <p role="status" className="operator-message">L’acquisto online è al momento in preparazione. Contatta l’amministratore per attivare un pacchetto tramite bonifico.</p> : stripeAvailable === null ? <p role="status">Verifica disponibilità pagamenti…</p> : null}<p className="muted">Nessun abbonamento. Crediti attivabili entro 12 mesi; realizzazione grafica separata.</p></section>
      <section className="panel"><h2>I tuoi pacchetti attivi</h2>{summary.grants.length === 0 ? <p className="muted">Nessun pacchetto ancora attivato. I crediti compariranno qui dopo il pagamento confermato.</p> : <div className="operator-table-wrap"><table className="operator-table"><thead><tr><th>Pacchetto</th><th>Utilizzati</th><th>Residui</th><th>Attivabile entro</th></tr></thead><tbody>{summary.grants.map(grant => <tr key={grant.id}><td>{grant.package_name}</td><td>{grant.used_count} / {grant.event_count}</td><td>{Date.parse(grant.expires_at) > Date.now() ? grant.event_count - grant.used_count : "Scaduto"}</td><td>{formatDate(grant.expires_at)}</td></tr>)}</tbody></table></div>}</section>
      <section className="panel"><h2>Storico pubblicazioni</h2>{summary.usages.length ? <ul className="operator-history">{summary.usages.map(usage => <li key={usage.invitation_id}><strong>{usage.invitation_title}</strong><span>{formatDate(usage.created_at)} · 1 credito</span></li>)}</ul> : <p className="muted">Nessun credito ancora utilizzato.</p>}</section>
    </>}
    <dialog ref={confirmation} className="operator-confirmation" onCancel={() => setRequestSent(false)}><p className="eyebrow">Richiesta ricevuta</p><h2>Grazie, la tua richiesta è stata inviata.</h2><p>Il nostro team verificherà i dati della tua attività. Dopo l’approvazione potrai acquistare il pacchetto con Stripe dalla tua area operatori.</p><p className="muted">Puoi già preparare le bozze. Nessun pagamento è stato richiesto.</p><button className="button" onClick={() => { confirmation.current?.close(); setRequestSent(false); }}>Vai alla mia area</button></dialog>
  </>;
}
