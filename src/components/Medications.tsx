import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Pill, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService, isPrescriptionActiveFlag } from '@/services/apiService';
import { Medication } from '@/types/patient';
import { parseDateTime, getRelativeTimeFuture } from '@/utils/timeUtils';
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

interface MedicationsProps {
  onAddMedication: () => void;
  onEditMedication: (medication: Medication) => void;
  medications: Medication[];
  loading: boolean;
  admissionId: string;
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  indentUrl?: string;
  isInpatient?: boolean;
}

// Helper function to parse nextDue from API format and calculate priority
const parseNextDueAndPriority = (nextDueString: string) => {
  if (!nextDueString) return { nextDue: null, priority: 'scheduled' as const, canMarkGiven: false, nextDueDisplay: '' };

  const nextDue = parseDateTime(nextDueString);
  if (!nextDue) return { nextDue: null, priority: 'scheduled' as const, canMarkGiven: false, nextDueDisplay: '' };

  const now = new Date();
  const timeDiff = nextDue.getTime() - now.getTime();
  const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));

  let priority: 'overdue' | 'due-soon' | 'scheduled' = 'scheduled';
  if (hoursUntil < 0) priority = 'overdue';
  else if (hoursUntil < 1) priority = 'due-soon';

  const minutesDiff = timeDiff / (1000 * 60);
  const canMarkGiven = minutesDiff <= 5; // Show button if due within 5 minutes or overdue

  return {
    nextDue,
    priority,
    canMarkGiven,
    nextDueDisplay: nextDue.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    nextDueString // Keep original string for MedicationDueTime component
  };
};

const formatFoodTimingAbbrev = (timing?: string) => {
  switch (timing) {
    case 'before-food': return 'BFM';
    case 'after-food': return 'AFM';
    case 'before-bed': return 'BB';
    case 'with-food': return 'WF';
    default: return timing ? timing.replace(/-/g, ' ') : '';
  }
};

const formatMedMeta = (med: Medication) => {
  const durationLabel = med.numberOfDays
    ? `${med.numberOfDays}D`
    : med.duration
      ? med.duration
      : '';
  return [med.dosage, med.frequency, formatFoodTimingAbbrev(med.foodTiming), durationLabel]
    .filter(Boolean)
    .join(' • ');
};

const formatShortDateTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = parseDateTime(dateStr);
  if (!date) return dateStr;
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${time}, ${datePart}`;
};

const getNextDueLabel = (nextDueString?: string) => {
  if (!nextDueString) return { label: '—', isOverdue: false };
  const { text, isOverdue } = getRelativeTimeFuture(nextDueString);
  if (isOverdue) {
    const cleaned = text.replace(/\s*overdue$/i, '').trim();
    return { label: cleaned ? `Overdue by ${cleaned}` : text, isOverdue: true };
  }
  const nextDue = parseDateTime(nextDueString);
  const timeLabel = nextDue
    ? `Next ${nextDue.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    : text;
  return { label: timeLabel, isOverdue: false };
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-1 py-2 bg-[#F8FAFC] border-y border-[#E2E8F0] rounded-sm">
    <span className="text-[13px] font-medium text-[#64748B]">{title}</span>
  </div>
);

interface MedicationCardProps {
  med: Medication;
  onClick: () => void;
  showDelete?: boolean;
  muted?: boolean;
  statusLabel?: string;
  statusVariant?: 'active' | 'overdue' | 'completed';
  deletingId?: string | null;
  onDelete?: (e: React.MouseEvent) => void;
}

const MedicationCard = ({
  med,
  onClick,
  showDelete = false,
  muted = false,
  statusLabel,
  statusVariant,
  deletingId,
  onDelete,
}: MedicationCardProps) => {
  const { priority } = parseNextDueAndPriority(med.nextDue || '');
  const isActive = statusVariant ? statusVariant === 'active' : priority !== 'overdue';
  const isOverdue = statusVariant ? statusVariant === 'overdue' : priority === 'overdue';
  const isCompleted = statusVariant === 'completed';

  const badgeLabel = statusLabel ?? (isCompleted ? 'Course Completed' : isOverdue ? 'Overdue' : 'Active');
  const badgeClass = isCompleted
    ? 'bg-[#e8f5e9] text-[#2e7d32]'
    : isOverdue
      ? 'bg-[#fff3e0] text-[#e65100]'
      : 'bg-[#e8f5e9] text-[#2e7d32]';

  return (
    <div
      onClick={onClick}
      className={`bg-white p-3 rounded-[16px] border border-[#e0e3f5] transition-all duration-300 group relative ${
        muted ? 'opacity-70 cursor-default hover:border-[#e0e3f5]' : 'hover:border-[#64549f]/30 cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex gap-2.5 min-w-0">
          <div className={`w-[32px] h-[32px] rounded-[10px] flex items-center justify-center flex-shrink-0 transition-colors ${
            muted ? 'bg-[#f5f7fc]' : 'bg-[#f5f7fc] group-hover:bg-[#64549f]/5'
          }`}>
            <Pill className={`w-4 h-4 ${muted ? 'text-[#94A3B8]' : 'text-[#64549f]'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className={`font-semibold text-[14px] truncate font-['Inter'] ${
                muted ? 'text-[#94A3B8]' : 'text-[#161616] group-hover:text-[#64549f] transition-colors'
              }`}>
                {med.name}
              </h4>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeClass}`}>
                {badgeLabel}
              </span>
            </div>
            <div className={`text-[12px] font-semibold flex items-center gap-1.5 mt-0.5 font-['Inter'] ${
              muted ? 'text-[#CBD5E1]' : 'text-[#9e9e9e]'
            }`}>
              <Clock className="w-3 h-3 shrink-0" />
              {med.frequency || formatMedMeta(med)}
            </div>
          </div>
        </div>

        {showDelete && onDelete && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={deletingId === med.medicationId}
              className="h-6 w-6 p-0 rounded-lg hover:bg-red-50 text-red-500"
              title="Delete Medication"
            >
              {deletingId === med.medicationId ? (
                <Loader2 className="w-3 animate-spin" />
              ) : (
                <Trash2 className="w-3" />
              )}
            </Button>
          </div>
        )}
      </div>

      <div className={`flex items-start gap-2 text-[12px] font-medium mt-1.5 pt-1.5 border-t font-['Inter'] ${
        muted ? 'text-[#CBD5E1] border-[#f0f3f9]' : 'text-[#424242] border-[#f0f3f9]'
      }`}>
        <div className={`flex items-center gap-1.5 flex-wrap ${muted ? 'text-[#CBD5E1]' : 'text-[#6e6868]'}`}>
          {med.dosage && <span className="font-semibold text-[12px]">{med.dosage}</span>}
          {med.dosage && med.route && <span className="opacity-30">•</span>}
          {med.route && <span className="text-[12px]">{med.route}</span>}
          {med.foodTiming && (
            <>
              <span className="opacity-30">•</span>
              <span className={`text-[12px] ${muted ? 'text-[#CBD5E1]' : 'text-[#64549f]'}`}>
                {med.foodTiming.replace('-', ' ')}
              </span>
            </>
          )}
          {!med.dosage && !med.route && !med.foodTiming && (
            <span className="text-[12px]">{formatMedMeta(med)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export const Medications = ({
  onAddMedication,
  onEditMedication,
  medications,
  loading,
  admissionId,
  setMedications,
  indentUrl,
  isInpatient = false,
}: MedicationsProps) => {
  const navigate = useNavigate();
  const [givenMedications, setGivenMedications] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; medication: Medication | null }>({
    isOpen: false,
    medication: null
  });
  const [deleting, setDeleting] = useState(false);

  const handleDeleteMedication = async () => {
    if (!deleteConfirm.medication?.medicationId) return;

    setDeleting(true);
    try {
      setDeletingId(deleteConfirm.medication.medicationId);
      await apiService.deletePrescription(deleteConfirm.medication.medicationId);
      setMedications((prev) => prev.filter((m) => m.medicationId !== deleteConfirm.medication?.medicationId));
      setDeleteConfirm({ isOpen: false, medication: null });
    } catch (error) {
      console.error('Error deleting medication:', error);
    } finally {
      setDeletingId(null);
      setDeleting(false);
    }
  };

  const handleMarkGiven = async (medicationId: string, admissionId: string) => {
    try {
      setMarkingId(medicationId);
      if (admissionId) {
        await apiService.markGiven(admissionId, medicationId);
        setGivenMedications(prev => new Set([...prev, medicationId]));
      }
    } catch (error) {
      console.error('Error marking medication as given:', error);
    } finally {
      setMarkingId(null);
    }
  };

  const handleEditMedication = (medication: Medication) => {
    onEditMedication(medication);
  };

  const activeMedications = useMemo(() => {
    if (isInpatient) {
      return medications.filter((med) => isPrescriptionActiveFlag(med.activeFlag));
    }
    return medications.filter((med) => med.status !== 'discontinued');
  }, [medications, isInpatient]);

  const discontinuedMedications = useMemo(() => {
    if (isInpatient) {
      return medications.filter((med) => !isPrescriptionActiveFlag(med.activeFlag));
    }
    return medications.filter((med) => med.status === 'discontinued');
  }, [medications, isInpatient]);

  useEffect(() => {
    if (!isInpatient || activeMedications.length === 0) return;
    setExpandedId((current) => current ?? activeMedications[0].medicationId);
  }, [isInpatient, activeMedications]);

  if (loading) {
    return (
      <div className="bg-white rounded-[20px] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[1.125rem] font-semibold text-[#161616] font-['Inter']">Medications</h3>
        </div>
        <div className="text-center text-muted-foreground py-2">Loading medications...</div>
      </div>
    );
  }

  if (isInpatient) {
    return (
      <div className="bg-white rounded-[20px] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[1.125rem] font-semibold text-[#161616] font-['Inter']">Medications</h3>
          <Button
            size="sm"
            onClick={onAddMedication}
            variant="outline"
            className="h-8 px-4 rounded-[10px] text-[13px] font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto medical-scroll pr-1">
          <SectionHeader title="Active Medications" />

          {activeMedications.length === 0 ? (
            <div className="text-center py-8 text-[#6e6868] bg-[#fcfdfe] rounded-[16px] border border-dashed border-[#e0e3f5]">
              <p className="text-[0.875rem] font-bold text-[#1a2256]">No active medications found</p>
              <p className="text-[0.75rem] font-medium mt-1">Add a new medication to begin.</p>
            </div>
          ) : (
            activeMedications.map((med) => {
              const isExpanded = expandedId === med.medicationId;
              const instructions = med.instructions || med.Instructions || '';

              return (
                <div key={med.medicationId}>
                  <MedicationCard
                    med={med}
                    onClick={() => setExpandedId(isExpanded ? null : med.medicationId)}
                  />

                  {isExpanded && (
                    <div className="px-3 pb-2 pt-1 ml-[42px]">
                      {(med.infusionRate || med.nextDue) && (
                        <p className="text-[12px] text-[#64748B] mb-2">
                          {med.infusionRate ? `${med.infusionRate}` : ''}
                          {med.nextDue ? `${med.infusionRate ? ' | ' : ''}${formatShortDateTime(med.nextDue)}` : ''}
                        </p>
                      )}
                      {med.lastGiven && (
                        <p className="text-[12px] text-[#64748B] mb-2 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          Last given: {formatShortDateTime(med.lastGiven)}
                        </p>
                      )}
                      <p className="text-[12px] text-[#94A3B8]">
                        {instructions.trim() || 'No special instructions or notes provided.'}
                      </p>
                      {/* <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          disabled={markingId === med.medicationId || givenMedications.has(med.medicationId)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkGiven(med.medicationId, admissionId);
                          }}
                          className="h-9 px-4 rounded-lg text-[13px] font-semibold bg-[#64549f] hover:bg-[#5b48a2] text-white"
                        >
                          {markingId === med.medicationId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Mark as Taken'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMedication(med);
                          }}
                          className="h-9 px-4 rounded-lg text-[13px] font-semibold border-[#64549f] text-[#64549f] hover:bg-[#64549f]/5"
                        >
                          Details
                        </Button>
                      </div> */}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {discontinuedMedications.length > 0 && (
            <>
              <SectionHeader title="Medications Discontinued" />
              {discontinuedMedications.map((med) => (
                <MedicationCard
                  key={med.medicationId}
                  med={med}
                  onClick={() => {}}
                  muted
                  statusLabel="Course Completed"
                  statusVariant="completed"
                />
              ))}
            </>
          )}
        </div>
{/* 
        <div className="grid grid-cols-2 gap-3 p-4 border-t border-[#E2E8F0]">
          {indentUrl ? (
            <a
              href={indentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-10 px-4 border border-[#64549f] bg-white hover:bg-[#64549f]/5 text-[#64549f] rounded-[10px] text-[13px] font-semibold transition-all no-underline"
            >
              Create Intent
            </a>
          ) : (
            <Button
              variant="outline"
              disabled
              className="h-10 rounded-[10px] text-[13px] font-semibold border-[#64549f] text-[#64549f]"
            >
              Create Intent
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/consultationId/${admissionId}/mar`)}
            className="h-10 rounded-[10px] text-[13px] font-semibold border-[#64549f] text-[#64549f] hover:bg-[#64549f]/5"
          >
            MAR
          </Button>
        </div> */}

        <AlertDialog
          open={deleteConfirm.isOpen}
          onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, medication: null })}
        >
          <AlertDialogContent className="rounded-[24px] border-[#e0e3f5]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#1a2256] font-bold">Delete Medication</AlertDialogTitle>
              <AlertDialogDescription className="text-[#6e6868] font-medium">
                Are you sure you want to delete <span className="text-[#1a2256] font-bold italic">"{deleteConfirm.medication?.name}"</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel disabled={deleting} className="rounded-[12px] font-bold text-[#6e6868] border-[#e0e3f5]">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMedication}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white rounded-[12px] font-bold shadow-md hover:shadow-lg transition-all"
              >
                {deleting ? 'Deleting...' : 'Delete Medication'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[1.125rem] font-semibold text-[#161616] font-['Inter']">Medications</h3>
        <div className="flex items-center gap-2">

          <Button
            size="sm"
            onClick={onAddMedication}
            variant="outline"
            className="h-8 px-4 rounded-[10px] text-[13px] font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto medical-scroll pr-1">
        {medications.length === 0 ? (
          <div className="text-center py-8 text-[#6e6868] bg-[#fcfdfe] rounded-[16px] border border-dashed border-[#e0e3f5]">
            <p className="text-[0.875rem] font-bold text-[#1a2256]">No current medications found</p>
            <p className="text-[0.75rem] font-medium mt-1">Add a new medication to begin.</p>
          </div>
        ) : (
          medications.map((med) => (
            <MedicationCard
              key={med.medicationId}
              med={med}
              onClick={() => handleEditMedication(med)}
              showDelete
              deletingId={deletingId}
              onDelete={(e) => {
                e.stopPropagation();
                setDeleteConfirm({ isOpen: true, medication: med });
              }}
            />
          ))
        )}
      </div>
      {indentUrl && (
        <a
          href={indentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full h-8 px-4 border border-[#e0e3f5] bg-[#f5f7fc] hover:bg-[#ebeef5] text-[#64549f] rounded-[10px] text-[0.94rem] font-semibold transition-all active:scale-[0.98] no-underline mt-3"
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          Create Indent
        </a>
      )}

      <AlertDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, medication: null })}
      >
        <AlertDialogContent className="rounded-[24px] border-[#e0e3f5]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1a2256] font-bold">Delete Medication</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6e6868] font-medium">
              Are you sure you want to delete <span className="text-[#1a2256] font-bold italic">"{deleteConfirm.medication?.name}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleting} className="rounded-[12px] font-bold text-[#6e6868] border-[#e0e3f5]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMedication}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white rounded-[12px] font-bold shadow-md hover:shadow-lg transition-all"
            >
              {deleting ? 'Deleting...' : 'Delete Medication'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
