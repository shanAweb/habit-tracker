"use client";

import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const {
    notices,
    unread,
    permission,
    pushEnabled,
    pushConfigured,
    requestPermission,
    enablePush,
    disablePush,
    testPush,
    markAllRead,
    clearNotices,
  } = useNotifications();

  return (
    <div className="notification-box">
      <button className="button secondary notify-trigger" onClick={() => setOpen(!open)} type="button">
        <Bell size={16} /> Notifications {unread > 0 ? `(${unread})` : ""}
      </button>
      {open && (
        <section className="notification-panel">
          <div className="section-head">
            <h2>Notifications</h2>
            <span>{permission}</span>
          </div>
          {permission !== "granted" && permission !== "unsupported" && (
            <button className="button" onClick={requestPermission} type="button">
              Enable browser alerts
            </button>
          )}
          <div className="empty-state">
            Push is {pushConfigured ? "configured" : "not configured"} and {pushEnabled ? "enabled" : "disabled"}.
          </div>
          <div className="notice-actions">
            <button className="button" onClick={enablePush} type="button">
              Enable closed-app push
            </button>
            <button className="button secondary" onClick={testPush} type="button">
              Test push
            </button>
            <button className="button ghost" onClick={disablePush} type="button">
              Disable
            </button>
          </div>
          <div className="notice-actions">
            <button className="button ghost" onClick={markAllRead} type="button">
              <CheckCheck size={15} /> Read
            </button>
            <button className="button ghost" onClick={clearNotices} type="button">
              <Trash2 size={15} /> Clear
            </button>
          </div>
          <div className="notice-list">
            {notices.map((notice) => (
              <article className={`notice ${notice.read ? "" : "unread"}`} key={notice.id}>
                <strong>{notice.title}</strong>
                <p>{notice.body}</p>
              </article>
            ))}
            {notices.length === 0 && <div className="empty-state">No notifications yet.</div>}
          </div>
        </section>
      )}
    </div>
  );
}
