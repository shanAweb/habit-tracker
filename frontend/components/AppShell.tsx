"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  CalendarCheck,
  Flame,
  ListChecks,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { NotificationBell } from "./NotificationBell";

const links = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/check-in", label: "Check In", icon: CalendarCheck },
  { href: "/calendar", label: "Calendar", icon: CalendarCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, token, user, logout } = useAuth();
  const authPath = ["/login", "/signup", "/forgot-password", "/reset-password"].some(
    (path) => pathname.startsWith(path),
  );

  useEffect(() => {
    if (!ready) return;
    if (!token && !authPath) router.replace("/login");
    if (token && authPath) router.replace("/");
  }, [authPath, ready, router, token]);

  if (authPath) {
    return <main className="auth-shell">{children}</main>;
  }

  if (!ready || !token) {
    return <main className="auth-shell"><div className="panel">Loading...</div></main>;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Flame size={24} />
          </span>
          Habit Tracker
        </div>
        <nav className="nav" aria-label="Primary navigation">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className={pathname === item.href ? "active" : ""}
                href={item.href}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <NotificationBell />
        <div className="account-box">
          <span>{user?.name}</span>
          <button className="button ghost" onClick={logout} type="button">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
