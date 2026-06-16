import { Button } from '@/components/ui/button';
import { FileText, Upload, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { LabResult } from '@/types/patient';
import { PDFSidebar } from './PDFSidebar';
import { useState, useEffect, useMemo, useRef } from 'react';
import { RelativeTime } from '@/components/RelativeTime';
import { Touchable } from '@/components/ui/touchable';

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
}

interface BoundingBox {
  page_number: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

interface ChecklistItemResult {
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
  error?: string;
  fileId?: string;
  checklistResults?: ChecklistItemResult[];
}

const CHECKLIST_ITEMS = [
  'Facility Amount',
  'Facility Type',
  'Borrower Name',
  'Tenor / Maturity',
  'Interest Margin (Applicable Margin)',
  'Base Rate',
  'Repayment',
  'Debt to EBITDA Covenant (Max Leverage)',
  'Interest Coverage Ratio Covenant (Min ICR)',
  'Testing Frequency',
  'Quarterly Financial Statement Deadline',
  'Annual Financial Statement Deadline',
  'Compliance Certificate Signatories',
  'Default Notification Period',
  'Additional Indebtedness Restriction',
  'Revolving Facility Cap (Permitted Indebtedness)',
  'Other Indebtedness Cap (Permitted Indebtedness)',
  'Asset Disposal Restriction',
  'Small Disposal Permitted Cap',
  'Mandatory Prepayment from Disposal Proceeds',
  'Events of Default (Count)',
  'Non-Payment Grace Period (Event of Default)',
  'Cross-Default Threshold',
  'Amendment Approval — General',
  'Amendment Approval — Super Majority Items',
  'Amendment Approval — All Lenders',
  'Consent Response Period',
  'Governing Law',
  'Voluntary Prepayment Minimum',
  'Change of Control Prepayment',
  'Equity Cure Right',
  'Acquisition Cap (No Consent Required)',
  'Capital Lease / Purchase Money Cap',
  'Number of Lenders',
  'Facility Agent',
  'Security Trustee',
];

interface LabResultCardProps {
  result: LabResult;
  handleViewReport: (id: string) => void;
}

const LabResultCard = ({ result, handleViewReport }: LabResultCardProps) => {
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
          <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
            <span className="text-[12px] font-bold text-[#64549f] flex items-center gap-1">
              View full report
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </span>
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
  onClauseClick?: (fileId: string | undefined, pageNumber: number, boundingBoxes?: BoundingBox[]) => void;
}

const UploadedFileRow = ({ file, isOpen, onToggle, onClauseClick }: UploadedFileRowProps) => {
  const isProcessing = file.isUploading;
  const hasError = !!file.error;
  const results = file.checklistResults || [];
  
  const achievedClauses = new Set(results.map(r => r.clause.toLowerCase().trim()));
  const unachievedItems = CHECKLIST_ITEMS.filter(item => !achievedClauses.has(item.toLowerCase().trim()));
  
  return (
    <div className="rounded-[16px] border border-[#e0e3f5] bg-white overflow-hidden shadow-sm transition-all duration-200">
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-[#f5f7fc] transition-colors text-left disabled:opacity-70 disabled:cursor-not-allowed"
        disabled={isProcessing}
      >
        <div className="w-[40px] h-[40px] rounded-[10px] bg-[#f0ecf7] flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-[#64549f]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.9rem] font-bold text-[#1a2256] truncate">{file.name}</p>
          <p className="text-[0.75rem] text-[#6e6868] font-medium mt-0.5">
            {isProcessing ? 'Processing with AI...' : hasError ? 'Processing failed' : `${results.length} found, ${unachievedItems.length} missing`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-[#64549f] animate-spin" />
          ) : (
            isOpen
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Accordion checklist */}
      {isOpen && !isProcessing && !hasError && (
        <div className="border-t border-[#f0f3f9] bg-[#fbfcfe] px-4 py-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Found Items Analysis
          </p>
          <div className="space-y-1.5 mb-6">
            {results.map((item, idx) => (
              <div
                key={`found-${idx}`}
                onClick={() => {
                  if (onClauseClick && item.page_numbers && item.page_numbers.length > 0) {
                    onClauseClick(file.fileId, item.page_numbers[0], item.bounding_boxes);
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
            
            {results.length === 0 && (
              <div className="text-center py-4 text-sm text-slate-500">
                No items found.
              </div>
            )}
          </div>

          <p className="text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Missing Items
          </p>
          <div className="space-y-1.5 opacity-80">
            {unachievedItems.map((item, idx) => (
              <div
                key={`missing-${idx}`}
                className="flex items-center gap-3 px-3 py-2 rounded-[10px] border border-dashed border-[#e0e3f5] bg-[#fafbfc]"
              >
                {/* Si No */}
                <span className="text-[0.69rem] font-bold text-slate-300 w-5 text-right flex-shrink-0">
                  {results.length + idx + 1}
                </span>

                {/* Clause name */}
                <span className="flex-1 text-[0.84rem] font-medium text-slate-400">
                  {item}
                </span>

                {/* Status icon */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shadow-sm">
                  <span className="text-slate-400 font-bold text-xs">-</span>
                </div>
              </div>
            ))}

            {unachievedItems.length === 0 && (
              <div className="text-center py-4 text-sm text-slate-500">
                All checklist items found!
              </div>
            )}
          </div>
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
}: RecentResultsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [openFileId, setOpenFileId] = useState<string | null>(null);
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingTargetPage, setViewingTargetPage] = useState<number | undefined>(undefined);
  const [viewingTargetBoxes, setViewingTargetBoxes] = useState<BoundingBox[]>([]);

  // Fetch existing deal files on mount
  useEffect(() => {
    if (!admissionId) return;

    const fetchDealFiles = async () => {
      try {
        const response = await fetch(`http://localhost:8000/deal_files/${admissionId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch deal files: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data && data.files) {
          const loadedFiles: UploadedFile[] = data.files.map((file: any, index: number) => ({
            id: `server-${file.file_id}`,
            name: file.file_name || `Document ${index + 1}`,
            fileId: file.file_id,
            checklistResults: file.checklist_data || [],
            isUploading: false,
          }));
          
          setUploadedFiles(prev => {
            const existingIds = new Set(prev.map(p => p.fileId).filter(Boolean));
            const newFiles = loadedFiles.filter(f => !existingIds.has(f.fileId));
            return [...newFiles, ...prev];
          });
        }
      } catch (err) {
        console.error("Error fetching deal files:", err);
      }
    };

    fetchDealFiles();
  }, [admissionId]);

  const handleClauseClick = (fileId: string | undefined, pageNumber: number, boundingBoxes?: BoundingBox[]) => {
    if (fileId) {
      setViewingFileUrl(`http://localhost:8000/download_document?deal_id=${admissionId}&file_id=${fileId}`);
    }
    setViewingTargetPage(pageNumber);
    setViewingTargetBoxes(boundingBoxes || []);
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

  // Handle file selection from native browser
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const tempId = `local-${Date.now()}-${Math.random()}`;
    const newFile: UploadedFile = {
      id: tempId,
      name: file.name,
      isUploading: true
    };
    
    setUploadedFiles(prev => [newFile, ...prev]);

    try {
      const formData = new FormData();
      formData.append("deal_id", admissionId || 'unknown');
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/analyze_document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === tempId 
          ? { 
              ...f, 
              isUploading: false, 
              fileId: data.file_id,
              checklistResults: data.checklist_analysis?.items || [] 
            }
          : f
      ));

    } catch (error) {
      console.error("Failed to analyze document:", error);
      setUploadedFiles(prev => prev.map(f => 
        f.id === tempId 
          ? { ...f, isUploading: false, error: 'Failed to process' }
          : f
      ));
    } finally {
      e.target.value = ''; // Reset input
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
    const hasLocalFiles = uploadedFiles.length > 0;

    if (!hasExistingResults && !hasLocalFiles) {
      return (
        <div className="text-center py-12 text-[#6e6868] bg-[#fcfdfe] rounded-[16px] border border-dashed border-[#e0e3f5]">
          No Lab results
        </div>
      );
    }

    return (
      <>
        {/* Locally uploaded files with accordion checklist */}
        {uploadedFiles.map(file => (
          <UploadedFileRow
            key={file.id}
            file={file}
            isOpen={openFileId === file.id}
            onToggle={() => setOpenFileId(openFileId === file.id ? null : file.id)}
            onClauseClick={handleClauseClick}
          />
        ))}

        {/* Existing Lab Results from API */}
        {hasExistingResults &&
          labResults!.map(result => (
            <LabResultCard
              key={result.Id}
              result={result}
              handleViewReport={handleViewReport}
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
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="flex items-center gap-2 rounded-[10px] px-3 py-1.5 text-[0.875rem] font-semibold shadow-sm transition-all hover:shadow-md active:scale-95"
          size="sm"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 medical-scroll max-h-[600px] overflow-y-auto pr-2">
        {renderContent()}
      </div>

      {viewingFileUrl && (
        <PDFSidebar
          isOpen={!!viewingFileUrl}
          onClose={() => {
            setViewingFileUrl(null);
            setViewingTargetPage(undefined);
            setViewingTargetBoxes([]);
          }}
          pdfUrl={viewingFileUrl}
          targetPage={viewingTargetPage}
          targetBoxes={viewingTargetBoxes}
          patientName="Document Analysis"
        />
      )}
    </div>
  );
};
