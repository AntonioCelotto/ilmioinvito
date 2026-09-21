import { PasswordUpdateForm } from "@/components/password-update-form";

export default function PasswordUpdatePage() {
  return <main className="auth-page"><section className="auth-card">
    <a className="brand" href="/">ilmioinvito</a>
    <div><p className="eyebrow">Sicurezza account</p><h1>Crea una nuova password</h1><p className="muted">Usa almeno 8 caratteri e una password diversa da quelle utilizzate altrove.</p></div>
    <PasswordUpdateForm />
    <p className="auth-switch"><a href="/login">Vai all’accesso</a></p>
  </section></main>;
}
