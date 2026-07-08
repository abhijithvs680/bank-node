import { Button } from '@/components/ui/button';
import { FileText, Upload, Settings, Loader2, ChevronDown, ChevronUp, CheckCircle2, Bot, Trash2, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { LabResult } from '@/types/patient';
import { PDFSidebar } from './PDFSidebar';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { deleteDealFile } from '@/services/dealNoteService';
import { uploadDealDocument, runDealFileChecklist } from '@/services/dealFileService';
import { RunChecklistModal } from '@/components/RunChecklistModal';
import { useToast } from '@/hooks/use-toast';
import { DataRedactModal } from './DataRedactModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

interface RecentResultsProps {
  onAddLabResult?: () => void;
  admissionId?: string;
  labResults?: LabResult[];
  loading?: boolean;
  error?: string | null;
  setIsPDFOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  isPDFOpen?: boolean;
  selectedTest?: string;
  patientName?: string;
  setSelectedTest?: React.Dispatch<React.SetStateAction<string>>;
  setPatientName?: React.Dispatch<React.SetStateAction<string>>;
  onRefreshLabResults?: () => Promise<void>;
  onViewReport?: (index: number) => void;
  onAskAI?: (fileId: string, fileName: string) => void;
}

interface BoundingBox {
  page_number: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

interface ChecklistItemResult {
  group_id?: string | null;
  item_id?: string | null;
  clause: string;
  achieved: boolean;
  page_numbers: number[];
  exact_quotes: string[];
  bounding_boxes?: BoundingBox[];
}

interface UploadedFile {
  id: string;
  name: string;
  isUploading?: boolean;
  isAnalyzing?: boolean;
  error?: string;
  fileId?: string;
  checklistResults?: ChecklistItemResult[];
  uploadedAt?: string;
}


interface LabResultCardProps {
  result: LabResult;
  handleViewReport: (id: string) => void;
  onAskAI?: (fileId: string, fileName: string) => void;
}

const LabResultCard = ({ result, handleViewReport, onAskAI }: LabResultCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Touchable
      onClick={() => result.FileFullPath && handleViewReport(result.Id)}
      className={`group flex gap-3 p-3 rounded-[16px] border border-[#e0e3f5] bg-white transition-all duration-300 hover:shadow-lg hover:border-[#64549f]/30 ${result.FileFullPath ? 'cursor-pointer' : 'opacity-60 cursor-default shadow-none'}`}
      disabled={!result.FileFullPath}
    >
      {/* Icon Container */}
      <div className="w-[40px] h-[40px] rounded-[10px] bg-[#f5f7fc] flex items-center justify-center flex-shrink-0 group-hover:bg-[#64549f]/10 transition-colors">
        <FileText className="w-4.5 h-4.5 text-[#64549f]" />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-[0.94rem] font-bold text-[#161616] truncate group-hover:text-[#64549f] transition-colors">
            {result.FileName || result.TestName || 'Lab Report'}
          </h4>
          <span className="text-[0.75rem] text-[#9e9e9e] font-medium">
            <RelativeTime dateStr={result.CreatedAt} />
          </span>
        </div>

        {result.Ai_Summary ? (
          <div className="space-y-1">
            <p className={`text-[0.81rem] text-[#424242] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
              <span className="font-bold text-[#1a2256]">Summary:</span> {result.Ai_Summary}
            </p>
            {result.Ai_Interpretation && (
              <p className={`text-[0.81rem] text-[#6e6868] leading-relaxed italic ${isExpanded ? '' : 'line-clamp-2'}`}>
                {result.Ai_Interpretation}
              </p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-[0.75rem] font-bold text-[#64549f] hover:underline mt-1 flex items-center gap-1 focus:outline-none"
            >
              {isExpanded ? 'Read Less' : 'Read More'}
            </button>
          </div>
        ) : result.Summary && (
          <div>
            <p className={`text-[0.81rem] text-[#6e6868] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
              {result.Summary}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-[0.75rem] font-bold text-[#64549f] hover:underline mt-1 flex items-center gap-1 focus:outline-none"
            >
              {isExpanded ? 'Read Less' : 'Read More'}
            </button>
          </div>
        )}

        {/* View Badge (Only if file exists) */}
        {result.FileFullPath && (
          <div className="mt-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
            <span className="text-[12px] font-bold text-[#64549f] flex items-center gap-1">
              View full report
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </span>
            {onAskAI && result.Id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const fileName = result.FileName || result.TestName || 'Lab Report';
                  onAskAI(result.Id, fileName);
                }}
                className="flex items-center gap-1 text-[12px] font-bold text-[#1a2256] bg-[#f5f7fc] px-2 py-1 rounded hover:bg-[#e0e3f5] transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                Ask AI
              </button>
            )}
          </div>
        )}
      </div>
    </Touchable>
  );
};

// ─── Uploaded File Row with accordion checklist ───────────────────────────────
interface UploadedFileRowProps {
  file: UploadedFile;
  isOpen: boolean;
  onToggle: () => void;
  onClauseClick?: (fileId: string | undefined, fileName: string, pageNumber: number, boundingBoxes?: BoundingBox[]) => void;
  onAskAI?: (fileId: string, fileName: string) => void;
  onRunChecklist?: (file: UploadedFile) => void;
  onDelete?: (file: UploadedFile) => void;
  isDeleting?: boolean;
  onFilePreview?: (fileId: string, fileName: string) => void;
}

const UploadedFileRow = ({ file, isOpen, onToggle, onClauseClick, onAskAI, onRunChecklist, onDelete, isDeleting, onFilePreview }: UploadedFileRowProps) => {
  const isUploading = file.isUploading;
  const isAnalyzing = file.isAnalyzing;
  const isBusy = isUploading || isAnalyzing;
  const hasError = !!file.error;
  const rawResults = file.checklistResults || [];
  const results = rawResults.filter(r => {
    const clauseName = r.clause.split('|')[0].trim().toLowerCase();
    return clauseName !== 'repayment' && 
           clauseName !== 'amendment approval — super majority items' && 
           clauseName !== 'amendment approval - super majority items';
  });
  
  const hasAnalysis = results.length > 0;
  const foundItems = results.filter(r => r.achieved === true);
  const missingItems = results.filter(r => r.achieved === false);

  const statusText = isUploading
    ? 'Uploading…'
    : isAnalyzing
      ? 'Running checklist analysis…'
      : hasError
        ? 'Upload failed'
        : hasAnalysis
          ? `${foundItems.length} found, ${missingItems.length} missing`
          : 'Uploaded — run checklist analysis';
  return (
    <div className="rounded-[16px] border border-[#e0e3f5] bg-white overflow-hidden shadow-sm transition-all duration-200">
      {/* Row header */}
      <div className="w-full flex items-center gap-3 p-3 hover:bg-[#f5f7fc] transition-colors">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 min-w-0 text-left disabled:opacity-70 disabled:cursor-not-allowed"
          disabled={isBusy}
        >
          <div className="w-[40px] h-[40px] rounded-[10px] bg-[#f0ecf7] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-[#64549f]" />
          </div>
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                if (!isBusy && !hasError && file.fileId && onFilePreview) {
                  e.stopPropagation();
                  onFilePreview(file.fileId, file.name);
                }
              }}
              className="text-[0.9rem] font-bold text-[#1a2256] truncate hover:text-[#64549f] hover:underline text-left cursor-pointer transition-colors focus:outline-none"
            >
              {file.name}
            </button>
            <p className="text-[0.75rem] text-[#6e6868] font-medium mt-0.5">{statusText}</p>
          </div>
          {isBusy ? (
            <Loader2 className="w-4 h-4 text-[#64549f] animate-spin flex-shrink-0" />
          ) : (
            isOpen
              ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isBusy && !hasError && file.fileId && onRunChecklist && (
            <button
              type="button"
              onClick={() => onRunChecklist(file)}
              className="flex items-center gap-1 text-[12px] font-bold text-[#64549f] bg-[#f0ecf7] px-2 py-1 rounded hover:bg-[#e0d5f5] transition-colors"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Run checklist
            </button>
          )}
          {!isBusy && !hasError && file.fileId && onAskAI && (
            <button
              type="button"
              onClick={() => onAskAI(file.fileId!, file.name)}
              className="flex items-center gap-1 text-[12px] font-bold text-[#1a2256] bg-[#f5f7fc] px-2 py-1 rounded hover:bg-[#e0e3f5] transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              Ask AI
            </button>
          )}
          {!isBusy && file.fileId && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(file)}
              disabled={isDeleting}
              className="flex items-center gap-1 text-[12px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Accordion checklist */}
      {isOpen && !isBusy && !hasError && (
        <div className="border-t border-[#f0f3f9] bg-[#fbfcfe] px-4 py-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {!hasAnalysis ? (
            <div className="text-center py-6 px-2">
              <p className="text-sm text-slate-600 font-medium">No checklist analysis yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Use <span className="font-semibold">Run checklist</span> to evaluate this file against deal checklist groups.
              </p>
            </div>
          ) : (
            <>
          <p className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Found Items Analysis
          </p>
          <div className="space-y-1.5 mb-6">
            {foundItems.map((item, idx) => (
              <div
                key={`found-${idx}`}
                onClick={() => {
                  if (onClauseClick && item.page_numbers && item.page_numbers.length > 0) {
                    onClauseClick(
                      file.fileId,
                      file.name,
                      item.page_numbers[0],
                      item.bounding_boxes
                    );
                  }
                }}
                className={`flex items-start gap-3 px-3 py-2 rounded-[10px] border border-[#e0e3f5] bg-white ${item.page_numbers && item.page_numbers.length > 0 ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
              >
                {/* Si No */}
                <span className="text-[0.69rem] font-bold text-slate-400 w-5 text-right flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>

                {/* Clause name & info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[0.84rem] font-medium text-[#1a2256]">
                    {item.clause}
                  </p>
                  {item.achieved && item.exact_quotes && item.exact_quotes.length > 0 && (
                    <p className="text-[0.75rem] text-slate-500 mt-1 italic leading-snug">
                      "{item.exact_quotes[0]}"
                    </p>
                  )}
                  {item.page_numbers && item.page_numbers.length > 0 && (
                    <p className="text-[0.65rem] text-slate-400 mt-1 font-medium">
                      Page: {item.page_numbers.join(', ')}
                    </p>
                  )}
                </div>

                {/* Status icon */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${item.achieved ? 'bg-green-500 shadow-green-200' : 'bg-red-50 shadow-red-100 border border-red-200'}`}>
                  {item.achieved ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-red-500 font-bold text-xs">X</span>
                  )}
                </div>
              </div>
            ))}
            
            {foundItems.length === 0 && (
              <div className="text-center py-4 text-sm text-slate-500">
                No items found.
              </div>
            )}
          </div>

          <p className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Missing Items
          </p>
          <div className="space-y-1.5 opacity-80">
            {missingItems.map((item, idx) => (
              <div
                key={`missing-${idx}`}
                className="flex items-center gap-3 px-3 py-2 rounded-[10px] border border-dashed border-[#e0e3f5] bg-[#fafbfc]"
              >
                {/* Si No */}
                <span className="text-[0.69rem] font-bold text-slate-300 w-5 text-right flex-shrink-0">
                  {foundItems.length + idx + 1}
                </span>

                {/* Clause name */}
                <span className="flex-1 text-[0.84rem] font-medium text-slate-400">
                  {item.clause}
                </span>

                {/* Status icon */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shadow-sm">
                  <span className="text-slate-400 font-bold text-xs">-</span>
                </div>
              </div>
            ))}

            {missingItems.length === 0 && (
              <div className="text-center py-4 text-sm text-slate-500">
                All checklist items found!
              </div>
            )}
          </div>
            </>
          )}
        </div>
      )}
      
      {isOpen && hasError && (
        <div className="p-4 text-sm text-red-500 bg-red-50 border-t border-red-100">
          {file.error}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const RecentResults = ({
  onAddLabResult,
  admissionId,
  labResults,
  loading,
  error,
  setIsPDFOpen,
  isPDFOpen,
  selectedTest,
  patientName,
  setSelectedTest,
  setPatientName,
  onRefreshLabResults,
  onViewReport,
  onAskAI,
}: RecentResultsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [openFileId, setOpenFileId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>('');
  const [viewingTargetPage, setViewingTargetPage] = useState<number | undefined>(undefined);
  const [viewingTargetBoxes, setViewingTargetBoxes] = useState<BoundingBox[]>([]);
  const [checklistModalFile, setChecklistModalFile] = useState<UploadedFile | null>(null);
  const [isRedactModalOpen, setIsRedactModalOpen] = useState(false);
  const [selectedRedactOptions, setSelectedRedactOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('redactOptions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (user?.email) {
      fetch(`${API_BASE_URL}/data_redact_config?email=${user.email}&type=file`)
        .then(res => res.json())
        .then(data => {
          if (data && data.redact_options) {
            setSelectedRedactOptions(data.redact_options);
          }
        })
        .catch(err => console.error('Failed to fetch file redact config:', err));
    }
  }, [user?.email]);

  useEffect(() => {
    localStorage.setItem('redactOptions', JSON.stringify(selectedRedactOptions));
    if (user?.email) {
      fetch(`${API_BASE_URL}/data_redact_config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          type: 'file',
          redact_options: selectedRedactOptions
        })
      }).catch(err => console.error('Failed to save file redact config:', err));
    }
  }, [selectedRedactOptions, user?.email]);

  // Sort uploaded files so that the last uploaded document is first in order
  const sortedFilesForDisplay = useMemo(() => {
    const parseUploadedAt = (uploadedAtStr?: string) => {
      if (!uploadedAtStr) return 0;
      let normalized = uploadedAtStr;
      if (uploadedAtStr.includes(' ') && !uploadedAtStr.includes('T')) {
        normalized = uploadedAtStr.replace(' ', 'T');
      }
      const t = Date.parse(normalized);
      return isNaN(t) ? 0 : t;
    };
    return [...uploadedFiles].sort((a, b) => parseUploadedAt(b.uploadedAt) - parseUploadedAt(a.uploadedAt));
  }, [uploadedFiles]);

  const loadDealFiles = useCallback(async () => {
    if (!admissionId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/deal_files/${admissionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch deal files: ${response.statusText}`);
      }

      const data = await response.json();
      if (data?.files) {
        const loadedFiles: UploadedFile[] = data.files.map((file: any, index: number) => ({
          id: `server-${file.file_id}`,
          name: file.file_name || `Document ${index + 1}`,
          fileId: file.file_id,
          checklistResults: file.checklist_data || [],
          isUploading: false,
          uploadedAt: file.uploaded_at,
        }));

        setUploadedFiles((prev) => {
          const serverFileIds = new Set(loadedFiles.map((f) => f.fileId));
          const pendingLocal = prev.filter(
            (f) =>
              f.isUploading ||
              (!f.fileId && f.id.startsWith('local-')) ||
              (f.isAnalyzing && f.fileId && !serverFileIds.has(f.fileId))
          );
          return [...pendingLocal, ...loadedFiles];
        });
      }
    } catch (err) {
      console.error('Error fetching deal files:', err);
    }
  }, [admissionId]);

  useEffect(() => {
    loadDealFiles();
  }, [loadDealFiles]);

  const handleDeleteRequest = (file: UploadedFile) => {
    setFileToDelete(file);
  };

  const handleConfirmDelete = async () => {
    if (!admissionId || !fileToDelete?.fileId) return;

    setDeletingFileId(fileToDelete.fileId);
    try {
      const result = await deleteDealFile(admissionId, fileToDelete.fileId);
      setUploadedFiles((prev) => prev.filter((f) => f.fileId !== fileToDelete.fileId));
      if (openFileId === fileToDelete.id) {
        setOpenFileId(null);
      }
      if (viewingFileUrl) {
        setViewingFileUrl(null);
      }
      toast({
        title: 'File deleted',
        description: `"${result.file_name}" has been removed.`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to delete file',
        description: err.message || 'Could not delete the file.',
        variant: 'destructive',
      });
    } finally {
      setDeletingFileId(null);
      setFileToDelete(null);
    }
  };

  const handleClauseClick = (fileId: string | undefined, fileName: string, pageNumber: number, boundingBoxes: BoundingBox[] = []) => {
    if (!fileId || !admissionId) return;
    setViewingFileUrl(`${API_BASE_URL}/download_document?deal_id=${admissionId}&file_id=${fileId}`);
    setViewingFileName(fileName);
    setViewingTargetPage(pageNumber);
    setViewingTargetBoxes(boundingBoxes);
  };

  const handleFilePreview = (fileId: string, fileName: string) => {
    if (!admissionId) return;
    setViewingFileUrl(`${API_BASE_URL}/download_document?deal_id=${admissionId}&file_id=${fileId}`);
    setViewingFileName(fileName);
    setViewingTargetPage(undefined);
    setViewingTargetBoxes([]);
  };

  // Filter reports that have files
  const reportsWithFiles = useMemo(() => {
    if (!labResults) return [];
    return labResults
      .filter(r => r.FileFullPath)
      .map(r => ({
        id: r.Id,
        fileName: r.FileName,
        fileUrl: r.FileFullPath,
        mimeType: r.MimeType || 'application/pdf',
        testName: r.TestName || 'General',
        findings: r.Findings || '',
        summary: r.Summary || '',
      }));
  }, [labResults]);

  const handleRunChecklist = (file: UploadedFile) => {
    if (!file.fileId) return;
    setChecklistModalFile(file);
  };

  const handleRunChecklistStart = async (groupIds: string[]) => {
    if (!checklistModalFile?.fileId || !admissionId) return;
    const fileId = checklistModalFile.fileId;
    const fileRowId = checklistModalFile.id;
    
    // Close modal immediately
    setChecklistModalFile(null);

    // Set analyzing state
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.fileId === fileId ? { ...f, isAnalyzing: true } : f
      )
    );

    try {
      await runDealFileChecklist(admissionId, fileId, groupIds);
      
      setUploadedFiles((prev) =>
        prev.map((f) => (f.fileId === fileId ? { ...f, isAnalyzing: false } : f))
      );
      setOpenFileId(fileRowId);
      await loadDealFiles();
    } catch (err: unknown) {
      console.error('Checklist analysis failed:', err);
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.fileId === fileId ? { ...f, isAnalyzing: false, error: err instanceof Error ? err.message : 'Checklist analysis failed' } : f
        )
      );
    }
  };

  const handleChecklistModalClose = () => {
    setChecklistModalFile(null);
  };

  // Handle file selection from native browser
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const tempId = `local-${Date.now()}-${Math.random()}`;
    const newFile: UploadedFile = {
      id: tempId,
      name: file.name,
      isUploading: true,
      uploadedAt: new Date().toISOString(),
    };
    
    setUploadedFiles(prev => [newFile, ...prev]);

    try {
      const data = await uploadDealDocument(admissionId || 'unknown', file, selectedRedactOptions);
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === tempId 
          ? { 
              ...f, 
              isUploading: false, 
              fileId: data.file_id,
              name: data.file_name || f.name,
              checklistResults: [],
            }
          : f
      ));

    } catch (error) {
      console.error("Failed to upload document:", error);
      setUploadedFiles(prev => prev.map(f => 
        f.id === tempId 
          ? { ...f, isUploading: false, error: error instanceof Error ? error.message : 'Failed to upload' }
          : f
      ));
    } finally {
      e.target.value = '';
    }
  };


  const handleViewReport = (resultId: string) => {
    const index = reportsWithFiles.findIndex(r => r.id === resultId);
    if (index !== -1) {
      setCurrentReportIndex(index);
      if (onViewReport) {
        onViewReport(index);
      } else {
        setIsPDFOpen?.(true);
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Loading lab results...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 px-4">
          <p className="text-sm text-destructive">Failed to load lab results</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      );
    }

    const hasExistingResults = labResults && labResults.length > 0 && labResults[0].Vector_UUID !== '';
    const hasLocalFiles = sortedFilesForDisplay.length > 0;

    if (!hasExistingResults && !hasLocalFiles) {
      return (
        <div className="text-center py-12 text-[#6e6868] bg-[#fcfdfe] rounded-[16px] border border-dashed border-[#e0e3f5]">
          No Documents Uploaded
        </div>
      );
    }

    return (
      <>
        {/* Locally uploaded files with accordion checklist */}
        {sortedFilesForDisplay.map(file => (
          <UploadedFileRow
            key={file.id}
            file={file}
            isOpen={openFileId === file.id}
            onToggle={() => setOpenFileId(openFileId === file.id ? null : file.id)}
            onClauseClick={handleClauseClick}
            onFilePreview={handleFilePreview}
            onAskAI={onAskAI}
            onRunChecklist={handleRunChecklist}
            onDelete={handleDeleteRequest}
            isDeleting={deletingFileId === file.fileId}
          />
        ))}

        {/* Existing Lab Results from API */}
        {hasExistingResults &&
          labResults!.map(result => (
            <LabResultCard
              key={result.Id}
              result={result}
              handleViewReport={handleViewReport}
              onAskAI={onAskAI}
            />
          ))
        }
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-[1.125rem] font-semibold text-[#1a2256]">Documents</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsRedactModalOpen(true)}
            variant="outline"
            className="flex items-center justify-center rounded-[10px] w-9 h-9 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all active:scale-95 border border-slate-200"
            title="Configure Data Redact"
          >
            <ShieldAlert className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => admissionId && navigate(`/clause-management?deal_id=${encodeURIComponent(admissionId)}`)}
            variant="outline"
            disabled={!admissionId}
            className="flex items-center justify-center rounded-[10px] w-9 h-9 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all active:scale-95 border border-slate-200"
            title="Clause Management"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-2 rounded-[10px] px-3 py-1.5 text-[0.875rem] font-semibold shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            size="sm"
            disabled={uploadedFiles.some(f => f.isUploading)}
          >
            {uploadedFiles.some(f => f.isUploading) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 medical-scroll max-h-[600px] overflow-y-auto pr-2">
        {renderContent()}
      </div>

      <DataRedactModal
        isOpen={isRedactModalOpen}
        onClose={() => setIsRedactModalOpen(false)}
        selectedOptions={selectedRedactOptions}
        onSelectionChange={setSelectedRedactOptions}
      />

      {viewingFileUrl && (
        <PDFSidebar
          isOpen={!!viewingFileUrl}
          onClose={() => {
            setViewingFileUrl(null);
            setViewingFileName('');
            setViewingTargetPage(undefined);
            setViewingTargetBoxes([]);
          }}
          pdfUrl={viewingFileUrl}
          testName={viewingFileName}
          targetPage={viewingTargetPage}
          targetBoxes={viewingTargetBoxes}
          patientName="Document Analysis"
        />
      )}

      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{fileToDelete?.name}</strong> from the deal,
              including its checklist analysis data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingFileId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={!!deletingFileId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingFileId ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {checklistModalFile?.fileId && admissionId && (
        <RunChecklistModal
          open={!!checklistModalFile}
          dealId={admissionId}
          fileId={checklistModalFile.fileId}
          fileName={checklistModalFile.name}
          onClose={handleChecklistModalClose}
          onRun={handleRunChecklistStart}
        />
      )}
    </div>
  );
};
