import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./visuals.css";
import "./controls.css";
import "./responsive.css";
import { AppShell } from "../components/AppShell";

export const metadata: Metadata = {
  title: "Habit Tracker",
  description: "Track daily habits and progress over time.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
