import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand" href="/">
          ilmioinvito
        </a>
        <div>
          <p className="eyebrow">Accesso cliente</p>
          <h1>Accedi al sistema</h1>
          <p className="muted">
            Usa email e password dopo aver creato e confermato il tuo account.
          </p>
        </div>
        <AuthForm mode="login" />
        <p className="auth-switch">
          Non hai ancora un account? <a href="/registrati">Registrati</a>
        </p>
      </section>
    </main>
  );
}
