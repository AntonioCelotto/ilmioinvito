import { AuthGate } from "@/components/auth-gate";
import { TemplateGallery } from "@/components/template-gallery";

export default function TemplatesPage() {
  return (
    <main className="template-page">
      <header className="template-page-header">
        <a className="brand" href="/">
          ilmioinvito
        </a>
        <a href="/dashboard">I miei inviti</a>
      </header>

      <section className="template-intro">
        <p className="eyebrow">Primo passo</p>
        <h1>Scegli il tuo template</h1>
        <p>
          Parti dallo stile che racconta meglio il tuo evento. Nel passaggio
          successivo potrai inserire i dati, organizzare gli slot e
          personalizzare colori e caratteri.
        </p>
      </section>

      <AuthGate>
        <TemplateGallery />
      </AuthGate>
    </main>
  );
}
