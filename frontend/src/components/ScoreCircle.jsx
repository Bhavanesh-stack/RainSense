import { useMemo } from 'react';

export default function ScoreCircle({ score, size = 140, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = useMemo(() => {
    if (score >= 80) return { stroke: '#10b981', bg: '#ecfdf5', text: '#065f46' };
    if (score >= 50) return { stroke: '#f59e0b', bg: '#fffbeb', text: '#92400e' };
    return { stroke: '#ef4444', bg: '#fef2f2', text: '#991b1b' };
  }, [score]);

  const category = score >= 80 ? 'Highly Suitable' : score >= 50 ? 'Moderately Suitable' : 'Low Suitability';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="score-ring"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-display font-bold" style={{ color: color.text }}>
            {score}
          </span>
          <span className="text-xs text-gray-400 font-medium">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: color.bg, color: color.text }}>
        {category}
      </span>
    </div>
  );
}
