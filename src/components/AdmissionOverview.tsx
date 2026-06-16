import { useState, useEffect, type ReactNode } from 'react';
import { Pencil, Plus, Loader2, UserRound, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { InpatientAdmissionData } from '@/types/patient';

interface AdmissionOverviewProps {
  admission: InpatientAdmissionData;
  consultationId: string;
  onStaffUpdated?: () => void;
}

const formatAdmissionDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  const normalized = dateStr.replace(/\\/g, '');
  const parts = normalized.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${day.padStart(2, '0')} - ${month.padStart(2, '0')} - ${year}`;
  }
  return normalized;
};

const formatRoomBed = (admission: InpatientAdmissionData): string => {
  const ward = admission.wardType?.trim();
  const room = admission.roomNo?.trim();
  const bed = admission.bedNo?.trim();

  if (ward && bed) return `${ward} ${bed}`;
  if (room && bed) return `${room} ${bed}`;
  if (bed) return bed;
  if (ward) return ward;
  if (room) return room;
  return '—';
};

const OverviewRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2256]/8 last:border-b-0">
    <span className="text-[14px] text-[#64748B]">{label}</span>
    <div className="text-[14px] font-medium text-[#0B1220] text-right">{children}</div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 py-2 bg-[#F8FAFC] border-b border-[#1a2256]/8">
    <span className="text-[13px] font-medium text-[#94A3B8]">{title}</span>
  </div>
);

interface StaffSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  placeholder: string;
  icon: ReactNode;
  options: { id: string; Name: string }[];
  selectedId: string;
  onSelectedIdChange: (id: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const StaffSelectionDialog = ({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  icon,
  options,
  selectedId,
  onSelectedIdChange,
  onSave,
  isSaving,
}: StaffSelectionDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[440px] rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl gap-0">
      <div className="px-6 py-5 border-b border-[#e0e3f5] bg-white">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#64549f]/10 flex items-center justify-center text-[#64549f]">
              {icon}
            </div>
            <div>
              <DialogTitle className="text-[18px] font-semibold text-[#1a2256]">{title}</DialogTitle>
              <p className="text-[13px] text-[#64748B] font-medium mt-0.5">{description}</p>
            </div>
          </div>
        </DialogHeader>
      </div>

      <div className="px-6 py-6 bg-white space-y-3">
        <Label className="text-[#1a2256] font-bold text-[13px] ml-1 uppercase tracking-wide">
          {label}
        </Label>
        <Select value={selectedId} onValueChange={onSelectedIdChange}>
          <SelectTrigger className="h-12 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] text-[15px] font-medium focus:ring-[#64549f]/20">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[#e0e3f5]">
            {options.length === 0 ? (
              <SelectItem value="__empty" disabled>
                No options available
              </SelectItem>
            ) : (
              options.map((option) => (
                <SelectItem key={option.id} value={option.id} className="text-[14px]">
                  {option.Name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="px-6 py-4 bg-[#fbfcfd] border-t border-[#f0f3f9] flex flex-row justify-end gap-3 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
          className="rounded-[12px] h-11 px-6 font-semibold border-[#e0e3f5] text-[#64748B]"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={!selectedId || isSaving}
          className="rounded-[12px] h-11 px-8 font-semibold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const AdmissionOverview = ({
  admission,
  consultationId,
  onStaffUpdated,
}: AdmissionOverviewProps) => {
  const [nurseName, setNurseName] = useState(admission.nurseName);
  const [dutyDoctorName, setDutyDoctorName] = useState(admission.dutyDoctorName);
  const [nurseDialogOpen, setNurseDialogOpen] = useState(false);
  const [dutyDoctorDialogOpen, setDutyDoctorDialogOpen] = useState(false);
  const [nurseList, setNurseList] = useState<{ id: string; Name: string }[]>([]);
  const [dutyDoctorList, setDutyDoctorList] = useState<{ id: string; Name: string }[]>([]);
  const [selectedNurseId, setSelectedNurseId] = useState('');
  const [selectedDutyDoctorId, setSelectedDutyDoctorId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNurseName(admission.nurseName);
    setDutyDoctorName(admission.dutyDoctorName);
  }, [admission.nurseName, admission.dutyDoctorName]);

  const roomBed = formatRoomBed(admission);
  const roomBedParts = roomBed === '—' ? { prefix: '', highlight: '' } : (() => {
    const lastSpace = roomBed.lastIndexOf(' ');
    if (lastSpace === -1) return { prefix: '', highlight: roomBed };
    return {
      prefix: roomBed.slice(0, lastSpace + 1),
      highlight: roomBed.slice(lastSpace + 1),
    };
  })();

  const openNurseDialog = async () => {
    try {
      const response = await apiService.switchStaffRole(consultationId, 'NurseSelector', '');
      setNurseList(JSON.parse((response as { Nurse?: string })?.Nurse || '[]'));
      setSelectedNurseId('');
      setNurseDialogOpen(true);
    } catch {
      toast.error('Failed to load nurse list');
    }
  };

  const openDutyDoctorDialog = async () => {
    try {
      const response = await apiService.switchStaffRole(consultationId, 'dutyDoctor', '');
      const doctors = JSON.parse((response as { Doctor?: string })?.Doctor || '[]') as { id: string; Name: string }[];
      setDutyDoctorList(doctors);
      const current = doctors.find((d) => d.Name === dutyDoctorName);
      setSelectedDutyDoctorId(current?.id || '');
      setDutyDoctorDialogOpen(true);
    } catch {
      toast.error('Failed to load duty doctor list');
    }
  };

  const saveNurse = async () => {
    if (!selectedNurseId) return;
    setIsSaving(true);
    try {
      await apiService.switchStaffRole(consultationId, 'nurse', selectedNurseId);
      const nurse = nurseList.find((n) => n.id === selectedNurseId);
      setNurseName(nurse?.Name || '');
      setNurseDialogOpen(false);
      toast.success('Nurse updated successfully');
      onStaffUpdated?.();
    } catch {
      toast.error('Failed to update nurse');
    } finally {
      setIsSaving(false);
    }
  };

  const saveDutyDoctor = async () => {
    if (!selectedDutyDoctorId) return;
    setIsSaving(true);
    try {
      await apiService.switchStaffRole(consultationId, 'dutyDoctor', selectedDutyDoctorId);
      const doctor = dutyDoctorList.find((d) => d.id === selectedDutyDoctorId);
      setDutyDoctorName(doctor?.Name || '');
      setDutyDoctorDialogOpen(false);
      toast.success('Duty doctor updated successfully');
      onStaffUpdated?.();
    } catch {
      toast.error('Failed to update duty doctor');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-[20px] border border-[#1a2256]/10 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#1a2256]/8">
          <h3 className="text-[16px] font-semibold text-[#1a2256]">Admission Overview</h3>
        </div>

        <SectionHeader title="Care Details" />
        <OverviewRow label="Assigned Doctor">
          {admission.doctorName ? `Dr. ${admission.doctorName.replace(/^Dr\.?\s*/i, '')}` : '—'}
        </OverviewRow>
        <OverviewRow label="Room / Bed">
          {roomBed === '—' ? (
            '—'
          ) : (
            <span>
              {roomBedParts.prefix}
              <span className="text-[#F97316] font-semibold">{roomBedParts.highlight}</span>
            </span>
          )}
        </OverviewRow>
        <OverviewRow label="Admission ID">
          {admission.consultationId ? `#${admission.consultationId}` : '—'}
        </OverviewRow>
        <OverviewRow label="Admitted">
          {formatAdmissionDate(admission.scheduleDate)}
        </OverviewRow>

        <SectionHeader title="Add Team" />
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2256]/8">
          <span className="text-[14px] text-[#64748B]">Nurse</span>
          {nurseName ? (
            <span className="text-[14px] font-medium text-[#0B1220]">{nurseName}</span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={openNurseDialog}
              className="h-8 px-3 text-[13px] font-medium border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[14px] text-[#64748B]">Duty Doctor</span>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-[#0B1220]">
              {dutyDoctorName || '—'}
            </span>
            <button
              type="button"
              onClick={openDutyDoctorDialog}
              className="p-1 rounded-md text-[#64748B] hover:text-[#1a2256] hover:bg-[#F8FAFC] transition-colors"
              aria-label="Edit duty doctor"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <StaffSelectionDialog
        open={nurseDialogOpen}
        onOpenChange={setNurseDialogOpen}
        title="Add Nurse"
        description="Assign a nurse to this inpatient admission."
        label="Select Nurse"
        placeholder="Choose a nurse"
        icon={<UserRound className="w-5 h-5" />}
        options={nurseList}
        selectedId={selectedNurseId}
        onSelectedIdChange={setSelectedNurseId}
        onSave={saveNurse}
        isSaving={isSaving}
      />

      <StaffSelectionDialog
        open={dutyDoctorDialogOpen}
        onOpenChange={setDutyDoctorDialogOpen}
        title="Edit Duty Doctor"
        description="Update the duty doctor for this admission."
        label="Select Duty Doctor"
        placeholder="Choose a duty doctor"
        icon={<Stethoscope className="w-5 h-5" />}
        options={dutyDoctorList}
        selectedId={selectedDutyDoctorId}
        onSelectedIdChange={setSelectedDutyDoctorId}
        onSave={saveDutyDoctor}
        isSaving={isSaving}
      />
    </>
  );
};
