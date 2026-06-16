import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, BarChart2, DollarSign, Banknote, PieChart, ArrowUp, ArrowDown, Info } from "lucide-react";

interface DisbursementChangesCardProps {
  consultationId: string;
}

interface MetricItem {
  name: string;
  value: string;
  direction: "up" | "down" | "flat";
  color: "green" | "red" | "slate";
  icon: React.ReactNode;
}

export const DisbursementChangesCard = ({ consultationId }: DisbursementChangesCardProps) => {
  const getMetricsData = (): MetricItem[] => {
    const iconClass = "w-4 h-4 text-slate-700";

    switch (consultationId) {
      case "6007": // Apex Leverage (Matches the user's uploaded image exactly)
        return [
          {
            name: "Revenue",
            value: "+8%",
            direction: "up",
            color: "green",
            icon: <TrendingUp className={iconClass} />
          },
          {
            name: "EBITDA Margin",
            value: "-2%",
            direction: "down",
            color: "red",
            icon: <BarChart2 className={iconClass} />
          },
          {
            name: "Total Debt",
            value: "+15%",
            direction: "up",
            color: "green",
            icon: <div className="w-4 h-4 rounded-full border-[1.5px] border-slate-700 flex items-center justify-center font-bold text-[9px] text-slate-700 leading-none">$</div>
          },
          {
            name: "Cash & Equivalents",
            value: "+12%",
            direction: "up",
            color: "green",
            icon: <Banknote className={iconClass} />
          },
          {
            name: "Debt / EBITDA",
            value: "+0.6x",
            direction: "up",
            color: "green",
            icon: <PieChart className={iconClass} />
          }
        ];
      case "6008": // Apollo Energy
        return [
          {
            name: "Revenue",
            value: "+12%",
            direction: "up",
            color: "green",
            icon: <TrendingUp className={iconClass} />
          },
          {
            name: "EBITDA Margin",
            value: "+1%",
            direction: "up",
            color: "green",
            icon: <BarChart2 className={iconClass} />
          },
          {
            name: "Total Debt",
            value: "-4%",
            direction: "down",
            color: "red",
            icon: <div className="w-4 h-4 rounded-full border-[1.5px] border-slate-700 flex items-center justify-center font-bold text-[9px] text-slate-700 leading-none">$</div>
          },
          {
            name: "Cash & Equivalents",
            value: "+8%",
            direction: "up",
            color: "green",
            icon: <Banknote className={iconClass} />
          },
          {
            name: "Debt / EBITDA",
            value: "-0.2x",
            direction: "down",
            color: "red",
            icon: <PieChart className={iconClass} />
          }
        ];
      case "6009": // Project Horizon
        return [
          {
            name: "Revenue",
            value: "+18%",
            direction: "up",
            color: "green",
            icon: <TrendingUp className={iconClass} />
          },
          {
            name: "EBITDA Margin",
            value: "+3%",
            direction: "up",
            color: "green",
            icon: <BarChart2 className={iconClass} />
          },
          {
            name: "Total Debt",
            value: "+2%",
            direction: "up",
            color: "green",
            icon: <div className="w-4 h-4 rounded-full border-[1.5px] border-slate-700 flex items-center justify-center font-bold text-[9px] text-slate-700 leading-none">$</div>
          },
          {
            name: "Cash & Equivalents",
            value: "+25%",
            direction: "up",
            color: "green",
            icon: <Banknote className={iconClass} />
          },
          {
            name: "Debt / EBITDA",
            value: "-0.4x",
            direction: "down",
            color: "red",
            icon: <PieChart className={iconClass} />
          }
        ];
      case "6006": // Orion Manufacturing
      default:
        return [
          {
            name: "Revenue",
            value: "+6%",
            direction: "up",
            color: "green",
            icon: <TrendingUp className={iconClass} />
          },
          {
            name: "EBITDA Margin",
            value: "-1%",
            direction: "down",
            color: "red",
            icon: <BarChart2 className={iconClass} />
          },
          {
            name: "Total Debt",
            value: "+5%",
            direction: "up",
            color: "green",
            icon: <div className="w-4 h-4 rounded-full border-[1.5px] border-slate-700 flex items-center justify-center font-bold text-[9px] text-slate-700 leading-none">$</div>
          },
          {
            name: "Cash & Equivalents",
            value: "+3%",
            direction: "up",
            color: "green",
            icon: <Banknote className={iconClass} />
          },
          {
            name: "Debt / EBITDA",
            value: "+0.2x",
            direction: "up",
            color: "green",
            icon: <PieChart className={iconClass} />
          }
        ];
    }
  };

  const metrics = getMetricsData();

  return (
    <Card className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-extrabold text-[#1a2256] uppercase tracking-wider font-['Inter']">
              WHAT'S CHANGED SINCE LAST DISBURSEMENT
            </span>
            <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
          </div>
        </div>

        {/* Metrics List */}
        <div className="divide-y divide-slate-100">
          {metrics.map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              {/* Left Side: Icon + Metric Name */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100/50 flex items-center justify-center shrink-0">
                  {metric.icon}
                </div>
                <span className="text-[13.5px] font-semibold text-slate-700 font-['Inter']">
                  {metric.name}
                </span>
              </div>

              {/* Right Side: Trend Arrow + Value */}
              <div className="flex items-center gap-1.5 font-['Inter']">
                {metric.direction === "up" && (
                  <ArrowUp className={`w-4 h-4 ${metric.color === "green" ? "text-emerald-600" : "text-slate-600"}`} />
                )}
                {metric.direction === "down" && (
                  <ArrowDown className={`w-4 h-4 ${metric.color === "red" ? "text-red-600" : "text-slate-600"}`} />
                )}
                <span
                  className={`text-[14px] font-bold ${metric.color === "green"
                      ? "text-emerald-600"
                      : metric.color === "red"
                        ? "text-red-600"
                        : "text-slate-600"
                    }`}
                >
                  {metric.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
