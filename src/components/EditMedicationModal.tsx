import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, isValid, parseISO, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { Save, X, CalendarIcon, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { patientMedicineSearchService } from '@/services/patientMedicineSearchService';
import { PatientMedicine } from '@/services/patientMedicineDatabase';
import { MEDICATION_FREQUENCY_OPTIONS, MEDICATION_ROUTE_OPTIONS } from '@/utils/medicationOptions';

interface EditMedicationModalProps {
  medication: any;
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMedicationUpdated: () => void;
}

export const EditMedicationModal = ({
  medication,
  patientId,
  open,
  onOpenChange,
  onMedicationUpdated
}: EditMedicationModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    route: '',
    instructions: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    numberOfDays: '',
    infusionRate: '',
    remark: '',
    foodTiming: '',
    untilNextReview: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<PatientMedicine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<PatientMedicine | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Check if patient medicine data is ready
  useEffect(() => {
    const checkDataReady = async () => {
      const ready = await patientMedicineSearchService.isReady();
      setIsDataLoading(!ready);
    };

    if (open) {
      checkDataReady();
    }

    // Listen for sync complete event
    const handleSyncComplete = () => setIsDataLoading(false);
    document.addEventListener('patient-medicine-sync-complete', handleSyncComplete);
    return () => document.removeEventListener('patient-medicine-sync-complete', handleSyncComplete);
  }, [open]);
  const safeDateParse = (dateString: string | undefined | null): Date | undefined => {
    if (!dateString) return undefined;

    // Try parsing ISO first
    try {
      const isoDate = parseISO(dateString);
      if (isValid(isoDate)) return isoDate;
    } catch {
      console.log("error");

    }

    // Try parsing custom formats with seconds
    try {
      // Handles dd-MM-yyyy HH:mm:ss
      const customDate = parse(dateString, "dd-MM-yyyy HH:mm:ss", new Date());
      if (isValid(customDate)) return customDate;
    } catch {
      console.log("error");
    }

    // Try parsing custom formats without seconds
    try {
      // Handles dd-MM-yyyy HH:mm
      const customDateNoSec = parse(dateString, "dd-MM-yyyy HH:mm", new Date());
      if (isValid(customDateNoSec)) return customDateNoSec;
    } catch {
      console.log("error");
    }

    // Try creating Date directly
    try {
      const directDate = new Date(dateString);
      if (isValid(directDate)) return directDate;
    } catch {
      console.log("error");
    }

    return undefined;
  };


  useEffect(() => {
    if (medication) {
      console.log('Setting medication data:', medication);

      const startDate = safeDateParse(
        medication.dueDate ||
        medication.nextDue ||
        medication.plannedStartDateTime ||
        medication.startDate
      );
      const endDate = safeDateParse(medication.plannedEndDateTime || medication.endDate);

      // Map frequency values from API to form values
      const mapFrequency = (freq: string) => {
        if (!freq) return '';
        const f = freq.toLowerCase().trim();

        // Exact match or partial match for human-readable strings
        if (f.includes('once daily') && (f.includes('morning') || f.includes('1-0-0'))) return 'once-daily-morning';
        if (f.includes('once daily') && (f.includes('afternoon') || f.includes('0-1-0'))) return 'once-daily-afternoon';
        if (f.includes('once daily') && (f.includes('evening') || f.includes('night') || f.includes('0-0-1'))) return 'once-daily-night';
        if (f.includes('twice daily') || f.includes('1-0-1')) return 'twice-daily';
        if (f.includes('three times') || f.includes('1-1-1')) return 'three-times-daily';
        if (f.includes('four times') || f.includes('1-1-1-1')) return 'four-times-daily';
        if (f.includes('every 4 hours') || f.includes('q4h')) return 'every-4-hours';
        if (f.includes('every 6 hours') || f.includes('q6h')) return 'every-6-hours';
        if (f.includes('every 8 hours') || f.includes('q8h')) return 'every-8-hours';
        if (f.includes('as needed') || f.includes('prn')) return 'prn';

        const freqMap: Record<string, string> = {
          'once-daily-morning': 'once-daily-morning',
          'once-daily-afternoon': 'once-daily-afternoon',
          'once-daily-evening': 'once-daily-night',
          'once-daily-night': 'once-daily-night',
          'twice-daily': 'twice-daily',
          'three-times-daily': 'three-times-daily',
          'four-times-daily': 'four-times-daily',
          'every-4-hours': 'every-4-hours',
          'every-6-hours': 'every-6-hours',
          'every-8-hours': 'every-8-hours',
          'pnr': 'prn',
          'prn': 'prn'
        };
        return freqMap[freq] || freq;
      };

      // Map route values from API to form values (should be lowercase to match SelectItem values)
      const mapRoute = (route: string) => {
        if (!route) return '';
        const r = route.toLowerCase().trim();
        if (r.includes('vaginal')) return 'vaginal';
        return r;
      };

      // Map food timing values from API to form values
      const mapFoodTiming = (timing: string) => {
        if (!timing) return '';
        const t = timing.toLowerCase().trim();
        if (t.includes('before food') || t.includes('before meal')) return 'before-food';
        if (t.includes('after food') || t.includes('after meal')) return 'after-food';
        if (t.includes('with food') || t.includes('with meal')) return 'with-food';
        if (t.includes('before bed') || t.includes('at night')) return 'before-bed';
        return t.replace(' ', '-'); // Fallback to hyphenated
      };

      setFormData({
        name: medication.name || '',
        dosage: medication.dosage || '',
        frequency: mapFrequency(medication.frequency || ''),
        route: mapRoute(medication.route || ''),
        instructions: medication.specialInstructions || medication.instructions || '',
        startDate: startDate,
        endDate: endDate,
        numberOfDays: medication.durationDays?.toString() || medication.numberOfDays || '',
        infusionRate: medication.infusionRate || '',
        remark: medication.remark || '',
        foodTiming: mapFoodTiming(medication.foodTiming || ''),
        untilNextReview: (medication.durationDays?.toString() === 'Until Next review' || medication.numberOfDays === 'Until Next review'),
      });
    }
  }, [medication]);

  const handleInputChange = (field: string, value: string | Date | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (dosage && !formData.dosage) {
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
    }
  };

  const handleSuggestionSelect = (medicine: PatientMedicine) => {
    // Auto-extract dosage from selected medicine name
    const dosage = extractDosageFromName(medicine.Name);
    setFormData(prev => ({
      ...prev,
      name: medicine.Name,
      ...(dosage ? { dosage } : {}),
    }));
    setSelectedMedicine(medicine);
    setShowSuggestions(false);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please fill in medication name",
        variant: "destructive",
      });
      return;
    }


    setSubmitting(true);
    try {

      await apiService.postForm('Edit Prescription', {
        Mode: 'edit',
        ConsultationID: patientId,
        PrescriptionID: medication?.medicationId,
        MedicationName: formData.name,
        Dosage: formData.dosage,
        Frequency: formData.frequency,
        Route: formData.route,
        instructions: formData.instructions,
        StartDate: formData.startDate ? format(formData.startDate, 'dd-MM-yyyy HH:mm') : format(new Date(), 'dd-MM-yyyy HH:mm'),
        endDate: formData.endDate ? format(formData.endDate, 'dd-MM-yyyy') : null,
        numberOfDays: formData.untilNextReview ? 'Until Next review' : formData.numberOfDays,
        infusionRate: formData.infusionRate,
        remark: formData.remark,
        FoodTiming: formData.foodTiming,
        timestamp: new Date().toISOString()
      });

      // Dispatch real-time update event
      const updatedMedication = {
        Tag: 'Edit Prescription',
        patientId: patientId,
        medicationId: medication?.medicationId,
        MedicationName: formData.name,
        Dosage: formData.dosage,
        Frequency: formData.frequency,
        Route: formData.route,
        StartDate: formData.startDate ? format(formData.startDate, 'dd-MM-yyyy') : format(new Date(), 'dd-MM-yyyy'),
        instructions: formData.instructions,
        numberOfDays: formData.untilNextReview ? 'Until Next review' : formData.numberOfDays,
        infusionRate: formData.infusionRate,
        foodTiming: formData.foodTiming,
      };
      document.dispatchEvent(new CustomEvent('medication-updated', { detail: updatedMedication }));

      toast({
        title: "Medication Updated",
        description: "Medication has been updated successfully.",
      });
      onMedicationUpdated();
      onOpenChange(false);

    } catch (error) {
      console.error('Error updating medication:', error);
      toast({
        title: "Error",
        description: "Failed to update medication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              Edit Medication
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-0">
          <div className="p-6 space-y-5 bg-white max-h-[70vh] overflow-y-auto medical-scroll">
            <div className="grid grid-cols-2 gap-5">
              <div className="relative">
                <Label htmlFor="name" className="block text-[14px] font-bold text-[#1a2256] mb-2">Medication Name *</Label>
                <Input
                  ref={inputRef}
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleMedicineNameChange(e.target.value)}
                  placeholder="e.g., Metoprolol"
                  autoComplete="off"
                  required
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
                <Label htmlFor="dosage" className="block text-[14px] font-bold text-[#1a2256] mb-2">Dosage </Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => handleInputChange('dosage', e.target.value)}
                  placeholder="e.g., 25 mg"
                  className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div>
                <Label htmlFor="frequency" className="block text-[14px] font-bold text-[#1a2256] mb-2">Frequency </Label>
                <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
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
                <Label htmlFor="route" className="block text-[14px] font-bold text-[#1a2256] mb-2">Route </Label>
                <Select value={formData.route} onValueChange={(value) => handleInputChange('route', value)}>
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
                <Label htmlFor="foodTiming" className="block text-[14px] font-bold text-[#1a2256] mb-2">Administration Instructions</Label>
                <Select value={formData.foodTiming} onValueChange={(value) => handleInputChange('foodTiming', value)}>
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
                <Label htmlFor="startDate" className="block text-[14px] font-bold text-[#1a2256] mb-2">Start Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full h-11 justify-start text-left font-medium rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] hover:bg-gray-50 transition-all",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#64549f]" />
                      {formData.startDate ? format(formData.startDate, "PPP p") : <span>Pick a date & time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-[20px] shadow-2xl border-[#e0e3f5]" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => {
                        if (date) {
                          const currentDateTime = formData.startDate || new Date();
                          const newDateTime = new Date(date);
                          newDateTime.setHours(currentDateTime.getHours(), currentDateTime.getMinutes());
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
                            value={formData.startDate ? formData.startDate.getHours().toString().padStart(2, '0') : '00'}
                            onChange={(e) => {
                              const hours = parseInt(e.target.value) || 0;
                              const currentDateTime = formData.startDate || new Date();
                              const newDateTime = new Date(currentDateTime);
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
                            value={formData.startDate ? formData.startDate.getMinutes().toString().padStart(2, '0') : '00'}
                            onChange={(e) => {
                              const minutes = parseInt(e.target.value) || 0;
                              const currentDateTime = formData.startDate || new Date();
                              const newDateTime = new Date(currentDateTime);
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
                  <Label htmlFor="numberOfDays" className="block text-[14px] font-bold text-[#1a2256]">Duration (Days)</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="editUntilNextReview"
                      checked={formData.untilNextReview}
                      onCheckedChange={(checked) => handleInputChange('untilNextReview', !!checked)}
                      className="h-4 w-4 border-[#e0e3f5] data-[state=checked]:bg-[#1a2256] data-[state=checked]:border-[#1a2256]"
                    />
                    <label htmlFor="editUntilNextReview" className="text-[12px] font-medium text-[#6e6868] cursor-pointer">Until Next review</label>
                  </div>
                </div>
                <Input
                  id="numberOfDays"
                  type="text"
                  value={formData.untilNextReview ? 'Until Next review' : formData.numberOfDays}
                  onChange={(e) => handleInputChange('numberOfDays', e.target.value)}
                  placeholder="e.g., 7"
                  min="1"
                  disabled={formData.untilNextReview}
                  className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
            </div>

            {formData.route === 'iv' && (
              <div>
                <Label htmlFor="infusionRate" className="block text-[14px] font-bold text-[#1a2256] mb-2">Infusion Rate</Label>
                <Input
                  id="infusionRate"
                  value={formData.infusionRate}
                  onChange={(e) => handleInputChange('infusionRate', e.target.value)}
                  placeholder="e.g., 100 ml/hr"
                  className="h-11 rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
                />
              </div>
            )}

            <div>
              <Label htmlFor="instructions" className="block text-[14px] font-bold text-[#1a2256] mb-2">Special Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Special instructions or notes..."
                className="rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium min-h-[100px] resize-none leading-relaxed p-4"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] flex flex-row justify-end gap-3 rounded-b-[24px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="rounded-[12px] h-10 px-6 font-bold text-[#6e6868] border-[#e0e3f5] hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-[12px] h-10 px-6 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              {submitting ? 'Updating...' : 'Update Medication'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
