"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";
import { todayIso } from "../../../lib/date";
import type { HabitDetail } from "../../../lib/types";
import { useAuth } from "../../../hooks/useAuth";

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [detail, setDetail] = useState<HabitDetail | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    void api.habitDetail(id, todayIso(), token).then(setDetail);
  }, [id, token]);

  if (!detail) return <div className="panel">Loading...</div>;

  return (
    <>
      <header className="page-title">
        <div>
          <h1>{detail.habit.name}</h1>
          <p>{detail.habit.category} habit detail and recent performance.</p>
        </div>
      </header>
      <section className="grid stat-grid">
        <div className="card"><strong>{detail.current_streak}</strong><span>Current streak</span></div>
        <div className="card"><strong>{detail.longest_streak}</strong><span>Longest streak</span></div>
        <div className="card"><strong>{detail.completion_rate}%</strong><span>Completion rate</span></div>
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="section-head">
          <h2>Heatmap</h2>
          <span>{detail.missed_days} missed days</span>
        </div>
        <div className="heatmap">
          {detail.heatmap.map((day) => (
            <span
              className={day.completed ? "heat done" : day.missed ? "heat missed" : "heat"}
              key={day.date}
              title={`${day.date}${day.note ? `: ${day.note}` : ""}`}
            />
          ))}
        </div>
      </section>
    </>
  );
}
