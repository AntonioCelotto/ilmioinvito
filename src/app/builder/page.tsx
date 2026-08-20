import { BuilderClient } from "@/components/builder-client";
import { StoryEditor } from "@/components/story-editor";
import { StoryBlockOrderEnhancer } from "@/components/story-block-order-enhancer";
import { CelebrationNumberEditor } from "@/components/celebration-number-editor";
import { HeroCenterEnhancer } from "@/components/hero-center-enhancer";
import { AuthGate } from "@/components/auth-gate";

export default function BuilderPage() {
  return (
    <main className="workspace">
      <div className="app-shell">
        <aside
          className="sidebar"
          style={{
            position: "sticky",
            top: 0,
            alignSelf: "start",
            height: "100vh",
            overflowY: "auto"
          }}
        >
          <a className="brand" href="/">
            ilmioinvito
          </a>
          <nav aria-label="Builder">
            <a className="active" href="/builder">
              Crea invito
            </a>
            <a href="/templates">Scegli template</a>
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
                Inserisci i dati, scegli sezioni e personalizza il template.
                Per usare il builder devi prima registrarti e accedere.
              </p>
            </div>
            <a className="button" href="/dashboard">
              Vai alla dashboard
            </a>
          </div>

          <AuthGate>
            <>
              <BuilderClient />
              <StoryBlockOrderEnhancer />
              <CelebrationNumberEditor />
              <StoryEditor />
              <HeroCenterEnhancer />
            </>
          </AuthGate>
        </section>
      </div>
    </main>
  );
}
