import type { CheckIn, DashboardStats, Habit } from "./types";

export function rewardState(stats: DashboardStats | null, habits: Habit[], checkins: CheckIn[]) {
  const xp = checkins.length * 25 + (stats?.streak ?? 0) * 15;
  const level = Math.floor(xp / 250) + 1;
  const levelProgress = xp % 250;
  const dailyComplete = stats?.daily.total ? stats.daily.percentage : 0;
  const badges = [
    { label: "First spark", active: checkins.length > 0 },
    { label: "Three day chain", active: (stats?.streak ?? 0) >= 3 },
    { label: "Perfect day", active: dailyComplete === 100 && habits.length > 0 },
    { label: "Collector", active: habits.length >= 5 },
  ];
  return {
    xp,
    level,
    levelProgress,
    badges,
    quest: dailyComplete === 100 ? "Quest complete" : "Complete every due habit today",
  };
}
