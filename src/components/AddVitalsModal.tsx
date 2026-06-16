import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';

interface AddVitalsModalProps {
  consultationId: string;
  isOpen: boolean;
  onClose: () => void;
  onVitalsAdded?: () => void;
  initialVitalsData?: {
    heartRate?: string;
    bloodPressureSystolic?: string;
    bloodPressureDiastolic?: string;
    temperature?: string;
    oxygenSaturation?: string;
    respiratoryRate?: string;
    painLevel?: string;
    bloodGlucose?: string;
    glasgowComaScale?: string;
  };
}

export const AddVitalsModal = ({ consultationId, isOpen, onClose, onVitalsAdded, initialVitalsData }: AddVitalsModalProps) => {
  const [vitals, setVitals] = useState({
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    oxygenSaturation: '',
    respiratoryRate: '',
    painLevel: '',
    bloodGlucose: '',
    glasgowComaScale: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    // Validate at least one field is filled
    const hasData = Object.values(vitals).some(value => value.trim() !== '');

    if (!hasData) {
      toast({
        title: "Missing Information",
        description: "Please enter at least one vital sign.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiService.addVitals({
        consultationId: consultationId,
        heartRate: vitals.heartRate,
        bloodPressureSystolic: vitals.bloodPressureSystolic,
        bloodPressureDiastolic: vitals.bloodPressureDiastolic,
        temperature: vitals.temperature,
        oxygenSaturation: vitals.oxygenSaturation,
        respiratoryRate: vitals.respiratoryRate,
        painLevel: vitals.painLevel,
        bloodGlucose: vitals.bloodGlucose,
        glasgowComaScale: vitals.glasgowComaScale,
      });

      toast({
        title: "Vitals Added",
        description: "New vital signs have been recorded successfully.",
      });

      // Trigger refresh of vitals data
      onVitalsAdded?.();

      // Reset form and close
      setVitals({
        heartRate: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        temperature: '',
        oxygenSaturation: '',
        respiratoryRate: '',
        painLevel: '',
        bloodGlucose: '',
        glasgowComaScale: ''
      });

      onClose();
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to submit vitals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  // Pre-fill form with AI data when modal opens
  useEffect(() => {
    if (isOpen && initialVitalsData) {
      setVitals(prev => ({
        ...prev,
        heartRate: initialVitalsData.heartRate || prev.heartRate,
        bloodPressureSystolic: initialVitalsData.bloodPressureSystolic || prev.bloodPressureSystolic,
        bloodPressureDiastolic: initialVitalsData.bloodPressureDiastolic || prev.bloodPressureDiastolic,
        temperature: initialVitalsData.temperature || prev.temperature,
        oxygenSaturation: initialVitalsData.oxygenSaturation || prev.oxygenSaturation,
        respiratoryRate: initialVitalsData.respiratoryRate || prev.respiratoryRate,
        painLevel: initialVitalsData.painLevel || prev.painLevel,
        bloodGlucose: initialVitalsData.bloodGlucose || prev.bloodGlucose,
        glasgowComaScale: initialVitalsData.glasgowComaScale || prev.glasgowComaScale
      }));
    }
  }, [isOpen, initialVitalsData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              Add Current Vitals
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Heart Rate (BPM)</label>
              <Input
                type="number"
                value={vitals.heartRate}
                onChange={(e) => handleInputChange('heartRate', e.target.value)}
                placeholder="e.g., 75"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Temperature (°C)</label>
              <Input
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={(e) => handleInputChange('temperature', e.target.value)}
                placeholder="e.g., 36.5"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Blood Pressure Systolic</label>
              <Input
                type="number"
                value={vitals.bloodPressureSystolic}
                onChange={(e) => handleInputChange('bloodPressureSystolic', e.target.value)}
                placeholder="e.g., 120"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Blood Pressure Diastolic</label>
              <Input
                type="number"
                value={vitals.bloodPressureDiastolic}
                onChange={(e) => handleInputChange('bloodPressureDiastolic', e.target.value)}
                placeholder="e.g., 80"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Oxygen Saturation (%)</label>
              <Input
                type="number"
                value={vitals.oxygenSaturation}
                onChange={(e) => handleInputChange('oxygenSaturation', e.target.value)}
                placeholder="e.g., 98"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Respiratory Rate</label>
              <Input
                type="number"
                value={vitals.respiratoryRate}
                onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
                placeholder="e.g., 16"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Pain Level (0-10)</label>
              <Input
                type="number"
                min="0"
                max="10"
                value={vitals.painLevel}
                onChange={(e) => handleInputChange('painLevel', e.target.value)}
                placeholder="e.g., 3"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Blood Glucose (mg/dL)</label>
              <Input
                type="number"
                value={vitals.bloodGlucose}
                onChange={(e) => handleInputChange('bloodGlucose', e.target.value)}
                placeholder="e.g., 110"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Glasgow Coma Scale (3-15)</label>
              <Input
                type="number"
                min="3"
                max="15"
                value={vitals.glasgowComaScale}
                onChange={(e) => handleInputChange('glasgowComaScale', e.target.value)}
                placeholder="e.g., 15"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] flex flex-row justify-end gap-3 rounded-b-[24px]">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="rounded-[12px] h-10 px-6 font-bold text-[#6e6868] border-[#e0e3f5] hover:bg-gray-50 transition-all active:scale-95"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={submitting}
            className="rounded-[12px] h-10 px-6 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            {submitting ? 'Saving...' : 'Save Vitals'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
