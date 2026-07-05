type ProgressRingProps = {
  value: number;
  label: string;
};

export function ProgressRing({ value, label }: ProgressRingProps) {
  return (
    <div className="ring-wrap" aria-label={`${label}: ${value}%`}>
      <div
        className="ring"
        style={{
          background: `conic-gradient(var(--primary) ${value}%, #fed7aa ${value}% 100%)`,
        }}
      >
        <div>
          <strong>{value}%</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}
