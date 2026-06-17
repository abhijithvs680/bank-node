/**
 * MiniGauge — a compact version of the AI Loan Health Score gauge chart.
 * Uses identical color segments and needle logic as LoanHealthScoreCard.
 * Designed to sit inside tile cards and list rows at a small footprint.
 */

interface MiniGaugeProps {
  /** 0-100 score value */
  score: number;
  /** Short label e.g. "Healthy" */
  label: string;
  /** Size in pixels for the rendered container (default 80) */
  size?: number;
}

// Score → needle angle: score 0 → -60°, score 100 → +120°
// Formula matches LoanHealthScoreCard: angle = -60 + (180 * score / 100)
const scoreToAngle = (score: number) => -60 + (180 * score) / 100;

// Derive label color from score
const getLabelColor = (score: number): string => {
  if (score >= 80) return "#10b981"; // emerald
  if (score >= 65) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

// Derive a human-readable label if not provided
export const getHealthLabel = (consultationId: string): { score: number; label: string } => {
  switch (consultationId) {
    case "6008": return { score: 78, label: "Healthy" };
    case "6009": return { score: 85, label: "Excellent" };
    case "6007": return { score: 64, label: "Moderate" };
    case "1001":
    default:     return { score: 72, label: "Healthy" };
  }
};

export const MiniGauge = ({ score, label, size = 80 }: MiniGaugeProps) => {
  const angle = scoreToAngle(score);
  const labelColor = getLabelColor(score);

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ width: size, minWidth: size }}
      title={`AI Loan Health Score: ${score}/100 — ${label}`}
    >
      {/* SVG Gauge — same 200×135 viewBox as full card, scaled down */}
      <svg
        viewBox="0 0 200 135"
        style={{ width: size, height: size * 0.7 }}
        aria-label={`Health score gauge: ${score}`}
      >
        {/* Segment 1: Red */}
        <path
          d="M 21 112 A 80 80 0 0 1 44 64"
          fill="none"
          stroke="#ef4444"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Segment 2: Orange */}
        <path
          d="M 50 58 A 80 80 0 0 1 96 41"
          fill="none"
          stroke="#f97316"
          strokeWidth="14"
        />
        {/* Segment 3: Yellow */}
        <path
          d="M 104 41 A 80 80 0 0 1 150 58"
          fill="none"
          stroke="#eab308"
          strokeWidth="14"
        />
        {/* Segment 4: Green */}
        <path
          d="M 156 64 A 80 80 0 0 1 179 112"
          fill="none"
          stroke="#22c55e"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Needle */}
        <g transform={`rotate(${angle}, 100, 120)`}>
          <line
            x1="100" y1="120"
            x2="100" y2="54"
            stroke="#1a2256"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <polygon points="100,46 96,56 104,56" fill="#1a2256" />
        </g>

        {/* Center cap */}
        <circle cx="100" cy="120" r="7" fill="#1a2256" />
        <circle cx="100" cy="120" r="3" fill="#ffffff" />

        {/* Score text */}
        <text
          x="100" y="84"
          textAnchor="middle"
          fontWeight="800"
          fontSize="26"
          fill={labelColor}
          fontFamily="Inter, sans-serif"
        >
          {score}
        </text>
        {/* Label text */}
        <text
          x="100" y="103"
          textAnchor="middle"
          fontWeight="700"
          fontSize="13"
          fill={labelColor}
          fontFamily="Inter, sans-serif"
        >
          {label}
        </text>
      </svg>
    </div>
  );
};
