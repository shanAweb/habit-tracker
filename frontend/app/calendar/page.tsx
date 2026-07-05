"use client";

import { useEffect } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { useHabitData } from "../../hooks/useHabitData";
import { monthStartIso } from "../../lib/date";

export default function CalendarPage() {
  const { calendar, loadCalendar } = useHabitData();
  const { token } = useAuth();

  useEffect(() => {
    void loadCalendar(monthStartIso());
  }, [loadCalendar]);

  async function backfill(habitId: string, date: string) {
    if (!token) return;
    await api.createCheckIn(habitId, date, token, "Backfilled from calendar");
    await loadCalendar(monthStartIso());
  }

  return (
    <>
      <header className="page-title">
        <div>
          <h1>Calendar</h1>
          <p>Review completed and missed habits across the current month.</p>
        </div>
      </header>
      <section className="calendar-grid">
        {calendar.map((day) => (
          <article className="calendar-cell" key={day.date}>
            <strong>{new Date(day.date).getDate()}</strong>
            <span>{day.completed}/{day.due}</span>
            <div>
              {day.habits.slice(0, 3).map((habit) => (
                <button
                  className={`mini-status ${habit.completed ? "done-text" : ""}`}
                  disabled={habit.completed || !habit.due}
                  key={habit.habit_id}
                  onClick={() => backfill(habit.habit_id, day.date)}
                  type="button"
                >
                  {habit.name}
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
