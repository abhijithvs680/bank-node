import { useNavigate } from "react-router-dom";
import { Patient } from "@/types/patient";
import { Touchable } from "@/components/ui/touchable";

interface DealListRowProps {
  patient: Patient;
}

export const DealListRow = ({ patient }: DealListRowProps) => {
  const navigate = useNavigate();

  const handleRowClick = () => {
    navigate(`/deals/${patient.consultationId}`);
  };

  const getRiskScore = (id: string) => {
    switch (id) {
      case "6008":
        return { score: 78, label: "Low", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "6009":
        return { score: 85, label: "Minimal", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "6007":
        return { score: 64, label: "Medium", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "1001":
      default:
        return { score: 72, label: "Low", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    }
  };

  const dealName = patient.dealName || `${patient.firstName} ${patient.surName}`;
  const dealId = patient.dealId || `#AG${patient.consultationId}`;
  const borrower = patient.borrower || "ORION MANUFACTURING HOLDINGS LIMITED";
  const arranger = patient.arranger || "Anagha KM";
  const currency = patient.currency || "ZAR";
  const dealStatus = patient.dealStatus || "Pre Financial Close";
  const { score, label, color } = getRiskScore(patient.consultationId);

  return (
    <Touchable onClick={handleRowClick} className="w-full block">
      <div className="bg-white border border-[#e2e8f0] rounded-xl px-6 py-3 hover:shadow-md transition-all duration-200 mb-0 text-left">
        <div className="grid grid-cols-2 md:grid-cols-[2.5fr,1.8fr,1.2fr,1.2fr,1fr,1.3fr] gap-4 items-center">
          {/* Column 1: Deal Info (ID on top, Name below) */}
          <div className="min-w-0">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Deal ID</div>
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">{dealId}</div>
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Deal Name</div>
            <div className="text-[14px] font-bold text-slate-800 truncate">{dealName}</div>
          </div>

          {/* Column 2: Borrower */}
          <div className="min-w-0 col-span-2 md:col-span-1">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Borrower</div>
            <div className="text-[14px] font-medium text-slate-700 truncate">{borrower}</div>
          </div>

          {/* Column 3: Arranger */}
          <div className="min-w-0">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Arranger</div>
            <div className="text-[14px] font-medium text-slate-700 truncate">{arranger}</div>
          </div>

          {/* Column 4: Risk Score */}
          <div className="min-w-0">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Risk Score</div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-slate-800">{score}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
                {label}
              </span>
            </div>
          </div>

          {/* Column 5: Currency */}
          <div className="min-w-0">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Currency</div>
            <div className="text-[14px] font-medium text-slate-700 truncate">{currency}</div>
          </div>

          {/* Column 6: Status */}
          <div className="min-w-0 flex items-center gap-1.5 justify-start md:justify-end col-span-2 md:col-span-1">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-2">Status</div>
            <span className="w-2 h-2 bg-blue-600 rounded-sm inline-block shrink-0" />
            <span className="text-[13px] font-bold text-slate-800 truncate">{dealStatus}</span>
          </div>
        </div>
      </div>
    </Touchable>
  );
};
