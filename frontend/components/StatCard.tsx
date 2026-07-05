import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

export function StatCard({ title, value, helper, icon: Icon }: StatCardProps) {
  return (
    <section className="card stat-card">
      <div className="stat-icon">
        <Icon size={19} />
      </div>
      <p>{title}</p>
      <strong>{value}</strong>
      <span>{helper}</span>
    </section>
  );
}
