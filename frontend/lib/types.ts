export type Habit = {
  id: string;
  name: string;
  category: string;
  color: string;
  created_at: string;
  active: boolean;
};

export type CheckIn = {
  habit_id: string;
  date: string;
  completed_at: string;
};

export type ProgressSummary = {
  completed: number;
  total: number;
  percentage: number;
};

export type SeriesPoint = ProgressSummary & {
  label: string;
};

export type DashboardStats = {
  daily: ProgressSummary;
  weekly: ProgressSummary;
  monthly: ProgressSummary;
  streak: number;
  active_habits: number;
  today_checkins: CheckIn[];
  weekly_series: SeriesPoint[];
  monthly_series: SeriesPoint[];
};

export type NewHabit = {
  name: string;
  category: string;
  color: string;
};
