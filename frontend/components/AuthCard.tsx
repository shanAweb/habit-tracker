import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <section className="auth-card">
      <Link className="brand auth-brand" href="/">
        <span className="brand-mark">H</span>
        Habit Tracker
      </Link>
      <header>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>
      {children}
      <div className="auth-footer">{footer}</div>
    </section>
  );
}
