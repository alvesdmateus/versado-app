interface StudySparklineProps {
  data: number[];
  label: string;
  currentValue: string;
  color?: string;
}

export function StudySparkline({
  data,
  label,
  currentValue,
  color = "var(--color-primary-500)",
}: StudySparklineProps) {
  const width = 100;
  const height = 36;
  const padding = 2;

  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
    const y = padding + (1 - v / max) * (height - padding * 2);
    return { x, y };
  });

  const pathD =
    points.length > 1
      ? `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`
      : "";

  const first = points[0];
  const last = points[points.length - 1];
  const areaD =
    points.length > 1 && first && last
      ? `M ${first.x.toFixed(1)},${height} ` +
        points.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
        ` L ${last.x.toFixed(1)},${height} Z`
      : "";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        <span className="text-sm font-semibold text-neutral-900">
          {currentValue}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
      >
        {areaD && (
          <path
            d={areaD}
            fill={color}
            opacity={0.15}
          />
        )}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}
