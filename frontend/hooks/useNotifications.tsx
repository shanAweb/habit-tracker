"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import { todayIso } from "../lib/date";
import type { Habit } from "../lib/types";
import { useAuth } from "./useAuth";

type Notice = { id: string; title: string; body: string; createdAt: string; read: boolean };
type NotificationContextValue = {
  notices: Notice[];
  unread: number;
  permission: NotificationPermission | "unsupported";
  pushEnabled: boolean;
  pushConfigured: boolean;
  requestPermission: () => Promise<void>;
  enablePush: () => Promise<void>;
  disablePush: () => Promise<void>;
  testPush: () => Promise<void>;
  markAllRead: () => void;
  clearNotices: () => void;
  celebrate: (title: string, body: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const storageKey = user ? `habit_notices_${user.id}` : "habit_notices";

  useEffect(() => {
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  useEffect(() => {
    if (!token || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    void navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const key = await api.pushPublicKey(token);
      setPushConfigured(key.configured && Boolean(key.public_key));
      setPushEnabled(Boolean(await registration.pushManager.getSubscription()));
    });
  }, [token]);

  useEffect(() => {
    if (!user) return;
    setNotices(JSON.parse(localStorage.getItem(storageKey) ?? "[]"));
  }, [storageKey, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKey, JSON.stringify(notices.slice(0, 60)));
  }, [notices, storageKey, user]);

  const pushNotice = useCallback((title: string, body: string) => {
    const notice = { id: crypto.randomUUID(), title, body, createdAt: new Date().toISOString(), read: false };
    setNotices((current) => [notice, ...current].slice(0, 60));
    void showBrowserNotification(title, body);
  }, []);

  useEffect(() => {
    if (!token) return;
    const activeToken = token;
    let cancelled = false;
    const timers: number[] = [];
    async function schedule() {
      const [habits, checkins] = await Promise.all([
        api.habits(activeToken),
        api.checkins(todayIso(), activeToken),
      ]);
      if (cancelled) return;
      const completed = new Set(checkins.map((item) => item.habit_id));
      habits.filter(canRemind).forEach((habit) => {
        const delay = nextDelay(habit.reminder_time ?? "09:00");
        const timer = window.setTimeout(() => {
          if (!completed.has(habit.id)) {
            pushNotice(`Time for ${habit.name}`, "A quick check-in keeps the streak alive.");
          }
        }, delay);
        timers.push(timer);
      });
    }
    void schedule();
    const interval = window.setInterval(schedule, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      window.clearInterval(interval);
    };
  }, [pushNotice, token]);

  const value = useMemo<NotificationContextValue>(() => ({
    notices,
    unread: notices.filter((notice) => !notice.read).length,
    permission,
    requestPermission: async () => {
      if (typeof Notification === "undefined") return setPermission("unsupported");
      setPermission(await Notification.requestPermission());
    },
    markAllRead: () => setNotices((items) => items.map((item) => ({ ...item, read: true }))),
    clearNotices: () => setNotices([]),
    celebrate: pushNotice,
    pushEnabled,
    pushConfigured,
    enablePush: async () => {
      if (!token) return;
      const browserPermission = await Notification.requestPermission();
      setPermission(browserPermission);
      if (browserPermission !== "granted") return;
      const key = await api.pushPublicKey(token);
      if (!key.public_key) return pushNotice("Push setup missing", "Add VAPID keys on the backend.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key.public_key),
      });
      await api.subscribePush(subscription.toJSON(), token);
      setPushConfigured(key.configured);
      setPushEnabled(true);
      pushNotice("Push enabled", "You can now get reminders when the app is closed.");
    },
    disablePush: async () => {
      if (!token) return;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await api.unsubscribePush(subscription.endpoint, token);
        await subscription.unsubscribe();
      }
      setPushEnabled(false);
    },
    testPush: async () => {
      if (!token) return;
      const result = await api.testPush(token);
      pushNotice("Push test sent", `${result.sent} browser subscription received it.`);
    },
  }), [notices, permission, pushConfigured, pushEnabled, pushNotice, token]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}

function canRemind(habit: Habit) {
  return habit.active && habit.reminder_enabled && Boolean(habit.reminder_time);
}

function nextDelay(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);
  return target.getTime() - Date.now();
}

async function showBrowserNotification(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready : null;
  if (registration) return registration.showNotification(title, { body, icon: "/favicon.ico" });
  return new Notification(title, { body });
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}
