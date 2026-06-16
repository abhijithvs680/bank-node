
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';

interface AddFindingModalProps {
  consultationId: string;
  isOpen: boolean;
  onClose: () => void;
  onNoteAdded?: () => void;
  initialNotes?: string;
  initialFindingType?: string;
}

export const AddFindingModal = ({
  consultationId,
  isOpen,
  onClose,
  onNoteAdded,
  initialNotes = '',
  initialFindingType = 'Admission Note'
}: AddFindingModalProps) => {
  const [type, setType] = useState('Admission Note');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Effect to set initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setNotes(initialNotes);
      setType(initialFindingType || 'Admission Note');
    }
  }, [isOpen, initialNotes, initialFindingType]);

  const handleSave = async () => {
    if (!notes) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiService.addNotes({
        consultationId: consultationId,
        noteContent: notes,
        Type: type,
      });

      toast({
        title: "Finding Added",
        description: "New Notes has been recorded successfully.",
      });

      // Trigger refresh of notes data
      onNoteAdded?.();

      // Reset form and close
      setType('Admission Note');
      setNotes('');
      onClose();
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to submit finding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              Add New Notes
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-white">
          <div className="space-y-2">
            <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Type </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium pl-4">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-[16px] border-[#e0e3f5] shadow-xl">
                <SelectItem value="Consultation Note">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                    Consultation Note
                  </div>
                </SelectItem>
                <SelectItem value="Lab Order">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                    Lab Order
                  </div>
                </SelectItem>
                <SelectItem value="Admission Note">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                    Admission Note
                  </div>
                </SelectItem>
                <SelectItem value="Progress Note">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                    Progress Note
                  </div>
                </SelectItem>

                <SelectItem value="Operative Note">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                    Operative Note
                  </div>
                </SelectItem>
                <SelectItem value="Procedure Note">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                    Procedure Note
                  </div>
                </SelectItem>
                <SelectItem value="Discharge Note / Summary">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                    Discharge Note / Summary
                  </div>
                </SelectItem>
                <SelectItem value="Emergency Department Note">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                    Emergency Department Note
                  </div>
                </SelectItem>
                <SelectItem value="Transfer Note">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                    Transfer Note
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Clinical Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter detailed clinical findings, observations, or notes..."
              className="rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium min-h-32 resize-none leading-relaxed p-4"
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
            {submitting ? 'Saving...' : 'Save Finding'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
