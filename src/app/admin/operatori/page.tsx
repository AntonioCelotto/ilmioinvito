import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";
import { OperatorAdminPanel } from "@/components/operator-admin-panel";
export const metadata: Metadata = { title: "Gestione operatori | Il Mio Invito", robots: { index: false, follow: false } };
export default function OperatorAdminPage() {
  return <main className="workspace"><div className="app-shell"><aside className="sidebar"><a className="brand" href="/">ilmioinvito</a><nav aria-label="Amministrazione"><a href="/dashboard">Dashboard</a><a href="/admin/templates">Gestione Template</a><a className="active" href="/admin/operatori">Gestione operatori</a><a href="/operatori">Area operatori</a></nav></aside><section className="main"><AuthGate title="Accedi come amministratore" description="La gestione degli operatori è riservata agli account di Antonio e Mirko." returnTo="/admin/operatori" allowRegistration={false}><OperatorAdminPanel /></AuthGate></section></div></main>;
}
