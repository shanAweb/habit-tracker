"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { CheckIn, Habit } from "../lib/types";

type CheckInListProps = {
  habits: Habit[];
  checkins: CheckIn[];
  category: string;
  onToggle: (habitId: string, checked: boolean, note?: string) => Promise<void>;
};

export function CheckInList({ habits, checkins, category, onToggle }: CheckInListProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const completed = new Set(checkins.map((checkin) => checkin.habit_id));
  const visible = category === "All" ? habits : habits.filter((habit) => habit.category === category);

  if (habits.length === 0) return <div className="empty-state">Add habits before checking in.</div>;
  if (visible.length === 0) return <div className="empty-state">No habits match this category.</div>;

  return (
    <div className="check-list">
      {visible.map((habit) => {
        const done = completed.has(habit.id);
        return (
          <article className={`card check-row ${done ? "complete" : ""}`} key={habit.id}>
            <span className="swatch" style={{ background: habit.color }} />
            <div className="check-meta">
              <strong>{habit.name}</strong>
              <span>{done ? "Done today" : label(habit)}</span>
              {!done && (
                <input
                  className="note-input"
                  placeholder="Optional note"
                  value={notes[habit.id] ?? ""}
                  onChange={(event) => setNotes({ ...notes, [habit.id]: event.target.value })}
                />
              )}
            </div>
            <button
              aria-label={`Toggle ${habit.name}`}
              className={`check-toggle ${done ? "done" : ""}`}
              onClick={() => onToggle(habit.id, !done, notes[habit.id] ?? "")}
              type="button"
            >
              <Check size={26} />
            </button>
          </article>
        );
      })}
    </div>
  );
}

function label(habit: Habit) {
  if (habit.frequency === "weekly") return `${habit.target_count} check-ins this week`;
  if (habit.frequency === "monthly") return `${habit.monthly_target} check-ins this month`;
  if (habit.frequency === "weekdays") return "Scheduled on selected weekdays";
  return "Daily habit";
}
