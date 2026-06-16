import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Generic medicine type that works with both Medicine and PatientMedicine
export interface MedicineItem {
  Name: string;
  Description: string;
  Category: string;
  MedicineType: string;
  Manufacturer: string;
  [key: string]: any;
}

interface MedicineSelectionOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicines: MedicineItem[];
  onConfirm: (selectedMedicine: MedicineItem) => void;
  searchQuery: string;
}

export function MedicineSelectionOverlay({
  open,
  onOpenChange,
  medicines,
  onConfirm,
  searchQuery
}: MedicineSelectionOverlayProps) {
  const handleMedicineSelect = (medicine: MedicineItem) => {
    onConfirm(medicine);
    // Don't call onOpenChange(false) here - the confirm handler manages the dialog state
    // This prevents the close handler from overwriting the selected medicine data
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl [&>button]:text-white">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              Select Medicine - "{searchQuery}"
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 bg-white">
          <ScrollArea className="h-[400px] pr-4 medical-scroll">
            <div className="space-y-3">
              {medicines.length === 0 ? (
                <div className="text-center py-12 bg-[#fcfdfe] rounded-[16px] border border-dashed border-[#e0e3f5]">
                  <p className="text-[#6e6868] font-medium">No medicines found matching "{searchQuery}"</p>
                </div>
              ) : (
                medicines.map((medicine, index) => (
                  <button
                    key={index}
                    onClick={() => handleMedicineSelect(medicine)}
                    className="w-full text-left p-4 rounded-[16px] border border-[#e0e3f5] bg-[#fcfdfe] hover:bg-[#f5f7fc] hover:border-[#64549f]/30 transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#1a2256] text-[15px]">{medicine.Name}</div>
                        <div className="text-[13px] text-[#6e6868] font-medium mt-1 pr-4 line-clamp-2">
                          {medicine.Description}
                        </div>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {medicine.Category && (
                            <Badge className="bg-[#1a2256]/5 text-[#1a2256] border-[#1a2256]/10 hover:bg-[#1a2256]/10 text-[11px] font-bold">
                              {medicine.Category}
                            </Badge>
                          )}
                          {medicine.MedicineType && (
                            <Badge variant="outline" className="border-[#e0e3f5] text-[#6e6868] text-[11px] font-bold">
                              {medicine.MedicineType}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#e0e3f5] group-hover:bg-[#1a2256] group-hover:border-[#1a2256] transition-all">
                        <Check className="w-4 h-4 text-[#6e6868] group-hover:text-white" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
