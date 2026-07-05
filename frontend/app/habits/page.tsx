"use client";

import { HabitForm } from "../../components/HabitForm";
import { HabitList } from "../../components/HabitList";
import { useHabitData } from "../../hooks/useHabitData";

export default function HabitsPage() {
  const { habits, addHabit, removeHabit, state, error } = useHabitData();

  return (
    <>
      <header className="page-title">
        <div>
          <h1>Habits</h1>
          <p>Add the routines you want to track and remove anything outdated.</p>
        </div>
      </header>
      {state === "error" && <div className="error-state">{error}</div>}
      <div className="grid">
        <HabitForm onAdd={addHabit} />
        <HabitList habits={habits} onRemove={removeHabit} />
      </div>
    </>
  );
}
