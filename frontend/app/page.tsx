"use client";

import { CalendarDays, Flame, Target } from "lucide-react";
import { BarChart } from "../components/BarChart";
import { ProgressRing } from "../components/ProgressRing";
import { StatCard } from "../components/StatCard";
import { useHabitData } from "../hooks/useHabitData";
import { prettyToday } from "../lib/date";
import { rewardState } from "../lib/rewards";

export default function DashboardPage() {
  const { habits, checkins, stats, state, error } = useHabitData();

  if (state === "error") {
    return <div className="error-state">{error}</div>;
  }

  const daily = stats?.daily.percentage ?? 0;
  const analytics = stats?.analytics;
  const rewards = rewardState(stats, habits, checkins);

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
        <StatCard
          title="Trend"
          value={`${analytics?.weekly_trend ?? 0}%`}
          helper="Vs previous week"
          icon={Target}
        />
      </section>
      <section className="grid dashboard-grid" style={{ marginTop: 18 }}>
        <div className="panel reward-panel">
          <div className="section-head">
            <h2>Reward engine</h2>
            <span>Level {rewards.level}</span>
          </div>
          <strong>{rewards.xp} XP</strong>
          <div className="xp-track">
            <span style={{ width: `${(rewards.levelProgress / 250) * 100}%` }} />
          </div>
          <p>{rewards.quest}</p>
          <div className="badge-row">
            {rewards.badges.map((badge) => (
              <span className={badge.active ? "badge active" : "badge"} key={badge.label}>
                {badge.label}
              </span>
            ))}
          </div>
        </div>
        <div className="panel reward-panel">
          <div className="section-head">
            <h2>Comeback loop</h2>
            <span>Low friction</span>
          </div>
          <strong>{analytics?.at_risk.length ? "Win the next 2 minutes" : "Momentum protected"}</strong>
          <p>
            {analytics?.at_risk.length
              ? "Start with one tiny check-in. The app will count the comeback."
              : "Nothing is slipping right now."}
          </p>
        </div>
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
      <section className="grid dashboard-grid" style={{ marginTop: 18 }}>
        <div className="panel">
          <div className="section-head">
            <h2>Analytics</h2>
            <span>{analytics?.streak_milestone ?? "Start a streak today"}</span>
          </div>
          <div className="insight-list">
            <p>Best habit: {analytics?.best_habit?.name ?? "None yet"}</p>
            <p>Most missed: {analytics?.most_missed_habit?.name ?? "None yet"}</p>
            <p>Monthly trend: {analytics?.monthly_trend ?? 0}%</p>
          </div>
        </div>
        <div className="panel">
          <div className="section-head">
            <h2>At risk today</h2>
            <span>{analytics?.at_risk.length ?? 0} habits</span>
          </div>
          <div className="habit-list">
            {(analytics?.at_risk ?? []).map((habit) => (
              <div className="empty-state" key={habit.habit_id}>{habit.name}</div>
            ))}
            {analytics?.at_risk.length === 0 && <div className="empty-state">Nothing at risk.</div>}
          </div>
        </div>
      </section>
    </>
  );
}
