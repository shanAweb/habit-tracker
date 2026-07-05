"use client";

import { useState } from "react";
import { HabitForm } from "../../components/HabitForm";
import { HabitList } from "../../components/HabitList";
import { useHabitData } from "../../hooks/useHabitData";

export default function HabitsPage() {
  const { habits, addHabit, removeHabit, state, error } = useHabitData();
  const [category, setCategory] = useState("All");
  const categories = ["All", ...Array.from(new Set(habits.map((habit) => habit.category)))];
  const visible = category === "All" ? habits : habits.filter((habit) => habit.category === category);

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
        <div className="filter-row">
          {categories.map((item) => (
            <button
              className={`button ${item === category ? "" : "ghost"}`}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <HabitForm onAdd={addHabit} />
        <HabitList habits={visible} onRemove={removeHabit} />
      </div>
    </>
  );
}
