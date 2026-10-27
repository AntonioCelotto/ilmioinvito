import { AuthGate } from "@/components/auth-gate";
import { TemplateAdminClient } from "@/components/template-admin-client";

export default function TemplateAdminPage() {
  return <main className="workspace">
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">ilmioinvito</a>
        <nav aria-label="Amministrazione">
          <a href="/dashboard">Dashboard</a>
          <a href="/templates">Template</a>
          <a className="active" href="/admin/templates">Gestione Template</a>
        </nav>
      </aside>
      <section className="main"><AuthGate><TemplateAdminClient /></AuthGate></section>
    </div>
  </main>;
}
