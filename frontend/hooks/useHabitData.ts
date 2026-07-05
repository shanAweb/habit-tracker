"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import { api } from "../lib/api";
import { todayIso } from "../lib/date";
import type { CalendarDay, CheckIn, DashboardStats, Habit, NewHabit } from "../lib/types";

type LoadState = "idle" | "loading" | "ready" | "error";

export function useHabitData() {
  const { token, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const date = useMemo(() => todayIso(), []);

  const refresh = useCallback(async () => {
    try {
      if (!token) return;
      setState((current) => (current === "ready" ? current : "loading"));
      const [habitData, checkinData, statData] = await Promise.all([
        api.habits(token),
        api.checkins(date, token),
        api.stats(date, token),
      ]);
      setHabits(habitData);
      setCheckins(checkinData);
      setStats(statData);
      setState("ready");
      setError("");
    } catch (err) {
      if (err instanceof Error && err.message === "Authentication required") {
        logout();
      }
      setState("error");
      setError(err instanceof Error ? err.message : "Unable to load habit data");
    }
  }, [date, logout, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!token) return;
    const socket = new WebSocket(api.wsUrl);
    socket.onmessage = () => void refresh();
    return () => socket.close();
  }, [refresh, token]);

  async function addHabit(habit: NewHabit) {
    if (!token) return;
    await api.createHabit(habit, token);
    await refresh();
  }

  async function updateHabit(habitId: string, habit: NewHabit) {
    if (!token) return;
    await api.updateHabit(habitId, habit, token);
    await refresh();
  }

  async function removeHabit(habitId: string) {
    if (!token) return;
    await api.deleteHabit(habitId, token);
    await refresh();
  }

  async function toggleCheckIn(habitId: string, checked: boolean, note = "") {
    if (checked) {
      if (!token) return;
      await api.createCheckIn(habitId, date, token, note);
    } else {
      if (!token) return;
      await api.deleteCheckIn(habitId, date, token);
    }
    await refresh();
  }

  const loadCalendar = useCallback(async (monthDate = date) => {
    if (!token) return;
    setCalendar(await api.calendar(monthDate, token));
  }, [date, token]);

  return {
    habits,
    checkins,
    stats,
    calendar,
    date,
    state,
    error,
    addHabit,
    updateHabit,
    removeHabit,
    toggleCheckIn,
    loadCalendar,
    refresh,
  };
}
