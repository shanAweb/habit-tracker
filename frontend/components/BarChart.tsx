import type { SeriesPoint } from "../lib/types";

type BarChartProps = {
  title: string;
  data: SeriesPoint[];
};

export function BarChart({ title, data }: BarChartProps) {
  return (
    <section className="panel">
      <div className="section-head">
        <h2>{title}</h2>
        <span>Completion %</span>
      </div>
      <div className="bar-chart">
        {data.map((point) => (
          <div className="bar-item" key={point.label}>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ height: `${point.percentage}%` }}
                title={`${point.completed}/${point.total}`}
              />
            </div>
            <span>{point.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
