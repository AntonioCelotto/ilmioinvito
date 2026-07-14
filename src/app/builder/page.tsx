import { BuilderClient } from "@/components/builder-client";

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
                Il salvataggio account su Supabase arriva nel prossimo step.
              </p>
            </div>
            <a className="button" href="/dashboard">
              Vai alla dashboard
            </a>
          </div>

          <BuilderClient />
        </section>
      </div>
    </main>
  );
}
