import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand" href="/">
          ilmioinvito
        </a>
        <div>
          <p className="eyebrow">Registrazione cliente</p>
          <h1>Crea il tuo account</h1>
          <p className="muted">
            Registrati prima di accedere al sistema: cosi ogni bozza e ogni
            invito restano collegati al tuo account.
          </p>
        </div>
        <AuthForm mode="register" />
        <p className="auth-switch">
          Hai gia un account? <a href="/login">Accedi</a>
        </p>
      </section>
    </main>
  );
}
