"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";

export default function SettingsPage() {
  const { token, user, updateProfile, changePassword, deleteAccount } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [timezone, setTimezone] = useState(user?.timezone ?? "UTC");
  const [weekStart, setWeekStart] = useState(user?.week_start ?? 0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setTimezone(user.timezone);
    setWeekStart(user.week_start);
  }, [user]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateProfile(name, email, timezone, weekStart);
    setMessage("Profile updated");
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await changePassword(currentPassword, newPassword);
    setCurrentPassword("");
    setNewPassword("");
    setMessage("Password changed");
  }

  async function exportData() {
    if (!token) return;
    const response = await fetch(api.exportUrl, { headers: { Authorization: `Bearer ${token}` } });
    const blob = new Blob([await response.text()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "habit-checkins.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <header className="page-title">
        <div>
          <h1>Settings</h1>
          <p>Manage profile, timezone, week start, password, and account access.</p>
        </div>
      </header>
      {message && <div className="empty-state">{message}</div>}
      <section className="grid dashboard-grid">
        <form className="panel auth-form" onSubmit={saveProfile}>
          <label className="field">Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="field">Email<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="field">Timezone<input value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label>
          <label className="field">Week starts<select value={weekStart} onChange={(event) => setWeekStart(Number(event.target.value))}><option value="0">Monday</option><option value="6">Sunday</option></select></label>
          <button className="button" type="submit">Save profile</button>
        </form>
        <form className="panel auth-form" onSubmit={savePassword}>
          <label className="field">Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
          <label className="field">New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
          <button className="button" type="submit">Change password</button>
          <button className="button secondary" onClick={exportData} type="button">Export CSV</button>
          <button
            className="button ghost"
            onClick={() => {
              if (confirm("Delete your account and all habit data?")) void deleteAccount();
            }}
            type="button"
          >
            Delete account
          </button>
        </form>
      </section>
    </>
  );
}
