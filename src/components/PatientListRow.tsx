import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/types/patient";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { Touchable } from "@/components/ui/touchable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getPatientDetailsPath, type PatientFlowType } from "@/utils/patientRoutes";

interface PatientListRowProps {
  patient: Patient;
  patientType?: PatientFlowType;
}

export const PatientListRow = ({ patient, patientType = 'outpatient' }: PatientListRowProps) => {
  const navigate = useNavigate();

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-100 font-semibold px-2 py-0.5 text-[10px] uppercase tracking-wider">
            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
            Severe
          </Badge>
        );
      case 'moderate':
        return (
          <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-semibold px-2 py-0.5 text-[10px] uppercase tracking-wider">
            Moderate
          </Badge>
        );
      case 'mild':
        return (
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-semibold px-2 py-0.5 text-[10px] uppercase tracking-wider">
            Mild
          </Badge>
        );
      case 'critical':
        return (
          <Badge className="bg-rose-500 text-white border-transparent font-semibold px-2 py-0.5 text-[10px] uppercase tracking-wider animate-pulse">
            Critical
          </Badge>
        );
      default:
        return severity ? <Badge variant="outline" className="font-semibold text-[10px]">{severity}</Badge> : null;
    }
  };

  const handleClick = () => {
    navigate(getPatientDetailsPath(patient.consultationId, patientType));
  };

  const fullName = [patient.firstName, patient.surName].filter(Boolean).join(" ") || "Unknown Patient";

  const truncateText = (text: string | undefined, maxLength: number = 80) => {
    if (!text) return "-";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const isPending = patient.consultationStatus === "Pending" || patient.appointmentStatus === "Pending";
  const isCompleted = patient.consultationStatus === "Completed" || patient.appointmentStatus === "Completed";

  const hoverColors = isPending
    ? {
      bg: 'hover:bg-amber-50/50',
      shadow: 'group-hover:shadow-[inset_4px_0_0_0_#f59e0b]',
      text: 'group-hover:text-amber-600',
      chevron: 'group-hover:bg-amber-600',
      mobileBg: 'bg-amber-50/30',
      mobileBorder: 'border-amber-100/50',
      actionText: 'text-amber-600'
    }
    : {
      bg: 'hover:bg-emerald-50/50',
      shadow: 'group-hover:shadow-[inset_4px_0_0_0_#10b981]',
      text: 'group-hover:text-emerald-600',
      chevron: 'group-hover:bg-emerald-600',
      mobileBg: 'bg-emerald-50/30',
      mobileBorder: 'border-emerald-100/50',
      actionText: 'text-emerald-600'
    };

  return (
    <TooltipProvider>
      <Touchable onClick={handleClick} className="group">
        {/* Desktop View - Table Row */}
        <div className={`hidden md:grid grid-cols-[1.5fr,2.5fr,2fr,120px,auto] gap-4 items-center px-8 py-5 bg-white transition-all ${hoverColors.bg} ${hoverColors.shadow}`}>
          {/* Name */}
          <div className="flex flex-col min-w-0">
            <span className={`font-semibold text-[18px] text-[#1a2256] truncate mb-0.5 transition-colors ${hoverColors.text}`}>
              {fullName}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-[#1a2256]/40 uppercase tracking-tighter">ID: {patient.consultationId}</span>
              <div className="w-1 h-1 rounded-full bg-[#1a2256]/10" />
              <span className="text-[15px] font-semibold text-[#1a2256]/40 uppercase tracking-tighter">PID: {patient.patientId || "N/A"}</span>
            </div>
          </div>

          {/* Symptoms */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-[16px] text-[#1a2256]/70 font-medium truncate pr-4">
                {truncateText(patient.symptoms, 100)}
              </div>
            </TooltipTrigger>
            {patient.symptoms && patient.symptoms.length > 40 && (
              <TooltipContent side="bottom" className="max-w-xs bg-[#1a2256] text-white border-none p-4 rounded-xl shadow-xl">
                <p className="text-[15px] leading-relaxed">{patient.symptoms}</p>
              </TooltipContent>
            )}
          </Tooltip>

          {/* Purpose of Visit */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-[16px] text-[#1a2256]/70 font-medium truncate pr-4">
                {truncateText(patient.purposeOfVisit, 100)}
              </div>
            </TooltipTrigger>
            {patient.purposeOfVisit && patient.purposeOfVisit.length > 40 && (
              <TooltipContent side="bottom" className={`max-w-xs text-white border-none p-4 rounded-xl shadow-xl ${isPending ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                <p className="text-[15px] leading-relaxed">{patient.purposeOfVisit}</p>
              </TooltipContent>
            )}
          </Tooltip>

          {/* Severity */}
          <div>
            {patient.severity && getSeverityBadge(patient.severity)}
          </div>

          {/* Chevron */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-[#1a2256]/5 group-hover:text-white transition-all ${hoverColors.chevron}`}>
            <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Mobile View - Stacked Card */}
        <div className={`md:hidden p-5 bg-white border border-[#1a2256]/10 rounded-2xl mb-3 hover:shadow-lg transition-all ${hoverColors.bg}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-[16px] text-[#1a2256] truncate transition-colors ${hoverColors.text}`}>
                {fullName}
              </h3>
              <p className="text-[14px] text-[#1a2256]/40 font-semibold uppercase tracking-tighter mt-1">
                {patient.consultationId} {patient.patientId && `• PID: ${patient.patientId}`}
              </p>
            </div>
            <div className="shrink-0">
              {patient.severity && getSeverityBadge(patient.severity)}
            </div>
          </div>

          {patient.symptoms && (
            <div className={`mb-3 p-3 rounded-xl border transition-colors ${hoverColors.mobileBg} ${hoverColors.mobileBorder}`}>
              <p className={`text-[14px] font-semibold uppercase tracking-wider mb-1 ${isPending ? 'text-amber-600/50' : 'text-emerald-600/50'}`}>Symptoms</p>
              <p className="text-[15px] text-[#1a2256]/80 font-medium line-clamp-2">{patient.symptoms}</p>
            </div>
          )}

          {patient.purposeOfVisit && (
            <div className={`p-3 rounded-xl border transition-colors ${isPending ? 'bg-amber-50/80 border-amber-100' : 'bg-emerald-50/80 border-emerald-100'}`}>
              <p className={`text-[14px] font-semibold uppercase tracking-wider mb-1 ${isPending ? 'text-amber-600/50' : 'text-emerald-600/50'}`}>Purpose of Visit</p>
              <p className="text-[15px] text-[#1a2256]/80 font-medium line-clamp-2">{patient.purposeOfVisit}</p>
            </div>
          )}

          <div className={`flex items-center justify-end mt-4 pt-3 border-t border-[#1a2256]/5 text-[14px] font-semibold uppercase tracking-wider transition-colors ${hoverColors.actionText}`}>
            View Console <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </Touchable>
    </TooltipProvider>
  );
};
