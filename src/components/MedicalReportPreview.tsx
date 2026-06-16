import { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Printer, Smartphone, X, Loader2 } from 'lucide-react';

interface MedicalReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  patientName?: string;
  onPrint: () => void;
  onSendToMobile: () => void;
  isSendingToMobile: boolean;
}

export const MedicalReportPreview = ({
  isOpen,
  onClose,
  pdfBlob,
  patientName,
  onPrint,
  onSendToMobile,
  isSendingToMobile,
}: MedicalReportPreviewProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
    }
  }, [pdfBlob]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-full p-0 flex flex-col [&>button]:hidden"
      >
        {/* Header with buttons */}
        <div className="p-3 border-b flex items-center justify-between bg-background">
          <div>
            <h2 className="font-semibold text-foreground">Prescription Report</h2>
            {patientName && (
              <p className="text-sm text-muted-foreground">{patientName}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={onSendToMobile} 
              disabled={isSendingToMobile} 
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isSendingToMobile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
              {isSendingToMobile ? 'Sending...' : 'Send to Mobile'}
            </Button>
            <Button 
              onClick={onPrint}
              size="sm"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="flex-1 bg-muted/50">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Medical Report Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
