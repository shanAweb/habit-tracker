import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./visuals.css";
import "./controls.css";
import "./responsive.css";
import "./auth.css";
import "./notifications.css";
import { AppShell } from "../components/AppShell";
import { AuthProvider } from "../hooks/useAuth";
import { NotificationProvider } from "../hooks/useNotifications";

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
        <AuthProvider>
          <NotificationProvider>
            <AppShell>{children}</AppShell>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
