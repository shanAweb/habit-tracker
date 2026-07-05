"use client";

import { CheckInList } from "../../components/CheckInList";
import { useHabitData } from "../../hooks/useHabitData";
import { prettyToday } from "../../lib/date";

export default function CheckInPage() {
  const { habits, checkins, toggleCheckIn, stats, state, error } = useHabitData();

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
      <CheckInList habits={habits} checkins={checkins} onToggle={toggleCheckIn} />
    </>
  );
}
