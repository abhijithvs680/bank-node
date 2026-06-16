import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Pill, Check, Maximize2, Minimize2, X } from "lucide-react";
import { PreviousPrescriptionSet, PreviousPrescriptionItem } from "@/types/doctorAssistant";
import { apiService } from "@/services/apiService";
import { cn } from "@/lib/utils";

interface PreviousPrescriptionsSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  consultationId: string;
  onImportSet: (medications: PreviousPrescriptionItem[]) => void;
}
export const PreviousPrescriptionsSidebar: React.FC<PreviousPrescriptionsSidebarProps> = ({
  isOpen,
  onOpenChange,
  consultationId,
  onImportSet,
}) => {
  const [loading, setLoading] = useState(false);
  const [prescriptionSets, setPrescriptionSets] = useState<PreviousPrescriptionSet[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isOpen && consultationId) {
      loadPreviousPrescriptions();
    }
  }, [isOpen, consultationId]);

  const loadPreviousPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPreviousPrescriptions(consultationId);

      if (Array.isArray(data)) {
        // Group medications by date
        const groups: Record<string, PreviousPrescriptionItem[]> = {};

        data.forEach((item: any) => {
          // Extract date from StartDate (e.g., "11-03-2026 12:12:21")
          let dateStr = "Unknown Date";
          if (item.StartDate) {
            dateStr = item.StartDate.split(' ')[0]; // Group by day
          } else if (item.CreatedOn) {
            dateStr = item.CreatedOn.split(' ')[0];
          }

          if (!groups[dateStr]) {
            groups[dateStr] = [];
          }

          groups[dateStr].push({
            id: item.PrescriptionID || item.rowID,
            name: item.MedicationName || 'Unknown Medication',
            dosage: item.Dosage || '',
            frequency: item.Frequency || '',
            duration: item.Duration || '',
            instructions: item.Instructions || ''
          });
        });

        // Convert groups to sorted array of prescription sets
        const sets: PreviousPrescriptionSet[] = Object.keys(groups)
          .sort((a, b) => {
            // Very simple date string sort descending (assuming DD-MM-YYYY or YYYY-MM-DD)
            // For more robust sorting, we'd need to parse the date properly
            return b.localeCompare(a);
          })
          .map(date => ({
            date: date,
            medications: groups[date]
          }));

        setPrescriptionSets(sets);
      } else {
        setPrescriptionSets([]);
      }
    } catch (error) {
      console.error('Error loading previous prescriptions:', error);
      setPrescriptionSets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (set: PreviousPrescriptionSet, idx: number) => {
    setImportingId(String(idx));
    onImportSet(set.medications);

    setTimeout(() => {
      setImportingId(null);
      onOpenChange(false);
    }, 800);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setIsExpanded(false); // Reset expansion on close
    }}>
      <SheetContent
        className={cn(
          "p-0 flex flex-col gap-0 border-l border-[#e2e4f0] shadow-2xl transition-[width,max-width] duration-300 ease-in-out overflow-hidden forced-colors:border-white",
          isExpanded ? "!max-w-none" : ""
        )}
        style={{
          width: isExpanded ? '98vw' : 'min(95vw, 600px)',
          maxWidth: isExpanded ? '98vw' : 'min(95vw, 600px)'
        }}
      >
        <SheetHeader className="px-6 py-3 bg-white border-b border-[#e2e4f0] shrink-0 flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-[18px] font-bold text-[#1a2256] flex items-center gap-2">
              Previous Prescriptions
            </SheetTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 text-[#64549f]/60 hover:text-[#64549f] hover:bg-red-50 hover:text-red-500 rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </SheetHeader>

        <div className="flex-1 overflow-hidden bg-[#f8f9fd]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#64549f]/20 mb-4" />
              <p className="text-[#64549f] font-medium opacity-60">Retrieving prescription history...</p>
            </div>
          ) : prescriptionSets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Pill className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#1a2256] mb-1">No Previous Prescriptions</h3>
              <p className="text-gray-400 text-[13px] max-w-[240px]">We couldn't find any historical prescription records for this patient.</p>
            </div>
          ) : (
            <ScrollArea className="h-full px-6 py-6">
              <div className="space-y-8">
                {prescriptionSets.map((set, setIdx) => (
                  <div key={setIdx} className="relative pl-6 border-l-2 border-[#64549f]/10 pb-4">
                    {/* Date circle */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#64549f] border-4 border-white shadow-sm" />

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] font-bold text-[#1a2256] flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#64549f]/60" />
                        {set.date}
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-[#e2e4f0] overflow-hidden shadow-sm mb-3">
                      <table className="w-full border-collapse table-fixed">
                        <thead>
                          <tr className="bg-[#fcfdff] border-b border-[#e2e4f0]">
                            <th className="w-[40%] py-1.5 px-3 text-left text-[10px] font-bold text-[#64549f]/60 uppercase tracking-wider">Medicine</th>
                            <th className="w-[20%] py-1.5 px-3 text-left text-[10px] font-bold text-[#64549f]/60 uppercase tracking-wider">Dosage</th>
                            <th className="w-[20%] py-1.5 px-3 text-left text-[10px] font-bold text-[#64549f]/60 uppercase tracking-wider">Freq</th>
                            <th className="w-[20%] py-1.5 px-3 text-left text-[10px] font-bold text-[#64549f]/60 uppercase tracking-wider">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f2f9]">
                          {set.medications.map((med, medIdx) => (
                            <tr key={medIdx} className="hover:bg-[#f8f9fd] transition-colors group">
                              <td className="py-1 px-3">
                                <div className="text-[12px] font-bold text-[#1a2256] group-hover:text-[#64549f] transition-colors leading-tight truncate">
                                  {med.name}
                                </div>
                                {med.instructions && (
                                  <div className="text-[9px] text-gray-400 truncate italic">
                                    {med.instructions}
                                  </div>
                                )}
                              </td>
                              <td className="py-1 px-3 text-[11px] text-[#4a5578] truncate">{med.dosage || '-'}</td>
                              <td className="py-1 px-3 text-[11px] text-[#4a5578] truncate">{med.frequency || '-'}</td>
                              <td className="py-1 px-3 text-[11px] text-[#4a5578] truncate">{med.duration || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Button
                      onClick={() => handleImport(set, setIdx)}
                      disabled={importingId !== null}
                      className={`w-full rounded-lg text-[12px] font-semibold transition-all ${importingId === String(setIdx)
                        ? 'bg-green-500 hover:bg-green-500 text-white shadow-md'
                        : 'bg-[#64549f] hover:bg-[#5a4a8f] text-white shadow-md'
                        }`}
                    >
                      {importingId === String(setIdx) ? (
                        <span className="flex items-center gap-1.5 animate-in zoom-in-95 duration-200">
                          <Check className="w-3.5 h-3.5" />
                          Imported to Summary
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text">
                          <Check className="w-3.5 h-3.5 opacity-50" />
                          Import This Set
                        </span>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
