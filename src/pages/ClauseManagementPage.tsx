import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  FolderPlus,
  FilePlus2,
  Folder,
  FileText,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

interface Clause {
  id: string;
  title: string;
  description: string;
}

interface ClauseGroup {
  id: string;
  name: string;
  clauses: Clause[];
}

const DEFAULT_CLAUSE_GROUPS: ClauseGroup[] = [
  {
    id: 'group-1',
    name: 'Basic Finance Checklist',
    clauses: [
      { id: 'fd-1', title: 'Facility Amount', description: 'USD 500,000,000 (five hundred million United States Dollars)' },
      { id: 'fd-2', title: 'Facility Type', description: 'Senior Secured Syndicated Term Loan Facility (single-draw, fully amortising)' },
      { id: 'fd-3', title: 'Borrower Name', description: 'Orion Manufacturing Holdings Limited' },
      { id: 'fd-4', title: 'Tenor / Maturity', description: '5 years from Signing Date; Final Maturity Date: 15 June 2030' },
      { id: 'fd-5', title: 'Interest Margin (Applicable Margin)', description: '2.75% per annum (initial); subject to margin ratchet: 2.25% (≤2.00x), 2.50% (≤3.00x), 2.75% (≤4.00x), 3.25% (>4.00x)' },
      { id: 'fd-6', title: 'Base Rate', description: 'Term SOFR for the relevant Interest Period, determined 2 Business Days prior to commencement of Interest Period' },
      { id: 'fd-7', title: 'Interest Payment Dates', description: 'Last day of each Interest Period' },
      { id: 'fd-8', title: 'Debt to EBITDA Covenant (Max Leverage)', description: 'Consolidated Net Leverage Ratio must not exceed 4.00x as at each Testing Date' },
      { id: 'fd-9', title: 'Interest Coverage Ratio Covenant (Min ICR)', description: 'Interest Coverage Ratio must not be less than 3.00x as at each Testing Date' },
      { id: 'fd-10', title: 'Testing Frequency', description: 'Quarterly; tested on each Testing Date (last day of each fiscal quarter)' },
      { id: 'fd-11', title: 'Quarterly Financial Statement Deadline', description: 'Within 45 days after the end of each of the first three fiscal quarters' },
      { id: 'fd-12', title: 'Annual Financial Statement Deadline', description: 'Within 120 days after the end of each fiscal year' },
      { id: 'fd-13', title: 'Compliance Certificate Signatories', description: 'Chief Financial Officer and one (1) other authorised officer' },
      { id: 'fd-14', title: 'Default Notification Period', description: 'Within 5 Business Days of becoming aware of Default or Event of Default' },
      { id: 'fd-15', title: 'Additional Indebtedness Restriction', description: 'No Financial Indebtedness without prior written consent of Majority Lenders, except Permitted Indebtedness as defined in Clause 12.1(a)-(g)' },
      { id: 'fd-16', title: 'Revolving Facility Cap (Permitted Indebtedness)', description: 'USD 75,000,000 aggregate drawn at any time' },
      { id: 'fd-17', title: 'Other Indebtedness Cap (Permitted Indebtedness)', description: 'USD 20,000,000 aggregate at any time; must be unsecured' },
      { id: 'fd-18', title: 'Asset Disposal Restriction', description: 'No Asset Disposal without prior written consent of Majority Lenders, except Permitted Disposals as defined in Clause 12.2(a)-(f)' },
      { id: 'fd-19', title: 'Small Disposal Permitted Cap', description: 'USD 10,000,000 per disposal; USD 25,000,000 aggregate per fiscal year' },
      { id: 'fd-20', title: 'Mandatory Prepayment from Disposal Proceeds', description: '50% of Net Disposal Proceeds exceeding USD 10,000,000 in any fiscal year applied to prepay Loan within 15 Business Days' }
    ]
  },
  {
    id: 'group-2',
    name: 'Legal Agreement Checklist',
    clauses: [
      { id: 'cl2-1', title: 'Events of Default (Count)', description: '11 Events of Default defined (Clauses 13.1 to 13.11)' },
      { id: 'cl2-2', title: 'Non-Payment Grace Period (Event of Default)', description: '3 Business Days after due date (or after notice, if earlier)' },
      { id: 'cl2-3', title: 'Cross-Default Threshold', description: 'Financial Indebtedness exceeding USD 20,000,000 in aggregate' },
      { id: 'cl2-4', title: 'Amendment Approval — General', description: 'Majority Lenders (66.67% of Total Commitments / outstanding Loans)' },
      { id: 'cl2-5', title: 'Amendment Approval — Super-Majority Items', description: 'Super-Majority Lenders (85% of Total Commitments / outstanding Loans) required for: Facility Amount Increase, maturity extension, margin reduction, Financial Covenant changes, security release, change to voting thresholds' },
      { id: 'cl2-6', title: 'Amendment Approval — All Lenders', description: 'All Lenders required for: disproportionate payment date extension, pro rata sharing changes, disproportionate Commitment reduction, governing law change' },
      { id: 'cl2-7', title: 'Consent Response Period', description: '15 Business Days from circulation of amendment/waiver request' },
      { id: 'cl2-8', title: 'Governing Law', description: 'Laws of the State of New York' },
      { id: 'cl2-9', title: 'Voluntary Prepayment Minimum', description: 'USD 25,000,000 (or remaining balance if less)' },
      { id: 'cl2-10', title: 'Change of Control Prepayment', description: 'Each Lender may require prepayment within 30 Business Days of receiving Change of Control notice' },
      { id: 'cl2-11', title: 'Equity Cure Right', description: 'Maximum 2 occasions in any 12-month period; maximum 4 occasions total; injection within 20 Business Days of Testing Date' },
      { id: 'cl2-12', title: 'Acquisition Cap (No Consent Required)', description: 'USD 75,000,000 per acquisition; USD 150,000,000 per fiscal year' },
      { id: 'cl2-13', title: 'Capital Lease / Purchase Money Cap', description: 'USD 25,000,000 in aggregate outstanding' },
      { id: 'cl2-14', title: 'Number of Lenders', description: '6 Lenders' },
      { id: 'cl2-15', title: 'Facility Agent', description: 'Atlas Meridian Bank PLC' },
      { id: 'cl2-16', title: 'Security Trustee', description: 'Nova Trust & Custody Services Limited' }
    ]
  }
];

