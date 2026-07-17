import { BuilderClient } from "@/components/builder-client";
import { AuthGate } from "@/components/auth-gate";

export default function BuilderPage() {
  return (
    <main className="workspace">
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand" href="/">
            ilmioinvito
          </a>
          <nav aria-label="Builder">
            <a className="active" href="/builder">
              Crea invito
            </a>
            <a href="/dashboard">Dashboard</a>
            <a href="/i/dora-lorenzo-demo">Anteprima pubblica</a>
          </nav>
        </aside>

        <section className="main">
          <div className="toolbar">
            <div>
              <p className="eyebrow">Builder MVP</p>
              <h2>Crea il tuo invito</h2>
              <p className="muted">
                Salva una bozza, scegli sezioni, location, media e grafica.
                Per usare il builder devi prima registrarti e accedere.
              </p>
            </div>
            <a className="button" href="/dashboard">
              Vai alla dashboard
            </a>
          </div>

          <AuthGate>
            <BuilderClient />
          </AuthGate>
        </section>
      </div>
    </main>
  );
}
