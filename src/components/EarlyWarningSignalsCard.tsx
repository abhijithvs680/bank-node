import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Info } from "lucide-react";

interface EarlyWarningSignalsCardProps {
  consultationId: string;
}

export const EarlyWarningSignalsCard = ({ consultationId }: EarlyWarningSignalsCardProps) => {
  const getSignalsData = () => {
    switch (consultationId) {
      case "6007": // Apex Leverage - Moderate Health
        return [
          { text: "Revenue growth slowing", severity: "high" },
          { text: "Covenant headroom reduced", severity: "high" },
          { text: "Credit rating outlook negative", severity: "medium" },
          { text: "Working capital days increasing", severity: "medium" },
          { text: "Debt service coverage ratio (DSCR) headroom thin", severity: "high" },
          { text: "Interest coverage ratio (ICR) trending downwards", severity: "medium" },
          { text: "Leverage ratio close to covenant limit", severity: "medium" }
        ];
      case "6008": // Apollo Energy - Healthy
        return [
          { text: "Revenue growth slowing", severity: "medium" },
          { text: "Working capital days increasing", severity: "medium" },
          { text: "Covenant headroom reduced", severity: "medium" },
          { text: "Leverage ratio close to threshold", severity: "medium" }
        ];
      case "6009": // Project Horizon - Excellent
        return [
          { text: "Covenant headroom reduced", severity: "medium" },
          { text: "Working capital days increasing", severity: "medium" },
          { text: "Interest coverage ratio (ICR) trending downwards", severity: "medium" }
        ];
      case "6006": // Orion Manufacturing - Healthy
      default:
        return [
          { text: "Credit rating outlook negative", severity: "medium" },
          { text: "Working capital days increasing", severity: "medium" },
          { text: "Revenue growth slowing", severity: "medium" },
          { text: "Covenant headroom reduced", severity: "medium" }
        ];
    }
  };

  const signals = getSignalsData();

  return (
    <Card className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-extrabold text-[#1a2256] uppercase tracking-wider font-['Inter']">
              EARLY WARNING SIGNALS
            </span>
            <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
          </div>
        </div>

        {/* Signals List */}
        <div className="divide-y divide-slate-100">
          {signals.length > 0 ? (
            signals.map((signal, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0 text-left"
              >
                <div className="shrink-0">
                  <AlertTriangle
                    className={`w-4 h-4 ${signal.severity === "high"
                      ? "text-red-600 fill-red-500/10"
                      : "text-amber-500 fill-amber-500/10"
                      }`}
                  />
                </div>
                <span className="text-[13.5px] font-semibold text-slate-700 font-['Inter'] leading-normal">
                  {signal.text}
                </span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-slate-400 text-[12.5px] font-medium font-['Inter']">
              No warning signals active.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
