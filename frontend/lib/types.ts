export type Frequency = "daily" | "weekdays" | "weekly" | "monthly";

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  color: string;
  created_at: string;
  active: boolean;
  frequency: Frequency;
  weekdays: number[];
  target_count: number;
  monthly_target: number;
  reminder_enabled: boolean;
  reminder_time?: string | null;
};

export type CheckIn = {
  user_id: string;
  habit_id: string;
  date: string;
  completed_at: string;
  note: string;
};

export type ProgressSummary = { completed: number; total: number; percentage: number };
export type SeriesPoint = ProgressSummary & { label: string };
export type HabitInsight = { habit_id: string; name: string; value: number };

export type DashboardStats = {
  daily: ProgressSummary;
  weekly: ProgressSummary;
  monthly: ProgressSummary;
  streak: number;
  active_habits: number;
  today_checkins: CheckIn[];
  weekly_series: SeriesPoint[];
  monthly_series: SeriesPoint[];
  analytics: {
    best_habit?: HabitInsight | null;
    most_missed_habit?: HabitInsight | null;
    weekly_trend: number;
    monthly_trend: number;
    streak_milestone: string;
    at_risk: HabitInsight[];
  };
};

export type NewHabit = Omit<Habit, "id" | "user_id" | "created_at" | "active">;
export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  timezone: string;
  week_start: number;
};
export type AuthResponse = { access_token: string; token_type: string; user: User };

export type HeatmapDay = { date: string; completed: boolean; missed: boolean; note: string };
export type HabitDetail = {
  habit: Habit;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  missed_days: number;
  heatmap: HeatmapDay[];
};
export type CalendarDay = {
  date: string;
  completed: number;
  due: number;
  habits: { habit_id: string; name: string; completed: boolean; due: boolean }[];
};

export type PushKeyResponse = {
  public_key: string;
  configured: boolean;
};
