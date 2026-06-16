import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LabService } from '@/services/servicesDatabase';

interface ServiceSelectionOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: LabService[];
  onConfirm: (selectedService: LabService) => void;
  searchQuery: string;
}

export function ServiceSelectionOverlay({
  open,
  onOpenChange,
  services,
  onConfirm,
  searchQuery
}: ServiceSelectionOverlayProps) {
  const handleServiceSelect = (service: LabService) => {
    onConfirm(service);
    // Don't call onOpenChange(false) here - the confirm handler manages the dialog state
    // This prevents the close handler from overwriting the selected service data
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl [&>button]:text-white">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              <TestTube className="w-5 h-5 text-white/80" />
              Select Lab Test - "{searchQuery}"
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 bg-white">
          <ScrollArea className="h-[400px] pr-4 medical-scroll">
            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="text-center py-12 bg-[#fcfdfe] rounded-[16px] border border-dashed border-[#e0e3f5]">
                  <p className="text-[#6e6868] font-medium">No lab tests found matching "{searchQuery}"</p>
                </div>
              ) : (
                services.map((service, index) => (
                  <button
                    key={service.rowID || index}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full text-left p-4 rounded-[16px] border border-[#e0e3f5] bg-[#fcfdfe] hover:bg-[#f5f7fc] hover:border-[#64549f]/30 transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#1a2256] text-[15px]">{service['Service Name']}</div>
                        <div className="text-[13px] text-[#6e6868] font-medium mt-1">
                          {service['Sub Department']} - {service['Item Code']}
                        </div>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {service['Service Categories'] && (
                            <Badge className="bg-[#1a2256]/5 text-[#1a2256] border-[#1a2256]/10 hover:bg-[#1a2256]/10 text-[11px] font-bold">
                              {service['Service Categories']}
                            </Badge>
                          )}
                          {service['Department Name'] && (
                            <Badge variant="outline" className="border-[#e0e3f5] text-[#6e6868] text-[11px] font-bold">
                              {service['Department Name']}
                            </Badge>
                          )}
                          {service['OP TARIFF'] && parseFloat(service['OP TARIFF']) > 0 && (
                            <Badge className="bg-green-50 text-green-700 border-green-100 text-[11px] font-bold">
                              ₹{parseFloat(service['OP TARIFF']).toLocaleString()}
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
