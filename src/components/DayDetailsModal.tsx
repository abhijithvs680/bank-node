import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MARMedication, MARAdministrationRecord } from "@/types/patient";

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDay: number | null;
  dates: Date[];
  administrationRecords: MARAdministrationRecord[];
  medicationDefinitions: Record<string, MARMedication>;
  onPreviousDay: () => void;
  onNextDay: () => void;
  formatDate: (date: Date) => string;
  formatDateString: (date: Date) => string;
  formatTimeString: (timeStr: string) => string;
  getDayLabel: (index: number) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedDay,
  dates,
  administrationRecords,
  medicationDefinitions,
  onPreviousDay,
  onNextDay,
  formatDate,
  formatDateString,
  formatTimeString,
  getDayLabel,
  getStatusIcon
}) => {
  if (selectedDay === null || !dates[selectedDay]) return null;

  const dayRecords = administrationRecords
    .filter((record) => record.date.toDateString() === dates[selectedDay].toDateString())
    .sort((a, b) => a.time.localeCompare(b.time));

  // Group records by medication name
  const groupedByMedication = dayRecords.reduce((groups, record) => {
    const med = medicationDefinitions[record.medicationId];
    const medName = med?.name || 'Unknown Medication';

    if (!groups[medName]) {
      groups[medName] = {
        medication: med,
        records: []
      };
    }

    groups[medName].records.push(record);
    return groups;
  }, {} as Record<string, { medication: MARMedication | undefined; records: MARAdministrationRecord[] }>);

  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden border-[#e0e3f5] shadow-2xl !flex !flex-col min-h-0 rounded-[24px] [&>button]:text-white">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader className="flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-normal">
                  {getDayLabel(selectedDay)}
                </DialogTitle>
                <p className="text-white/70 text-[13px] font-medium">{formatDate(dates[selectedDay])}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mr-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPreviousDay}
                disabled={selectedDay === 0}
                className="text-white hover:bg-white/10 disabled:opacity-30 rounded-lg h-9 w-9 p-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNextDay}
                disabled={selectedDay >= dates.length - 1}
                className="text-white hover:bg-white/10 disabled:opacity-30 rounded-lg h-9 w-9 p-0"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 medical-scroll bg-white">
          <div className="flex items-center justify-between border-b border-[#f0f3f9] pb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#1a2256]/5 text-[#1a2256] border-none text-[11px] font-bold px-3">
                {Object.keys(groupedByMedication).length} Medications
              </Badge>
              <Badge className="bg-[#64549f]/5 text-[#64549f] border-none text-[11px] font-bold px-3">
                {dayRecords.length} Records
              </Badge>
            </div>
          </div>

          {dayRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Object.entries(groupedByMedication).map(([medName, { medication, records }]) => (
                <div
                  key={medName}
                  className="bg-[#fcfdfe] border border-[#e0e3f5] rounded-[20px] p-5 hover:border-[#64549f]/30 transition-all shadow-sm flex flex-col"
                >
                  <div className="flex-1 space-y-4">
                    <div className="pb-3 border-b border-[#f0f3f9]">
                      <div className="text-[15px] font-bold text-[#1a2256] leading-tight">
                        {medName}
                      </div>
                      <div className="text-[12px] text-[#6e6868] font-bold mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-white border border-[#e0e3f5]">
                          Dose: {medication?.dosage}
                        </span>
                        {medication?.route && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#e0e3f5]">
                            Route: {medication.route}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {records
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((record, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-[14px] border border-[#f0f3f9] group hover:border-[#64549f]/20 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1a2256]/5 flex items-center justify-center text-[#1a2256]">
                                <Clock className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-[#1a2256] text-[14px]">
                                  {formatTime12Hour(record.time)}
                                </div>
                                <div className="text-[11px] font-bold text-[#6e6868] opacity-60">
                                  by {record.administeredBy || 'Unknown'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {getStatusIcon(record.status)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-[#fcfdfe] border border-[#e0e3f5] flex items-center justify-center">
                <Calendar className="w-10 h-10 text-[#e0e3f5]" />
              </div>
              <div>
                <p className="text-[#1a2256] font-bold text-lg">No records found</p>
                <p className="text-[13px] text-[#6e6868] font-medium mt-1">
                  There are no administration records for this specific day.
                </p>
              </div>
            </div>
          )}
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