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
interface DutyDoctorSelectorProps {
  currentDutyDoctor: string;
  admissionId: string;
  onStaffUpdated?: (newDoctor: string) => void;
}
export const DutyDoctorSelector = ({
  currentDutyDoctor,
  admissionId,
  onStaffUpdated,
}: DutyDoctorSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDutyDoctor, setSelectedDutyDoctor] = useState(currentDutyDoctor);
  const [isLoading, setIsLoading] = useState(false);
  const [dutyDocList, setDutyDocList] = useState<any[]>([])
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call to update the patient's duty doctor
      //  await new Promise(resolve => setTimeout(resolve, 500));
      apiService.switchStaffRole(admissionId, 'dutyDoctor', getCurrentDutyDoctorId());
      toast.success('Duty doctor updated successfully');
      onStaffUpdated?.(selectedDutyDoctor);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to update duty doctor');
      setSelectedDutyDoctor(currentDutyDoctor); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };
  const handleEdit = async () => {
    try {
      const response = await apiService.switchStaffRole(admissionId, 'dutyDoctor', "");
      setDutyDocList(JSON.parse((response as any)?.Doctor || "[]"));
    } catch (error) {
      toast.error('Failed to update assigned doctor');
    }
  };
  const handleCancel = () => {
    setSelectedDutyDoctor(currentDutyDoctor);
    setIsOpen(false);
  };

  const getCurrentDutyDoctorName = () => {
    const doctor = dutyDocList.find(d => d.Name === selectedDutyDoctor || d.id === selectedDutyDoctor);
    return doctor ? doctor.Name : selectedDutyDoctor;
  };

  const getCurrentDutyDoctorSpecialty = () => {
    const doctor = dutyDocList.find(d => d.Name === selectedDutyDoctor || d.id === selectedDutyDoctor);
    return doctor ? doctor.specialty : '';
  };
  const getCurrentDutyDoctorId = () => {
    const doctor = dutyDocList.find(d => d.Name === selectedDutyDoctor || d.id === selectedDutyDoctor);
    return doctor ? doctor.id : '';
  };

  const handleCardClick = async () => {
    await handleEdit();
    setIsOpen(true);
  };

  return (
    <>
      <Touchable onClick={handleCardClick} className="block">
        <Card className="relative medical-card fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
            <CardTitle className="flex items-center gap-1 text-xs font-medium">
              <Stethoscope className="w-3 h-3 text-primary" />
              {currentDutyDoctor ? "Duty Doctor" : "Add Duty Doctor"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-2 px-4">
            <div className="text-xs font-medium pl-6">{getCurrentDutyDoctorName()}</div>
            <div className="text-xs text-muted-foreground pl-6">{getCurrentDutyDoctorSpecialty()}</div>
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
                Update Duty Doctor
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label htmlFor="dutyDoctor" className="block text-[14px] font-bold text-[#1a2256] mb-2">
                Duty Doctor
              </Label>
              <Select value={selectedDutyDoctor} onValueChange={setSelectedDutyDoctor}>
                <SelectTrigger className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium pl-4">
                  <SelectValue placeholder="Select a duty doctor" />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] border-[#e0e3f5] shadow-xl">
                  {dutyDocList.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.Name}>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1a2256]">{doctor.Name}</span>
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