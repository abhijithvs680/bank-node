import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, StickyNote, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiService } from '@/services/apiService';
import { socketService } from '@/services/socketService';
import { PDFSidebar } from './PDFSidebar';
import { EditLabResultModal } from './EditLabResultModal';
import { useToast } from '@/hooks/use-toast';
import { RelativeTime } from '@/components/RelativeTime';
import { Touchable } from '@/components/ui/touchable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LabResult {
  TestName: string;
  Notes: string;
  FileURL?: string;
  CreatedOn?: string;
  rowID?: string;
  FileIdentification?: string;
  FileFullPath?: string;
  MimeType?: string;
}

interface LabProps {
  onAddLabResult?: () => void;
  admissionId?: string;
  onRefreshRef?: (refreshFn: () => Promise<void>) => void;
  onLabResultUpdated?: () => void;
}

export const Lab = ({ onAddLabResult, admissionId, onRefreshRef, onLabResultUpdated }: LabProps) => {
  const { toast } = useToast();
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPDFOpen, setIsPDFOpen] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<string>('');

  // Edit modal state
  const [editModal, setEditModal] = useState<{ isOpen: boolean; labResult: LabResult | null }>({
    isOpen: false,
    labResult: null
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; labResult: LabResult | null }>({
    isOpen: false,
    labResult: null
  });
  const [deleting, setDeleting] = useState(false);

  const fetchLabResults = async () => {
    if (!admissionId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const labData = await apiService.viewLabResults(admissionId);

      const hasFileIdentification = labData.some(
        (result: LabResult) => result.FileIdentification
      );

      if (hasFileIdentification) {
        try {
          const fileList = await apiService.getRecentLabResults(admissionId);

          const fileMap = new Map<string, { path: string; mimeType?: string }>();
          fileList.forEach((file: any) => {
            const fileId = file.FileIdentification || file.Id;
            if (fileId) {
              fileMap.set(fileId, {
                path: file.FileFullPath,
                mimeType: file.MimeType
              });
            }
          });

          const enrichedLabData = labData.map((result: LabResult) => {
            if (result.FileIdentification) {
              const fileInfo = fileMap.get(result.FileIdentification);
              if (fileInfo) {
                return {
                  ...result,
                  FileFullPath: fileInfo.path,
                  MimeType: fileInfo.mimeType
                };
              }
            }
            return result;
          });

          setLabResults(enrichedLabData);
        } catch (fileError) {
          console.error('Error fetching file list:', fileError);
          setLabResults(labData);
        }
      } else {
        setLabResults(labData);
      }
    } catch (error) {
      console.error('Error fetching lab results:', error);
      setError('Failed to load lab results data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabResults();
  }, [admissionId]);

  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef(fetchLabResults);
    }
  }, [onRefreshRef, admissionId]);

  const handleDelete = async () => {
    if (!deleteConfirm.labResult?.rowID || !admissionId) return;

    setDeleting(true);
    try {
      await apiService.addLabResult({
        consultationId: admissionId,
        testName: deleteConfirm.labResult.TestName,
        notes: deleteConfirm.labResult.Notes || '',
        action: 'delete',
        rowID: deleteConfirm.labResult.rowID
      });

      socketService.emit('patient_data_update', {
        _type: 'lab',
        admissionid: admissionId
      });

      toast({
        title: 'Success',
        description: 'Lab result deleted successfully'
      });

      setLabResults(prev => prev.filter(r => r.rowID !== deleteConfirm.labResult?.rowID));
      setDeleteConfirm({ isOpen: false, labResult: null });
      onLabResultUpdated?.();
    } catch (error) {
      console.error('Error deleting lab result:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lab result',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleViewReport = (result: LabResult) => {
    const fileUrl = result.FileFullPath || result.FileURL;
    if (fileUrl) {
      setSelectedFileUrl(fileUrl);
      setSelectedTest(result.TestName);
      setIsPDFOpen(true);
    }
  };

  return (
    <Card className="medical-card p-4 fade-in bg-white border-[#e0e3f5] rounded-[24px]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[17px] font-semibold text-[#1a2256]">Lab Order</h3>
        </div>
        <Button
          size="sm"
          onClick={onAddLabResult}
          variant="outline"
          className="h-8 px-4 rounded-[10px] text-[13px] font-semibold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-3 medical-scroll max-h-[440px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#6e6868]">
            <Loader2 className="w-6 h-6 animate-spin text-[#64549f] mb-2" />
            <p className="text-[13px] font-medium">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 px-4 bg-red-50 rounded-[16px] border border-red-100">
            <p className="text-sm text-destructive font-bold">Failed to load orders</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        ) : labResults.length === 0 ? (
          <div className="text-center py-12 text-[#6e6868] bg-[#fcfdfe] rounded-[16px] border border-dashed border-[#e0e3f5]">
            <p className="text-[14px] font-bold text-[#1a2256]">No lab orders</p>
            <p className="text-[12px] font-medium mt-1">Add a new order to begin.</p>
          </div>
        ) : (
          labResults.map((result, index) => (
            <div
              key={result.rowID || index}
              onClick={() => setEditModal({ isOpen: true, labResult: result })}
              className="bg-white p-4 rounded-[16px] border border-[#e0e3f5] hover:border-[#64549f]/30 transition-all duration-300 group relative cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex gap-3 min-w-0">
                  <div className="w-[36px] h-[36px] rounded-[10px] bg-[#f5f7fc] flex items-center justify-center flex-shrink-0 group-hover:bg-[#64549f]/5 transition-colors">
                    <FileText className="w-4.5 h-4.5 text-[#64549f]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[#161616] text-[14px] truncate group-hover:text-[#64549f] transition-colors">
                      {result.TestName}
                    </h4>
                    {result.CreatedOn && (
                      <div className="text-[11px] text-[#9e9e9e] font-semibold flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <RelativeTime dateStr={result.CreatedOn} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ isOpen: true, labResult: result });
                    }}
                    className="h-7 w-7 p-0 rounded-lg hover:bg-red-50 text-red-500"
                    title="Delete Order"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {result.Notes && (
                <div className="flex items-start gap-2 text-[13px] text-[#424242] font-semibold mt-2 pt-2 border-t border-[#f0f3f9]">
                  <span className="line-clamp-2 leading-relaxed text-[13px]">{result.Notes}</span>
                </div>
              )}

              {(result.FileFullPath || result.FileURL) && (
                <div className="mt-3">
                  <Touchable
                    onClick={() => handleViewReport(result)}
                    className="w-full flex items-center justify-center gap-2 py-1.5 rounded-[12px] border border-[#e0e3f5] bg-[#fcfdfe] hover:bg-white hover:border-[#64549f]/30 hover:shadow-sm transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#64549f]" />
                    <span className="text-[12px] font-semibold text-[#64549f]">View Report</span>
                  </Touchable>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <PDFSidebar
        isOpen={isPDFOpen}
        onClose={() => setIsPDFOpen(false)}
        pdfUrl={selectedFileUrl}
        testName={selectedTest}
        patientName=""
      />

      <EditLabResultModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, labResult: null })}
        labResult={editModal.labResult}
        consultationId={admissionId || ''}
        onLabResultUpdated={() => {
          fetchLabResults();
          onLabResultUpdated?.();
        }}
      />

      <AlertDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, labResult: null })}
      >
        <AlertDialogContent className="rounded-[24px] border-[#e0e3f5]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1a2256] font-bold">Delete Lab Order</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6e6868] font-medium">
              Are you sure you want to delete <span className="text-[#1a2256] font-bold italic">"{deleteConfirm.labResult?.TestName}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleting} className="rounded-[12px] font-bold text-[#6e6868] border-[#e0e3f5]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white rounded-[12px] font-bold shadow-md hover:shadow-lg transition-all"
            >
              {deleting ? 'Deleting...' : 'Delete Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
