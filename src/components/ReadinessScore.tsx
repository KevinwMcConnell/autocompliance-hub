import { cn } from "@/lib/utils";

interface ReadinessScoreProps {
  score: number;
  className?: string;
}

export function ReadinessScore({ score, className }: ReadinessScoreProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getScoreColor = () => {
    if (score >= 80) return "text-status-ok";
    if (score >= 60) return "text-status-due-soon";
    return "text-status-overdue";
  };

  const getStrokeColor = () => {
    if (score >= 80) return "stroke-status-ok";
    if (score >= 60) return "stroke-status-due-soon";
    return "stroke-status-overdue";
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg className="w-32 h-32 transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={cn("score-ring transition-all duration-1000", getStrokeColor())}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", getScoreColor())}>{score}%</span>
        <span className="text-xs text-muted-foreground">Ready</span>
      </div>
    </div>
  );
}
