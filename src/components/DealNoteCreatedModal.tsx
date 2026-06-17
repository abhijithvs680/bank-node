import { useEffect, useState } from 'react';
import { CheckCircle, FileText, Loader2, X as XIcon } from 'lucide-react';
import { ReadableAiContent } from '@/components/ReadableAiContent';
import { saveDealNote, type DealNotePendingData, type DealNoteRecord } from '@/services/dealNoteService';
import { emitNoteCancelledOutcome, emitNoteSavedOutcome } from '@/utils/dealModalVoiceFeedback';

export type { DealNotePendingData as DealNoteModalData };

type NoteModalState = 'preview' | 'saved' | 'cancelled';

interface DealNoteCreatedModalProps {
  open: boolean;
  dealId: string;
  note: DealNotePendingData | null;
  onClose: () => void;
  onSaved?: (note: DealNoteRecord) => void;
  hideBackdrop?: boolean;
  variant?: 'standalone' | 'stacked';
}

export const DealNoteCreatedModal = ({
  open,
  dealId,
  note,
  onClose,
  onSaved,
  hideBackdrop = false,
  variant = 'standalone',
}: DealNoteCreatedModalProps) => {
  const [state, setState] = useState<NoteModalState>('preview');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setState('preview');
      setSaving(false);
      setSaveError(null);
    }
  }, [open, note?.note_title]);

  useEffect(() => {
    if (state !== 'saved') return;
    const timer = setTimeout(() => handleClose(), 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    const onModalAction = (e: Event) => {
      const action = (e as CustomEvent).detail?.action;
      if (!open) return;
      if (action === 'save_note') void handleSave();
      if (action === 'cancel_note' || action === 'close_all' || action === 'cancel_all') handleCancel();
    };
    document.addEventListener('ai-deal-modal-action', onModalAction);
    return () => document.removeEventListener('ai-deal-modal-action', onModalAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, note, dealId]);

  if (!open || !note) return null;

  const handleSave = async () => {
    if (!dealId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveDealNote(dealId, note);
      setState('saved');
      emitNoteSavedOutcome(result.note.note_title, result.note.id);
      onSaved?.(result.note);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    emitNoteCancelledOutcome(note.note_title);
    setState('cancelled');
    setSaveError(null);
    onClose();
  };

  const handleClose = () => {
    if (state === 'preview') {
      emitNoteCancelledOutcome(note.note_title);
    }
    setState('preview');
    setSaveError(null);
    onClose();
  };

  const positionClass =
    variant === 'stacked'
      ? 'relative w-full max-h-[calc((100vh-5rem)/2)] min-h-[220px]'
      : 'fixed right-6 top-6 z-[9999] max-h-[calc(100vh-3rem)]';

  return (
    <>
      {!hideBackdrop && variant === 'standalone' && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9998] animate-in fade-in duration-300 pointer-events-none"
          aria-hidden
        />
      )}
      <div
        className={`${positionClass} w-[400px] bg-white rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-slate-100 transform transition-transform duration-300 animate-in slide-in-from-right duration-300 flex flex-col overflow-hidden`}
      >
        {state === 'preview' && (
          <>
            <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-5">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-green-600 shrink-0" />
                <h4 className="text-[14px] font-bold text-slate-800 font-['Inter'] truncate">
                  {note.note_title}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors shrink-0"
                aria-label="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-transparent px-5 py-3 space-y-2.5">
              <ReadableAiContent text={note.note_description} compact />
              <div className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col gap-0.5">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  Note Type
                </span>
                <span className="text-slate-600 font-semibold">{note.note_type}</span>
              </div>
            </div>

            <div className="shrink-0 px-5 pb-5 pt-2 border-t border-slate-100 space-y-2">
              {saveError && (
                <p className="text-[11px] text-red-600 font-medium">{saveError}</p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 rounded-[10px] h-9 border border-slate-200 hover:bg-slate-50 text-[12px] font-bold text-slate-700 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="px-5 rounded-[10px] h-9 bg-green-600 hover:bg-green-700 text-white text-[12px] font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          </>
        )}

        {state === 'saved' && (
          <div className="p-5 flex flex-col gap-4">
            <div className="w-full bg-green-500 h-1 rounded-full shrink-0" />
            <div className="py-2 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shadow-sm shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-[13px] font-bold text-slate-800 font-['Inter']">
                  Note added successfully
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium font-['Inter']">
                  The AI-generated note has been saved to this deal.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
