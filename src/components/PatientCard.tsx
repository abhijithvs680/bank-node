import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, AlertTriangle, Clock, Activity, Target, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '@/types/patient';
import { ExpandableText } from '@/components/ExpandableText';
import { Touchable } from '@/components/ui/touchable';
import { RelativeTime } from '@/components/RelativeTime';

import { getPatientDetailsPath, type PatientFlowType } from '@/utils/patientRoutes';

interface PatientCardProps {
  patient: Patient;
  patientType?: PatientFlowType;
}

export const PatientCard = ({ patient, patientType = 'outpatient' }: PatientCardProps) => {
  const navigate = useNavigate();

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
        return (
          <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 font-semibold px-3 py-1 text-[11px] uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3 mr-1.5" />
            Severe
          </Badge>
        );
      case 'moderate':
        return (
          <Badge className="bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 font-semibold px-3 py-1 text-[11px] uppercase tracking-wider">
            Moderate
          </Badge>
        );
      case 'mild':
        return (
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 font-semibold px-3 py-1 text-[11px] uppercase tracking-wider">
            Mild
          </Badge>
        );
      case 'critical':
        return (
          <Badge className="bg-rose-500 text-white border-transparent hover:bg-rose-600 font-semibold px-3 py-1 text-[11px] uppercase tracking-wider animate-pulse">
            <AlertTriangle className="w-3 h-3 mr-1.5" />
            Critical
          </Badge>
        );
      default:
        return severity ? <Badge variant="outline" className="font-semibold text-[11px] px-3 py-1">{severity}</Badge> : null;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'border-t-rose-500';
      case 'severe':
        return 'border-t-red-500';
      case 'moderate':
        return 'border-t-amber-500';
      case 'mild':
        return 'border-t-emerald-500';
      default:
        return 'border-t-[#1a2256]/30';
    }
  };

  const isPending = patient.consultationStatus === "Pending" || patient.appointmentStatus === "Pending";
  const isCompleted = patient.consultationStatus === "Completed" || patient.appointmentStatus === "Completed";

  const hoverTextClass = isPending ? 'group-hover:text-amber-600' : 'group-hover:text-emerald-600';

  return (
    <Touchable
      onClick={() => navigate(getPatientDetailsPath(patient.consultationId, patientType))}
      className="rounded-[24px]"
    >
      <Card
        className={`p-4 border-t-4 flex flex-col h-full bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[24px] group border-x-0 border-b-0 shadow-sm ${getBorderColor(patient.severity || '')}`}
      >
        {/* Top Section */}
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={`text-[1.125rem] font-semibold text-[#1a2256] truncate transition-colors ${hoverTextClass}`}>
              {patient.firstName || 'Unknown Patient'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[0.75rem] font-semibold text-[#1a2256]/40 uppercase tracking-tighter">ID: {patient.consultationId}</span>
              <div className="w-1 h-1 rounded-full bg-[#1a2256]/20" />
              <div className="flex items-center gap-1 text-[0.75rem] text-[#1a2256]/40">
                <Clock className="w-3 h-3" />
                <span>Today</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-end shrink-0">
            {patient.severity && getSeverityBadge(patient.severity)}
          </div>
        </div>

        {/* Content Blocks */}
        <div className="space-y-2 mb-4 flex-1">
          {/* Symptoms */}
          {patient.symptoms && (
            <div className={`p-3 border rounded-[18px] transition-colors ${isPending ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Activity className={`w-3.5 h-3.5 ${isPending ? 'text-amber-500' : 'text-emerald-500'}`} />
                <p className={`text-[0.69rem] font-semibold uppercase tracking-wider ${isPending ? 'text-amber-600/70' : 'text-emerald-600/70'}`}>Presenting Symptoms</p>
              </div>
              <ExpandableText
                text={patient.symptoms}
                maxLines={2}
                className="text-[0.875rem] text-[#1a2256]/80 leading-relaxed font-medium"
              />
            </div>
          )}

          {/* Purpose of Visit */}
          {patient.purposeOfVisit && (
            <div className={`p-3 border rounded-[18px] transition-colors ${isPending ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Target className={`w-3.5 h-3.5 ${isPending ? 'text-amber-500' : 'text-emerald-500'}`} />
                <p className={`text-[0.69rem] font-semibold uppercase tracking-wider ${isPending ? 'text-amber-600/70' : 'text-emerald-600/70'}`}>Purpose of Visit</p>
              </div>
              <ExpandableText
                text={patient.purposeOfVisit}
                maxLines={2}
                className="text-[0.875rem] text-[#1a2256]/80 leading-relaxed font-medium"
              />
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="mt-auto flex items-center justify-between text-[0.69rem] text-[#1a2256]/40 pt-3 border-t border-[#1a2256]/5 font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className=" px-2 py-0.5 rounded">PID: {patient.patientId || 'N/A'}</span>
          </div>
          <div className={`flex items-center gap-1 transition-colors ${hoverTextClass}`}>
            View Details
            <ChevronRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Card>
    </Touchable>
  );
};
