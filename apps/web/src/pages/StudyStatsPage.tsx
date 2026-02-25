import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, BarChart3, Target, Layers, Calendar } from "lucide-react";
import { studyApi, type DetailedStats } from "@/lib/study-api";
import { dashboardApi, type DashboardStats } from "@/lib/dashboard-api";

const STATUS_COLORS: Record<string, string> = {
  new: "#94a3b8",
  learning: "#3b82f6",
  relearning: "#f59e0b",
  review: "#8b5cf6",
  mastered: "#22c55e",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  learning: "Learning",
  relearning: "Relearning",
  review: "Review",
  mastered: "Mastered",
};

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-neutral-0 p-4 shadow-card">
      <div className="text-primary-500">{icon}</div>
      <p className="mt-2 text-lg font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function BarChart({ data }: { data: Array<{ date: string; reviews: number }> }) {
  const maxReviews = Math.max(...data.map((d) => d.reviews), 1);

  return (
    <div className="rounded-xl bg-neutral-0 p-4 shadow-card">
      <h3 className="mb-3 text-sm font-semibold text-neutral-700">Daily Reviews</h3>
      <svg viewBox="0 0 300 120" className="w-full" preserveAspectRatio="xMidYMid meet">
        {data.map((d, i) => {
          const height = (d.reviews / maxReviews) * 90;
          const x = i * (300 / data.length) + 2;
          const width = 300 / data.length - 4;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={95 - height}
                width={Math.max(width, 2)}
                height={Math.max(height, 1)}
                rx={2}
                fill={d.reviews > 0 ? "var(--color-primary-400)" : "var(--color-neutral-200)"}
              />
              {i % 2 === 0 && (
                <text
                  x={x + width / 2}
                  y={112}
                  textAnchor="middle"
                  className="fill-neutral-400"
                  fontSize="7"
                >
                  {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function AccuracyChart({ data }: { data: Array<{ date: string; accuracy: number | null }> }) {
  const points = data
    .map((d, i) => ({
      x: (i / (data.length - 1)) * 280 + 10,
      y: d.accuracy !== null ? 90 - (d.accuracy / 100) * 80 : null,
      accuracy: d.accuracy,
    }));

  const validPoints = points.filter((p) => p.y !== null) as Array<{ x: number; y: number; accuracy: number }>;
  if (validPoints.length < 2) {
    return (
      <div className="rounded-xl bg-neutral-0 p-4 shadow-card">
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">Accuracy Trend</h3>
        <p className="text-center text-xs text-neutral-400 py-8">Not enough data yet</p>
      </div>
    );
  }

  const linePath = validPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const lastPoint = validPoints[validPoints.length - 1]!;
  const firstPoint = validPoints[0]!;
  const areaPath = `${linePath} L ${lastPoint.x} 90 L ${firstPoint.x} 90 Z`;

  return (
    <div className="rounded-xl bg-neutral-0 p-4 shadow-card">
      <h3 className="mb-3 text-sm font-semibold text-neutral-700">Accuracy Trend</h3>
      <svg viewBox="0 0 300 100" className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <g key={pct}>
            <line
              x1={10}
              y1={90 - (pct / 100) * 80}
              x2={290}
              y2={90 - (pct / 100) * 80}
              stroke="var(--color-neutral-100)"
              strokeWidth={0.5}
            />
            <text x={4} y={93 - (pct / 100) * 80} className="fill-neutral-300" fontSize="6">
              {pct}
            </text>
          </g>
        ))}
        {/* Area fill */}
        <path d={areaPath} fill="var(--color-primary-100)" opacity={0.5} />
        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--color-primary-500)" strokeWidth={2} />
        {/* Dots */}
        {validPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--color-primary-500)" />
        ))}
      </svg>
    </div>
  );
}

function DonutChart({ distribution }: { distribution: Record<string, number> }) {
  const entries = Object.entries(distribution).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) {
    return (
      <div className="rounded-xl bg-neutral-0 p-4 shadow-card">
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">Card Distribution</h3>
        <p className="text-center text-xs text-neutral-400 py-8">No cards yet</p>
      </div>
    );
  }

  const radius = 40;
  const cx = 60;
  const cy = 50;
  let startAngle = -90;

  const arcs = entries.map(([status, count]) => {
    const angle = (count / total) * 360;
    const endAngle = startAngle + angle;
    const start = polarToCartesian(cx, cy, radius, startAngle);
    const end = polarToCartesian(cx, cy, radius, endAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    startAngle = endAngle;
    return { status, count, path, color: STATUS_COLORS[status] ?? "#94a3b8" };
  });

  return (
    <div className="rounded-xl bg-neutral-0 p-4 shadow-card">
      <h3 className="mb-3 text-sm font-semibold text-neutral-700">Card Distribution</h3>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 120 100" className="h-24 w-24 flex-shrink-0">
          {arcs.map((arc) => (
            <path
              key={arc.status}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth={16}
              strokeLinecap="round"
            />
          ))}
          <text x={cx} y={cy - 2} textAnchor="middle" className="fill-neutral-900" fontSize="14" fontWeight="bold">
            {total}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" className="fill-neutral-400" fontSize="7">
            cards
          </text>
        </svg>
        <div className="flex flex-col gap-1.5">
          {entries.map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] ?? "#94a3b8" }}
              />
              <span className="text-xs text-neutral-600">
                {STATUS_LABELS[status] ?? status} ({count})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function StudyStatsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([studyApi.getDetailedStats(), dashboardApi.getStats()])
      .then(([detailed, dash]) => {
        setStats(detailed);
        setDashboard(dash);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="flex-1 truncate text-center text-lg font-semibold text-neutral-900 pr-14">
          Study Stats
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-200" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 px-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<BarChart3 className="h-5 w-5" />}
              label="Total Sessions"
              value={stats?.totalSessions ?? 0}
            />
            <StatCard
              icon={<Layers className="h-5 w-5" />}
              label="Cards Mastered"
              value={dashboard?.mastered ?? 0}
            />
            <StatCard
              icon={<Target className="h-5 w-5" />}
              label="Accuracy"
              value={`${dashboard?.accuracy ?? 0}%`}
            />
            <StatCard
              icon={<Calendar className="h-5 w-5" />}
              label="Day Streak"
              value={dashboard?.streakDays ?? 0}
            />
          </div>

          {/* Daily reviews bar chart */}
          {stats && <BarChart data={stats.dailyReviews} />}

          {/* Accuracy trend */}
          {stats && <AccuracyChart data={stats.dailyReviews} />}

          {/* Card distribution donut */}
          {stats && <DonutChart distribution={stats.cardDistribution} />}
        </div>
      )}
    </div>
  );
}