export default function ClauseManagementPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [groups, setGroups] = useState<ClauseGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // States for modals/forms
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  const [isAddingClause, setIsAddingClause] = useState(false);
  const [newClauseTitle, setNewClauseTitle] = useState('');
  const [newClauseDesc, setNewClauseDesc] = useState('');

  const [editingClauseId, setEditingClauseId] = useState<string | null>(null);
  const [editingClauseTitle, setEditingClauseTitle] = useState('');
  const [editingClauseDesc, setEditingClauseDesc] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('goodbank_clause_groups');
    if (saved && saved.includes('Legal Agreement Checklist')) {
      try {
        const parsed = JSON.parse(saved);
        setGroups(parsed);
        if (parsed.length > 0) {
          setSelectedGroupId(parsed[0].id);
        }
      } catch (e) {
        setGroups(DEFAULT_CLAUSE_GROUPS);
        setSelectedGroupId(DEFAULT_CLAUSE_GROUPS[0].id);
      }
    } else {
      setGroups(DEFAULT_CLAUSE_GROUPS);
      setSelectedGroupId(DEFAULT_CLAUSE_GROUPS[0].id);
      localStorage.setItem('goodbank_clause_groups', JSON.stringify(DEFAULT_CLAUSE_GROUPS));
    }
  }, []);

  // Save helper
  const saveGroups = (updatedGroups: ClauseGroup[]) => {
    setGroups(updatedGroups);
    localStorage.setItem('goodbank_clause_groups', JSON.stringify(updatedGroups));
  };

  // Group Operations
  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup: ClauseGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      clauses: []
    };
    const updated = [...groups, newGroup];
    saveGroups(updated);
    setSelectedGroupId(newGroup.id);
    setNewGroupName('');
    setIsAddingGroup(false);
    toast({
      title: "Group Added",
      description: `Clause Group "${newGroup.name}" created successfully.`,
    });
  };

  const handleStartEditGroup = (e: React.MouseEvent, group: ClauseGroup) => {
    e.stopPropagation();
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const handleSaveEditGroup = (e: React.MouseEvent | React.KeyboardEvent, groupId: string) => {
    e.stopPropagation();
    if (!editingGroupName.trim()) return;
    const updated = groups.map(g => g.id === groupId ? { ...g, name: editingGroupName.trim() } : g);
    saveGroups(updated);
    setEditingGroupId(null);
    setEditingGroupName('');
    toast({
      title: "Group Updated",
      description: "Clause Group name updated successfully.",
    });
  };

  const handleDeleteGroup = (e: React.MouseEvent, groupId: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the clause group "${name}" and all of its clauses?`)) {
      const updated = groups.filter(g => g.id !== groupId);
      saveGroups(updated);
      if (selectedGroupId === groupId) {
        setSelectedGroupId(updated.length > 0 ? updated[0].id : null);
      }
      toast({
        title: "Group Deleted",
        description: "Clause Group removed successfully.",
        variant: "destructive"
      });
    }
  };

  // Clause Operations
  const handleAddClause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !newClauseTitle.trim() || !newClauseDesc.trim()) return;

    const newClause: Clause = {
      id: `clause-${Date.now()}`,
      title: newClauseTitle.trim(),
      description: newClauseDesc.trim()
    };

    const updated = groups.map(g => {
      if (g.id === selectedGroupId) {
        return { ...g, clauses: [...g.clauses, newClause] };
      }
      return g;
    });

    saveGroups(updated);
    setIsAddingClause(false);
    setNewClauseTitle('');
    setNewClauseDesc('');
    toast({
      title: "Clause Added",
      description: `Clause "${newClause.title}" added successfully.`,
    });
  };

  const handleStartEditClause = (clause: Clause) => {
    setEditingClauseId(clause.id);
    setEditingClauseTitle(clause.title);
    setEditingClauseDesc(clause.description);
  };

  const handleSaveEditClause = (clauseId: string) => {
    if (!editingClauseTitle.trim() || !editingClauseDesc.trim()) return;
    const updated = groups.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          clauses: g.clauses.map(c => c.id === clauseId ? { ...c, title: editingClauseTitle.trim(), description: editingClauseDesc.trim() } : c)
        };
      }
      return g;
    });
    saveGroups(updated);
    setEditingClauseId(null);
    setEditingClauseTitle('');
    setEditingClauseDesc('');
    toast({
      title: "Clause Updated",
      description: "Clause details updated successfully.",
    });
  };

  const handleDeleteClause = (clauseId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the clause "${title}"?`)) {
      const updated = groups.map(g => {
        if (g.id === selectedGroupId) {
          return { ...g, clauses: g.clauses.filter(c => c.id !== clauseId) };
        }
        return g;
      });
      saveGroups(updated);
      toast({
        title: "Clause Deleted",
        description: "Clause removed successfully.",
        variant: "destructive"
      });
    }
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="min-h-screen bg-[#ebeef9] font-['Inter'] flex flex-col h-screen overflow-hidden">
      {/* Header banner matching Deal 360 */}
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
              <p className="text-[13px] text-white/50 font-medium">Organize and manage legal checklist clauses and categories</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main two-panel container */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6 max-w-[1600px] w-full mx-auto">

        {/* Left Panel - Clause Groups */}
        <div className="w-[380px] bg-white rounded-[24px] border border-[#e0e3f5] shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h2 className="text-md font-bold text-[#1a2256] flex items-center gap-2">
              <Folder className="w-5 h-5 text-[#64549f]" />
              Clause Groups
            </h2>
            <button
              onClick={() => setIsAddingGroup(true)}
              className="w-8 h-8 rounded-lg bg-[#1a2256]/5 hover:bg-[#1a2256]/10 text-[#1a2256] flex items-center justify-center transition-all active:scale-95"
              title="Add Clause Group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 medical-scroll">
            {groups.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">No groups created yet.</p>
            ) : (
              groups.map(group => {
                const isSelected = group.id === selectedGroupId;
                const isEditing = editingGroupId === group.id;

                return (
                  <div
                    key={group.id}
                    onClick={() => !isEditing && setSelectedGroupId(group.id)}
                    className={`group/item flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${isSelected
                        ? "bg-[#1a2256] border-[#1a2256] text-white shadow-md shadow-[#1a2256]/10"
                        : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50/60 hover:border-slate-200"
                      }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            className="w-full rounded px-2 py-1 text-xs font-semibold text-slate-800 outline-none border border-slate-200"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditGroup(e, group.id)}
                          />
                          <button
                            onClick={(e) => handleSaveEditGroup(e, group.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingGroupId(null); }}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Folder className={`w-4 h-4 shrink-0 ${isSelected ? "text-white/80" : "text-slate-400"}`} />
                          <span className="text-[0.875rem] font-bold truncate leading-none">
                            {group.name}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {group.clauses.length}
                          </span>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartEditGroup(e, group)}
                          className={`p-1 rounded transition-colors ${isSelected ? "text-white/70 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                          title="Rename"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteGroup(e, group.id, group.name)}
                          className={`p-1 rounded transition-colors ${isSelected ? "text-white/70 hover:text-red-200 hover:bg-white/10" : "text-rose-500 hover:bg-rose-50"}`}
                          title="Delete Group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-white/50" : "text-slate-300"}`} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Clauses */}
        <div className="flex-1 bg-white rounded-[24px] border border-[#e0e3f5] shadow-sm flex flex-col overflow-hidden">
          {selectedGroup ? (
            <>
              {/* Workspace Header */}
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

              {/* Clauses List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 medical-scroll">
                {selectedGroup.clauses.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 italic">No clauses inside this group yet.</p>
                    <button
                      onClick={() => setIsAddingClause(true)}
                      className="text-xs font-bold text-[#64549f] hover:underline mt-2 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add first clause
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedGroup.clauses.map(clause => (
                      <div
                        key={clause.id}
                        className="p-4 rounded-xl border border-slate-100 bg-[#fafbfc]/30 hover:shadow-md hover:border-[#64549f]/10 transition-all duration-200"
                      >
                        {editingClauseId === clause.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clause Title</label>
                              <input
                                type="text"
                                value={editingClauseTitle}
                                onChange={(e) => setEditingClauseTitle(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold outline-none focus:border-[#1a2256]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clause Description</label>
                              <textarea
                                value={editingClauseDesc}
                                onChange={(e) => setEditingClauseDesc(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-[#1a2256] resize-none"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingClauseId(null)} className="rounded-lg text-xs">
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => handleSaveEditClause(clause.id)} className="bg-[#1a2256] text-white rounded-lg text-xs">
                                Save Clause
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
                                {clause.description}
                              </p>
                            </div>

                            {/* Actions for Clause */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleStartEditClause(clause)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                                title="Edit Clause"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClause(clause.id, clause.title)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                                title="Delete Clause"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
              <p className="text-sm text-slate-400">Please select or create a clause group from the left panel to manage its clauses.</p>
            </div>
          )}
        </div>

      </div>

      {/* Add Group Modal Overlay */}
      {isAddingGroup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] shadow-xl border border-slate-100 max-w-md w-full overflow-hidden p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#1a2256] flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#0ea5e9]" />
                Add New Clause Group
              </h3>
              <button onClick={() => setIsAddingGroup(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Group Name</label>
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
                <Button type="submit" className="bg-[#1a2256] hover:bg-[#1a2256]/90 text-white rounded-[10px]">
                  Create Group
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Clause Modal Overlay */}
      {isAddingClause && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] shadow-xl border border-slate-100 max-w-md w-full overflow-hidden p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#1a2256] flex items-center gap-2">
                <FilePlus2 className="w-5 h-5 text-[#64549f]" />
                Add New Clause
              </h3>
              <button onClick={() => setIsAddingClause(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClause} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clause Title</label>
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  required
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
                <Button type="submit" className="bg-[#1a2256] hover:bg-[#1a2256]/90 text-white rounded-[10px]">
                  Add Clause
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
