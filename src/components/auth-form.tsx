"use client";

import { type FormEvent, useState } from "react";
import {
  loginWithEmailPassword,
  registerWithEmailPassword
} from "@/lib/supabase/drafts";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (isRegister && !accepted) {
      setMessage("Per registrarti devi accettare privacy e condizioni.");
      return;
    }

    if (password.length < 6) {
      setMessage("La password deve contenere almeno 6 caratteri.");
      return;
    }

    setLoading(true);

    const result = isRegister
      ? await registerWithEmailPassword(fullName, email, password)
      : await loginWithEmailPassword(email, password);

    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (isRegister && result.data?.session) {
      window.location.href = "/templates";
      return;
    }

    if (isRegister) {
      const loginResult = await loginWithEmailPassword(email, password);

      if (loginResult.error) {
        setMessage(
          "Account creato. Se non riesci ad accedere subito, disattiva la conferma email in Supabase Auth."
        );
        return;
      }

      window.location.href = "/templates";
      return;
    }

    window.location.href = "/templates";
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {isRegister ? (
        <div className="field">
          <label htmlFor="fullName">Nome e cognome</label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          minLength={6}
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {isRegister ? (
        <label className="check-row">
          <input
            checked={accepted}
            type="checkbox"
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>Accetto privacy e condizioni del servizio.</span>
        </label>
      ) : null}

      <button className="button" disabled={loading} type="submit">
        {loading ? "Attendi..." : isRegister ? "Crea account" : "Accedi"}
      </button>

      {message ? <p className="auth-message">{message}</p> : null}
    </form>
  );
}
