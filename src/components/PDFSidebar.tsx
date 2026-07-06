import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Download, Printer, ChevronLeft, ChevronRight, FileText, ZoomIn, ZoomOut, RotateCcw, FolderOpen, PanelLeftClose, PanelLeft, GripVertical } from 'lucide-react';
import { Touchable } from '@/components/ui/touchable';
import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker to handle rendering processes off the main UI thread
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Report {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  testName?: string;
  findings?: string;
  summary?: string;
}

export interface BoundingBox {
  page_number: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

function getBoxPageNumber(box: BoundingBox): number {
  const page = Number(box.page_number);
  return Number.isFinite(page) ? page : 0;
}

interface PdfPageWithHighlightsProps {
  pageNumber: number;
  scale: number;
  boxes: BoundingBox[];
  onPageRef?: (el: HTMLDivElement | null) => void;
}

function PdfPageWithHighlights({
  pageNumber,
  scale,
  boxes,
  onPageRef,
}: PdfPageWithHighlightsProps) {
  return (
    <div
      ref={onPageRef}
      className="mb-6 shadow-lg bg-white relative mx-auto w-fit"
    >
      <Page
        pageNumber={pageNumber}
        scale={scale}
        className="block"
        renderAnnotationLayer={false}
        renderTextLayer={false}
      />
      {boxes.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {boxes.map((box, i) => (
            <div
              key={`${pageNumber}-${i}`}
              className="absolute bg-yellow-400/40 border border-yellow-500/70 mix-blend-multiply"
              style={{
                top: `${box.ymin / 10}%`,
                left: `${box.xmin / 10}%`,
                width: `${Math.max((box.xmax - box.xmin) / 10, 0.2)}%`,
                height: `${Math.max((box.ymax - box.ymin) / 10, 0.2)}%`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Support both new multi-report interface and legacy single-file interface
interface PDFSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  // New multi-report interface
  reports?: Report[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  // Legacy single-file interface
  pdfUrl?: string;
  testName?: string;
  selectedFileType?: string;
  targetPage?: number;
  targetBoxes?: BoundingBox[];
}

export const PDFSidebar = ({ 
  isOpen, 
  onClose, 
  patientName,
  // New props
  reports: reportsProp,
  currentIndex: currentIndexProp = 0,
  onNavigate: onNavigateProp,
  // Legacy props
  pdfUrl,
  testName,
  selectedFileType,
  targetPage,
  targetBoxes
}: PDFSidebarProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [internalIndex, setInternalIndex] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pdfZoom, setPdfZoom] = useState(100);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Sidebar resize and collapse state
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // react-pdf state
  const [numPages, setNumPages] = useState<number | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pdfScale = pdfZoom / 100;

  useEffect(() => {
    if (numPages && targetPage && pageRefs.current[targetPage]) {
      const timer = setTimeout(() => {
        pageRefs.current[targetPage]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [numPages, targetPage]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Convert legacy props to reports array if needed
  const reports = useMemo(() => {
    if (reportsProp && reportsProp.length > 0) {
      return reportsProp;
    }
    // Legacy mode: create single-item array
    if (pdfUrl) {
      return [{
        id: 'legacy-single',
        fileName: testName || 'Document',
        fileUrl: pdfUrl,
        mimeType: selectedFileType || 'application/pdf'
      }];
    }
    return [];
  }, [reportsProp, pdfUrl, testName, selectedFileType]);

  const currentIndex = onNavigateProp ? currentIndexProp : internalIndex;
  const onNavigate = onNavigateProp || setInternalIndex;

  const currentReport = reports[currentIndex];
  const hasMultipleReports = reports.length > 1;
  const hasNext = currentIndex < reports.length - 1;
  const hasPrev = currentIndex > 0;

  // Group reports by testName
  const groupedReports = useMemo(() => {
    const groups: Record<string, { reports: Report[]; indices: number[] }> = {};
    reports.forEach((report, index) => {
      const groupName = report.testName || 'Other';
      if (!groups[groupName]) {
        groups[groupName] = { reports: [], indices: [] };
      }
      groups[groupName].reports.push(report);
      groups[groupName].indices.push(index);
    });
    return groups;
  }, [reports]);

  // Initialize expanded groups
  useEffect(() => {
    if (isOpen) {
      setExpandedGroups(new Set(Object.keys(groupedReports)));
    }
  }, [isOpen, groupedReports]);

  // Reset zoom when report changes
  useEffect(() => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
    setPdfZoom(100);
  }, [currentIndex]);

  // Sidebar resize handler
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, 200), 500);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const handleDownload = () => {
    if (!currentReport) return;
    const link = document.createElement('a');
    link.href = currentReport.fileUrl;
    link.download = currentReport.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!currentReport) return;
    const printWindow = window.open(currentReport.fileUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // Image zoom controls
  const zoomIn = () => setImageZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setImageZoom(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // PDF zoom controls
  const pdfZoomIn = () => setPdfZoom(prev => Math.min(prev + 25, 200));
  const pdfZoomOut = () => setPdfZoom(prev => Math.max(prev - 25, 50));
  const resetPdfZoom = () => setPdfZoom(100);

  // Handle PDF scroll zoom
  const handlePdfWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setPdfZoom(prev => Math.min(Math.max(prev + delta, 50), 200));
    }
  }, []);

  // Handle image wheel zoom
  const handleImageWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setImageZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
    }
  }, []);

  // Image drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageZoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const goToNext = useCallback(() => {
    if (hasNext) {
      onNavigate(currentIndex + 1);
    }
  }, [hasNext, currentIndex, onNavigate]);

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(currentIndex - 1);
    }
  }, [hasPrev, currentIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  if (!currentReport) return null;

  const isPDF = currentReport.mimeType === 'application/pdf';
  const isImage = currentReport.mimeType?.startsWith('image/');

  // Determine which zoom controls to show
  const currentZoom = isImage ? Math.round(imageZoom * 100) : pdfZoom;
  const handleZoomIn = isImage ? zoomIn : pdfZoomIn;
  const handleZoomOut = isImage ? zoomOut : pdfZoomOut;
  const handleResetZoom = isImage ? resetZoom : resetPdfZoom;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[50vw] p-0 flex flex-col"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <SheetHeader className="p-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold text-foreground truncate">
                {currentReport.fileName}
              </SheetTitle>
              {patientName && patientName !== 'Document Analysis' && (
                <p className="text-xs text-muted-foreground truncate">Patient: {patientName}</p>
              )}
            </div>
          
            <div className="flex items-center gap-1 shrink-0">
              {/* Navigation buttons - only show if multiple reports */}
              {hasMultipleReports && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPrev}
                    disabled={!hasPrev}
                    className="h-10 w-10"
                    aria-label="Previous report"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <span className="text-xs text-muted-foreground px-2 min-w-[60px] text-center">
                    {currentIndex + 1} / {reports.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNext}
                    disabled={!hasNext}
                    className="h-10 w-10"
                    aria-label="Next report"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}

              {/* Action buttons - only show for non-PDF */}
              {!isPDF && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownload}
                    className="h-10 w-10"
                    aria-label="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrint}
                    className="h-10 w-10"
                    aria-label="Print"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                </>
              )}

              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <X className="w-5 h-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetHeader>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Expand Button - Shows when sidebar is collapsed */}
          {hasMultipleReports && isSidebarCollapsed && (
            <div className="hidden md:flex items-start p-2 border-r border-border bg-muted/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed(false)}
                className="h-8 w-8"
                aria-label="Expand sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Report list sidebar with Findings/Summary - hidden on mobile, visible on larger screens */}
          {hasMultipleReports && !isSidebarCollapsed && (
            <div 
              ref={sidebarRef}
              className="hidden md:flex flex-col border-r border-border bg-muted/30 overflow-hidden relative transition-all duration-300"
              style={{ width: sidebarWidth }}
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">All Reports ({reports.length})</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="h-7 w-7"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                {/* Grouped reports */}
                {Object.entries(groupedReports).map(([groupName, { reports: groupReports, indices }]) => (
                  <div key={groupName} className="border-b border-border/50">
                    <Touchable
                      onClick={() => toggleGroup(groupName)}
                      className="w-full p-3 flex items-center gap-2 hover:bg-muted/50 transition-colors"
                    >
                      <FolderOpen className={`w-4 h-4 text-primary transition-transform ${expandedGroups.has(groupName) ? '' : '-rotate-90'}`} />
                      <span className="text-sm font-medium text-foreground flex-1 text-left">{groupName}</span>
                      <span className="text-xs text-muted-foreground">({groupReports.length})</span>
                    </Touchable>
                    
                    {expandedGroups.has(groupName) && (
                      <div className="pl-4">
                        {indices.map((reportIndex) => {
                          const report = reports[reportIndex];
                          return (
                            <Touchable
                              key={report.id}
                              onClick={() => onNavigate(reportIndex)}
                              className={`w-full p-3 text-left border-b border-border/30 transition-colors ${
                                reportIndex === currentIndex 
                                  ? 'bg-primary/10 border-l-2 border-l-primary' 
                                  : 'hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${
                                  reportIndex === currentIndex ? 'text-primary' : 'text-muted-foreground'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <span className={`text-xs line-clamp-2 block ${
                                    reportIndex === currentIndex ? 'text-foreground font-medium' : 'text-muted-foreground'
                                  }`}>
                                    {report.fileName}
                                  </span>
                                  {report.findings && (
                                    <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2 leading-tight">
                                      {report.findings}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Touchable>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Findings and Summary for current report */}
                {(currentReport.findings || currentReport.summary) && (
                  <div className="p-3 space-y-3">
                    {currentReport.findings && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Findings</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                          {currentReport.findings}
                        </p>
                      </div>
                    )}
                    {currentReport.summary && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Summary</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                          {currentReport.summary}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Resize Handle */}
              <div
                onMouseDown={handleResizeStart}
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors group flex items-center justify-center"
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          {/* Single report findings/summary sidebar */}
          {!hasMultipleReports && (currentReport.findings || currentReport.summary) && (
            <div className="hidden md:flex flex-col w-80 border-r border-border bg-muted/30 overflow-hidden">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-medium text-foreground">Report Details</p>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {currentReport.findings && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Findings</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {currentReport.findings}
                      </p>
                    </div>
                  )}
                  {currentReport.summary && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">Summary</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {currentReport.summary}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* PDF/Document/Image viewer */}
          <div className="flex-1 overflow-hidden bg-background flex flex-col relative">
            {/* Content viewer */}
            <div className="flex-1 overflow-hidden">
              {isImage ? (
                <div 
                  ref={imageContainerRef}
                  className={`w-full h-full overflow-hidden flex items-center justify-center bg-muted/20 ${imageZoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  onWheel={handleImageWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={currentReport.fileUrl}
                    alt={currentReport.fileName}
                    className="max-w-full max-h-full object-contain transition-transform duration-100"
                    style={{
                      transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                      transformOrigin: 'center center'
                    }}
                    draggable={false}
                  />
                </div>
              ) : (
                <div 
                  className="w-full h-full overflow-y-auto bg-[#4b4e51] py-6"
                  onWheel={handlePdfWheel}
                >
                  <Document
                    file={{ url: currentReport.fileUrl, httpHeaders: { 'ngrok-skip-browser-warning': 'true' } }}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="text-white text-center py-8">Streaming document...</div>}
                    error={<div className="text-red-400 text-center py-8">Failed to load PDF.</div>}
                  >
                    {Array.from(new Array(numPages || 0), (el, index) => {
                      const pageNumber = index + 1;
                      const pageBoxes =
                        targetBoxes?.filter((box) => getBoxPageNumber(box) === pageNumber) ?? [];

                      return (
                        <PdfPageWithHighlights
                          key={pageNumber}
                          pageNumber={pageNumber}
                          scale={pdfZoom / 100}
                          boxes={pageBoxes}
                          onPageRef={(el) => {
                            pageRefs.current[pageNumber] = el;
                          }}
                        />
                      );
                    })}
                  </Document>
                </div>
              )}
            </div>

            {/* Floating Glassmorphism Zoom Controls - Bottom Center */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/70 dark:bg-black/50 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg shadow-black/10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={isImage ? zoomOut : pdfZoomOut}
                  className="h-9 w-9 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                
                <span className="text-sm font-medium min-w-[50px] text-center text-foreground">
                  {isImage ? Math.round(imageZoom * 100) : pdfZoom}%
                </span>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={isImage ? zoomIn : pdfZoomIn}
                  className="h-9 w-9 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={isImage ? resetZoom : resetPdfZoom}
                  className="h-9 w-9 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile report indicator dots - only if multiple reports */}
        {hasMultipleReports && (
          <div className="md:hidden flex justify-center gap-1.5 p-3 border-t border-border bg-background">
            {reports.map((_, index) => (
              <button
                key={index}
                onClick={() => onNavigate(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
                aria-label={`Go to report ${index + 1}`}
              />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
