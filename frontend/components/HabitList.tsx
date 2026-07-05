import { Trash2 } from "lucide-react";
import Link from "next/link";
import type { Habit } from "../lib/types";

type HabitListProps = {
  habits: Habit[];
  onRemove: (habitId: string) => Promise<void>;
};

export function HabitList({ habits, onRemove }: HabitListProps) {
  if (habits.length === 0) {
    return <div className="empty-state">No habits yet. Add the first one above.</div>;
  }

  return (
    <div className="habit-list">
      {habits.map((habit) => (
        <article className="card habit-row" key={habit.id}>
          <span className="swatch" style={{ background: habit.color }} />
          <div className="habit-meta">
            <strong>{habit.name}</strong>
            <span>
              {habit.category} · {label(habit)}
              {habit.reminder_enabled && habit.reminder_time ? ` · ${habit.reminder_time}` : ""}
            </span>
          </div>
          <Link className="button secondary" href={`/habits/${habit.id}`}>Details</Link>
          <button
            aria-label={`Remove ${habit.name}`}
            className="button ghost"
            onClick={() => onRemove(habit.id)}
            type="button"
          >
            <Trash2 size={17} />
          </button>
        </article>
      ))}
    </div>
  );
}

function label(habit: Habit) {
  if (habit.frequency === "weekly") return `${habit.target_count}x/week`;
  if (habit.frequency === "monthly") return `${habit.monthly_target}x/month`;
  if (habit.frequency === "weekdays") return "selected weekdays";
  return "daily";
}
