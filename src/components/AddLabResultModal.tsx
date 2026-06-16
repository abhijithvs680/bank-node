import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, Loader2, FileText, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { socketService } from '@/services/socketService';
import { servicesSearchService } from '@/services/servicesSearchService';
import type { LabService } from '@/services/servicesDatabase';

interface AddLabResultModalProps {
  consultationId: string;
  isOpen: boolean;
  onClose: () => void;
  onLabResultAdded?: () => void;
  initialTestName?: string; // Pre-filled from voice command/selection
  initialNotes?: string;
}

export const AddLabResultModal = ({
  consultationId,
  isOpen,
  onClose,
  onLabResultAdded,
  initialTestName = '',
  initialNotes = ''
}: AddLabResultModalProps) => {
  const [labResult, setLabResult] = useState({
    testName: initialTestName,
    notes: initialNotes
  });
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<LabService[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (!labResult.testName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a test name.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiService.addLabResult({
        consultationId,
        testName: labResult.testName,
        notes: labResult.notes,
        action: 'add'
      });

      // Emit socket event for real-time update
      socketService.emit('patient_data_update', {
        _type: 'lab',
        admissionid: consultationId
      });

      // Dispatch custom event for local UI sync
      document.dispatchEvent(new CustomEvent('lab-added', {
        detail: {
          testName: labResult.testName,
          notes: labResult.notes
        }
      }));

      toast({
        title: "Lab Result Added",
        description: "New lab result has been recorded successfully.",
      });

      // Trigger refresh of lab results data
      onLabResultAdded?.();

      // Reset form and close
      setLabResult({
        testName: '',
        notes: ''
      });
      onClose();
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to submit lab result. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setLabResult(prev => ({ ...prev, [field]: value }));
  };

  const handleTestNameChange = async (value: string) => {
    handleInputChange('testName', value);

    if (value.trim().length >= 2) {
      setLoadingSuggestions(true);
      try {
        // Use fuzzy search from IndexedDB
        const results = await servicesSearchService.search(value, 15);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Error searching services:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      // Hide suggestions when less than 2 characters
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (service: LabService) => {
    setLabResult(prev => ({ ...prev, testName: service['Service Name'] }));
    setShowSuggestions(false);
  };

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update when initialTestName or initialNotes changes (from voice command/summary)
  useEffect(() => {
    if (initialTestName || initialNotes) {
      setLabResult(prev => ({ 
        ...prev, 
        testName: initialTestName || prev.testName,
        notes: initialNotes || prev.notes
      }));
    }
  }, [initialTestName, initialNotes]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setLabResult({
        testName: initialTestName || '',
        notes: initialNotes || ''
      });
      setShowSuggestions(false);
    }
  }, [isOpen, initialTestName]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              Add Lab
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-white">
          <div className="relative">
            <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Test Name</label>
            <div className="relative group">
              <Input
                ref={inputRef}
                value={labResult.testName}
                onChange={(e) => handleTestNameChange(e.target.value)}
                placeholder="Search or enter test name"
                autoComplete="off"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium pl-4 group-hover:border-[#64549f]/30"
              />
              {loadingSuggestions && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[#64549f]/40" />
                </div>
              )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-2 bg-white border border-[#e0e3f5] rounded-[16px] shadow-xl max-h-56 overflow-y-auto medical-scroll animate-in fade-in slide-in-from-top-2"
              >
                {suggestions.map((service, index) => (
                  <div
                    key={service.rowID || index}
                    className="px-4 py-3 cursor-pointer hover:bg-[#f5f7fc] border-b border-[#f0f3f9] last:border-0 transition-colors group"
                    onClick={() => handleSuggestionSelect(service)}
                  >
                    <div className="font-bold text-[#1a2256] text-[14px] group-hover:text-[#64549f]">{service['Service Name']}</div>
                    {service['Sub Department'] && (
                      <div className="text-[12px] text-[#6e6868] font-medium mt-0.5 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-[#f0ecf7] text-[#64549f] text-[10px] font-bold">
                          {service['Sub Department']}
                        </span>
                        <span className="opacity-40">•</span>
                        {service['Item Code']}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Notes</label>
            <Textarea
              value={labResult.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter notes about this lab result..."
              rows={4}
              className="rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium resize-none leading-relaxed p-4"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] flex flex-row justify-end gap-3 rounded-b-[24px]">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="rounded-[12px] h-10 px-6 font-bold text-[#6e6868] border-[#e0e3f5] hover:bg-gray-50 transition-all active:scale-95"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="rounded-[12px] h-10 px-6 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin text-white/60" />}
            {submitting ? 'Saving...' : 'Save Result'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
