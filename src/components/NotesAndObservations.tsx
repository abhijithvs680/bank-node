import { useState, useEffect } from 'react';
import { Save, Trash2, Clock, Check } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { EditNoteModal } from '@/components/EditNoteModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { RelativeTime } from '@/components/RelativeTime';
import { Touchable } from '@/components/ui/touchable';

interface NotesAndObservationsProps {
  onAddFinding?: () => void;
  visits?: any[];
  admissionId?: string;
  loading?: boolean;
  error?: string | null;
  setVisits?: React.Dispatch<React.SetStateAction<any[]>>;
  onNoteAdded?: () => void;
}

export const NotesAndObservations = ({
  onAddFinding,
  visits,
  admissionId,
  loading,
  error,
  setVisits,
  onNoteAdded
}: NotesAndObservationsProps) => {
  // Listen for added findings and prepend
  const [editNoteModal, setEditNoteModal] = useState<{
    open: boolean;
    note: any | null;
  }>({ open: false, note: null });

  // Inline note entry state
  const [noteType, setNoteType] = useState('Consultation Note');
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    const handleFindingAdded = (e: Event) => {
      const ce = e as CustomEvent<any>;
      if (ce.detail) {
        setVisits?.((prev) => [ce.detail, ...(Array.isArray(prev) ? prev : [])]);
      }
    };

    const handleNoteUpdated = (e: Event) => {
      const ce = e as CustomEvent<any>;
      if (ce.detail) {
        setVisits?.((prev) => (Array.isArray(prev) ? prev : []).map(note =>
          note.id === ce.detail.id ? { ...note, ...ce.detail } : note
        ));
      }
    };

    document.addEventListener('finding-added', handleFindingAdded as EventListener);
    document.addEventListener('note-updated', handleNoteUpdated as EventListener);

    return () => {
      document.removeEventListener('finding-added', handleFindingAdded as EventListener);
      document.removeEventListener('note-updated', handleNoteUpdated as EventListener);
    };
  }, [setVisits]);

  const handleEditNote = (note: any) => {
    setEditNoteModal({ open: true, note });
  };

  const parseDate = (str: string) => {
    if (!str) return new Date(0);
    const [datePart, timePart] = str.split(' ');
    if (!datePart || !timePart) return new Date(0);
    const [day, month, year] = datePart.split('-');
    if (!day || !month || !year) return new Date(0);
    return new Date(`${year}-${month}-${day}T${timePart}`);
  };

  const handleNoteUpdated = () => {
    onNoteAdded?.();
  };

  const handleInlineSave = async () => {
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      await apiService.postForm('Add New Finding', {
        ConsultationID: admissionId,
        Type: noteType,
        NoteContent: noteText,
      });
      toast({
        title: "Note Added",
        description: "Note saved successfully."
      });
      setNoteText('');
      onNoteAdded?.();
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const noteTypes = [
    'Consultation Note',
    'Review Note',
    'Clinical Note',
    'Admission Note',
    'Follow-up Note',
    'Other ',
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-muted-foreground animate-pulse font-medium">Loading clinical notes...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 px-4 bg-red-50 rounded-[20px] border border-red-100">
          <p className="text-sm text-destructive font-bold">Failed to load notes</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-2">
        {/* Note Entry Area */}
        <div className="bg-white p-6 rounded-[24px] border border-[#e0e3f5] shadow-sm">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter  notes"
            spellCheck="false"
            data-gramm="false"
            className="min-h-[120px] resize-none text-[1.1rem] font-medium leading-relaxed border-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none p-0 mb-6 bg-transparent placeholder:text-muted-foreground/50 shadow-none focus:shadow-none"
          />

          <div className="flex items-center justify-between gap-4">
            {/* Category Chips */}
            <div className="flex flex-wrap gap-2">
              {noteTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setNoteType(type)}
                  className={`px-4 py-1.5 rounded-lg text-[0.86rem] font-medium transition-all duration-200 flex items-center gap-1.5 border ${noteType === type
                    ? 'bg-[#f5f3ff] text-[#64549f] border-[#64549f]/20'
                    : 'bg-white text-[#161616] border-[#e0e3f5] hover:border-[#64549f]/30'
                    }`}
                >
                  {noteType === type && <Check className="w-4 h-4 text-[#64549f]" />}
                  {type.replace(' Note', '').replace(' / Summary', '')}
                </button>
              ))}
            </div>

            {/* Add Note Button */}
            <Button
              onClick={handleInlineSave}
              disabled={submitting || !noteText.trim()}
              className="bg-[#1a2256] hover:bg-[#1a2256]/90 text-white rounded-lg px-8 h-10 text-[1rem] font-medium shadow-lg shadow-[#1a2256]/20 transition-all active:scale-95 whitespace-nowrap"
            >
              {submitting ? 'Saving...' : 'Add Note'}
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-4 medical-scroll max-h-[600px] overflow-y-auto pr-2">
          {(!visits || !Array.isArray(visits) || visits.length === 0 || (visits[0] && visits[0].length === 0)) ? (
            <div className="text-center py-16 text-[#6e6868] bg-[#fcfdfe] rounded-[24px] border border-dashed border-[#e0e3f5]">
              <div className="w-12 h-12 rounded-full bg-[#f5f7fc] flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-[#9e9e9e]" />
              </div>
              <p className="text-[15px] font-bold text-[#1a2256]">No  Notes</p>
              <p className="text-[13px] font-medium mt-1">Start by adding a note above.</p>
            </div>
          ) : (
            (Array.isArray(visits) ? visits : [])
              .sort((a, b) => parseDate(b.writtenOn).getTime() - parseDate(a.writtenOn).getTime())
              .map((visit) => {
                const initials = visit.DoctorName
                  ? visit.DoctorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'DR';
                return (
                  <Touchable
                    key={visit.id}
                    onClick={() => handleEditNote(visit)}
                    className="group flex gap-3 p-4 rounded-[20px] border border-[#e0e3f5] bg-white hover:border-[#64549f]/30 hover:shadow-xl transition-all duration-400 relative"
                  >
                    <div className="w-[42px] h-[42px] rounded-[12px] bg-[#f5f7fc] flex items-center justify-center flex-shrink-0 border border-[#e0e3f5] group-hover:bg-[#64549f]/5 transition-colors">
                      <span className="text-[0.94rem] font-bold text-[#64549f]">{initials}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[1rem] font-bold text-[#161616] group-hover:text-[#64549f] transition-colors">
                          {visit.DoctorName || 'Attending Physician'}
                        </span>
                        <span className="text-[0.75rem] text-[#9e9e9e] font-bold">
                          <RelativeTime dateStr={visit.UpdatedOn} />
                        </span>
                      </div>

                      {visit.Type && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block bg-[#f0ecf7] text-[#64549f] text-[0.69rem] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-[#64549f]/10 shadow-sm">
                            {visit.Type}
                          </span>
                        </div>
                      )}

                      <div className="p-3 bg-[#fcfdfe] rounded-[16px] border border-[#f0f3f9] group-hover:bg-white group-hover:border-[#64549f]/10 transition-all duration-300">
                        <p className="text-[0.94rem] text-[#424242] font-medium leading-[1.6] break-words line-clamp-4" style={{ whiteSpace: 'pre-line' }}>
                          {visit.NoteContent}
                        </p>
                      </div>

                      {/* Interaction hint */}
                      <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                        <span className="text-[12px] font-bold text-[#64549f] flex items-center gap-1">
                          Edit Note
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm('Terminate this clinical note?')) return;
                        const id = visit.NoteID ?? visit.id;
                        try {
                          await apiService.postForm('DeleteNote', { NoteID: id });
                          toast({ title: 'Note deleted' });
                          setVisits?.((prev) => (Array.isArray(prev) ? prev.filter(n => (n.NoteID ?? n.id) !== id) : prev));
                        } catch (err) {
                          toast({ title: 'Delete failed', variant: 'destructive' });
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-[10px] hover:bg-red-50 ml-2 self-start transform hover:scale-110 active:scale-95 transition-all"
                    >
                      <Trash2 className="w-4.5 h-4.5 text-red-400" />
                    </button>
                  </Touchable>
                );
              })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#e0e3f5] p-1 shadow-none fade-in">
      {renderContent()}

      <EditNoteModal
        open={editNoteModal.open}
        onOpenChange={(open) => setEditNoteModal({ open, note: null })}
        note={editNoteModal.note}
        onNoteUpdated={handleNoteUpdated}
        admissionId={admissionId}
      />
    </div>
  );
};
