"use client";

import { CalendarDays, Flame, Target } from "lucide-react";
import { BarChart } from "../components/BarChart";
import { ProgressRing } from "../components/ProgressRing";
import { StatCard } from "../components/StatCard";
import { useHabitData } from "../hooks/useHabitData";
import { prettyToday } from "../lib/date";

export default function DashboardPage() {
  const { stats, state, error } = useHabitData();

  if (state === "error") {
    return <div className="error-state">{error}</div>;
  }

  const daily = stats?.daily.percentage ?? 0;

  return (
    <>
      <header className="page-title">
        <div>
          <h1>Dashboard</h1>
          <p>{prettyToday()} progress across daily, weekly, and monthly goals.</p>
        </div>
      </header>
      <section className="grid stat-grid">
        <StatCard
          title="Today"
          value={`${stats?.daily.completed ?? 0}/${stats?.daily.total ?? 0}`}
          helper={`${daily}% complete`}
          icon={Target}
        />
        <StatCard
          title="Weekly"
          value={`${stats?.weekly.percentage ?? 0}%`}
          helper="Seven-day completion"
          icon={CalendarDays}
        />
        <StatCard
          title="Current streak"
          value={`${stats?.streak ?? 0}`}
          helper="Perfect days in a row"
          icon={Flame}
        />
      </section>
      <section className="grid dashboard-grid" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="section-head">
            <h2>Daily progress</h2>
            <span>{stats?.active_habits ?? 0} active habits</span>
          </div>
          <ProgressRing value={daily} label="Today" />
        </div>
        <BarChart title="This week" data={stats?.weekly_series ?? []} />
      </section>
      <section style={{ marginTop: 18 }}>
        <BarChart title="This month" data={stats?.monthly_series ?? []} />
      </section>
    </>
  );
}
