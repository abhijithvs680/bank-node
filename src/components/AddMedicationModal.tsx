import { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, AlertTriangle, CalendarIcon, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { patientMedicineSearchService } from '@/services/patientMedicineSearchService';
import { PatientMedicine } from '@/services/patientMedicineDatabase';
import { MEDICATION_FREQUENCY_OPTIONS, MEDICATION_ROUTE_OPTIONS } from '@/utils/medicationOptions';
import { apiService } from '@/services/apiService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface AddMedicationModalProps {
  consultationId: string;
  isOpen: boolean;
  onClose: () => void;
  onMedicationAdded?: () => void;
  initialMedicationData?: {
    medicationName?: string;
    dosage?: string;
    frequency?: string;
    route?: string;
    instructions?: string;
    foodTiming?: string;
    numberOfDays?: string;  // NEW
  };
}

export const AddMedicationModal = ({ consultationId, isOpen, onClose, onMedicationAdded, initialMedicationData }: AddMedicationModalProps) => {
  const [medication, setMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    route: '',
    instructions: '',
    startDate: new Date(),
    numberOfDays: '',
    infusionRate: '',
    remark: '',
    foodTiming: '',
    untilNextReview: false,
  });

  const [suggestions, setSuggestions] = useState<PatientMedicine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<PatientMedicine | null>(null);
  const [stockWarning, setStockWarning] = useState<string>('');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // Check if patient medicine data is ready
  useEffect(() => {
    const checkDataReady = async () => {
      const ready = await patientMedicineSearchService.isReady();
      setIsDataLoading(!ready);
    };

    if (isOpen) {
      checkDataReady();
    }

    // Listen for sync complete event
    const handleSyncComplete = () => setIsDataLoading(false);
    document.addEventListener('patient-medicine-sync-complete', handleSyncComplete);
    return () => document.removeEventListener('patient-medicine-sync-complete', handleSyncComplete);
  }, [isOpen]);

  const handleSave = async () => {
    if (!medication.name || !medication.frequency) {
      toast({
        title: "Missing Information",
        description: "Please fill in medication name and frequency.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await apiService.addPrescription({
        consultationId: consultationId,
        medicationName: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        route: medication.route,
        duration: medication.untilNextReview ? 'Until Next review' : medication.numberOfDays,
        startDate: format(medication.startDate, 'dd-MM-yyyy HH:mm:ss'),
        foodTiming: medication.foodTiming,
        numberOfDays: medication.untilNextReview ? 'Until Next review' : medication.numberOfDays,
        infusionRate: medication.infusionRate,
        instructions: medication.instructions,
      });

      // Reflect immediately in the medications list via custom event
      const newMed = {
        medicationId: nanoid(),
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        route: medication.route,
        startDate: format(medication.startDate, 'dd-MM-yyyy HH:mm:ss'),
        instructions: medication.instructions,
        numberOfDays: medication.untilNextReview ? 'Until Next review' : medication.numberOfDays,
        foodTiming: medication.foodTiming,
        infusionRate: medication.infusionRate,
      };
      document.dispatchEvent(new CustomEvent('medication-added', { detail: newMed }));

      toast({
        title: "Medication Added",
        description: "New medication has been added successfully.",
      });

      // Trigger refresh of medications data
      onMedicationAdded?.();

      // Reset form and close
      setMedication({
        name: '',
        dosage: '',
        frequency: '',
        route: '',
        instructions: '',
        startDate: new Date(),
        numberOfDays: '',
        infusionRate: '',
        remark: '',
        foodTiming: '',
        untilNextReview: false,
      });
      onClose();
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to submit medication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | Date | boolean) => {
    setMedication(prev => ({ ...prev, [field]: value }));
  };

  // Extract dosage from medication name (e.g., "Dolo 650" → "650 mg")
  const extractDosageFromName = (name: string): string | null => {
    const match = name.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ml|g|iu|%)?\s*$/i);
    if (match) {
      const num = match[1];
      const unit = match[2] || 'mg';
      return `${num} ${unit}`;
    }
    return null;
  };

  const handleMedicineNameChange = async (value: string) => {
    handleInputChange('name', value);

    // Auto-extract dosage from name
    const dosage = extractDosageFromName(value);
    if (dosage && !medication.dosage) {
      handleInputChange('dosage', dosage);
    }

    if (value.trim().length >= 2) {
      try {
        const results = await patientMedicineSearchService.search(value, 10);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching medicines:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedMedicine(null);
      setStockWarning('');
    }
  };

  const handleSuggestionSelect = (medicine: PatientMedicine) => {
    // Auto-extract dosage from selected medicine name
    const dosage = extractDosageFromName(medicine.Name);
    setMedication(prev => ({
      ...prev,
      name: medicine.Name,
      ...(dosage ? { dosage } : {}),
    }));
    setSelectedMedicine(medicine);
    setShowSuggestions(false);
    setStockWarning('');
  };

  // Pre-fill form with AI data when modal opens or initialMedicationData changes
  useEffect(() => {
    if (isOpen && initialMedicationData) {
      // Use the exact medication name from initialMedicationData
      setMedication(prev => ({
        ...prev,
        name: initialMedicationData.medicationName || '',
        dosage: initialMedicationData.dosage || '',
        frequency: initialMedicationData.frequency || '',
        route: initialMedicationData.route || '',
        instructions: initialMedicationData.instructions || '',
        foodTiming: initialMedicationData.foodTiming || '',
        numberOfDays: initialMedicationData.numberOfDays || '',
        untilNextReview: initialMedicationData.numberOfDays === 'Until Next review',
      }));

      // Clear any previous suggestions when pre-filling
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isOpen, initialMedicationData?.medicationName, initialMedicationData?.dosage, initialMedicationData?.frequency, initialMedicationData?.route, initialMedicationData?.instructions, initialMedicationData?.foodTiming, initialMedicationData?.numberOfDays]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMedication({
        name: '',
        dosage: '',
        frequency: '',
        route: '',
        instructions: '',
        startDate: new Date(),
        numberOfDays: '',
        infusionRate: '',
        remark: '',
        foodTiming: '',
        untilNextReview: false,
      });
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedMedicine(null);
      setStockWarning('');
    }
  }, [isOpen]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              Add New Medication
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-white max-h-[70vh] overflow-y-auto medical-scroll">
          <div className="grid grid-cols-2 gap-5">
            <div className="relative">
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Medication Name</label>
              <Input
                ref={inputRef}
                value={medication.name}
                onChange={(e) => handleMedicineNameChange(e.target.value)}
                placeholder="e.g., Metoprolol"
                autoComplete="off"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium pl-4"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-2 bg-white border border-[#e0e3f5] rounded-[16px] shadow-xl max-h-56 overflow-y-auto medical-scroll animate-in fade-in slide-in-from-top-2"
                >
                  {isDataLoading ? (
                    <div className="px-4 py-3 text-[14px] text-[#6e6868]">Loading medicines...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((medicine) => (
                      <div
                        key={medicine.id}
                        className="px-4 py-3 cursor-pointer hover:bg-[#f5f7fc] border-b border-[#f0f3f9] last:border-0 transition-colors group"
                        onClick={() => handleSuggestionSelect(medicine)}
                      >
                        <div className="font-bold text-[#1a2256] text-[14px] group-hover:text-[#64549f]">{medicine.Name}</div>
                        <div className="text-[12px] text-[#6e6868] font-medium mt-0.5">
                          {medicine.Description && `${medicine.Description} • `}
                          {medicine.Category && `${medicine.Category} • `}
                          {medicine.MedicineType}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-[14px] text-[#6e6868]">No medicines found</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Dosage</label>
              <Input
                value={medication.dosage}
                onChange={(e) => handleInputChange('dosage', e.target.value)}
                placeholder="e.g., 25 mg"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Frequency</label>
              <Select value={medication.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
                <SelectTrigger className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] border-[#e0e3f5] shadow-xl">
                  {MEDICATION_FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Route</label>
              <Select value={medication.route} onValueChange={(value) => handleInputChange('route', value)}>
                <SelectTrigger className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] border-[#e0e3f5] shadow-xl">
                  {MEDICATION_ROUTE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Administration Instructions</label>
              <Select value={medication.foodTiming} onValueChange={(value) => handleInputChange('foodTiming', value)}>
                <SelectTrigger className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all">
                  <SelectValue placeholder="Select timing (optional)" />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] border-[#e0e3f5] shadow-xl">
                  <SelectItem value="before-food">Before Food</SelectItem>
                  <SelectItem value="after-food">After Food</SelectItem>
                  <SelectItem value="before-bed">Before Bed</SelectItem>
                  <SelectItem value="with-food">With Food</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Start Date & Time</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-medium rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] hover:bg-gray-50 transition-all",
                      !medication.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#64549f]" />
                    {medication.startDate ? format(medication.startDate, "PPP p") : <span>Pick a date & time</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[20px] shadow-2xl border-[#e0e3f5]" align="start">
                  <Calendar
                    mode="single"
                    selected={medication.startDate}
                    onSelect={(date) => {
                      if (date) {
                        const currentTime = medication.startDate;
                        const newDateTime = new Date(date);
                        newDateTime.setHours(currentTime.getHours(), currentTime.getMinutes());
                        handleInputChange('startDate', newDateTime);
                      }
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                  <div className="border-t border-[#f0f3f9] p-4 bg-[#fcfdfe] rounded-b-[20px]">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-[#64549f]" />
                      <span className="text-[14px] font-bold text-[#1a2256]">Time Selection:</span>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={medication.startDate.getHours().toString().padStart(2, '0')}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value) || 0;
                            const newDateTime = new Date(medication.startDate);
                            newDateTime.setHours(hours);
                            handleInputChange('startDate', newDateTime);
                          }}
                          className="w-14 h-9 text-center rounded-[8px] border-[#e0e3f5] font-bold"
                          placeholder="HH"
                        />
                        <span className="text-[#1a2256] font-bold self-center">:</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={medication.startDate.getMinutes().toString().padStart(2, '0')}
                          onChange={(e) => {
                            const minutes = parseInt(e.target.value) || 0;
                            const newDateTime = new Date(medication.startDate);
                            newDateTime.setMinutes(minutes);
                            handleInputChange('startDate', newDateTime);
                          }}
                          className="w-14 h-9 text-center rounded-[8px] border-[#e0e3f5] font-bold"
                          placeholder="MM"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[14px] font-bold text-[#1a2256]">Number of Days</label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="untilNextReview"
                    checked={medication.untilNextReview}
                    onCheckedChange={(checked) => handleInputChange('untilNextReview', !!checked)}
                    className="h-4 w-4 border-[#e0e3f5] data-[state=checked]:bg-[#1a2256] data-[state=checked]:border-[#1a2256]"
                  />
                  <label htmlFor="untilNextReview" className="text-[12px] font-medium text-[#6e6868] cursor-pointer">Until Next review</label>
                </div>
              </div>
              <Input
                type="text"
                value={medication.untilNextReview ? 'Until Next review' : medication.numberOfDays}
                onChange={(e) => handleInputChange('numberOfDays', e.target.value)}
                placeholder="e.g., 7"
                min="1"
                disabled={medication.untilNextReview}
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>
          </div>

          {medication.route === 'iv' && (
            <div>
              <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Infusion Rate</label>
              <Input
                value={medication.infusionRate}
                onChange={(e) => handleInputChange('infusionRate', e.target.value)}
                placeholder="e.g., 100 ml/hr"
                className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-[14px] font-bold text-[#1a2256] mb-2">Instructions</label>
            <Textarea
              value={medication.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Special instructions or notes..."
              className="rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium min-h-[100px] resize-none leading-relaxed p-4"
            />
          </div>

          {stockWarning && (
            <Alert className="border-amber-200 bg-amber-50 rounded-[12px]">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 font-medium">
                {stockWarning}
              </AlertDescription>
            </Alert>
          )}
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
            {submitting ? 'Saving...' : 'Save Medication'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
