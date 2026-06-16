import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, User, Calendar, Activity } from "lucide-react";
import { MARMedication, MARAdministrationRecord } from "@/types/patient";
import { cn } from "@/lib/utils";

interface MedicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication: MARMedication | null;
  administrationRecords: MARAdministrationRecord[];
}

export const MedicationDetailsModal: React.FC<MedicationDetailsModalProps> = ({
  isOpen,
  onClose,
  medication,
  administrationRecords
}) => {
  if (!medication) return null;

  const getStatusBadge = (status: string) => {
    const badges = {
      given: "bg-medical-success/20 text-medical-success border-medical-success/30",
      held: "bg-medical-danger/20 text-medical-danger border-medical-danger/30",
      refused: "bg-medical-warning/20 text-medical-warning border-medical-warning/30",
      pending: "bg-medical-muted/20 text-muted-foreground border-medical-muted/30",
    };
    return badges[status as keyof typeof badges] || "bg-muted text-muted-foreground";
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Group administration records by date and consolidate duplicate times
  const groupedRecords = administrationRecords.reduce((groups, record) => {
    const dateKey = record.date.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    // Check if this time already exists for this date
    const existingRecord = groups[dateKey].find(r => r.time === record.time);
    if (!existingRecord) {
      groups[dateKey].push(record);
    }

    return groups;
  }, {} as Record<string, MARAdministrationRecord[]>);

  const givenCount = administrationRecords.filter(r => r.status === 'given').length;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl [&>button]:text-white">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              <Pill className="w-5 h-5 text-white/80" />
              {medication.name}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-white max-h-[70vh] overflow-y-auto medical-scroll">
          {/* Medication Info */}
          <div className="bg-[#fcfdfe] border border-[#e0e3f5] rounded-[20px] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#f0f3f9] pb-3">
              <h3 className="font-bold text-[#1a2256]">Medication Information</h3>
            </div>

            <div className="grid grid-cols-2 gap-6 text-[14px]">
              <div>
                <span className="text-[#6e6868] font-medium block mb-1">Dosage</span>
                <p className="font-bold text-[#1a2256]">{medication.dosage}</p>
              </div>
              <div>
                <span className="text-[#6e6868] font-medium block mb-1">Route</span>
                <p className="font-bold text-[#1a2256]">{medication.route || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-[#6e6868] font-medium block mb-1">Frequency</span>
                <p className="font-bold text-[#1a2256]">{medication.frequency}</p>
              </div>
            </div>

            {medication.prescriber && (
              <div className="pt-3 border-t border-[#f0f3f9]">
                <span className="text-[#6e6868] text-[13px] font-medium block mb-1">Prescribed by</span>
                <p className="font-bold text-[#1a2256] flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-[#64549f]" />
                  {medication.prescriber}
                </p>
              </div>
            )}

            {medication.discontinuedReason && (
              <div className="pt-3 border-t border-[#f0f3f9] bg-red-50/50 -mx-5 px-5 py-3 mt-4 rounded-b-[20px]">
                <span className="text-red-600 text-[13px] font-bold block mb-1">Discontinuation Reason</span>
                <p className="font-bold text-red-800">{medication.discontinuedReason}</p>
              </div>
            )}
          </div>

          {/* Administration Summary */}
          <div className="bg-[#fcfdfe] border border-[#e0e3f5] rounded-[20px] p-5 shadow-sm">
            <h3 className="font-bold text-[#1a2256] mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#64549f]" />
              Administration Status
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-[#e0e3f5] p-4 rounded-[16px]">
                <div className="text-2xl font-bold text-green-600">{givenCount}</div>
                <div className="text-[11px] font-bold text-[#6e6868] uppercase tracking-wider mt-1">Given</div>
              </div>
              <div className="bg-white border border-[#e0e3f5] p-4 rounded-[16px]">
                <div className="text-2xl font-bold text-[#64549f]">
                  {administrationRecords.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-[11px] font-bold text-[#6e6868] uppercase tracking-wider mt-1">Pending</div>
              </div>
              <div className="bg-white border border-[#e0e3f5] p-4 rounded-[16px]">
                <div className="text-2xl font-bold text-red-500">
                  {administrationRecords.filter(r => r.status === 'held' || r.status === 'refused').length}
                </div>
                <div className="text-[11px] font-bold text-[#6e6868] uppercase tracking-wider mt-1">Held/Refused</div>
              </div>
            </div>
          </div>

          {/* Administration History */}
          <div className="bg-[#fcfdfe] border border-[#e0e3f5] rounded-[20px] p-5 shadow-sm">
            <h3 className="font-bold text-[#1a2256] mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#64549f]" />
              Historical Records
            </h3>

            {Object.keys(groupedRecords).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(groupedRecords)
                  .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                  .map(([dateKey, records]) => (
                    <div key={dateKey} className="p-4 bg-white border border-[#f0f3f9] rounded-[16px]">
                      <div className="text-[12px] font-bold text-[#6e6868] mb-3 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(dateKey).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="space-y-3">
                        {records
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((record, index) => (
                            <div key={index} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-[#1a2256] text-[14px]">{formatTime(record.time)}</span>
                                <Badge className={cn("rounded-full px-3 text-[10px] font-bold uppercase tracking-tighter border-none", getStatusBadge(record.status))}>
                                  {record.status}
                                </Badge>
                              </div>
                              {record.administeredBy && (
                                <span className="text-[11px] font-bold text-[#6e6868] opacity-60 group-hover:opacity-100 transition-opacity">
                                  {record.administeredBy}
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[#6e6868] font-medium text-sm">No administration records available</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] rounded-b-[24px]">
          <Button
            onClick={onClose}
            className="rounded-[12px] h-11 px-8 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-lg shadow-[#1a2256]/20 transition-all active:scale-[0.98] w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};