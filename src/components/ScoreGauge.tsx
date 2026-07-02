import { cn } from "@/lib/utils";

/**
 * ScoreGauge — the visual anchor of the product. Renders a large numeric
 * lead score with a lime arc showing 0–100 fill.
 *
 * Uses SVG stroke-dasharray to draw the arc so it animates smoothly.
 */
export function ScoreGauge({
  score,
  grade,
  size = 192,
  className,
}: {
  score: number;
  grade?: string | null;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={12}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={12}
          strokeLinecap="round"
          className="stroke-brand transition-[stroke-dasharray] duration-1000 ease-out"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-5xl font-bold text-foreground animate-count-up"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {clamped}
        </span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
          Grade {grade ?? gradeFromScore(clamped)}
        </span>
      </div>
    </div>
  );
}

export function gradeFromScore(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function priorityFromScore(score: number): "Critical" | "High" | "Medium" | "Low" {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}
