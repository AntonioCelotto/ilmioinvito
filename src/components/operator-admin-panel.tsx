"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { operatorRequest } from "@/lib/operators/client";
import { operatorPackages, type OperatorSummary } from "@/lib/operators/types";

const date = (value: string) => new Date(value).toLocaleDateString("it-IT");
export function OperatorAdminPanel() {
  const [operators, setOperators] = useState<OperatorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const grantRequests = useRef(new Map<string, string>());
  async function refresh() {
    const result = await operatorRequest<{ operators: OperatorSummary[] }>("/api/admin/operators");
    setOperators(result.operators);
  }
  useEffect(() => {
    void refresh().catch(error => setMessage(error.message)).finally(() => setLoading(false));
  }, []);
  async function action(operatorId: string, body: Record<string, unknown>) {
    setBusy(operatorId); setMessage("");
    try {
      await operatorRequest("/api/admin/operators", { operatorId, ...body });
      await refresh();
      if (body.action === "grant") grantRequests.current.delete(operatorId);
      setMessage(body.action === "grant" ? "Pacchetto assegnato. I crediti sono disponibili nell’account operatore." : "Stato operatore aggiornato.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Operazione non riuscita."); }
    finally { setBusy(""); }
  }
  function grant(event: FormEvent<HTMLFormElement>, operatorId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    // Reuse the request key after network errors to prevent duplicate grants.
    const requestId = grantRequests.current.get(operatorId) ?? crypto.randomUUID();
    grantRequests.current.set(operatorId, requestId);
    void action(operatorId, { action: "grant", packageKey: form.get("package"), note: form.get("note"), requestId });
  }
  const visible = operators.filter(({ account }) => account && `${account.company_name} ${account.full_name} ${account.email}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <div className="toolbar"><div><p className="eyebrow">Amministrazione</p><h1>Gestione operatori</h1><p className="muted">Abilita i fornitori e assegna i pacchetti dopo aver verificato il pagamento.</p></div><a className="button light" href="/dashboard">Dashboard</a></div>
    {message ? <p role="status" className="operator-message">{message}</p> : null}
    {loading ? <p role="status">Caricamento operatori…</p> : <>
      <section className="panel"><label className="field">Cerca operatore<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Azienda, nome o email" /></label><p className="muted">{operators.length} operatori · {operators.filter(item => item.account?.status === "pending").length} richieste da abilitare</p><a href="/operatori">Pagina di registrazione operatori ↗</a></section>
      {visible.length === 0 ? <section className="panel"><p>Nessun operatore trovato.</p></section> : null}
      {visible.map(item => {
        const account = item.account!;
        return <section className="panel operator-admin-card" key={account.user_id}>
          <div className="operator-banner"><div><span className={`status ${account.status === "active" ? "confirmed" : "pending"}`}>{account.status === "pending" ? "Da abilitare" : account.status === "active" ? "Abilitato" : "Sospeso"}</span><h2>{account.company_name}</h2><p>{account.full_name} · {account.email} · {account.phone}</p><p className="muted">P. IVA / C.F. {account.vat_number}<br />{account.billing_address}</p></div><div className="operator-credit-count"><strong>{item.available}</strong><span>crediti disponibili</span></div></div>
          <div className="operator-actions"><button className="button" disabled={Boolean(busy) || account.status === "active"} onClick={() => void action(account.user_id, { action: "status", status: "active" })}>{account.status === "suspended" ? "Riattiva operatore" : "Abilita operatore"}</button><button className="button light" disabled={Boolean(busy) || account.status !== "active"} onClick={() => void action(account.user_id, { action: "status", status: "suspended" })}>Sospendi nuove pubblicazioni</button></div>
          {account.status === "active" ? <form className="operator-grant-form" onSubmit={event => grant(event, account.user_id)}><label className="field">Pacchetto acquistato<select name="package" required>{operatorPackages.map(pack => <option value={pack.key} key={pack.key}>{pack.name} — {pack.price.toLocaleString("it-IT")} € + IVA</option>)}</select></label><label className="field">Riferimento pagamento / ordine<input name="note" maxLength={500} placeholder="Es. bonifico o numero ordine" required /></label><button className="button" disabled={Boolean(busy)}>{busy === account.user_id ? "Attendi…" : "Assegna crediti"}</button><p className="muted operator-full-width">Assegnando il pacchetto confermi il pagamento. I crediti scadono dopo 12 mesi. L’operazione non addebita denaro al fornitore.</p></form> : null}
          <details><summary>Pacchetti e pubblicazioni ({item.usages.length} eventi attivati)</summary><div className="operator-table-wrap"><table className="operator-table"><thead><tr><th>Pacchetto</th><th>Utilizzati</th><th>Scadenza</th><th>Riferimento</th></tr></thead><tbody>{item.grants.map(pack => <tr key={pack.id}><td>{pack.package_name}</td><td>{pack.used_count} / {pack.event_count}</td><td>{date(pack.expires_at)}</td><td>{pack.note}</td></tr>)}</tbody></table></div><ul className="operator-history">{item.usages.map(usage => <li key={usage.invitation_id}><strong>{usage.invitation_title}</strong><span>{date(usage.created_at)} · 1 credito</span></li>)}</ul></details>
        </section>;
      })}
    </>}
  </>;
}
