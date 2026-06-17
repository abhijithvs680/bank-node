import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  X,
  FolderPlus,
  FilePlus2,
  Folder,
  FileText,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  addDealClauseItem,
  createDealClauseGroup,
  deleteDealClauseItem,
  fetchDealClauseGroups,
  updateDealClauseItem,
  type DealClauseGroup,
  type DealClauseItem,
} from '@/services/dealFileService';

export default function ClauseManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get('deal_id') || '';
  const { toast } = useToast();

  const [groups, setGroups] = useState<DealClauseGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);

  const [isAddingClause, setIsAddingClause] = useState(false);
  const [newClauseTitle, setNewClauseTitle] = useState('');
  const [newClauseDesc, setNewClauseDesc] = useState('');
  const [savingClause, setSavingClause] = useState(false);

  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editingClauseTitle, setEditingClauseTitle] = useState('');
  const [editingClauseDesc, setEditingClauseDesc] = useState('');
  const [updatingClauseId, setUpdatingClauseId] = useState<string | null>(null);
  const [deletingClauseId, setDeletingClauseId] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!dealId) {
      setGroups([]);
      setSelectedGroupId(null);
      return;
    }

    setLoadingGroups(true);
    setLoadError(null);
    try {
      const loaded = await fetchDealClauseGroups(dealId);
      setGroups(loaded);
      setSelectedGroupId((prev) => {
        if (prev && loaded.some((g) => g.id === prev)) return prev;
        return loaded.length > 0 ? loaded[0].id : null;
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load clause groups';
      setLoadError(message);
      setGroups([]);
      setSelectedGroupId(null);
    } finally {
      setLoadingGroups(false);
    }
  }, [dealId]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId || !newGroupName.trim() || savingGroup) return;

    setSavingGroup(true);
    try {
      const created = await createDealClauseGroup(dealId, newGroupName);
      setGroups((prev) => [...prev, created]);
      setSelectedGroupId(created.id);
      setNewGroupName('');
      setIsAddingGroup(false);
      toast({
        title: 'Group created',
        description: `Clause group "${created.name}" was saved to this deal.`,
      });
    } catch (err: unknown) {
      toast({
        title: 'Failed to create group',
        description: err instanceof Error ? err.message : 'Could not create clause group.',
        variant: 'destructive',
      });
    } finally {
      setSavingGroup(false);
    }
  };

  const handleAddClause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId || !selectedGroupId || !newClauseTitle.trim() || savingClause) return;

    setSavingClause(true);
    try {
      const item = await addDealClauseItem(dealId, selectedGroupId, {
        title: newClauseTitle,
        description: newClauseDesc,
      });
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroupId ? { ...g, clauses: [...g.clauses, item] } : g
        )
      );
      setIsAddingClause(false);
      setNewClauseTitle('');
      setNewClauseDesc('');
      toast({
        title: 'Clause added',
        description: `Clause "${item.title}" was added to the group.`,
      });
    } catch (err: unknown) {
      toast({
        title: 'Failed to add clause',
        description: err instanceof Error ? err.message : 'Could not add clause item.',
        variant: 'destructive',
      });
    } finally {
      setSavingClause(false);
    }
  };

  const handleStartEditClause = (clause: DealClauseItem) => {
    setEditingClauseId(clause.id);
    setEditingClauseTitle(clause.title);
    setEditingClauseDesc(clause.description || '');
  };

  const handleSaveEditClause = async (clauseId: string) => {
    if (!dealId || !selectedGroupId || !editingClauseTitle.trim() || updatingClauseId) return;

    setUpdatingClauseId(clauseId);
    try {
      const updated = await updateDealClauseItem(dealId, selectedGroupId, clauseId, {
        title: editingClauseTitle,
        description: editingClauseDesc,
      });
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroupId
            ? {
                ...g,
                clauses: g.clauses.map((c) => (c.id === clauseId ? updated : c)),
              }
            : g
        )
      );
      setEditingClauseId(null);
      setEditingClauseTitle('');
      setEditingClauseDesc('');
      toast({
        title: 'Clause updated',
        description: 'Clause details were saved.',
      });
    } catch (err: unknown) {
      toast({
        title: 'Failed to update clause',
        description: err instanceof Error ? err.message : 'Could not update clause item.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingClauseId(null);
    }
  };

  const handleDeleteClause = async (clause: DealClauseItem) => {
    if (!dealId || !selectedGroupId || deletingClauseId) return;
    if (
      !window.confirm(
        `Delete clause "${clause.title}"? This will also remove any checklist results linked to it.`
      )
    ) {
      return;
    }

    setDeletingClauseId(clause.id);
    try {
      await deleteDealClauseItem(dealId, selectedGroupId, clause.id);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroupId
            ? { ...g, clauses: g.clauses.filter((c) => c.id !== clause.id) }
            : g
        )
      );
      if (editingClauseId === clause.id) {
        setEditingClauseId(null);
        setEditingClauseTitle('');
        setEditingClauseDesc('');
      }
      toast({
        title: 'Clause deleted',
        description: `"${clause.title}" was removed from the group.`,
      });
    } catch (err: unknown) {
      toast({
        title: 'Failed to delete clause',
        description: err instanceof Error ? err.message : 'Could not delete clause item.',
        variant: 'destructive',
      });
    } finally {
      setDeletingClauseId(null);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  if (!dealId) {
    return (
      <div className="min-h-screen bg-[#ebeef9] font-['Inter'] flex flex-col items-center justify-center p-8">
        <Folder className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-xl font-bold text-[#1a2256] mb-2">No deal selected</h1>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
          Open clause management from a deal&apos;s documents panel so checklist groups are scoped to that deal.
        </p>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-[10px]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ebeef9] font-['Inter'] flex flex-col h-screen overflow-hidden">
      <header className="relative overflow-hidden bg-[#1a2256] h-20 shrink-0">
        <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-[400px] h-full bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none" />

        <div className="relative h-full px-6 md:px-12 lg:px-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 hover:bg-white/25 hover:border-white/30 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 text-white transition-colors" />
            </button>

            <div className="h-8 w-[1px] bg-white/10" />

            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Clause Management</h1>
              <p className="text-[13px] text-white/50 font-medium">
                Deal {dealId} — organize checklist groups and clause items
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-6 gap-6 max-w-[1600px] w-full mx-auto">
        <div className="w-[380px] bg-white rounded-[24px] border border-[#e0e3f5] shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h2 className="text-md font-bold text-[#1a2256] flex items-center gap-2">
              <Folder className="w-5 h-5 text-[#64549f]" />
              Clause Groups
            </h2>
            <button
              onClick={() => setIsAddingGroup(true)}
              disabled={loadingGroups}
              className="w-8 h-8 rounded-lg bg-[#1a2256]/5 hover:bg-[#1a2256]/10 text-[#1a2256] flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              title="Add Clause Group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 medical-scroll">
            {loadingGroups ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[#64549f]/60" />
              </div>
            ) : loadError ? (
              <div className="text-center py-8 px-2">
                <p className="text-sm text-red-600 font-medium">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadGroups()}
                  className="text-xs font-bold text-[#64549f] hover:underline mt-2"
                >
                  Retry
                </button>
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">
                No groups yet. Create one to start building a checklist.
              </p>
            ) : (
              groups.map((group) => {
                const isSelected = group.id === selectedGroupId;
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`group/item flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1a2256] border-[#1a2256] text-white shadow-md shadow-[#1a2256]/10'
                        : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50/60 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white/80' : 'text-slate-400'}`} />
                        <span className="text-[0.875rem] font-bold truncate leading-none">{group.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {group.clauses.length}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white/50' : 'text-slate-300'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[24px] border border-[#e0e3f5] shadow-sm flex flex-col overflow-hidden">
          {selectedGroup ? (
            <>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/20">
                <div>
                  <h2 className="text-md font-bold text-[#1a2256]">{selectedGroup.name} Clauses</h2>
                </div>
                <Button
                  onClick={() => setIsAddingClause(true)}
                  className="bg-[#1a2256] hover:bg-[#1a2256]/90 text-white rounded-[10px] h-9 px-4 font-semibold text-xs transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Clause
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 medical-scroll">
                {selectedGroup.clauses.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 italic">No clauses inside this group yet.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddingClause(true)}
                      className="text-xs font-bold text-[#64549f] hover:underline mt-2 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add first clause
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedGroup.clauses.map((clause) => (
                      <div
                        key={clause.id}
                        className="p-4 rounded-xl border border-slate-100 bg-[#fafbfc]/30 hover:shadow-md hover:border-[#64549f]/10 transition-all duration-200"
                      >
                        {editingClauseId === clause.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Clause Title
                              </label>
                              <input
                                type="text"
                                value={editingClauseTitle}
                                onChange={(e) => setEditingClauseTitle(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold outline-none focus:border-[#1a2256]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Clause Description
                              </label>
                              <textarea
                                value={editingClauseDesc}
                                onChange={(e) => setEditingClauseDesc(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-[#1a2256] resize-none"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingClauseId(null)}
                                disabled={updatingClauseId === clause.id}
                                className="rounded-lg text-xs"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => void handleSaveEditClause(clause.id)}
                                disabled={updatingClauseId === clause.id}
                                className="bg-[#1a2256] text-white rounded-lg text-xs"
                              >
                                {updatingClauseId === clause.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    Saving…
                                  </>
                                ) : (
                                  'Save Clause'
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="text-[0.94rem] font-bold text-[#161616] flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                {clause.title}
                              </h4>
                              <p className="text-[0.81rem] text-[#6e6868] leading-relaxed">
                                {clause.description || (
                                  <span className="italic text-slate-400">No description</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditClause(clause)}
                                disabled={deletingClauseId === clause.id}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50"
                                title="Edit Clause"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteClause(clause)}
                                disabled={deletingClauseId === clause.id}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                                title="Delete Clause"
                              >
                                {deletingClauseId === clause.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Folder className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-base font-bold text-[#1a2256] mb-1">No Clause Group Selected</h3>
              <p className="text-sm text-slate-400">
                Select or create a clause group from the left panel to manage its clauses.
              </p>
            </div>
          )}
        </div>
      </div>

      {isAddingGroup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] shadow-xl border border-slate-100 max-w-md w-full overflow-hidden p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#1a2256] flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#0ea5e9]" />
                Add New Clause Group
              </h3>
              <button type="button" onClick={() => setIsAddingGroup(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => void handleAddGroup(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Environmental Covenants"
                  className="w-full rounded-[10px] border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#1a2256] focus:ring-2 focus:ring-[#1a2256]/10 transition-all"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddingGroup(false)} className="rounded-[10px]">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingGroup}
                  className="bg-[#1a2256] hover:bg-[#1a2256]/90 text-white rounded-[10px]"
                >
                  {savingGroup ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingClause && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] shadow-xl border border-slate-100 max-w-md w-full overflow-hidden p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#1a2256] flex items-center gap-2">
                <FilePlus2 className="w-5 h-5 text-[#64549f]" />
                Add New Clause
              </h3>
              <button type="button" onClick={() => setIsAddingClause(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => void handleAddClause(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Clause Title
                </label>
                <input
                  type="text"
                  required
                  value={newClauseTitle}
                  onChange={(e) => setNewClauseTitle(e.target.value)}
                  placeholder="e.g. Cross-Default Threshold"
                  className="w-full rounded-[10px] border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#1a2256] focus:ring-2 focus:ring-[#1a2256]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={newClauseDesc}
                  onChange={(e) => setNewClauseDesc(e.target.value)}
                  placeholder="Describe what this covenant or clause checks or enforces..."
                  rows={4}
                  className="w-full rounded-[10px] border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#1a2256] focus:ring-2 focus:ring-[#1a2256]/10 transition-all resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddingClause(false)} className="rounded-[10px]">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingClause || !newClauseTitle.trim()}
                  className="bg-[#1a2256] hover:bg-[#1a2256]/90 text-white rounded-[10px]"
                >
                  {savingClause ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    'Add Clause'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
