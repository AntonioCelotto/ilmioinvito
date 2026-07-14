import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <main className="workspace">
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand" href="/">
            ilmioinvito
          </a>
          <nav aria-label="Dashboard">
            <a href="/builder">Crea invito</a>
            <a className="active" href="/dashboard">
              Dashboard
            </a>
            <a href="/i/dora-lorenzo-demo">Anteprima pubblica</a>
          </nav>
        </aside>

        <section className="main">
          <DashboardClient />
        </section>
      </div>
    </main>
  );
}
