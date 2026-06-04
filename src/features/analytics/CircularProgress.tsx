type Props = {
  label: string;
  value?: number;
};

function CircularProgress({ label, value }: Props) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value ?? 0, 0), 100);
  const dashOffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="circular-progress" role="img" aria-label={`${label}: ${value === undefined ? '—' : `${value}%`}`}>
      <svg viewBox="0 0 104 104" aria-hidden="true">
        <circle className="circular-progress__track" cx="52" cy="52" r={radius} />
        <circle
          className="circular-progress__value"
          cx="52"
          cy="52"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <strong>{value === undefined ? '—' : `${value}%`}</strong>
    </div>
  );
}

export default CircularProgress;
