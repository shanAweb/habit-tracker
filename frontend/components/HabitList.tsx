import { Trash2 } from "lucide-react";
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
            <span>{habit.category}</span>
          </div>
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
