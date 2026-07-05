import type { AuthResponse, CalendarDay, CheckIn, DashboardStats, Habit, HabitDetail, NewHabit, PushKeyResponse, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `API request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  wsUrl: API_URL.replace(/^http/, "ws") + "/ws",
  signup: (name: string, email: string, password: string) =>
    request<AuthResponse>("/api/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: (token: string) => request<User>("/api/auth/me", undefined, token),
  updateMe: (user: Pick<User, "name" | "email" | "timezone" | "week_start">, token: string) =>
    request<User>("/api/auth/me", { method: "PUT", body: JSON.stringify(user) }, token),
  changePassword: (current_password: string, new_password: string, token: string) =>
    request<{ message: string }>("/api/auth/password", { method: "PUT", body: JSON.stringify({ current_password, new_password }) }, token),
  deleteMe: (token: string) => request<void>("/api/auth/me", { method: "DELETE" }, token),
  forgotPassword: (email: string) =>
    request<{ message: string; reset_token?: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  habits: (token: string) => request<Habit[]>("/api/habits", undefined, token),
  habitDetail: (id: string, date: string, token: string) =>
    request<HabitDetail>(`/api/habits/${id}?date=${date}`, undefined, token),
  stats: (date: string, token: string) =>
    request<DashboardStats>(`/api/stats?date=${date}`, undefined, token),
  calendar: (date: string, token: string) =>
    request<CalendarDay[]>(`/api/calendar?date=${date}`, undefined, token),
  checkins: (date: string, token: string) =>
    request<CheckIn[]>(`/api/checkins?date=${date}`, undefined, token),
  createHabit: (habit: NewHabit, token: string) =>
    request<Habit>("/api/habits", { method: "POST", body: JSON.stringify(habit) }, token),
  updateHabit: (id: string, habit: NewHabit, token: string) =>
    request<Habit>(`/api/habits/${id}`, { method: "PUT", body: JSON.stringify(habit) }, token),
  deleteHabit: (habitId: string, token: string) =>
    request<void>(`/api/habits/${habitId}`, { method: "DELETE" }, token),
  createCheckIn: (habitId: string, date: string, token: string, note = "") =>
    request<CheckIn>("/api/checkins", { method: "POST", body: JSON.stringify({ habit_id: habitId, date, note }) }, token),
  deleteCheckIn: (habitId: string, date: string, token: string) =>
    request<void>(`/api/checkins/${habitId}?date=${date}`, { method: "DELETE" }, token),
  exportUrl: `${API_URL}/api/export/checkins`,
  pushPublicKey: (token: string) =>
    request<PushKeyResponse>("/api/notifications/public-key", undefined, token),
  subscribePush: (subscription: PushSubscriptionJSON, token: string) =>
    request<{ message: string }>("/api/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    }, token),
  unsubscribePush: (endpoint: string, token: string) =>
    request<{ message: string }>("/api/notifications/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ endpoint }),
    }, token),
  testPush: (token: string) =>
    request<{ sent: number }>("/api/notifications/test", {
      method: "POST",
      body: JSON.stringify({
        title: "Habit reminder test",
        body: "Closed-app push notifications are connected.",
      }),
    }, token),
};
