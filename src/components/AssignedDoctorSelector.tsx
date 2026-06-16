import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { Touchable } from '@/components/ui/touchable';

interface AssignedDoctorSelectorProps {
  currentAssignedDoctor: { name: string; id: string; department?: string; specialization?: string }[];
  admissionId: string;
  onStaffUpdated?: (newDoctor: { name: string; id: string; department?: string }) => void;
}

export const AssignedDoctorSelector = ({
  currentAssignedDoctor,
  admissionId,
  onStaffUpdated,
}: AssignedDoctorSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState({
    id: currentAssignedDoctor[0]?.id || "",
    name: currentAssignedDoctor[0]?.name || ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [assignedDocList, setAssignedDocList] = useState<any[]>([]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiService.switchStaffRole(admissionId, 'assignedDoctor', selectedDoctor.id);
      toast.success('Assigned doctor updated successfully');

      const doctorObj = assignedDocList.find(d => d.id === selectedDoctor.id);
      onStaffUpdated?.({
        name: doctorObj?.Name || "",
        id: doctorObj?.id || ""
      });

      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to update assigned doctor');
      setSelectedDoctor({
        id: currentAssignedDoctor[0]?.id || "",
        name: currentAssignedDoctor[0]?.name || ""
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      const response = await apiService.switchStaffRole(admissionId, 'assignedDoctor', "");
      setAssignedDocList(JSON.parse((response as any)?.Doctor || "[]"));

      setSelectedDoctor({
        id: currentAssignedDoctor[0]?.id || "",
        name: currentAssignedDoctor[0]?.name || ""
      });

    } catch (error) {
      toast.error('Failed to update assigned doctor');
    }
  };

  const handleCancel = () => {
    setSelectedDoctor({
      id: currentAssignedDoctor[0]?.id || "",
      name: currentAssignedDoctor[0]?.name || ""
    });
    setIsOpen(false);
  };

  const getCurrentAssignedDoctorName = () => {
    const doctor = assignedDocList.find(d => d.id === selectedDoctor.id);
    return doctor ? doctor.Name : (currentAssignedDoctor[0]?.name || "");
  };

  const getCurrentAssignedDoctorDepartment = () => {
    const doctor = assignedDocList.find(d => d.id === selectedDoctor.id);
    return doctor ? doctor.Department : (currentAssignedDoctor[0]?.department || '');
  };

  const handleCardClick = async () => {
    await handleEdit();
    setIsOpen(true);
  };

  return (
    <>
      <Touchable onClick={handleCardClick} className="block">
        <Card className="relative medical-card fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 fade-in">
            <CardTitle className="flex items-center gap-1 text-xs font-medium">
              <Stethoscope className="w-3 h-3 text-primary" />
              Assigned Doctor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-2 px-4">
            <div className="text-xs font-medium pl-6">{getCurrentAssignedDoctorName()}</div>
            <div className="text-xs text-muted-foreground pl-6">{getCurrentAssignedDoctorDepartment()}</div>
          </CardContent>
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </Card>
      </Touchable>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl [&>button]:hidden">
          <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2 font-normal">
                Update Assigned Doctor
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label htmlFor="assignedDoctor" className="block text-[14px] font-bold text-[#1a2256] mb-2">
                Assigned Doctor
              </Label>
              <Select
                value={selectedDoctor.id}
                onValueChange={(value) => {
                  const doctorObj = assignedDocList.find(d => d.id === value);
                  setSelectedDoctor({
                    id: value,
                    name: doctorObj?.Name || ""
                  });
                }}
              >
                <SelectTrigger className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium pl-4">
                  <SelectValue placeholder={currentAssignedDoctor[0]?.name || "Select an assigned doctor"} />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] border-[#e0e3f5] shadow-xl">
                  {assignedDocList.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1a2256]">Dr. {doctor.Name}</span>
                        <span className="text-[11px] text-[#6e6868] font-medium">{doctor.specialty}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] flex flex-row justify-end gap-3 rounded-b-[24px]">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rounded-[12px] h-10 px-6 font-bold text-[#6e6868] border-[#e0e3f5] hover:bg-gray-50 transition-all active:scale-95 flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="rounded-[12px] h-10 px-6 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex-1"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
