"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthCard } from "../../components/AuthCard";
import { useAuth } from "../../hooks/useAuth";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await signup(name, email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Start tracking habits with a private dashboard and daily check-ins."
      footer={<>Already have an account? <Link href="/login">Log in</Link></>}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="error-state">{error}</div>}
        <label className="field">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          Email
          <input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          Password
          <input
            autoComplete="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="button" disabled={saving} type="submit">
          {saving ? "Creating" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
