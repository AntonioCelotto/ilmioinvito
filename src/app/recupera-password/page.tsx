import { PasswordRecoveryForm } from "@/components/password-recovery-form";

export default function PasswordRecoveryPage() {
  return <main className="auth-page"><section className="auth-card">
    <a className="brand" href="/">ilmioinvito</a>
    <div><p className="eyebrow">Recupero account</p><h1>Password dimenticata?</h1><p className="muted">Inserisci l’email usata per la registrazione. Riceverai un link temporaneo per scegliere una nuova password.</p></div>
    <PasswordRecoveryForm />
    <p className="auth-switch"><a href="/login">Torna all’accesso</a></p>
  </section></main>;
}
