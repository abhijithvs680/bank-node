import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Folder, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchDealClauseGroups, type DealClauseGroup } from '@/services/dealFileService';
import { cn } from '@/lib/utils';

interface RunChecklistModalProps {
  open: boolean;
  dealId: string;
  fileId: string;
  fileName: string;
  onClose: () => void;
  onRun: (groupIds: string[]) => void;
}

export const RunChecklistModal = ({
  open,
  dealId,
  fileId,
  fileName,
  onClose,
  onRun,
}: RunChecklistModalProps) => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<DealClauseGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !dealId) return;

    setError(null);
    setSelectedGroupIds(new Set());
    setLoadingGroups(true);

    fetchDealClauseGroups(dealId)
      .then((loaded) => setGroups(loaded))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load checklist groups');
        setGroups([]);
      })
      .finally(() => setLoadingGroups(false));
  }, [open, dealId, fileId]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleRun = () => {
    if (!dealId || !fileId || selectedGroupIds.size === 0) return;
    onRun(Array.from(selectedGroupIds));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1a2256]">Run checklist analysis</DialogTitle>
          <DialogDescription>
            Select checklist groups to evaluate against{' '}
            <span className="font-semibold text-slate-700">{fileName}</span>.
          </DialogDescription>
        </DialogHeader>

        {loadingGroups ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#64549f]/60" />
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 px-4 text-center">
            <p className="text-sm text-slate-600 font-medium">No checklist groups for this deal.</p>
            <p className="text-xs text-slate-500 mt-1">
              Create groups in{' '}
              <button
                type="button"
                onClick={() => navigate(`/clause-management?deal_id=${encodeURIComponent(dealId)}`)}
                className="font-semibold text-[#64549f] hover:underline"
              >
                Clause Management
              </button>{' '}
              before running analysis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto scrollbar-transparent pr-1 py-1">
            {groups.map((group) => {
              const selected = selectedGroupIds.has(group.id);
              const clauseCount = group.clauses?.length ?? 0;
              return (
                <button
                  key={group.id}
                  type="button"
                  disabled={clauseCount === 0}
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'text-left rounded-xl border p-3 transition-all active:scale-[0.98]',
                    selected
                      ? 'border-[#64549f] bg-[#f0ecf7] ring-2 ring-[#64549f]/20'
                      : 'border-slate-200 bg-white hover:border-[#64549f]/40 hover:bg-slate-50',
                    clauseCount === 0 && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="w-4 h-4 text-[#64549f] shrink-0" />
                      <span className="text-[13px] font-bold text-[#1a2256] truncate">{group.name}</span>
                    </div>
                    {selected && <CheckCircle2 className="w-4 h-4 text-[#64549f] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    {clauseCount === 0 ? 'No clauses' : `${clauseCount} clause${clauseCount === 1 ? '' : 's'}`}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="text-[12px] text-red-600 font-medium">{error}</p>}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRun}
            disabled={loadingGroups || selectedGroupIds.size === 0}
            className="bg-[#1a2256] hover:bg-[#1a2256]/90"
          >
            Run analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
