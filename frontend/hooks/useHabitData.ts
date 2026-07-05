"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { todayIso } from "../lib/date";
import type { CheckIn, DashboardStats, Habit, NewHabit } from "../lib/types";

type LoadState = "idle" | "loading" | "ready" | "error";

export function useHabitData() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const date = useMemo(() => todayIso(), []);

  const refresh = useCallback(async () => {
    try {
      setState((current) => (current === "ready" ? current : "loading"));
      const [habitData, checkinData, statData] = await Promise.all([
        api.habits(),
        api.checkins(date),
        api.stats(date),
      ]);
      setHabits(habitData);
      setCheckins(checkinData);
      setStats(statData);
      setState("ready");
      setError("");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Unable to load habit data");
    }
  }, [date]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const socket = new WebSocket(api.wsUrl);
    socket.onmessage = () => void refresh();
    return () => socket.close();
  }, [refresh]);

  async function addHabit(habit: NewHabit) {
    await api.createHabit(habit);
    await refresh();
  }

  async function removeHabit(habitId: string) {
    await api.deleteHabit(habitId);
    await refresh();
  }

  async function toggleCheckIn(habitId: string, checked: boolean) {
    if (checked) {
      await api.createCheckIn(habitId, date);
    } else {
      await api.deleteCheckIn(habitId, date);
    }
    await refresh();
  }

  return {
    habits,
    checkins,
    stats,
    date,
    state,
    error,
    addHabit,
    removeHabit,
    toggleCheckIn,
    refresh,
  };
}
