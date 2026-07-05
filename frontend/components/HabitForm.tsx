"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import type { Frequency, NewHabit } from "../lib/types";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function HabitForm({ onAdd }: { onAdd: (habit: NewHabit) => Promise<void> }) {
  const [habit, setHabit] = useState<NewHabit>({
    name: "",
    category: "Personal",
    color: "#f97316",
    frequency: "daily",
    weekdays: [0, 1, 2, 3, 4],
    target_count: 3,
    monthly_target: 20,
    reminder_enabled: false,
    reminder_time: "09:00",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!habit.name.trim()) return;
    setSaving(true);
    try {
      await onAdd(habit);
      setHabit({ ...habit, name: "", category: "Personal" });
    } finally {
      setSaving(false);
    }
  }

  function patch(update: Partial<NewHabit>) {
    setHabit((current) => ({ ...current, ...update }));
  }

  return (
    <form className="panel habit-form" onSubmit={handleSubmit}>
      <label className="field">
        Habit
        <input value={habit.name} onChange={(event) => patch({ name: event.target.value })} />
      </label>
      <label className="field">
        Category
        <input value={habit.category} onChange={(event) => patch({ category: event.target.value })} />
      </label>
      <label className="field">
        Frequency
        <select value={habit.frequency} onChange={(event) => patch({ frequency: event.target.value as Frequency })}>
          <option value="daily">Daily</option>
          <option value="weekdays">Specific weekdays</option>
          <option value="weekly">X times per week</option>
          <option value="monthly">Monthly goal</option>
        </select>
      </label>
      {habit.frequency === "weekdays" && (
        <div className="weekday-row">
          {weekdays.map((day, index) => (
            <label key={day}>
              <input
                checked={habit.weekdays.includes(index)}
                onChange={(event) => patch({
                  weekdays: event.target.checked
                    ? [...habit.weekdays, index]
                    : habit.weekdays.filter((item) => item !== index),
                })}
                type="checkbox"
              />
              {day}
            </label>
          ))}
        </div>
      )}
      {habit.frequency === "weekly" && (
        <label className="field">
          Times per week
          <input type="number" min="1" max="7" value={habit.target_count} onChange={(event) => patch({ target_count: Number(event.target.value) })} />
        </label>
      )}
      {habit.frequency === "monthly" && (
        <label className="field">
          Monthly goal
          <input type="number" min="1" max="31" value={habit.monthly_target} onChange={(event) => patch({ monthly_target: Number(event.target.value) })} />
        </label>
      )}
      <label className="field">
        Reminder
        <input type="time" value={habit.reminder_time ?? "09:00"} onChange={(event) => patch({ reminder_time: event.target.value, reminder_enabled: true })} />
      </label>
      <button className="button" disabled={saving} type="submit">
        <Plus size={17} /> {saving ? "Adding" : "Add"}
      </button>
    </form>
  );
}
