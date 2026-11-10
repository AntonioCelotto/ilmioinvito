import type { OperatorSummary } from "@/lib/operators/types";
export function OperatorDashboardNotice({ summary }: { summary: OperatorSummary | null }) {
  if (!summary?.account) return null;
  return <section className="panel operator-banner"><div><p className="eyebrow">Account operatore · {summary.account.company_name}</p><strong>{summary.account.status === "active" ? `${summary.available} crediti disponibili` : summary.account.status === "pending" ? "Abilitazione in attesa" : "Nuove pubblicazioni sospese"}</strong><p>Le bozze sono gratuite. Un credito viene utilizzato alla prima pubblicazione di ciascun evento.</p></div><a className="button light" href="/operatori">Pacchetti e storico</a></section>;
}
