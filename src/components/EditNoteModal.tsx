import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';

interface Note {
  NoteID: string;
  staff?: string;
  role?: string;
  Type?: string;
  Level?: string;
  writtenOn?: string;
  notes?: string;
  NoteContent?: string;
}

interface EditNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onNoteUpdated?: () => void;
  admissionId?: string;

}

export const EditNoteModal = ({ open, onOpenChange, note, onNoteUpdated, admissionId }: EditNoteModalProps) => {
  const [formData, setFormData] = useState({
    Type: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };
  useEffect(() => {
    if (note && open) {
      setFormData({
        Type: note.Type || note.Level || 'Admission Note',
        notes: note.notes || note.NoteContent || ''
      });
    }
  }, [note, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionId || !note) return;
    if (!formData.notes) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiService.postForm('EditNote', {
        ConsultationID: admissionId,
        NoteID: note.NoteID,
        Type: formData.Type,
        NoteContent: formData.notes,
      });


      // Dispatch custom event to notify parent component
      document.dispatchEvent(new CustomEvent('note-updated', {
        detail: {
          ...note,
          Type: formData.Type,
          Level: formData.Type,
          notes: formData.notes,
          NoteContent: formData.notes
        }
      }));
      toast({
        title: "Finding Updated",
        description: "Note has been updated successfully.",
      });

      onNoteUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update note:', error);
      toast({
        title: "Error",
        description: "Failed to update Notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormData({
      Type: 'Admission Note',
      notes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              Edit Notes
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-0">
          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Type</label>
              <Select value={formData.Type} onValueChange={(value) => setFormData(prev => ({ ...prev, Type: value }))}>
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
                  <SelectItem value="Review Note">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                      Review Note
                    </div>
                  </SelectItem>
                  <SelectItem value="Clinical Note">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                      Clinical Note
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
                  <SelectItem value="High Priority">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#1a2256]"></div>
                      High Priority
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
              <Label htmlFor="notes" className="block text-[14px] font-bold text-[#1a2256] mb-2"> Notes *</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter detailed clinical findings, observations, or notes..."
                className="rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium min-h-32 resize-none leading-relaxed p-4"
                required
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] flex flex-row justify-end gap-3 rounded-b-[24px]">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="rounded-[12px] h-10 px-6 font-bold text-[#6e6868] border-[#e0e3f5] hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-[12px] h-10 px-6 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              {loading ? 'Updating...' : 'Update Finding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};