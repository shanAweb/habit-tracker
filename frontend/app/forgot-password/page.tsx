"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthCard } from "../../components/AuthCard";
import { useAuth } from "../../hooks/useAuth";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      setResetToken((await forgotPassword(email)) ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create reset token");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthCard
      title="Reset access"
      subtitle="Enter your account email to generate a password reset token."
      footer={<Link href="/login">Back to login</Link>}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="error-state">{error}</div>}
        <label className="field">
          Email
          <input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button className="button" disabled={saving} type="submit">
          {saving ? "Generating" : "Generate token"}
        </button>
      </form>
      {resetToken && (
        <div className="grid">
          <div className="token-box">{resetToken}</div>
          <Link
            className="inline-link"
            href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
          >
            Continue reset
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
