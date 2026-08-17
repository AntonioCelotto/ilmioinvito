import { DashboardClient } from "@/components/dashboard-client";
import { AuthGate } from "@/components/auth-gate";

export default function DashboardPage() {
  return (
    <main className="workspace">
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand" href="/">
            ilmioinvito
          </a>
          <nav aria-label="Dashboard">
            <a href="/templates">Crea invito</a>
            <a href="/abbonamenti">Pacchetti</a>
            <a className="active" href="/dashboard">
              Dashboard
            </a>
            <a href="/i/dora-lorenzo-demo">Anteprima pubblica</a>
          </nav>
        </aside>

        <section className="main">
          <AuthGate>
            <DashboardClient />
          </AuthGate>
        </section>
      </div>
    </main>
  );
}
