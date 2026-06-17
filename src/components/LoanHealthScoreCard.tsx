import { Card, CardContent } from "@/components/ui/card";
import { Info, ArrowRight } from "lucide-react";

interface LoanHealthScoreCardProps {
  consultationId: string;
}

export const LoanHealthScoreCard = ({ consultationId }: { consultationId: string }) => {
  const getLoanHealthData = () => {
    switch (consultationId) {
      case "6008": // Apollo Syndication
        return {
          score: 78,
          label: "Healthy",
          labelColor: "fill-emerald-600",
          bgColor: "bg-emerald-50/50 border-emerald-100/50 text-emerald-800",
          trend: "Stable",
          comment: "Strong liquidity and covenant compliance offset moderate leverage concerns."
        };
      case "6009": // Project Horizon
        return {
          score: 85,
          label: "Excellent",
          labelColor: "fill-emerald-600",
          bgColor: "bg-emerald-50/50 border-emerald-100/50 text-emerald-800",
          trend: "Improving",
          comment: "Robust cash reserve account and government guarantees support high debt service coverage."
        };
      case "6007": // Apex Leverage
        return {
          score: 64,
          label: "Moderate",
          labelColor: "fill-amber-600",
          bgColor: "bg-amber-50/50 border-amber-100/50 text-amber-800",
          trend: "Declining",
          comment: "Elevated LBO leverage and lease obligations are offset by solid e-commerce cash flows."
        };
      case "1001": // Orion Manufacturing
      default:
        return {
          score: 72,
          label: "Healthy",
          labelColor: "fill-emerald-600",
          bgColor: "bg-amber-50/60 border-amber-100/60 text-amber-800",
          trend: "Stable",
          comment: "Underlying financials remain stable but 2 open covenant breaches (BR-1005, BR-1008) and overdue Q1/Q2 reporting increase near-term risk. Active monitoring required."
        };
    }
  };

  const data = getLoanHealthData();

  // Calculate rotation angle for needle.
  // 0 is at -90 degrees (left), 100 is at 90 degrees (right).
  // 50 is pointing straight up (0 degrees).
  const needleAngle = -60 + (180 * data.score) / 100;

  return (
    <Card className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
      <CardContent className="p-5 text-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-[#1a2256] uppercase tracking-wider">
              Deal Health Score
            </span>
            <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
          </div>
        </div>

        {/* Gauge Chart Area */}
        <div className="relative flex justify-center items-center h-[130px] w-full mt-2">
          <svg className="w-full h-full max-w-[220px]" viewBox="0 0 200 135">
            {/* Background Track/Segments */}
            {/* Segment 1: Red (approx 174 to 136 deg) */}
            <path
              d="M 21 112 A 80 80 0 0 1 44 64"
              fill="none"
              stroke="#ef4444"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Segment 2: Orange (approx 131 to 93 deg) */}
            <path
              d="M 50 58 A 80 80 0 0 1 96 41"
              fill="none"
              stroke="#f97316"
              strokeWidth="12"
            />
            {/* Segment 3: Yellow (approx 87 to 49 deg) */}
            <path
              d="M 104 41 A 80 80 0 0 1 150 58"
              fill="none"
              stroke="#eab308"
              strokeWidth="12"
            />
            {/* Segment 4: Green (approx 44 to 6 deg) */}
            <path
              d="M 156 64 A 80 80 0 0 1 179 112"
              fill="none"
              stroke="#22c55e"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Needle Pointer Group */}
            <g transform={`rotate(${needleAngle}, 100, 120)`}>
              <line
                x1="100"
                y1="120"
                x2="100"
                y2="52"
                stroke="#1a2256"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <polygon points="100,44 96,54 104,54" fill="#1a2256" />
            </g>

            {/* Center Cap */}
            <circle cx="100" cy="120" r="6.5" fill="#1a2256" />
            <circle cx="100" cy="120" r="2.5" fill="#ffffff" />

            {/* Central Score Text Overlay inside SVG */}
            <text x="100" y="82" textAnchor="middle" className="font-extrabold text-[28px] fill-[#10b981] select-none font-['Inter']">
              {data.score}
            </text>

            <text x="100" y="100" textAnchor="middle" className={`font-extrabold text-[13px] ${data.labelColor} select-none font-['Inter']`}>
              {data.label}
            </text>
          </svg>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center justify-center gap-1 mt-1 mb-4 text-[12px] font-bold text-slate-600">
          <span>Trend: {data.trend}</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
        </div>

        {/* Comment Box */}
        {data.comment && (
          <div className={`rounded-xl border p-3 text-[12px] font-semibold leading-relaxed text-left ${data.bgColor}`}>
            {data.comment}
          </div>
        )}

        {/* Divider */}
        <div className="h-[1px] bg-slate-100 my-4" />

        {/* Top Risk Drivers Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-extrabold text-[#1a2256] uppercase tracking-wider font-['Inter']">
              TOP RISK DRIVERS
            </span>
            <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
          </div>
        </div>

        {/* Top Risk Drivers List */}
        <div className="space-y-2">
          {[
            { num: 1, text: "Repeated DSCR covenant breach", impact: "High Impact", color: "bg-red-600", badge: "text-red-600 bg-red-50 border-red-100" },
            { num: 2, text: "Principal repayment overdue", impact: "High Impact", color: "bg-red-600", badge: "text-red-600 bg-red-50 border-red-100" },
            { num: 3, text: "Leverage ratio above threshold", impact: "Medium Impact", color: "bg-orange-500", badge: "text-orange-600 bg-orange-50 border-orange-100" },
            { num: 4, text: "Delayed interest payments", impact: "Medium Impact", color: "bg-orange-500", badge: "text-orange-600 bg-orange-50 border-orange-100" },
            { num: 5, text: "Missing financial reporting", impact: "Medium Impact", color: "bg-orange-500", badge: "text-orange-600 bg-orange-50 border-orange-100" },
            { num: 6, text: "Expired insurance on pledged assets", impact: "Low Impact", color: "bg-yellow-500", badge: "text-green-600 bg-green-50 border-green-100" },
            { num: 7, text: "Repeated reporting non-compliance", impact: "Low Impact", color: "bg-green-600", badge: "text-green-600 bg-green-50 border-green-100" },
            { num: 8, text: "Pending borrower remediation plan", impact: "Low Impact", color: "bg-green-600", badge: "text-green-600 bg-green-50 border-green-100" }
          ].map((driver) => (
            <div key={driver.num} className="flex items-center justify-between gap-3 py-1 bg-slate-50/20 hover:bg-slate-50 px-2 rounded-xl border border-slate-100/50 transition-all">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold shrink-0 ${driver.color} font-['Inter']`}>
                  {driver.num}
                </div>
                <span className="text-[12.5px] font-semibold text-slate-700 text-left truncate font-['Inter']">
                  {driver.text}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border whitespace-nowrap font-['Inter'] ${driver.badge}`}>
                {driver.impact}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
