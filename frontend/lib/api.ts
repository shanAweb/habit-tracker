import type { CheckIn, DashboardStats, Habit, NewHabit } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  wsUrl: API_URL.replace(/^http/, "ws") + "/ws",
  habits: () => request<Habit[]>("/api/habits"),
  stats: (date: string) => request<DashboardStats>(`/api/stats?date=${date}`),
  checkins: (date: string) => request<CheckIn[]>(`/api/checkins?date=${date}`),
  createHabit: (habit: NewHabit) =>
    request<Habit>("/api/habits", {
      method: "POST",
      body: JSON.stringify(habit),
    }),
  deleteHabit: (habitId: string) =>
    request<void>(`/api/habits/${habitId}`, { method: "DELETE" }),
  createCheckIn: (habitId: string, date: string) =>
    request<CheckIn>("/api/checkins", {
      method: "POST",
      body: JSON.stringify({ habit_id: habitId, date }),
    }),
  deleteCheckIn: (habitId: string, date: string) =>
    request<void>(`/api/checkins/${habitId}?date=${date}`, { method: "DELETE" }),
};
