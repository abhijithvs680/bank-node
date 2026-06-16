import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Briefcase, User, MapPin, DollarSign, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '@/types/patient';
import { Touchable } from '@/components/ui/touchable';

interface PatientCardProps {
  patient: Patient;
  patientType?: 'inpatient' | 'outpatient';
}

export const PatientCardIp = ({ patient, patientType = 'inpatient' }: PatientCardProps) => {
  const navigate = useNavigate();

  const getRiskScore = (id: string) => {
    switch (id) {
      case "6008":
        return { score: 78, label: "Low", color: "text-emerald-600" };
      case "6009":
        return { score: 85, label: "Minimal", color: "text-emerald-600" };
      case "6007":
        return { score: 64, label: "Medium", color: "text-amber-600" };
      case "6006":
      default:
        return { score: 72, label: "Low", color: "text-emerald-600" };
    }
  };

  const dealName = patient.dealName || `${patient.firstName} ${patient.surName}`;
  const dealId = patient.dealId || `#AG${patient.consultationId}`;
  const borrower = patient.borrower || "ORION MANUFACTURING HOLDINGS LIMITED";
  const arranger = patient.arranger || "Anagha KM";
  const currency = patient.currency || "ZAR";
  const dealStatus = patient.dealStatus || "Pre Financial Close";
  const { score, label, color } = getRiskScore(patient.consultationId);

  const getAvatarGradient = (name: string) => {
    const char = name.trim().charAt(0).toUpperCase() || 'D';
    if (char >= 'A' && char <= 'F') {
      return 'from-blue-600 to-indigo-500';
    } else if (char >= 'G' && char <= 'L') {
      return 'from-emerald-600 to-teal-500';
    } else if (char >= 'M' && char <= 'R') {
      return 'from-violet-600 to-fuchsia-500';
    } else {
      return 'from-purple-600 to-pink-500';
    }
  };

  const isCompleted = dealStatus === "Completed";
  const borderTopColor = isCompleted ? "border-t-emerald-500" : "border-t-blue-600";

  return (
    <Touchable
      onClick={() => navigate(`/ip-details/${patient.consultationId}`)}
      className="rounded-[24px]"
    >
      <Card
        className={`p-5 border-t-4 ${borderTopColor} flex flex-col h-full bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[24px] group border-x-0 border-b-0 shadow-sm text-left`}
      >
        {/* Top Section */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar showing first letter of Deal Name */}
            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(dealName)} text-white flex items-center justify-center text-[18px] font-extrabold shadow-sm shrink-0 uppercase`}>
              {dealName.trim().charAt(0) || 'D'}
            </div>
            <div className="min-w-0">
              <span className="text-[0.75rem] font-bold text-blue-600 uppercase tracking-wider block mb-0.5">
                {dealId}
              </span>
              <h3 className="text-[1.05rem] font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {dealName}
              </h3>
            </div>
          </div>
          <div className="shrink-0">
            <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-semibold px-2.5 py-1 text-[11px] uppercase tracking-wider">
              {dealStatus}
            </Badge>
          </div>
        </div>

        {/* Content Blocks */}
        <div className="space-y-3 mb-4 flex-1">
          {/* Borrower */}
          <div className="p-3 border border-blue-50 bg-blue-50/20 rounded-[14px]">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-[0.69rem] font-bold text-slate-400 uppercase tracking-wider">Borrower</p>
            </div>
            <p className="text-[14px] text-slate-800 font-semibold truncate">{borrower}</p>
          </div>

          {/* Agency */}
          <div className="p-3 border border-slate-100 bg-slate-50/30 rounded-[14px]">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-[0.69rem] font-bold text-slate-400 uppercase tracking-wider">Agency</p>
            </div>
            <p className="text-[14px] text-slate-800 font-medium truncate">{arranger}</p>
          </div>

          {/* Risk Score & Currency */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 border border-slate-100 rounded-[10px] text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Risk Score</span>
              <span className={`text-[13px] font-bold ${color}`}>{score} ({label})</span>
            </div>
            <div className="p-2 border border-slate-100 rounded-[10px] text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Currency</span>
              <span className="text-[13px] font-bold text-slate-700">{currency}</span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto flex items-center justify-between text-[0.69rem] text-slate-400 pt-3 border-t border-slate-100 font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 transition-colors">
            View Checklist
            <ChevronRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Card>
    </Touchable>
  );
};
