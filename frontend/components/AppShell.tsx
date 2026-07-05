"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BarChart3, CalendarCheck, Flame, ListChecks } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/check-in", label: "Check In", icon: CalendarCheck },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

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
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
