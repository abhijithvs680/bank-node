import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Info, Eye, TrendingDown, UserX, FileWarning, Banknote, Globe } from "lucide-react";

interface AnomaliesCardProps {
  consultationId: string;
}

type Severity = "critical" | "high" | "medium";

interface Anomaly {
  icon: React.ElementType;
  text: string;
  detail: string;
  severity: Severity;
  detected: string;
}

export const AnomaliesCard = ({ consultationId }: AnomaliesCardProps) => {
  const getAnomaliesData = (): Anomaly[] => {
    return [];
  };

  const anomalies = getAnomaliesData();

  const severityConfig: Record<Severity, { dot: string; badge: string; label: string }> = {
    critical: {
      dot: "bg-red-600",
      badge: "bg-red-50 text-red-700 border-red-200",
      label: "Critical",
    },
    high: {
      dot: "bg-orange-500",
      badge: "bg-orange-50 text-orange-700 border-orange-200",
      label: "High",
    },
    medium: {
      dot: "bg-amber-400",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Medium",
    },
  };

  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const highCount = anomalies.filter((a) => a.severity === "high").length;

  return (
    <Card className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span className="text-[12px] font-extrabold text-[#1a2256] uppercase tracking-wider font-['Inter']">
              Anomalies &amp; Fraud Attempts
            </span>
            <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
          </div>
        </div>

        {/* Summary Badges */}
        {(criticalCount > 0 || highCount > 0) && (
          <div className="flex items-center gap-2 mb-4">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
                {criticalCount} Critical
              </span>
            )}
            {highCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                {highCount} High
              </span>
            )}
          </div>
        )}

        {/* Anomalies List */}
        <div className="divide-y divide-slate-100">
          {anomalies.length > 0 ? (
            anomalies.map((anomaly, idx) => {
              const Icon = anomaly.icon;
              const cfg = severityConfig[anomaly.severity];
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0 text-left"
                >
                  {/* Icon bubble */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    anomaly.severity === "critical"
                      ? "bg-red-50"
                      : anomaly.severity === "high"
                      ? "bg-orange-50"
                      : "bg-amber-50"
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      anomaly.severity === "critical"
                        ? "text-red-600"
                        : anomaly.severity === "high"
                        ? "text-orange-500"
                        : "text-amber-500"
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-slate-800 font-['Inter'] leading-snug">
                        {anomaly.text}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border whitespace-nowrap shrink-0 font-['Inter'] ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[12px] font-medium text-slate-500 font-['Inter'] leading-normal">
                      {anomaly.detail}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 font-['Inter']">
                      Detected: {anomaly.detected}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-[13px] font-medium font-['Inter'] flex flex-col items-center justify-center gap-2">
              <ShieldAlert className="w-8 h-8 text-slate-300" />
              <span>Nothing found</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
