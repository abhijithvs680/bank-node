import { useNavigate } from "react-router-dom";
import { Patient } from "@/types/patient";
import { Touchable } from "@/components/ui/touchable";
import { getPatientDetailsPath } from "@/utils/patientRoutes";

interface PatientListRowIpProps {
  patient: Patient;
}

export const PatientListRowIp = ({ patient }: PatientListRowIpProps) => {
  const navigate = useNavigate();

  const handleRowClick = () => {
    navigate(getPatientDetailsPath(patient.consultationId, "inpatient"));
  };

  const dealName = patient.dealName || `${patient.firstName} ${patient.surName}`;
  const dealId = patient.dealId || `#AG${patient.consultationId}`;
  const borrower = patient.borrower || "ORION MANUFACTURING HOLDINGS LIMITED";
  const arranger = patient.arranger || "Anagha KM";
  const jurisdiction = patient.jurisdiction || "SA";
  const currency = patient.currency || "ZAR";
  const dealStatus = patient.dealStatus || "Pre Financial Close";

  return (
    <Touchable onClick={handleRowClick} className="w-full block">
      <div className="bg-white border border-[#e2e8f0] rounded-xl px-6 py-4 hover:shadow-md transition-all duration-200 mb-2 text-left">
        <div className="grid grid-cols-2 md:grid-cols-[1.5fr,1fr,2fr,1.2fr,1fr,0.8fr,1.5fr] gap-4 items-center">
          {/* Column 1: Deal Name */}
          <div className="min-w-0">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Deal Name</div>
            <div className="text-[14px] font-bold text-slate-800 truncate">{dealName}</div>
          </div>

          {/* Column 2: Deal ID */}
          <div className="min-w-0">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Deal ID</div>
            <div className="text-[14px] font-semibold text-blue-600 hover:underline truncate">{dealId}</div>
          </div>

          {/* Column 3: Borrower */}
          <div className="min-w-0 col-span-2 md:col-span-1">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Borrower</div>
            <div className="text-[14px] font-medium text-slate-700 truncate">{borrower}</div>
          </div>

          {/* Column 4: Arranger */}
          <div className="min-w-0">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Arranger</div>
            <div className="text-[14px] font-medium text-slate-700 truncate">{arranger}</div>
          </div>

          {/* Column 5: Jurisdiction */}
          <div className="min-w-0">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Jurisdiction</div>
            <div className="text-[14px] font-medium text-slate-700 truncate">{jurisdiction}</div>
          </div>

          {/* Column 6: Currency */}
          <div className="min-w-0">
            <div className="md:hidden text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Currency</div>
            <div className="text-[14px] font-medium text-slate-700 truncate">{currency}</div>
          </div>

          {/* Column 7: Status */}
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
