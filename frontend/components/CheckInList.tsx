import { Check } from "lucide-react";
import type { CheckIn, Habit } from "../lib/types";

type CheckInListProps = {
  habits: Habit[];
  checkins: CheckIn[];
  onToggle: (habitId: string, checked: boolean) => Promise<void>;
};

export function CheckInList({ habits, checkins, onToggle }: CheckInListProps) {
  const completed = new Set(checkins.map((checkin) => checkin.habit_id));

  if (habits.length === 0) {
    return <div className="empty-state">Add habits before checking in.</div>;
  }

  return (
    <div className="check-list">
      {habits.map((habit) => {
        const done = completed.has(habit.id);
        return (
          <article className="card check-row" key={habit.id}>
            <span className="swatch" style={{ background: habit.color }} />
            <div className="check-meta">
              <strong>{habit.name}</strong>
              <span>{done ? "Done today" : "Waiting for today's check-in"}</span>
            </div>
            <button
              aria-label={`Toggle ${habit.name}`}
              className={`check-toggle ${done ? "done" : ""}`}
              onClick={() => onToggle(habit.id, !done)}
              type="button"
            >
              <Check size={22} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
