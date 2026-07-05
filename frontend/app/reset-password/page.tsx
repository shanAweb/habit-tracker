"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthCard } from "../../components/AuthCard";
import { useAuth } from "../../hooks/useAuth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await resetPassword(token, password);
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthCard
      title="New password"
      subtitle="Choose a new password for your habit tracker account."
      footer={<Link href="/login">Back to login</Link>}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="error-state">{error}</div>}
        <label className="field">
          Reset token
          <input value={token} onChange={(event) => setToken(event.target.value)} />
        </label>
        <label className="field">
          New password
          <input
            autoComplete="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="button" disabled={saving} type="submit">
          {saving ? "Saving" : "Save password"}
        </button>
      </form>
    </AuthCard>
  );
}
