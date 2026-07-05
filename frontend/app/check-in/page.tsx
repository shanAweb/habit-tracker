"use client";

import { useState } from "react";
import { CheckInList } from "../../components/CheckInList";
import { useHabitData } from "../../hooks/useHabitData";
import { prettyToday } from "../../lib/date";

export default function CheckInPage() {
  const { habits, checkins, toggleCheckIn, stats, state, error } = useHabitData();
  const [category, setCategory] = useState("All");
  const categories = ["All", ...Array.from(new Set(habits.map((habit) => habit.category)))];

  return (
    <>
      <header className="page-title">
        <div>
          <h1>Daily Check In</h1>
          <p>{prettyToday()} completion updates the dashboard instantly.</p>
        </div>
        <button className="button secondary" type="button">
          {stats?.daily.percentage ?? 0}% Today
        </button>
      </header>
      {state === "error" && <div className="error-state">{error}</div>}
      <div className="filter-row">
        {categories.map((item) => (
          <button className={`button ${item === category ? "" : "ghost"}`} key={item} onClick={() => setCategory(item)} type="button">
            {item}
          </button>
        ))}
      </div>
      <CheckInList habits={habits} checkins={checkins} category={category} onToggle={toggleCheckIn} />
    </>
  );
}
