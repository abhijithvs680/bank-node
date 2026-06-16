import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/apiService';

interface UploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission_id: string;
  onUploadComplete?: () => void;
  onUploadStart?: (pendingFiles: Array<{ fileName: string; findings: string }>) => void;
  onUploadSuccess?: () => void;
}

export const UploadReportModal = ({ isOpen, onClose, admission_id, onUploadComplete, onUploadStart, onUploadSuccess }: UploadReportModalProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [findings, setFindings] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    fileName: string;
    fileId: string;
    findings: string;
  }>>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    // Reset file input to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive"
      });
      return;
    }



    // Notify parent of pending uploads
    const pendingFiles = files.map(file => ({
      fileName: file.name,
      findings: findings
    }));
    onUploadStart?.(pendingFiles);

    // Close modal and reset form immediately
    resetForm();
    onClose();

    // Continue upload in background
    try {
      await apiService.uploadPatientReports(
        admission_id,
        files,
        findings,
        () => { } // Progress tracking not needed since modal is closed
      );

      toast({
        title: "Upload completed",
        description: `${files.length} ${files.length === 1 ? 'file' : 'files'} uploaded. Analyzing...`,
      });

      // Trigger "Analyzing" state in parent
      onUploadSuccess?.();

      // Socket will handle clearing pending state when backend processes the file

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
      // Clear pending state on error
      onUploadComplete?.();
    }
  };

  const resetForm = () => {
    setFiles([]);
    setFindings('');
    setUploadProgress(0);
    setUploadStatus('idle');
    setUploadedFiles([]);
  };

  const handleDone = () => {
    resetForm();
    onUploadComplete?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              Upload Medical Reports
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Upload reports and add clinical information for this patient
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-white max-h-[70vh] overflow-y-auto medical-scroll">
          {/* File Upload Area */}
          <div>
            <Label className="block text-[14px] font-bold text-[#1a2256] mb-2">Upload Files</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-[16px] p-8 text-center transition-all cursor-pointer",
                isDragging ? "border-[#64549f] bg-[#f5f7fc]" : "border-[#e0e3f5] hover:border-[#64549f]/50 bg-[#fcfdfe]",
                uploadStatus === 'success' && "border-green-500 bg-green-50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />

              {uploadStatus === 'idle' && (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-[#64549f]/40" />
                  <p className="text-[15px] font-bold text-[#1a2256] mb-1">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-[12px] text-[#6e6868] font-medium">
                    Supports: PDF, JPG, PNG, DOC, DOCX
                  </p>
                </>
              )}

              {uploadStatus === 'uploading' && (
                <>
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#64549f] animate-spin" />
                  <p className="text-[15px] font-bold text-[#1a2256] mb-3">Uploading files...</p>
                  <Progress value={uploadProgress} className="h-2 mb-2 bg-[#f0f3f9]" />
                  <p className="text-[12px] text-[#6e6868] font-medium">{Math.round(uploadProgress)}% complete</p>
                </>
              )}

              {uploadStatus === 'success' && uploadedFiles.length === 0 && (
                <>
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-[15px] font-bold text-green-600">Upload successful!</p>
                </>
              )}

              {uploadStatus === 'error' && (
                <>
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                  <p className="text-[15px] font-bold text-destructive">Upload failed. Please try again.</p>
                </>
              )}
            </div>

            {/* Selected Files List */}
            {files.length > 0 && uploadStatus === 'idle' && (
              <div className="mt-4 space-y-2">
                <p className="text-[14px] font-bold text-[#1a2256]">{files.length} {files.length === 1 ? 'file' : 'files'} selected:</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#f5f7fc] p-3 rounded-[12px] border border-[#e0e3f5] animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center border border-[#e0e3f5]">
                        <FileText className="w-4 h-4 text-[#64549f]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-[#1a2256] truncate">{file.name}</p>
                        <p className="text-[11px] text-[#6e6868] font-medium">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="flex-shrink-0 hover:bg-white text-[#6e6868] hover:text-destructive rounded-[8px]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Success State - Display Uploaded Files */}
          {uploadStatus === 'success' && uploadedFiles.length > 0 && (
            <div className="space-y-3 bg-green-50 border border-green-200 rounded-[16px] p-6 animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-green-600 mb-4">
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-bold text-lg">Upload Successful!</span>
              </div>

              {uploadedFiles.map((file, index) => (
                <div key={index} className="bg-white border border-green-100 p-4 rounded-[12px] shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-[#1a2256]">{file.fileName}</span>
                  </div>
                  {file.findings && (
                    <p className="text-[13px] text-[#6e6868] font-medium">
                      <strong>Findings:</strong> {file.findings}
                    </p>
                  )}
                </div>
              ))}

              <Button onClick={handleDone} className="w-full mt-4 rounded-[12px] h-11 font-bold bg-green-600 hover:bg-green-700 text-white shadow-md transition-all active:scale-95">
                Done
              </Button>
            </div>
          )}

          {/* Clinical Information - Hide after success */}
          {uploadStatus !== 'success' && (
            <div>
              <Label htmlFor="findings" className="block text-[14px] font-bold text-[#1a2256] mb-2">Clinical Findings</Label>
              <Textarea
                id="findings"
                placeholder="Enter clinical findings and observations..."
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium min-h-[120px] resize-none leading-relaxed p-4"
                disabled={uploading}
              />
            </div>
          )}
        </div>

        {/* Action Buttons - Hide after success */}
        {uploadStatus !== 'success' && (
          <DialogFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] flex flex-row justify-end gap-3 rounded-b-[24px]">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={uploading}
              className="rounded-[12px] h-10 px-6 font-bold text-[#6e6868] border-[#e0e3f5] hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="rounded-[12px] h-10 px-6 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 min-w-[120px]"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
