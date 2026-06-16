import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { ClinicalData, TranscriptEntry } from "@/types/doctorAssistant";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Copy,
  FileText,
  AlertTriangle,
  Pill,
  Heart,
  Users,
  Cigarette,
  Stethoscope,
  ClipboardList,
  Activity,
  Loader2,
  Square,
  TestTube2,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Maximize2,
  Minimize2,
  Edit2,
  Plus,
  History as HistoryIcon,
  FlaskConical,
  X,
  Ear,
  User,
  User2,
  Settings as SettingsIcon,
  StickyNote,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import doctorsOfficeGif from "../img/doctors-office.gif";
import { AddMedicationModal } from "./AddMedicationModal";
import { AddLabResultModal } from "./AddLabResultModal";
import { AmbientAssistantSettings } from "./AmbientAssistantSettings";
import { PreviousPrescriptionsSidebar } from "./PreviousPrescriptionsSidebar";
import { defaultCategories, AmbientAssistantSettings as SettingsType, PreviousPrescriptionItem, VisitInfo } from "@/types/doctorAssistant";
import { apiService } from "@/services/apiService";
import { patientMedicineSearchService } from "@/services/patientMedicineSearchService";
import type { PatientMedicine } from "@/services/patientMedicineDatabase";
import { AMBIENT_FREQUENCY_OPTIONS, ONCE_DAILY_NIGHT_LABEL } from "@/utils/medicationOptions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DoctorAssistantWidgetProps {
  isListening: boolean;
  isConnecting: boolean;
  isPaused: boolean;
  clinicalData: ClinicalData;
  conversationHistory: TranscriptEntry[];
  hasRecordedData: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onTogglePause: () => void;
  onClearData: () => void;
  onUpdateClinicalData: (update: (prev: ClinicalData) => ClinicalData) => void;
  medications?: any[];
  labOrders?: any[];
  assistantSettings: SettingsType;
  onSaveAssistantSettings: (settings: SettingsType) => void;
  doctorId: string;
  doctorName?: string;
  admissionId?: string;
  isExtracting?: boolean;
  isStreamStarted?: boolean;
  onRetryExtraction?: () => void;
  streamingResponse?: string;
  hasReceivedFinalResponse?: boolean;
  patientStreamingText?: string;
  visitInfo?: VisitInfo;
  isInpatient?: boolean;
}

const isVisitInfoNotEmpty = (visitInfo?: VisitInfo): boolean => {
  if (!visitInfo) return false;

  const standardFields = [
    visitInfo.chiefComplaint,
    visitInfo.purposeOfVisit,
    visitInfo.urgentConcerns,
    visitInfo.symptoms,
    visitInfo.duration,
    visitInfo.medicalHistory,
    visitInfo.allergy,
    visitInfo.comorbidity,
    visitInfo.familySocialHistory,
    visitInfo.currentMedication,
    visitInfo.notes,
  ];

  if (standardFields.some((field) => field?.trim())) return true;

  if (visitInfo.customCategories) {
    return Object.values(visitInfo.customCategories).some((value) => value?.trim());
  }

  return false;
};

interface AmbientHistoryMeta {
  doctorName: string;
  scheduledDate: string;
  scheduledTime: string;
  formattedDateTime: string;
}

const extractAmbientHistoryRecord = (response: any): { record: any; formData: any } | null => {
  if (!response) return null;

  let records: any[] = [];
  if (Array.isArray(response)) {
    if (response.length > 0 && (response[0].Value || response[0].value) && !response[0].consultationId && !response[0].ScheduledDate) {
      const wrapped = response[0].Value || response[0].value;
      try {
        const parsed = typeof wrapped === 'string' ? JSON.parse(wrapped) : wrapped;
        records = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        records = response;
      }
    } else {
      records = response;
    }
  } else {
    records = [response];
  }

  if (records.length === 0) return null;

  const record = records[0];
  let formData = record;

  if (record?.value) {
    try {
      formData = typeof record.value === 'string' ? JSON.parse(record.value) : record.value;
    } catch {
      formData = record.value;
    }
  } else if (record?.Value) {
    try {
      formData = typeof record.Value === 'string' ? JSON.parse(record.Value) : record.Value;
    } catch {
      formData = record.Value;
    }
  }

  return { record, formData };
};

const extractHistoryMetaFields = (record: any): Pick<AmbientHistoryMeta, 'scheduledDate' | 'scheduledTime'> => ({
  scheduledDate: String(
    record?.ScheduledDate || record?.scheduledDate || record?.scheduled_date || ''
  ).replace(/\\/g, ''),
  scheduledTime: String(
    record?.ScheduledTime || record?.scheduledTime || record?.scheduled_time || ''
  ),
});

const formatAmbientHistoryDateTime = (scheduledDate: string, scheduledTime: string): string => {
  if (!scheduledDate?.trim()) return '';

  const normalizedDate = scheduledDate.replace(/\\/g, '');
  const dateParts = normalizedDate.split('/');
  if (dateParts.length !== 3) {
    return [scheduledDate, scheduledTime].filter(Boolean).join(' ').trim();
  }

  const month = parseInt(dateParts[0], 10);
  const day = parseInt(dateParts[1], 10);
  const year = parseInt(dateParts[2], 10);

  if (isNaN(month) || isNaN(day) || isNaN(year)) {
    return [scheduledDate, scheduledTime].filter(Boolean).join(' ').trim();
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = monthNames[month - 1];
  if (!monthName) {
    return [scheduledDate, scheduledTime].filter(Boolean).join(' ').trim();
  }

  let formatted = `${monthName} ${day} ${year}`;

  if (scheduledTime?.trim()) {
    const [hoursStr, minutesStr = '0'] = scheduledTime.trim().split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (!isNaN(hours)) {
      const period = hours >= 12 ? 'pm' : 'am';
      const hour12 = hours % 12 || 12;
      const minStr = String(isNaN(minutes) ? 0 : minutes).padStart(2, '0');
      formatted += ` ${String(hour12).padStart(2, '0')}:${minStr}${period}`;
    }
  }

  return formatted;
};

const resolveHistoryDoctorName = (
  record: any,
  fallbackDoctorName: string,
  fallbackDoctorId: string,
): string => {
  const fromRecord = record?.DoctorName || record?.doctorName || '';
  if (fromRecord?.trim()) return fromRecord.trim();

  const recordDoctorId = String(record?.doctorId || record?.DoctorID || record?.DoctorId || '');
  if (recordDoctorId && recordDoctorId === String(fallbackDoctorId) && fallbackDoctorName?.trim()) {
    return fallbackDoctorName.trim();
  }

  return fallbackDoctorName?.trim() || '';
};

// Note content generators
const formatVisitSummary = (data: ClinicalData): string => {
  let summary = "VISIT SUMMARY\n\n";
  if (data.chiefComplaint) summary += `Chief Complaint: ${data.chiefComplaint}\n\n`;
  if (data.hpiDetails.onset || data.hpiDetails.duration || data.hpiDetails.severity) {
    summary += "History of Present Illness:\n";
    if (data.hpiDetails.onset) summary += `• Onset: ${data.hpiDetails.onset}\n`;
    if (data.hpiDetails.duration) summary += `• Duration: ${data.hpiDetails.duration}\n`;
    if (data.hpiDetails.severity) summary += `• Severity: ${data.hpiDetails.severity}\n`;
    if (data.hpiDetails.location) summary += `• Location: ${data.hpiDetails.location}\n`;
    if (data.hpiDetails.character) summary += `• Character: ${data.hpiDetails.character}\n`;
    summary += "\n";
  }
  if (data.assessment) summary += `Assessment: ${data.assessment}\n\n`;
  if (data.plan.length > 0) summary += `Plan:\n${data.plan.map(p => `• ${p}`).join('\n')}`;
  return summary;
};

const formatChiefComplaints = (data: ClinicalData): string => {
  let content = "CHIEF COMPLAINTS\n\n";
  if (data.chiefComplaint) content += `${data.chiefComplaint}\n\n`;
  if (data.hpiDetails.associatedSymptoms.length > 0) {
    content += `Associated Symptoms:\n${data.hpiDetails.associatedSymptoms.map(s => `• ${s}`).join('\n')}\n\n`;
  }
  if (data.redFlags.length > 0) {
    content += `⚠️ Red Flags:\n${data.redFlags.map(r => `• ${r}`).join('\n')}`;
  }
  return content;
};

const formatLabTestsRecommendation = (data: ClinicalData): string => {
  let content = "RECOMMENDED LAB TESTS\n\n";
  if (data.chiefComplaint) content += `Based on: ${data.chiefComplaint}\n\n`;
  const labRelated = data.plan.filter(p =>
    /lab|test|blood|cbc|bmp|lipid|a1c|thyroid|urine/i.test(p)
  );
  if (labRelated.length > 0) {
    content += `Discussed:\n${labRelated.map(l => `• ${l}`).join('\n')}`;
  } else {
    content += "No specific lab tests discussed during visit.";
  }
  return content;
};

const formatMedicationNote = (data: ClinicalData): string => {
  let content = "MEDICATION REVIEW\n\n";
  if (data.medications.length > 0) {
    content += "Medications Discussed:\n";
    content += data.medications.map(m => {
      const details = [m.frequency, m.dosage, m.duration].filter(Boolean).join(', ');
      return `• ${m.name}${details ? ` (${details})` : ''}`;
    }).join('\n');
    content += "\n\n";
  }
  if (data.allergies.length > 0) {
    content += "⚠️ Allergies:\n";
    content += data.allergies.map(a => `• ${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}`).join('\n');
  }
  const medChanges = data.plan.filter(p => /medication|prescribe|start|stop|increase|decrease|mg|dose/i.test(p));
  if (medChanges.length > 0) {
    content += "\n\nPlanned Changes:\n";
    content += medChanges.map(m => `• ${m}`).join('\n');
  }
  return content;
};

const hasContent = (data: ClinicalData): boolean => {
  return !!(
    data.chiefComplaint ||
    data.hpiDetails.onset ||
    data.hpiDetails.location ||
    data.pastMedicalHistory.length > 0 ||
    data.medications.length > 0 ||
    data.allergies.length > 0 ||
    data.redFlags.length > 0 ||
    data.assessment ||
    data.plan.length > 0
  );
};

const formatClinicalDataAsText = (data: ClinicalData): string => {
  let text = "";

  if (data.chiefComplaint) {
    text += `CHIEF COMPLAINT:\n${data.chiefComplaint}\n\n`;
  }

  const hpi = data.hpiDetails;
  if (hpi.onset || hpi.location || hpi.duration || hpi.character || hpi.severity) {
    text += "HISTORY OF PRESENT ILLNESS:\n";
    if (hpi.onset) text += `  Onset: ${hpi.onset}\n`;
    if (hpi.location) text += `  Location: ${hpi.location}\n`;
    if (hpi.duration) text += `  Duration: ${hpi.duration}\n`;
    if (hpi.character) text += `  Character: ${hpi.character}\n`;
    if (hpi.severity) text += `  Severity: ${hpi.severity}\n`;
    if (hpi.timing) text += `  Timing: ${hpi.timing}\n`;
    if (hpi.modifyingFactors) text += `  Modifying Factors: ${hpi.modifyingFactors}\n`;
    if (hpi.associatedSymptoms.length > 0) {
      text += `  Associated Symptoms: ${hpi.associatedSymptoms.join(", ")}\n`;
    }
    text += "\n";
  }

  if (Array.isArray(data.pastMedicalHistory) && data.pastMedicalHistory.length > 0) {
    text += `PAST MEDICAL HISTORY:\n${data.pastMedicalHistory.filter(h => h).map(h => `  • ${h}`).join("\n")}\n\n`;
  }

  const currentMeds = typeof data.currentMedication === 'string' ? data.currentMedication : ((data as any).medication?.value || (Array.isArray(data.medicationHistory) ? data.medicationHistory.join(', ') : ''));
  if (currentMeds) {
    text += `CURRENT MEDICATIONS:\n  ${currentMeds}\n\n`;
  }

  if (Array.isArray(data.medications) && data.medications.length > 0) {
    text += `PRESCRIPTIONS:\n${data.medications.filter(m => m && m.name).map(m => {
      const details = [m.frequency, m.dosage, m.duration].filter(Boolean).join(', ');
      return `  • ${m.name}${details ? ` (${details})` : ""}`;
    }).join("\n")}\n\n`;
  }

  const labList = Array.isArray(data.labOrders) ? data.labOrders : ((data.labOrders as any)?.items || []);
  if (labList.length > 0) {
    text += `LAB ORDERS:\n${labList.filter((l: any) => l && (l.testName || l.test)).map((l: any) => `  • ${l.testName || l.test}${l.description || l.reason ? ` (${l.description || l.reason})` : ""}`).join("\n")}\n\n`;
  }

  if (Array.isArray(data.allergies) && data.allergies.length > 0) {
    text += `ALLERGIES:\n${data.allergies.filter(a => a && a.allergen).map(a => `  • ${a.allergen}${a.reaction ? ` (${a.reaction})` : ""}`).join("\n")}\n\n`;
  }

  if (data.familyHistory.length > 0) {
    text += `FAMILY HISTORY:\n${data.familyHistory.map(f => `  • ${f}`).join("\n")}\n\n`;
  }

  const social = data.socialHistory;
  if (social.smoking || social.alcohol || social.occupation) {
    text += "SOCIAL HISTORY:\n";
    if (social.smoking) text += `  Smoking: ${social.smoking}\n`;
    if (social.alcohol) text += `  Alcohol: ${social.alcohol}\n`;
    if (social.drugs) text += `  Drugs: ${social.drugs}\n`;
    if (social.occupation) text += `  Occupation: ${social.occupation}\n`;
    if (social.livingSituation) text += `  Living Situation: ${social.livingSituation}\n`;
    text += "\n";
  }

  if (data.redFlags.length > 0) {
    text += `RED FLAGS:\n${data.redFlags.map(r => `  ⚠️ ${r}`).join("\n")}\n\n`;
  }

  if (data.physicalExam.length > 0) {
    text += `PHYSICAL EXAM:\n${data.physicalExam.map(p => `  • ${p}`).join("\n")}\n\n`;
  }

  if (data.assessment) {
    text += `ASSESSMENT:\n${data.assessment}\n\n`;
  }

  if (data.plan.length > 0) {
    text += `PLAN:\n${data.plan.map(p => `  • ${p}`).join("\n")}\n`;
  }

  return text;
};

// Quick note actions configuration
const quickNoteActions = [
  {
    label: "Visit Summary",
    findingType: "Progress Note",
    icon: FileText,
    generator: formatVisitSummary
  },
  {
    label: "Chief Complaints",
    findingType: "Consultation Note",
    icon: ClipboardList,
    generator: formatChiefComplaints
  },
  {
    label: "Lab Tests",
    findingType: "Progress Note",
    icon: TestTube2,
    generator: formatLabTestsRecommendation
  },
  {
    label: "Medication Note",
    findingType: "Progress Note",
    icon: Pill,
    generator: formatMedicationNote
  },
];

// Helper components for the redesigned summary
const SummaryCard = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) => (
  <div className="bg-white rounded-2xl border border-[#e2e4f0] shadow-sm hover:shadow-md transition-all duration-300 p-4">
    <div className="flex items-center gap-3 mb-2">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-[#64549f]/5 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#64549f]" />
        </div>
      )}
      <h4 className="text-[14px] font-bold text-[#1a2256] capitalize">{title} </h4>
    </div>
    <div className="rounded-xl border border-[#e2e4f0] bg-white p-5 transition-all duration-300 focus-within:border-[#64549f] focus-within:ring-2 focus-within:ring-[#64549f]/10">
      {children}
    </div>
  </div>
);

// Helper component for custom dropdowns
const CustomDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  allowCustom = false,
  activeColor = "#64549f"
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  allowCustom?: boolean;
  activeColor?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger asChild>
        <div className="relative w-full cursor-pointer">
          <div className="relative flex items-center">
            <input
              className="w-full bg-transparent border border-transparent hover:border-[#64549f]/20 focus:bg-white rounded-xl py-2 px-3 text-[14px] text-[#1a2256] focus:ring-0 outline-none transition-all placeholder:text-gray-300 cursor-pointer"
              placeholder={placeholder}
              value={value}
              onChange={(e) => allowCustom && onChange(e.target.value)}
              readOnly={!allowCustom}
            />
            <ChevronDown
              className={`absolute right-2 w-4 h-4 text-[#64549f] transition-transform duration-300 pointer-events-none opacity-40 ${isOpen ? "rotate-180 opacity-100" : ""}`}
            />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 border-[#e2e4f0] rounded-2xl shadow-xl overflow-hidden z-[1000]"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        align="start"
        sideOffset={4}
      >
        <div className="max-h-[240px] overflow-y-auto py-2 bg-white">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-[#64549f] hover:text-white ${value === opt ? "bg-[#64549f]/5 text-[#64549f]" : "text-[#1a2256]"
                }`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const DoctorAssistantWidget = ({
  isListening,
  isConnecting,
  isPaused,
  clinicalData,
  conversationHistory,
  hasRecordedData,
  onStartListening,
  onStopListening,
  onTogglePause,
  onUpdateClinicalData,
  onClearData,
  admissionId,
  doctorId,
  doctorName = '',
  medications: dashboardMedications = [],
  labOrders: dashboardLabOrders = [],
  assistantSettings,
  onSaveAssistantSettings,
  isExtracting,
  isStreamStarted,
  onRetryExtraction,
  streamingResponse,
  hasReceivedFinalResponse,
  patientStreamingText,
  visitInfo,
  isInpatient = false,
}: DoctorAssistantWidgetProps) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isPopupHidden, setIsPopupHidden] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationProgress, setInitializationProgress] = useState(0);
  // Consultation summary view shown after stopping scribing
  const [isConsultationView, setIsConsultationView] = useState(false);
  const [isViewingSavedHistory, setIsViewingSavedHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [historyMeta, setHistoryMeta] = useState<AmbientHistoryMeta | null>(null);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [isAddMedicationModalOpen, setIsAddMedicationModalOpen] = useState(false);
  const [isAddLabModalOpen, setIsAddLabModalOpen] = useState(false);
  const [consultForm, setConsultForm] = useState({
    chiefComplaint: '',
    purposeOfVisit: '',
    urgentConcerns: '',
    symptoms: '',
    medicalHistory: '',
    allergy: '',
    comorbidity: '',
    familySocialHistory: '',
    currentMedication: '',
    diagnosisAndFindings: '',
    prescriptions: [] as {
      id: number;
      name: string;
      frequency?: string;
      dosage?: string;
      duration?: string;
      route?: string;
      foodTiming?: string;
      instructions?: string;
      prescriptionId?: string;
    }[],
    labOrders: [] as {
      id: number;
      testName: string;
      notes?: string;
      labId?: string;
    }[],
    customCategories: {} as Record<string, string>,
  });

  // Suggestion states
  const [medicineSuggestions, setMedicineSuggestions] = useState<PatientMedicine[]>([]);
  const [labSuggestions, setLabSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isMedicineDataLoading, setIsMedicineDataLoading] = useState(true);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null);
  const [activeSuggestionType, setActiveSuggestionType] = useState<'medicine' | 'lab' | null>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkDataReady = async () => {
      const ready = await patientMedicineSearchService.isReady();
      setIsMedicineDataLoading(!ready);
    };
    checkDataReady();

    const handleSyncComplete = () => setIsMedicineDataLoading(false);
    document.addEventListener('patient-medicine-sync-complete', handleSyncComplete);
    return () => document.removeEventListener('patient-medicine-sync-complete', handleSyncComplete);
  }, []);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'medicine' | 'lab';
    idx: number;
    name: string;
    dbId?: string;
  } | null>(null);

  const handleMedicineSearch = async (idx: number, query: string) => {
    const updated = [...consultForm.prescriptions];
    updated[idx] = { ...updated[idx], name: query };
    setConsultForm(f => ({ ...f, prescriptions: updated }));

    if (query.trim().length >= 2) {
      setLoadingSuggestions(true);
      setActiveSuggestionIdx(idx);
      setActiveSuggestionType('medicine');
      try {
        if (patientMedicineSearchService.isSyncing()) {
          await patientMedicineSearchService.waitForSync();
        }
        const results = await patientMedicineSearchService.search(query, 10);
        setMedicineSuggestions(results);
      } catch (error) {
        console.error('Error searching medicines:', error);
        setMedicineSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      setMedicineSuggestions([]);
      setActiveSuggestionIdx(null);
      setActiveSuggestionType(null);
    }
  };

  const handleLabSearch = async (idx: number, query: string) => {
    const updated = [...consultForm.labOrders];
    updated[idx] = { ...updated[idx], testName: query };
    setConsultForm(f => ({ ...f, labOrders: updated }));

    if (query.trim().length >= 2) {
      setLoadingSuggestions(true);
      setActiveSuggestionIdx(idx);
      setActiveSuggestionType('lab');
      try {
        const { servicesSearchService } = await import('@/services/servicesSearchService');
        const results = await servicesSearchService.search(query, 10);
        setLabSuggestions(results);
      } catch (error) {
        console.error('Error searching labs:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      setLabSuggestions([]);
      setActiveSuggestionIdx(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setMedicineSuggestions([]);
        setLabSuggestions([]);
        setActiveSuggestionIdx(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviousPrescriptionsOpen, setIsPreviousPrescriptionsOpen] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { toast } = useToast();
  const syncedMedsRef = useRef<Set<string>>(new Set());
  const syncedLabsRef = useRef<Set<string>>(new Set());

  const normalizeFrequency = (freq: string) => {
    if (!freq) return '';
    const f = freq.toLowerCase();
    if (f.includes('once daily - evening') || f === 'once daily - evening (0-0-1)') return ONCE_DAILY_NIGHT_LABEL;
    if (f.includes('once daily') && (f.includes('afternoon') || f.includes('0-1-0'))) return "Once Daily - Afternoon (0-1-0)";
    if (f.includes('once daily') && (f.includes('morning') || f.includes('1-0-0'))) return "Once Daily - Morning (1-0-0)";
    if (f.includes('once daily') || f.includes('once a day') || f === 'od') return "Once Daily - Morning (1-0-0)";
    if (f.includes('twice daily') || f.includes('twice a day') || f === 'bd' || f === 'bid') return "Twice Daily (1-0-1)";
    if (f.includes('three times') || f === 'tid') return "Three Times Daily (1-1-1)";
    if (f.includes('four times') || f === 'qid') return "Four Times Daily (1-1-1-1)";
    if (f.includes('at night') || f.includes('before sleep') || f === 'hs' || f.includes('bedtime') || f.includes('night (0-0-1)')) return ONCE_DAILY_NIGHT_LABEL;
    if (f.includes('as needed') || f === 'prn') return "As Needed (PRN)";
    if (f.includes('every 4 hours') || f === 'q4h') return "Every 4 Hours";
    if (f.includes('every 6 hours') || f === 'q6h') return "Every 6 Hours";
    if (f.includes('every 8 hours') || f === 'q8h') return "Every 8 Hours";
    return freq;
  };

  const normalizeDuration = (dur: string) => {
    if (!dur) return '';
    let d = dur.toLowerCase().trim();
    // Word to number normalization
    d = d.replace(/\bone day\b/g, '1 day')
      .replace(/\btwo days\b/g, '2 days')
      .replace(/\bthree days\b/g, '3 days')
      .replace(/\bfour days\b/g, '4 days')
      .replace(/\bfive days\b/g, '5 days')
      .replace(/\bsix days\b/g, '6 days')
      .replace(/\bseven days\b/g, '7 days')
      .replace(/\bten days\b/g, '10 days')
      .replace(/\btwo weeks\b/g, '2 weeks');

    if (d.includes('next visit') || d.includes('until visit')) return "Until next visit";
    if (d.startsWith('until ')) d = d.replace('until ', '').trim();
    if (d === '1 day' || d === '7 days' || d === '10 days') return d;
    if (d === '2 days') return "2 days";
    if (d === '3 days') return "3 days";
    if (d === '5 days') return "5 days";
    if (d === '1 week') return "1 week";
    if (d === '2 weeks') return "2 weeks";
    if (d === '1 month') return "1 month";
    return dur;
  };

  /** Single key for med dedupe across sync effect, syncedMedsRef, and initial form merge. */
  const getMedicationSyncKey = (m: {
    name?: string;
    frequency?: string;
    dosage?: string;
    dose?: string;
    duration?: string;
    numberOfDays?: string;
  }) => {
    const name = (m.name || '').trim();
    const frequency = (m.frequency || '').trim();
    const dosage = (m.dosage || m.dose || '').trim();
    const duration = (m.duration || m.numberOfDays || '').trim();
    return `${name}|${frequency}|${dosage}|${duration}`.toLowerCase();
  };

  /** Matches variants like "Complete blood count (CBC)" vs "Complete blood count" for dedupe. */
  const getLabTestDedupeKey = (l: { testName?: string }) => {
    let s = (l.testName || '').trim().toLowerCase();
    s = s.replace(/\s+/g, ' ');
    s = s.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    s = s.replace(/\s+/g, ' ');
    return s;
  };

  const parsePlanForMedications = (plan: any) => {
    let text = '';
    if (Array.isArray(plan)) {
      text = plan.join(' ');
    } else if (plan && typeof plan === 'object') {
      text = plan.value || plan.instruction || '';
    } else {
      text = plan || '';
    }

    if (!text) return [];

    const meds: any[] = [];
    const parts = text.split(/Prescribed|Prescribing/i).slice(1);

    parts.forEach(part => {
      const cleanPart = part.trim().replace(/\.+$/, '');
      if (!cleanPart) return;

      // More robust parsing: look for keywords 'for' and 'to'
      // Example: "Paracetamol 650 mg, one tablet three times a day for five days to help reduce pain"
      let name = '';
      let frequency = '';
      let duration = '';
      let notes = '';

      // Split by comma first if it exists
      const commaIndex = cleanPart.indexOf(',');
      if (commaIndex !== -1) {
        name = cleanPart.substring(0, commaIndex).trim();
        let remaining = cleanPart.substring(commaIndex + 1).trim();

        // Look for 'for' or 'until' in remaining
        const durationMatch = remaining.match(/(.*?)\s+(for|until)\s+(.*)/i);
        if (durationMatch) {
          frequency = durationMatch[1].trim();
          let afterDuration = durationMatch[3].trim();

          // Look for 'to' in afterDuration
          const toMatch = afterDuration.match(/(.*?)\s+to\s+(.*)/i);
          if (toMatch) {
            duration = toMatch[1].trim();
            notes = toMatch[2].trim();
          } else {
            duration = afterDuration;
          }
        } else {
          // No 'for/until', look for 'to'
          const toMatch = remaining.match(/(.*?)\s+to\s+(.*)/i);
          if (toMatch) {
            frequency = toMatch[1].trim();
            notes = toMatch[2].trim();
          } else {
            frequency = remaining;
          }
        }
      } else {
        // No comma: look for 'for', 'until', or 'to' to split name
        const durationMatch = cleanPart.match(/(.*?)\s+(for|until)\s+(.*)/i);
        const toMatch = cleanPart.match(/(.*?)\s+to\s+(.*)/i);

        if (durationMatch && (!toMatch || durationMatch.index <= toMatch.index)) {
          name = durationMatch[1].trim();
          let afterDuration = durationMatch[3].trim();
          const toMatchInRemaining = afterDuration.match(/(.*?)\s+to\s+(.*)/i);
          if (toMatchInRemaining) {
            duration = toMatchInRemaining[1].trim();
            notes = toMatchInRemaining[2].trim();
          } else {
            duration = afterDuration;
          }
        } else if (toMatch) {
          name = toMatch[1].trim();
          notes = toMatch[2].trim();
        } else {
          name = cleanPart;
        }
      }

      if (name) {
        meds.push({
          name,
          frequency: normalizeFrequency(frequency),
          duration: normalizeDuration(duration),
          instructions: frequency,
          notes: notes
        });
      }
    });
    return meds;
  };

  const parsePlanForLabs = (plan: any) => {
    let text = '';
    if (Array.isArray(plan)) {
      text = plan.join(' ');
    } else if (plan && typeof plan === 'object') {
      text = plan.value || plan.instruction || '';
    } else {
      text = plan || '';
    }

    if (!text) return [];

    const labs: any[] = [];
    const labKeywords = ["Recommended labs", "Ordered tests", "Advised tests", "Lab tests", "Tests ordered"];
    for (const kw of labKeywords) {
      const regex = new RegExp(`${kw}[:\\s]+([^.]+)`, 'i');
      const match = text.match(regex);
      if (match) {
        const list = match[1].split(/,|and/i);
        list.forEach(item => {
          if (item.trim()) labs.push({ testName: item.trim(), notes: `Extracted from Plan: ${kw}` });
        });
        break;
      }
    }
    return labs;
  };

  const getExtractedLabs = (data: any) => {
    if (!data) return [];
    const labs: any[] = [];

    // Check all possible paths for lab orders
    const raw = data.labOrders || data.lab_orders || data.clinical_data?.labOrders || data.clinical_data?.lab_orders || data.recommendedLabs || data.clinical_data?.recommendedLabs || data.extraction?.labOrders || data.result?.clinical_data?.labOrders || data.result?.labOrders || data.data?.clinical_data?.labOrders || data.data?.labOrders;

    if (Array.isArray(raw)) {
      labs.push(...raw.map((l: any) => ({
        testName: (typeof l === 'string' ? l : (l.testName || l.test || l.test_name || l.lab_test || '')),
        notes: (typeof l === 'string' ? '' : (l.description || l.reason || l.notes || l.note || ''))
      })));
    } else if (raw && Array.isArray(raw.items)) {
      labs.push(...raw.items.map((l: any) => ({
        testName: l.test || l.testName || l.test_name || l.lab_test || '',
        notes: l.reason || l.description || l.notes || l.note || ''
      })));
    } else if (raw && Array.isArray(raw.tests)) {
      labs.push(...raw.tests.map((l: any) => ({
        testName: l.test || l.testName || l.test_name || l.lab_test || '',
        notes: l.reason || l.description || l.notes || l.note || ''
      })));
    }

    return labs.filter(l => l.testName && l.testName.trim() !== '');
  };

  const mapAmbientHistoryToConsultForm = (historyData: any) => {
    const customCategories: Record<string, string> = {};
    if (Array.isArray(historyData?.customCategories)) {
      historyData.customCategories.forEach((cat: { field?: string; value?: string }) => {
        if (cat.field) customCategories[cat.field] = cat.value || '';
      });
    } else if (historyData?.customCategories && typeof historyData.customCategories === 'object') {
      Object.assign(customCategories, historyData.customCategories);
    }

    return {
      chiefComplaint: historyData?.chiefComplaint || '',
      purposeOfVisit: historyData?.purposeOfVisit || '',
      urgentConcerns: historyData?.urgentConcerns || '',
      symptoms: historyData?.symptoms || '',
      medicalHistory: historyData?.medicalHistory || '',
      allergy: historyData?.allergy || '',
      comorbidity: historyData?.comorbidity || '',
      familySocialHistory: historyData?.familySocialHistory || '',
      currentMedication: historyData?.currentMedication || '',
      diagnosisAndFindings: historyData?.diagnosisAndFindings || '',
      prescriptions: (historyData?.prescriptions || []).map((rx: any, i: number) => ({
        id: rx.id || Date.now() + i,
        name: rx.name || '',
        frequency: normalizeFrequency(rx.frequency || ''),
        dosage: rx.dosage || '',
        duration: rx.duration || '',
        route: rx.route || '',
        foodTiming: rx.foodTiming || '',
        instructions: rx.instructions || '',
        prescriptionId: rx.prescriptionId || '',
      })),
      labOrders: (historyData?.labOrders || []).map((lab: any, i: number) => ({
        id: lab.id || Date.now() + i,
        testName: lab.testName || '',
        notes: lab.notes || '',
        labId: lab.labId || '',
      })),
      customCategories,
    };
  };

  const handleReviewFindings = async () => {
    if (!admissionId) {
      toast({
        title: "No Consultation",
        description: "Consultation ID is required to load saved findings.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingHistory(true);
    try {
      const historyResponse = await apiService.getAmbientHistory(admissionId);
      const extracted = extractAmbientHistoryRecord(historyResponse);
      if (!extracted) {
        toast({
          title: "No Saved Findings",
          description: "No ambient history was found for this consultation.",
          variant: "destructive",
        });
        return;
      }

      const { record, formData: historyData } = extracted;

      syncedMedsRef.current.clear();
      syncedLabsRef.current.clear();
      setConsultForm(mapAmbientHistoryToConsultForm(historyData));
      const metaFields = extractHistoryMetaFields(record);
      setHistoryMeta({
        doctorName: resolveHistoryDoctorName(record, doctorName, doctorId),
        scheduledDate: metaFields.scheduledDate,
        scheduledTime: metaFields.scheduledTime,
        formattedDateTime: formatAmbientHistoryDateTime(metaFields.scheduledDate, metaFields.scheduledTime),
      });
      setIsViewingSavedHistory(true);
      setIsConsultationView(true);
      setIsFetchingSummary(false);
      setIsMinimized(false);
      setIsMaximized(true);
      setIsPopupHidden(false);
      setIsViewOnly(false);
    } catch (error) {
      console.error('Failed to load ambient history:', error);
      toast({
        title: "Load Failed",
        description: "Could not load saved ambient findings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Sync additions from clinicalData to consultForm
  useEffect(() => {
    if (isConsultationView && !isViewingSavedHistory) {
      setConsultForm(prev => ({
        ...prev,
        chiefComplaint: clinicalData.chiefComplaint || prev.chiefComplaint,
        purposeOfVisit: clinicalData.purposeOfVisit || prev.purposeOfVisit,
        urgentConcerns: clinicalData.urgentConcerns || prev.urgentConcerns,
        symptoms: clinicalData.symptoms || prev.symptoms,
        medicalHistory: clinicalData.medicalHistory || prev.medicalHistory,
        allergy: clinicalData.allergy || prev.allergy,
        comorbidity: clinicalData.comorbidity || prev.comorbidity,
        familySocialHistory: clinicalData.familySocialHistory || prev.familySocialHistory,
        currentMedication: clinicalData.currentMedication || prev.currentMedication,
      }));

      // 1. Sync Medications from clinicalData (AI extracted), dashboardMedications, and parsed Plan
      const planMeds = parsePlanForMedications(clinicalData.plan || []);
      const combinedMedsRaw = [
        ...planMeds,
        ...(clinicalData.medications || []),
        ...dashboardMedications.map((m: any) => ({
          name: m.MedicationName || m.name || '',
          frequency: m.Frequency || m.frequency || '',
          dosage: m.Dosage || m.dosage || m.dose || '',
          duration: m.Duration || m.duration || m.numberOfDays || '',
          prescriptionId: m.PrescriptionID || m.rowID || ''
        }))
      ];

      const medKeySeen = new Set<string>();
      const combinedMeds = combinedMedsRaw.filter(m => {
        if (!m.name) return false;
        const k = getMedicationSyncKey(m);
        if (medKeySeen.has(k)) return false;
        medKeySeen.add(k);
        return true;
      });

      const newMedsToSync = combinedMeds.filter(m => {
        if (!m.name) return false;
        const key = getMedicationSyncKey(m);
        return !syncedMedsRef.current.has(key);
      });

      if (newMedsToSync.length > 0) {
        setConsultForm(prev => {
          const uniqueItems = newMedsToSync.filter(m =>
            !prev.prescriptions.some(p =>
              getMedicationSyncKey({
                name: p.name,
                frequency: p.frequency,
                dosage: p.dosage,
                duration: p.duration
              }) === getMedicationSyncKey(m)
            )
          );
          if (uniqueItems.length === 0) return prev;

          return {
            ...prev,
            prescriptions: [
              ...prev.prescriptions,
              ...uniqueItems.map((m, i) => ({
                id: Date.now() + i,
                name: m.name,
                frequency: normalizeFrequency(m.frequency || ''),
                dosage: m.dosage || '',
                duration: normalizeDuration(m.duration || ''),
                instructions: m.instructions || m.notes || '',
                prescriptionId: m.prescriptionId
              }))
            ]
          };
        });

        newMedsToSync.forEach(m => {
          syncedMedsRef.current.add(getMedicationSyncKey(m));
        });
      }

      // 2. Sync Labs from clinicalData (AI recommended/extracted) and dashboardLabOrders
      const planLabs = parsePlanForLabs(clinicalData.plan || []);

      const structuredLabs = getExtractedLabs(clinicalData);

      const combinedLabsRaw = [
        ...planLabs,
        ...(clinicalData.recommendedLabs || []).map(l => ({ testName: l, notes: '' })),
        ...structuredLabs,
        ...dashboardLabOrders.map((l: any) => ({
          testName: l.testName || l.name || l.serviceName || l.test || '',
          notes: l.notes || l.description || '',
          labId: l.rowID || l.id || ''
        }))
      ].filter(l => l.testName && l.testName.trim() !== '');

      const labKeySeen = new Set<string>();
      const combinedLabs = combinedLabsRaw.filter(l => {
        const k = getLabTestDedupeKey(l);
        if (labKeySeen.has(k)) return false;
        labKeySeen.add(k);
        return true;
      });

      const newLabsToSync = combinedLabs.filter(l => {
        const key = getLabTestDedupeKey(l);
        return !syncedLabsRef.current.has(key);
      });

      if (newLabsToSync.length > 0) {
        setConsultForm(prev => {
          const uniqueLabs = newLabsToSync.filter(l =>
            !prev.labOrders.some(p => getLabTestDedupeKey(p) === getLabTestDedupeKey(l))
          );
          if (uniqueLabs.length === 0) return prev;

          return {
            ...prev,
            labOrders: [
              ...prev.labOrders,
              ...uniqueLabs.map((l, i) => ({
                id: Date.now() + i + 1000,
                testName: l.testName,
                notes: l.notes,
                labId: l.labId
              }))
            ]
          };
        });

        newLabsToSync.forEach(l => {
          syncedLabsRef.current.add(getLabTestDedupeKey(l));
        });
      }
    }
  }, [clinicalData.currentMedication, clinicalData.medications, clinicalData.plan, clinicalData.labOrders, clinicalData.recommendedLabs, dashboardMedications, dashboardLabOrders, isConsultationView]);

  // Listen for manual additions from modals
  useEffect(() => {
    const handleMedAdded = (e: CustomEvent) => {
      if (!isConsultationView) return;

      const med = e.detail;
      // Format to match the "name, frequency, dosage, duration" pattern
      const formattedText = [
        med.name,
        med.frequency,
        med.dosage,
        med.numberOfDays || med.duration
      ].filter(p => p && p.trim() !== '').join(', ');

      setConsultForm(prev => {
        // Prevent duplicate if already exists (basic check by name)
        const exists = prev.prescriptions.some(p => p.name.toLowerCase() === med.name.toLowerCase());
        if (exists) return prev;

        return {
          ...prev,
          prescriptions: [...prev.prescriptions, {
            id: Date.now(),
            name: med.name,
            frequency: med.frequency,
            dosage: med.dosage,
            duration: med.duration || med.numberOfDays
          }]
        };
      });
    };

    const handleLabAdded = (e: CustomEvent) => {
      if (!isConsultationView) return;

      const lab = e.detail;
      setConsultForm(prev => {
        // Prevent duplicate if already exists (basic check by name)
        const exists = prev.labOrders.some(existing => getLabTestDedupeKey(existing) === getLabTestDedupeKey(lab));
        if (exists) return prev;

        return {
          ...prev,
          labOrders: [...prev.labOrders, {
            id: Date.now(),
            testName: lab.testName,
            notes: lab.notes
          }]
        };
      });
    };

    const handleVisitInfoRequested = (e: CustomEvent) => {
      if (!isConsultationView) return;
      const data = e.detail;

      setConsultForm(prev => ({
        ...prev,
        chiefComplaint: data.chiefComplaint !== undefined ? data.chiefComplaint : prev.chiefComplaint,
        purposeOfVisit: data.purposeOfVisit !== undefined ? data.purposeOfVisit : prev.purposeOfVisit,
        urgentConcerns: data.urgentConcerns !== undefined ? data.urgentConcerns : prev.urgentConcerns,
        symptoms: data.symptoms !== undefined ? data.symptoms : prev.symptoms,
        medicalHistory: data.medicalHistory !== undefined ? data.medicalHistory : prev.medicalHistory,
        allergy: data.allergy !== undefined ? data.allergy : prev.allergy,
        comorbidity: data.comorbidity !== undefined ? data.comorbidity : prev.comorbidity,
        familySocialHistory: data.familySocialHistory !== undefined ? data.familySocialHistory : prev.familySocialHistory,
        currentMedication: data.currentMedication !== undefined ? data.currentMedication : prev.currentMedication,
        customCategories: {
          ...prev.customCategories,
          ...(data.customFields || {})
        }
      }));
    };

    document.addEventListener('medication-added', handleMedAdded as EventListener);
    document.addEventListener('lab-added', handleLabAdded as EventListener);
    document.addEventListener('ai-visit-information-requested', handleVisitInfoRequested as EventListener);

    return () => {
      document.removeEventListener('medication-added', handleMedAdded as EventListener);
      document.removeEventListener('lab-added', handleLabAdded as EventListener);
      document.removeEventListener('ai-visit-information-requested', handleVisitInfoRequested as EventListener);
    };
  }, [isConsultationView]);

  // Reset states when data is cleared
  useEffect(() => {
    if (!hasRecordedData) {
      setIsSaved(false);
      setIsViewOnly(false);
      setIsPopupHidden(false);
      setIsConsultationView(false);
      syncedMedsRef.current.clear();
      syncedLabsRef.current.clear();
    }
  }, [hasRecordedData]);

  // Update state based on isExtracting or isListening
  useEffect(() => {
    // Show loader if we are extracting or if we are listening in expanded mode
    if (isExtracting || (isListening && !isMinimized)) {
      setIsFetchingSummary(true);
      setIsConsultationView(false);
    }
  }, [isExtracting, isListening, isMinimized]);

  useEffect(() => {
    if (isExtracting && isFetchingSummary) {
      setAnalysisProgress(20);
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 75) {
            clearInterval(interval);
            return 75;
          }
          return prev + Math.floor(Math.random() * 3) + 1;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isExtracting, isFetchingSummary]);

  useEffect(() => {
    if (hasReceivedFinalResponse && isFetchingSummary) {
      setAnalysisProgress(100);
    }
  }, [hasReceivedFinalResponse, isFetchingSummary]);

  // Transition from isExtracting false -> true means we just finished. Initialize form.
  const prevIsExtracting = useRef(false);
  useEffect(() => {
    if (prevIsExtracting.current === true && isExtracting === false && !isListening) {
      if (analysisProgress < 100) setAnalysisProgress(100);
      syncedMedsRef.current.clear();
      syncedLabsRef.current.clear();

      setConsultForm({
        chiefComplaint: clinicalData.chiefComplaint || '',
        purposeOfVisit: clinicalData.purposeOfVisit || '',
        urgentConcerns: clinicalData.urgentConcerns || (clinicalData.redFlags.length > 0 ? clinicalData.redFlags.join(', ') : ''),
        symptoms: clinicalData.symptoms || [
          clinicalData.hpiDetails.onset,
          clinicalData.hpiDetails.location,
          clinicalData.hpiDetails.character,
          ...clinicalData.hpiDetails.associatedSymptoms
        ].filter(Boolean).join(', '),
        medicalHistory: (typeof clinicalData.medicalHistory === 'object' ? (clinicalData.medicalHistory as any).value : clinicalData.medicalHistory) || (clinicalData.pastMedicalHistory.length > 0 ? clinicalData.pastMedicalHistory.join(', ') : ''),
        allergy: clinicalData.allergy || (clinicalData.allergies.length > 0 ? clinicalData.allergies.map(a => `${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}`).join(', ') : ''),
        comorbidity: clinicalData.comorbidity || '',
        familySocialHistory: clinicalData.familySocialHistory || (clinicalData.familyHistory.length > 0 ? `Family: ${clinicalData.familyHistory.join(', ')}` : ''),
        currentMedication: clinicalData.currentMedication || '',
        diagnosisAndFindings: clinicalData.assessment || '',
        prescriptions: [
          ...parsePlanForMedications(clinicalData.plan || []).map((m, i) => {
            syncedMedsRef.current.add(getMedicationSyncKey(m));
            return {
              id: Date.now() + dashboardMedications.length + (clinicalData.medications?.length || 0) + i + 5000,
              name: m.name,
              frequency: m.frequency || '',
              dosage: m.dosage || '',
              duration: m.duration || '',
              route: '',
              foodTiming: '',
              instructions: m.instructions || m.notes || ''
            };
          }),
          ...(clinicalData.medications || []).map((m, i) => {
            syncedMedsRef.current.add(getMedicationSyncKey(m));
            return {
              id: Date.now() + dashboardMedications.length + i,
              name: m.name,
              frequency: normalizeFrequency(m.frequency || ''),
              dosage: m.dosage || '',
              duration: normalizeDuration(m.duration || ''),
              route: '',
              foodTiming: '',
              instructions: m.instructions || m.notes || ''
            };
          }),
          ...dashboardMedications.map((m: any, i: number) => {
            const row = {
              name: m.MedicationName || m.name || '',
              frequency: m.Frequency || m.frequency || '',
              dosage: m.Dosage || m.dosage || m.dose || '',
              duration: m.Duration || m.duration || m.numberOfDays || ''
            };
            syncedMedsRef.current.add(getMedicationSyncKey(row));
            return {
              id: Date.now() + i,
              name: row.name,
              frequency: row.frequency || '',
              dosage: row.dosage || '',
              duration: row.duration || '',
              route: m.route || '',
              foodTiming: m.foodTiming || '',
              instructions: m.instructions || ''
            };
          })
        ].filter((m, index, self) => index === self.findIndex((t) =>
          getMedicationSyncKey({
            name: t.name,
            frequency: t.frequency,
            dosage: t.dosage,
            duration: t.duration
          }) === getMedicationSyncKey({
            name: m.name,
            frequency: m.frequency,
            dosage: m.dosage,
            duration: m.duration
          })
        )),
        labOrders: [
          ...parsePlanForLabs(clinicalData.plan || []).map((l, i) => {
            syncedLabsRef.current.add(getLabTestDedupeKey(l));
            return { id: Date.now() + i + 5000, testName: l.testName, notes: l.notes };
          }),
          ...dashboardLabOrders.map((l: any, i: number) => {
            const testName = l.testName || l.name || l.serviceName || l.test || '';
            const notes = l.notes || l.description || '';
            const row = { testName, notes };
            syncedLabsRef.current.add(getLabTestDedupeKey(row));
            return { id: Date.now() + i + 1000, testName, notes };
          }),
          ...getExtractedLabs(clinicalData).map((l, i) => {
            syncedLabsRef.current.add(getLabTestDedupeKey(l));
            return {
              id: Date.now() + dashboardLabOrders.length + i + 2000,
              testName: l.testName,
              notes: l.notes
            };
          })
        ].filter((l, index, self) => index === self.findIndex((t) => getLabTestDedupeKey(t) === getLabTestDedupeKey(l))),
        customCategories: { ...clinicalData.customFields },
      });

      // Transition to Summary View after a brief delay at 100%
      setTimeout(() => {
        setIsFetchingSummary(false);
        setIsConsultationView(true);
        setIsMaximized(true);
        setAnalysisProgress(0); // Reset for next time
      }, 1000);
    }
    prevIsExtracting.current = isExtracting;
  }, [isExtracting, isListening, clinicalData, hasReceivedFinalResponse, assistantSettings.categories, analysisProgress, dashboardMedications, dashboardLabOrders]);

  // Transition to maximized summary view when extraction starts
  useEffect(() => {
    if (isExtracting && isMinimized && isFetchingSummary) {
      setIsMinimized(false);
      setIsMaximized(true);
    }
  }, [isExtracting, isMinimized, isFetchingSummary]);

  useEffect(() => {
    if (isListening) {
      setIsViewOnly(false);
      setIsSaved(false);
      setIsPopupHidden(false);
      // isMinimized / isMaximized are owned by the Start Scribing / Stop buttons.
      // Do NOT override them here so the pill stays visible after scribing starts.
      setIsInitializing(false);
    }
  }, [isListening]);

  const copyToClipboard = () => {
    const text = formatClinicalDataAsText(clinicalData);
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Clinical data has been copied.",
    });
  };

  const handleSectionAction = (field: string, content: string, action: 'add' | 'edit') => {
    if (action === 'edit') {
      setEditingField(field);
      setEditValue(content);
      return;
    }

    // Dispatch custom event for specific field update
    document.dispatchEvent(new CustomEvent('ai-clinical-field-added', {
      detail: {
        field,
        content,
        callId: `doctor-assistant-field-${Date.now()}`
      }
    }));
  };

  const handleBatchSave = () => {
    // Filter out "No known allergies" and empty medications before saving
    const filteredClinicalData = {
      ...clinicalData,
      allergies: clinicalData.allergies.filter(a =>
        a.allergen.toLowerCase().trim() !== 'no known allergies'
      ),
      medications: clinicalData.medications.filter(m =>
        m.name.trim() !== ''
      )
    };

    // Dispatch custom event for batch save with the EDITED consultation form
    // Build custom categories array with labels for API
    const customCategoriesPayload = assistantSettings.categories
      .filter(c => c.field.startsWith('custom_') && consultForm.customCategories[c.field])
      .map(c => ({
        name: c.name,
        field: c.field,
        value: consultForm.customCategories[c.field] || ''
      }));

    document.dispatchEvent(new CustomEvent('ai-batch-save-requested', {
      detail: {
        clinicalData: filteredClinicalData,
        consultForm: consultForm, // Pass the edited form too
        customCategoriesPayload, // Custom categories with labels for API
        callId: `doctor-assistant-batch-${Date.now()}`
      }
    }));

    toast({
      title: "Saving to Record",
      description: "Syncing clinical findings and ambient history to the patient record...",
    });

    setIsSaved(true);
    setIsMinimized(true);
    setIsPopupHidden(true);
    setIsConsultationView(false);
    setIsViewingSavedHistory(false);
    setHistoryMeta(null);
    setIsMaximized(false);
  };

  const handleSaveClick = () => {
    if (isVisitInfoNotEmpty(visitInfo)) {
      setShowSaveConfirmation(true);
    } else {
      handleBatchSave();
    }
  };

  const handleQuickNote = (action: typeof quickNoteActions[0]) => {
    const noteContent = action.generator(clinicalData);

    // Dispatch the existing ai-note-requested event
    document.dispatchEvent(new CustomEvent('ai-note-requested', {
      detail: {
        note: noteContent,
        findingType: action.findingType,
        callId: `doctor-assistant-${Date.now()}`
      }
    }));
  };

  const handleSaveEdit = () => {
    if (!editingField) return;

    onUpdateClinicalData(prev => {
      const updated = { ...prev };
      if (editingField === 'chiefComplaint') updated.chiefComplaint = editValue;
      else if (editingField === 'assessment') updated.assessment = editValue;
      else if (editingField.startsWith('hpi.')) {
        const key = editingField.split('.')[1] as keyof typeof updated.hpiDetails;
        if (key === 'associatedSymptoms') {
          updated.hpiDetails = { ...updated.hpiDetails, associatedSymptoms: editValue.split(',').map(s => s.trim()).filter(Boolean) };
        } else {
          (updated.hpiDetails as any)[key] = editValue;
        }
      }
      else if (editingField.startsWith('social.')) {
        const key = editingField.split('.')[1] as keyof typeof updated.socialHistory;
        (updated.socialHistory as any)[key] = editValue;
      }
      else if (editingField === 'redFlags') updated.redFlags = editValue.split(',').map(s => s.trim()).filter(Boolean);
      else if (editingField === 'medicalHistory') updated.pastMedicalHistory = editValue.split(',').map(s => s.trim()).filter(Boolean);
      else if (editingField === 'plan') updated.plan = editValue.split(',').map(s => s.trim()).filter(Boolean);
      else if (editingField === 'physicalExam') updated.physicalExam = editValue.split(',').map(s => s.trim()).filter(Boolean);
      else if (editingField === 'medications') {
        updated.medications = editValue.split(',').map(item => {
          const [name, ...doseParts] = item.trim().split(' ');
          return { name, dose: doseParts.join(' ') || undefined };
        }).filter(m => m.name);
      }
      else if (editingField === 'medicationHistory') {
        updated.medicationHistory = editValue.split(',').map(s => s.trim()).filter(Boolean);
      }
      else if (editingField === 'recommendedMedications') {
        updated.recommendedMedications = editValue.split(',').map(item => {
          const parts = item.trim().split(' ');
          const name = parts[0];
          const dose = parts.slice(1).join(' ');
          return { name, dose: dose || undefined };
        }).filter(m => m.name);
      }
      else if (editingField === 'labHistory') {
        updated.labHistory = editValue.split(',').map(s => s.trim()).filter(Boolean);
      }
      else if (editingField === 'recommendedLabs') {
        updated.recommendedLabs = editValue.split(',').map(s => s.trim()).filter(Boolean);
      }
      else if (editingField === 'comorbidity') updated.comorbidity = editValue;
      else if (editingField === 'symptoms') updated.symptoms = editValue;
      else if (editingField === 'purpose') updated.purposeOfVisit = editValue;
      else if (editingField === 'urgent') updated.urgentConcerns = editValue;
      else if (editingField === 'familySocialHistory') updated.familySocialHistory = editValue;
      return updated;
    });

    setEditingField(null);
    toast({
      title: "Field Updated",
      description: "The clinical field has been updated manually.",
    });
  };


  const showQuickActions = hasRecordedData && !isListening && hasContent(clinicalData);
  const isWidgetActive = isListening || hasRecordedData || isConnecting || isInitializing;

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;

    const { type, idx, dbId } = deleteConfirmation;
    console.log("delete Confirmation", deleteConfirmation);

    if (dbId) {
      try {
        if (type === 'medicine') {
          await apiService.postForm('Delete', {
            PrescriptionID: dbId,
            ConsultationID: admissionId || ''
          });
          toast({ title: "Medication Deleted", description: "Successfully removed from the patient record." });
        } else {
          const lab = consultForm.labOrders[idx];
          await apiService.addLabResult({
            consultationId: admissionId || '',
            testName: lab.testName,
            notes: lab.notes || '',
            action: 'delete',
            rowID: dbId
          });
          toast({ title: "Lab Order Deleted", description: "Successfully removed from the patient record." });
        }
      } catch (error) {
        console.error(`Failed to delete ${type} via API:`, error);
        toast({ title: "Delete Failed", description: "Could not remove item from server.", variant: "destructive" });
      }
    }

    if (type === 'medicine') {
      setConsultForm(f => ({ ...f, prescriptions: f.prescriptions.filter((_, i) => i !== idx) }));
    } else {
      setConsultForm(f => ({ ...f, labOrders: f.labOrders.filter((_, i) => i !== idx) }));
    }

    setDeleteConfirmation(null);
  };

  const handleImportPreviousPrescriptions = (meds: any[]) => {
    const formattedMeds = meds.map((m, i) => ({
      id: Date.now() + i,
      name: m.MedicationName || m.name || '',
      frequency: m.Frequency || m.frequency || '',
      dosage: m.Dosage || m.dosage || m.dose || '',
      duration: m.Duration || m.duration || m.numberOfDays || '',
      prescriptionId: m.PrescriptionID || m.rowID || ''
    }));

    setConsultForm(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, ...formattedMeds]
    }));

    setIsPreviousPrescriptionsOpen(false);
    toast({
      title: "Medications Imported",
      description: `Successfully added ${meds.length} medications from history.`
    });
  };

  return (
    <>
      <Card className="border-0 shadow-none">
        {/* Main Entry Card - Simplified when active */}
        <div className="rounded-[20px] m-2 p-5 flex flex-col items-center relative overflow-hidden transition-all duration-300"
          style={{ background: 'linear-gradient(5deg, rgba(235, 211, 255, 0.36) 33%, rgba(170, 153, 229, 0.36) 81%)' }}>

          {/* Settings button — top-right corner */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-[#64549f]/50 hover:text-[#64549f] hover:bg-[#64549f]/10 transition-all duration-200 active:scale-90"
            title="Scribe Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>

          <div className="mb-2">
            <img src={doctorsOfficeGif} alt="" className="w-20 h-20" style={{ mixBlendMode: 'multiply' }} />
          </div>

          <h3 className="text-[21px] font-semibold text-[#64549f] font-['Inter'] mb-0.5">Ambient Mode</h3>
          <p className="text-[14px] text-[#64549f]/70 font-['Inter'] mb-4 text-center px-4">
            {isWidgetActive ? "Ambient Mode is active" : "Real-time conversation capture & note drafting"}
          </p>

          <div className="flex flex-col items-center w-full px-2">
            {!isListening ? (
              <button
                onClick={() => {
                  setIsViewingSavedHistory(false);
                  setHistoryMeta(null);
                  setIsMinimized(true);
                  setIsMaximized(false);
                  setIsPopupHidden(false);
                  setIsInitializing(false);
                  onStartListening();
                }}
                className="group relative flex items-center justify-center gap-2 h-11 px-8 bg-gradient-to-r from-[#64549f] via-[#9181db] to-[#64549f] bg-[length:200%_auto] hover:bg-[100%_0] text-white rounded-full shadow-[0_4px_15px_rgba(100,84,159,0.3)] hover:shadow-[0_6px_20px_rgba(145,129,219,0.6),inset_0_0_10px_rgba(255,255,255,0.2)] transition-all duration-500 hover:-translate-y-[1px] active:translate-y-0 active:scale-95 overflow-hidden border border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1.2s] ease-in-out skew-x-[-20deg]" />
                <Sparkles className="w-4 h-4 text-white/90 group-hover:text-white group-hover:rotate-12 group-hover:scale-110 transition-all duration-300  group-hover:animate-none" />
                <span className="relative z-10 text-[13px] font-semibold font-['Inter']  tracking-[0.1em] group-hover:tracking-[0.15em] whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-300">Start Scribing </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[#64549f] bg-white/40 px-4 py-1.5 rounded-full border border-[#64549f]/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
              </div>
            )}
          </div>

          {/* Listening History — past ambient sessions */}
          <button
            onClick={handleReviewFindings}
            disabled={isLoadingHistory}
            className="w-full mt-4 pt-3 border-t border-[#64549f]/12 flex items-center gap-3 px-1 py-2 rounded-xl hover:bg-white/40 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group"
            title="View ambient listening history"
          >
            <div className="w-10 h-10 rounded-xl bg-white/70 border border-[#64549f]/10 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:border-[#64549f]/20 transition-colors shadow-sm">
              {isLoadingHistory ? (
                <Loader2 className="w-4 h-4 text-[#64549f] animate-spin" />
              ) : (
                <HistoryIcon className="w-4 h-4 text-[#64549f]" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="block text-[13px] font-semibold text-[#64549f] leading-tight">
                {isLoadingHistory ? 'Loading history...' : 'Listening History'}
              </span>
              <span className="block text-[11px] text-[#64549f]/55 font-medium mt-0.5 truncate">
                View saved ambient sessions
              </span>
            </div>
            {!isLoadingHistory && (
              <ChevronRight className="w-4 h-4 text-[#64549f]/40 shrink-0 group-hover:text-[#64549f] group-hover:translate-x-0.5 transition-all" />
            )}
          </button>

          {/* Extraction Loader & Retry Button - Hold on Ambient Mode */}
          {isExtracting && !isStreamStarted && (
            <div className="mt-4 flex flex-col items-center gap-3 w-full bg-[#64549f]/5 rounded-2xl p-4 border border-[#64549f]/10 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-2 text-[#64549f] text-[12px] font-semibold uppercase tracking-wider">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Waiting for Server...</span>
              </div>
              <p className="text-[11px] text-[#64549f]/60 text-center font-medium italic">
                Extraction is pending. If it takes too long, please retry.
              </p>
              <button
                onClick={onRetryExtraction}
                className="w-full h-8 flex items-center justify-center gap-2 bg-[#64549f] text-white rounded-full text-[11px] font-bold shadow-md hover:bg-[#5a4a8f] transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Extraction
              </button>
            </div>
          )}
        </div>
      </Card>


      {/* Floating Popup - Dynamic Island / Dashboard */}
      {(isWidgetActive || isConsultationView) && !isPopupHidden && (
        <div
          className={`fixed z-[100] ${isMinimized
            ? ' top-10 left-1/2 -translate-x-1/2 w-auto'
            : isMaximized
              ? 'top-[1vh] left-[1vw] right-[1vw] bottom-[1vh] w-auto h-auto shadow-[0_0_50px_rgba(0,0,0,0.3)]'
              : 'bottom-6 right-6 w-96 h-[600px] max-h-[85vh]'
            }`}
        >
          <div className={`${isMinimized
            ? `bg-[#1a1b2e] border border-white/10 rounded-full py-1.5 px-2 pr-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${isListening && !isPaused ? 'animate-glow-border' : ''}`
            : 'bg-white/95 backdrop-blur-md border border-[#64549f]/20 rounded-[24px] shadow-2xl overflow-hidden'
            } flex flex-col h-full relative`}>

            {/* Minimized Dynamic Island Content */}
            <div className={`transition-opacity duration-300 ${isMinimized ? 'opacity-100 flex-1' : 'opacity-0 h-0 pointer-events-none'}`}>
              {isMinimized && (
                <div className="flex items-center gap-4 min-w-[320px] justify-between h-[44px]">
                  <div className="flex items-center gap-3 pl-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isListening && !isPaused ? 'bg-orange-500 animate-[badge-pulse_2s_ease-in-out_infinite]' : isPaused ? 'bg-yellow-500/80' : 'bg-[#64549f]'}`}>
                      {isPaused
                        ? <Pause className="w-5 h-5 text-white" />
                        : <Mic className={`w-5 h-5 text-white ${isListening ? '' : 'opacity-70'}`} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-white tracking-wide uppercase">
                        {isPaused ? 'Paused' : isListening ? 'Listening...' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Waveform / paused indicator */}
                    {isListening && !isPaused ? (
                      <div className="flex items-center gap-[3px] h-4">
                        {[0.5, 0.8, 1, 0.6, 0.9, 0.4, 0.7, 1, 0.5, 0.8].map((val, i) => (
                          <div
                            key={i}
                            className="w-[2px] bg-white/40 rounded-full animate-[waveform-bounce_1.2s_ease-in-out_infinite]"
                            style={{ animationDelay: `${i * 0.1}s`, height: `${val * 100}%` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-green-500 animate-pulse'}`} />
                        <span className="text-white/50 text-[10px] font-medium uppercase tracking-tighter">{isPaused ? 'Paused' : 'Active'}</span>
                      </div>
                    )}
                  </div>

                  {/* Pause/Resume + Stop only — no expand */}
                  <div className="flex items-center gap-2 pr-1">
                    {isListening && (
                      <button
                        onClick={onTogglePause}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all active:scale-90 ${isPaused ? 'bg-yellow-500/90 hover:bg-yellow-500' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        title={isPaused ? 'Resume' : 'Pause'}
                      >
                        {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                      </button>
                    )}
                    {isListening && (
                      <button
                        onClick={() => {
                          onStopListening();
                          // Maximize immediately to show the preparation loader
                          setIsMinimized(false);
                          setIsMaximized(true);
                          setIsFetchingSummary(true);
                        }}
                        className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-all active:scale-90"
                        title="Stop & Review"
                      >
                        <Square className="w-3 h-3 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Popup Content */}
            <div className={`flex flex-col h-full transition-opacity duration-300 ${!isMinimized && (isMaximized || isConsultationView || isFetchingSummary) ? 'opacity-100 flex-1 overflow-hidden' : 'opacity-0 h-0 pointer-events-none'}`}>
              {!isMinimized && (isFetchingSummary || (isConsultationView && (hasReceivedFinalResponse || isViewingSavedHistory))) ? (
                /* ── Consultation Summary View / Loader ── */
                <div className="flex flex-col h-full bg-[#f0f2f9]">
                  {isFetchingSummary ? (
                    /* Full-screen Progress Loader */
                    <div className="flex flex-col items-center justify-center h-full bg-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#64549f]/5 via-transparent to-blue-500/5 pointer-events-none" />

                      <div className="text-center space-y-3 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="w-16 h-16 bg-[#64549f]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                          <Sparkles className="w-8 h-8 text-[#64549f]" />
                        </div>
                        <h4 className="text-[24px] font-bold text-[#1a2256] tracking-tight">AI Clinical Assistant</h4>
                        <p className="text-[15px] text-[#64549f] font-medium opacity-80 uppercase tracking-widest flex items-center justify-center gap-3">
                          {isListening ? 'Ambient Listening Active' : 'Preparing Consultation Summary'}
                        </p>
                      </div>

                      <div className="mt-12 w-[400px] h-[4px] bg-[#64549f]/10 rounded-full overflow-hidden relative z-10">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1a2256] via-[#64549f] to-[#1a2256] transition-all duration-700 ease-out shadow-[0_0_12px_rgba(100,84,159,0.4)]"
                          style={{ width: `${analysisProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-[length:1.25rem_1.25rem] animate-[progress-bg_1s_linear_infinite] opacity-20" />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col items-center gap-4 w-full max-w-lg px-8">
                        <div className="flex items-center gap-3 text-[13px] text-[#6e6868] font-medium opacity-60 animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isListening ? 'Capturing audio and extracting markers...' : 'Analyzing captured clinical markers...'}
                        </div>


                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                      {/* Redesigned Summary Header */}
                      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-[#e2e4f0] shrink-0">
                        <h3 className="text-[18px] font-bold text-[#1a2256]">
                          Review & Edit Documentation
                        </h3>

                        <div className="flex items-center gap-4">
                          {isViewingSavedHistory && historyMeta && (
                            <div className="flex flex-col items-end text-right">
                              {historyMeta.doctorName && (
                                <span className="flex items-center gap-1.5 text-[13px] text-[#64549f] font-semibold">
                                  <User className="w-3.5 h-3.5" />
                                  {historyMeta.doctorName.match(/^dr\.?\s/i) ? historyMeta.doctorName : `Dr. ${historyMeta.doctorName}`}
                                </span>
                              )}
                              {historyMeta.formattedDateTime && (
                                <span className="text-[11px] text-[#6e6868] font-medium mt-0.5">
                                  {historyMeta.formattedDateTime}
                                </span>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setIsConsultationView(false);
                              setIsViewingSavedHistory(false);
                              setHistoryMeta(null);
                              setIsMinimized(false);
                              setIsMaximized(false);
                              setIsFetchingSummary(false);
                              setIsPopupHidden(true);
                            }}
                            className="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all active:scale-90 shrink-0"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* Redesigned Two-column body */}
                      <div className="flex flex-1 overflow-hidden bg-[#f8f9fd]">
                        <div className="flex-1 overflow-y-auto p-8 ">
                          <div className="grid grid-cols-12 gap-6 max-w-[1400px] mx-auto">
                            {/* Left Column - Card stack driven by enabled Data Capture categories */}
                            <div className="col-span-4 space-y-6">
                              {assistantSettings.categories
                                .filter(c => c.enabled && !(isInpatient && c.field === 'purposeOfVisit'))
                                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                .map((cat) => {
                                  // ── Standard fields mapped to consultForm ──
                                  if (cat.field === 'chiefComplaint') {
                                    return (
                                      <SummaryCard key={cat.id} title={cat.name}>
                                        <textarea
                                          className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[100px]"
                                          placeholder="Enter chief complaints..."
                                          value={consultForm.chiefComplaint}
                                          onChange={e => setConsultForm(f => ({ ...f, chiefComplaint: e.target.value }))}
                                        />
                                      </SummaryCard>
                                    );
                                  }
                                  if (cat.field === 'symptoms') {
                                    return (
                                      <SummaryCard key={cat.id} title={cat.name}>
                                        <textarea
                                          className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[100px]"
                                          placeholder="Enter symptoms..."
                                          value={consultForm.symptoms}
                                          onChange={e => setConsultForm(f => ({ ...f, symptoms: e.target.value }))}
                                        />
                                      </SummaryCard>
                                    );
                                  }
                                  if (cat.field === 'medication') {
                                    return (
                                      <SummaryCard key={cat.id} title={cat.name}>
                                        <textarea
                                          className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[100px]"
                                          placeholder="Enter current medications..."
                                          value={consultForm.currentMedication}
                                          onChange={e => setConsultForm(f => ({ ...f, currentMedication: e.target.value }))}
                                        />
                                      </SummaryCard>
                                    );
                                  }
                                  if (cat.field === 'medicalHistory') {
                                    return (
                                      <SummaryCard key={cat.id} title={cat.name}>
                                        <textarea
                                          className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[80px]"
                                          placeholder="Enter medical history..."
                                          value={consultForm.medicalHistory}
                                          onChange={e => setConsultForm(f => ({ ...f, medicalHistory: e.target.value }))}
                                        />
                                      </SummaryCard>
                                    );
                                  }
                                  if (cat.field === 'allergy') {
                                    return (
                                      <SummaryCard key={cat.id} title={cat.name}>
                                        <textarea
                                          className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[80px]"
                                          placeholder="Enter allergies..."
                                          value={consultForm.allergy}
                                          onChange={e => setConsultForm(f => ({ ...f, allergy: e.target.value }))}
                                        />
                                      </SummaryCard>
                                    );
                                  }
                                  if (cat.field === 'purposeOfVisit') {
                                    return (
                                      <SummaryCard key={cat.id} title={cat.name}>
                                        <textarea
                                          className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[80px]"
                                          placeholder="Enter purpose of visit..."
                                          value={consultForm.purposeOfVisit}
                                          onChange={e => setConsultForm(f => ({ ...f, purposeOfVisit: e.target.value }))}
                                        />
                                      </SummaryCard>
                                    );
                                  }
                                  if (cat.field === 'urgentConcerns') {
                                    return (
                                      <SummaryCard key={cat.id} title={cat.name}>
                                        <textarea
                                          className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[80px]"
                                          placeholder="Enter urgent concerns..."
                                          value={consultForm.urgentConcerns}
                                          onChange={e => setConsultForm(f => ({ ...f, urgentConcerns: e.target.value }))}
                                        />
                                      </SummaryCard>
                                    );
                                  }
                                  if (cat.field === 'comorbidity') {
                                    return (
                                      <SummaryCard key={cat.id} title={cat.name}>
                                        <textarea
                                          className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[80px]"
                                          placeholder="Enter comorbidities..."
                                          value={consultForm.comorbidity}
                                          onChange={e => setConsultForm(f => ({ ...f, comorbidity: e.target.value }))}
                                        />
                                      </SummaryCard>
                                    );
                                  }
                                  if (cat.field === 'familySocialHistory') {
                                    return (
                                      <SummaryCard key={cat.id} title={cat.name}>
                                        <textarea
                                          className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[80px]"
                                          placeholder="Enter family/social history..."
                                          value={consultForm.familySocialHistory}
                                          onChange={e => setConsultForm(f => ({ ...f, familySocialHistory: e.target.value }))}
                                        />
                                      </SummaryCard>
                                    );
                                  }
                                  // ── Custom user-defined categories ──
                                  return (
                                    <SummaryCard key={cat.id} title={cat.name}>
                                      <textarea
                                        className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[80px]"
                                        placeholder={`Enter ${cat.name.toLowerCase()}...`}
                                        value={consultForm.customCategories[cat.field] || ''}
                                        onChange={e => setConsultForm(f => ({
                                          ...f,
                                          customCategories: { ...f.customCategories, [cat.field]: e.target.value }
                                        }))}
                                      />
                                    </SummaryCard>
                                  );
                                })}
                            </div>

                            {/* Right Column */}
                            <div className="col-span-8 space-y-6">
                              {/* Clinical Findings */}
                              <SummaryCard title="Clinical Findings">
                                <textarea
                                  className="w-full bg-transparent border-0 p-0 text-[13px] text-[#1a2256] leading-relaxed focus:ring-0 outline-none resize-none min-h-[120px]"
                                  placeholder="Patient presents with acute febrile illness..."
                                  value={consultForm.diagnosisAndFindings}
                                  onChange={e => setConsultForm(f => ({ ...f, diagnosisAndFindings: e.target.value }))}
                                />
                              </SummaryCard>

                              {/* Prescription - Redesigned Table */}
                              <div className="bg-white rounded-2xl border border-[#e2e4f0] shadow-sm overflow-hidden">
                                <div className="px-6 py-5 flex items-center justify-between border-b border-[#f0f2f9]">
                                  <h4 className="text-[14px] font-bold text-[#1a2256] flex items-center gap-2">
                                    Prescription
                                  </h4>
                                  <button
                                    onClick={() => setIsPreviousPrescriptionsOpen(true)}
                                    className="text-[12px] text-[#64549f] font-semibold hover:underline flex items-center gap-1"
                                  >
                                    Select from Previous
                                  </button>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="bg-[#f8f9fd]">
                                        <th className="px-8 py-4 w-12 text-center">#</th>
                                        <th className="px-4 py-4 text-[11px] font-bold text-[#64549f] uppercase">Medicine Name</th>
                                        <th className="px-4 py-4 text-[11px] font-bold text-[#64549f] uppercase">Frequency</th>
                                        <th className="px-4 py-4 text-[11px] font-bold text-[#64549f] uppercase">Until</th>
                                        <th className="px-4 py-4 text-[11px] font-bold text-[#64549f] uppercase">Notes</th>
                                        <th className="px-8 py-4 w-12"></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0f2f9]">
                                      {consultForm.prescriptions.map((rx, idx) => (
                                        <tr key={rx.id} className="group hover:bg-[#f8f9fd]/50 transition-colors border-b border-[#f0f2f9] last:border-0">
                                          <td className="px-8 py-5 text-center">
                                            <div className="w-8 h-8 rounded-lg bg-[#64549f] text-white text-[12px] font-bold flex items-center justify-center">
                                              {idx + 1}
                                            </div>
                                          </td>
                                          <td className="px-4 py-5 relative">
                                            <Popover open={activeSuggestionType === 'medicine' && activeSuggestionIdx === idx} modal={false}>
                                              <PopoverTrigger asChild>
                                                <div className="flex flex-col">
                                                  <div className="rounded-lg border border-transparent transition-all px-2 py-1 -ml-2">
                                                    <input
                                                      className="w-full bg-transparent border-0 p-0 text-[13px] font-bold text-[#1a2256] focus:ring-0 outline-none placeholder:font-normal placeholder:text-gray-300"
                                                      placeholder="Medicine"
                                                      value={rx.name}
                                                      onChange={e => handleMedicineSearch(idx, e.target.value)}
                                                      onFocus={() => {
                                                        if (rx.name.length >= 2) handleMedicineSearch(idx, rx.name);
                                                      }}
                                                    />
                                                  </div>
                                                  {rx.prescriptionId && (
                                                    <div className="text-[10px] text-[#1a2256]/40 font-mono ml-0.5 mt-0.5">
                                                      ID: {rx.prescriptionId}
                                                    </div>
                                                  )}
                                                </div>
                                              </PopoverTrigger>
                                              <PopoverContent
                                                className="p-0 border-[#e2e4f0] rounded-xl shadow-2xl overflow-hidden py-1 z-[1000]"
                                                style={{ width: 'var(--radix-popover-trigger-width)' }}
                                                align="start"
                                                sideOffset={4}
                                                onOpenAutoFocus={(e) => e.preventDefault()}
                                              >
                                                <div className="max-h-56 overflow-y-auto">
                                                  {loadingSuggestions || isMedicineDataLoading ? (
                                                    <div className="px-4 py-3 text-[13px] text-[#6e6868]">Loading medicines...</div>
                                                  ) : medicineSuggestions.length > 0 ? (
                                                    medicineSuggestions.map((m) => (
                                                      <button
                                                        key={m.id}
                                                        className="w-full text-left px-4 py-2 hover:bg-[#64549f] hover:text-white transition-colors group/item"
                                                        onClick={() => {
                                                          const updated = [...consultForm.prescriptions];
                                                          updated[idx] = { ...updated[idx], name: m.Name };
                                                          setConsultForm(f => ({ ...f, prescriptions: updated }));
                                                          setMedicineSuggestions([]);
                                                          setActiveSuggestionIdx(null);
                                                          setActiveSuggestionType(null);
                                                        }}
                                                      >
                                                        <div className="font-bold text-[13px]">{m.Name}</div>
                                                        <div className="text-[11px] opacity-60 group-hover/item:opacity-100">
                                                          {m.Description && `${m.Description} • `}
                                                          {m.Category && `${m.Category} • `}
                                                          {m.MedicineType}
                                                        </div>
                                                      </button>
                                                    ))
                                                  ) : (
                                                    <div className="px-4 py-3 text-[13px] text-[#6e6868]">No medicines found</div>
                                                  )}
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          </td>
                                          <td className="px-4 py-4">
                                            <CustomDropdown
                                              options={[...AMBIENT_FREQUENCY_OPTIONS]}
                                              value={rx.frequency || ''}
                                              onChange={(val) => {
                                                const updated = [...consultForm.prescriptions];
                                                updated[idx] = { ...updated[idx], frequency: val };
                                                setConsultForm(f => ({ ...f, prescriptions: updated }));
                                              }}
                                              placeholder="Frequency"
                                            />
                                          </td>
                                          <td className="px-4 py-4">
                                            <CustomDropdown
                                              options={[
                                                "Until next visit",
                                                "2 days",
                                                "1 week",
                                                "1 month"
                                              ]}
                                              value={rx.duration || ''}
                                              onChange={(val) => {
                                                const updated = [...consultForm.prescriptions];
                                                updated[idx] = { ...updated[idx], duration: val };
                                                setConsultForm(f => ({ ...f, prescriptions: updated }));
                                              }}
                                              placeholder="Duration"
                                              allowCustom={true}
                                            />
                                          </td>
                                          <td className="px-4 py-4">
                                            <input
                                              className="w-full bg-transparent border-0 p-0 text-[13px] text-[#6e6868] italic focus:ring-0 placeholder:text-gray-300"
                                              placeholder="Notes"
                                              value={rx.instructions}
                                              onChange={e => {
                                                const updated = [...consultForm.prescriptions];
                                                updated[idx] = { ...updated[idx], instructions: e.target.value };
                                                setConsultForm(f => ({ ...f, prescriptions: updated }));
                                              }}
                                            />
                                          </td>
                                          {!isViewOnly && (
                                            <td className="px-8 py-4 text-center">
                                              <button
                                                onClick={() => {
                                                  const updated = consultForm.prescriptions.filter((_, i) => i !== idx);
                                                  setConsultForm(f => ({ ...f, prescriptions: updated }));
                                                }}
                                                className="p-1 text-gray-300 hover:text-red-500 transition-colors "
                                              >
                                                <X className="w-5 h-5" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {!isViewOnly && (
                                  <button
                                    onClick={() => {
                                      setConsultForm(f => ({
                                        ...f,
                                        prescriptions: [
                                          ...f.prescriptions,
                                          { id: Date.now(), name: '', frequency: '', dosage: '', duration: '', instructions: '' }
                                        ]
                                      }));
                                    }}
                                    className="w-full py-4 bg-[#f8f9fd] border-t border-[#e2e4f0] text-[12px] font-bold text-[#64549f] hover:bg-[#64549f]/5 transition-all flex items-center justify-center gap-2 border-dashed"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add Medication
                                  </button>
                                )}
                              </div>

                              {/* Lab Orders Section - Standardized Table */}
                              <div className="bg-white rounded-2xl border border-[#e2e4f0] shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-[#e2e4f0] flex items-center justify-between bg-[#fcfdfe]">
                                  <h4 className="text-[14px] font-bold text-[#1a2256] flex items-center gap-3">
                                    Lab Orders
                                  </h4>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-[#f8f9fd] border-b border-[#e2e4f0]">
                                        <th className="px-8 py-4 text-[11px] font-bold text-[#64549f] uppercase tracking-wider w-16">#</th>
                                        <th className="px-4 py-4 text-[11px] font-bold text-[#64549f] uppercase tracking-wider min-w-[250px]">Lab Test Name</th>
                                        <th className="px-4 py-4 text-[11px] font-bold text-[#64549f] uppercase tracking-wider">Notes</th>
                                        {!isViewOnly && <th className="px-8 py-4 text-center text-[11px] font-bold text-[#64549f] uppercase tracking-wider w-20">Action</th>}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e2e4f0]">
                                      {consultForm.labOrders.map((lab, idx) => (
                                        <tr key={lab.id} className="hover:bg-[#fcfdfe] transition-colors group">
                                          <td className="px-8 py-4">
                                            <span className="text-[13px] font-bold text-[#1a2256] opacity-30">{idx + 1}</span>
                                          </td>
                                          <td className="px-4 py-4 relative">
                                            <Popover open={activeSuggestionType === 'lab' && activeSuggestionIdx === idx && labSuggestions.length > 0} modal={false}>
                                              <PopoverTrigger asChild>
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    className="w-full bg-transparent border-0 p-0 text-[13px] font-bold text-[#1a2256] focus:ring-0 outline-none placeholder:text-gray-300"
                                                    placeholder="Search for lab test..."
                                                    value={lab.testName}
                                                    onChange={e => handleLabSearch(idx, e.target.value)}
                                                    onFocus={() => {
                                                      if (lab.testName.length >= 2) handleLabSearch(idx, lab.testName);
                                                    }}
                                                  />
                                                </div>
                                              </PopoverTrigger>
                                              <PopoverContent
                                                className="p-0 border-[#e2e4f0] rounded-xl shadow-2xl overflow-hidden py-1 z-[1000]"
                                                style={{ width: 'var(--radix-popover-trigger-width)' }}
                                                align="start"
                                                sideOffset={4}
                                                onOpenAutoFocus={(e) => e.preventDefault()}
                                              >
                                                <div className="max-h-56 overflow-y-auto">
                                                  {labSuggestions.map((l, lIdx) => (
                                                    <button
                                                      key={lIdx}
                                                      className="w-full text-left px-4 py-2 hover:bg-[#00c9a7] hover:text-white transition-colors group/item"
                                                      onClick={() => {
                                                        const updated = [...consultForm.labOrders];
                                                        updated[idx] = { ...updated[idx], testName: l['Service Name'] || l.testName };
                                                        setConsultForm(f => ({ ...f, labOrders: updated }));
                                                        setLabSuggestions([]);
                                                        setActiveSuggestionIdx(null);
                                                      }}
                                                    >
                                                      <div className="font-bold text-[13px]">{l['Service Name'] || l.testName}</div>
                                                      <div className="text-[11px] opacity-60 group-hover/item:opacity-100">{l['Sub Department'] || l.department}</div>
                                                    </button>
                                                  ))}
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          </td>
                                          <td className="px-4 py-4">
                                            <input
                                              className="w-full bg-transparent border-0 p-0 text-[13px] text-[#6e6868] italic focus:ring-0 outline-none placeholder:text-gray-300"
                                              placeholder="Additional notes..."
                                              value={lab.notes}
                                              onChange={e => {
                                                const updated = [...consultForm.labOrders];
                                                updated[idx] = { ...updated[idx], notes: e.target.value };
                                                setConsultForm(f => ({ ...f, labOrders: updated }));
                                              }}
                                            />
                                          </td>
                                          {!isViewOnly && (
                                            <td className="px-8 py-4 text-center">
                                              <button
                                                onClick={() => {
                                                  const updated = consultForm.labOrders.filter((_, i) => i !== idx);
                                                  setConsultForm(f => ({ ...f, labOrders: updated }));
                                                }}
                                                className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                              >
                                                <X className="w-5 h-5" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {!isViewOnly && (
                                  <button
                                    onClick={() => {
                                      setConsultForm(f => ({
                                        ...f,
                                        labOrders: [
                                          ...f.labOrders,
                                          { id: Date.now(), testName: '', notes: '', labId: '' }
                                        ]
                                      }));
                                    }}
                                    className="w-full py-4 bg-[#f8f9fd] border-t border-[#e2e4f0] text-[12px] font-bold text-[#64549f] hover:bg-[#64549f]/5 transition-all flex items-center justify-center gap-2 border-dashed"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add Lab Order
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sticky Bottom Action Bar */}
                      <div className="flex items-center justify-end px-10 py-5 bg-white border-t border-[#e2e4f0] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this recording?')) {
                              onClearData();
                              setIsConsultationView(false);
                              setIsMinimized(false);
                              setIsMaximized(false);
                              setIsPopupHidden(true);
                            }
                          }}
                          className="text-[14px] hidden font-semibold text-red-500 hover:text-red-600 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-5 h-5" />
                          Delete This Recording
                        </button>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={handleSaveClick}
                            className="h-12 px-10 bg-[#64549f] hover:bg-[#5a4a8f] text-white text-[15px] font-bold rounded-2xl shadow-[0_10px_25px_rgba(100,84,159,0.25)] hover:shadow-[0_15px_35px_rgba(100,84,159,0.35)] transition-all active:scale-95 flex items-center gap-3"
                          >
                            Save and Update
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : !isMinimized && (
                <div />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals for adding medications and labs */}
      {admissionId && (
        <>
          <AddMedicationModal
            isOpen={isAddMedicationModalOpen}
            onClose={() => setIsAddMedicationModalOpen(false)}
            consultationId={admissionId}
            onMedicationAdded={() => {
              // The modal uses custom events/API to sync, so we don't need explicit handling here
            }}
          />
          <AddLabResultModal
            isOpen={isAddLabModalOpen}
            onClose={() => setIsAddLabModalOpen(false)}
            consultationId={admissionId}
            onLabResultAdded={() => {
              // The modal uses socket events/API to sync
            }}
          />
        </>
      )}

      {/* Settings always accessible — not gated by admissionId */}
      {isSettingsOpen && (
        <AmbientAssistantSettings
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          settings={assistantSettings}
          doctorId={doctorId}
          onSave={onSaveAssistantSettings}
        />
      )}

      <PreviousPrescriptionsSidebar
        isOpen={isPreviousPrescriptionsOpen}
        onOpenChange={setIsPreviousPrescriptionsOpen}
        consultationId={admissionId || ''}
        onImportSet={handleImportPreviousPrescriptions}
      />

      <AlertDialog open={showSaveConfirmation} onOpenChange={setShowSaveConfirmation}>
        <AlertDialogContent className="rounded-[24px] border-[#e0e3f5]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1a2256] font-bold">Save and Update</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6e6868] font-medium">
              Are you sure you want to save and update? This will replace the existing visit info data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-[12px] font-bold text-[#6e6868] border-[#e0e3f5]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSaveConfirmation(false);
                handleBatchSave();
              }}
              className="bg-[#64549f] hover:bg-[#5a4a8f] text-white rounded-[12px] font-bold shadow-md hover:shadow-lg transition-all"
            >
              Save and Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <h3 className="text-[20px] font-bold text-[#1a2256] mb-3">
                Delete {deleteConfirmation.type === 'medicine' ? 'Medication' : 'Lab Order'}
              </h3>
              <p className="text-[#6e6868] text-[15px] leading-relaxed">
                Are you sure you want to delete <span className="font-bold italic text-[#1a2256]">"{deleteConfirmation.name}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-8 pb-8">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-6 py-2.5 rounded-xl border border-[#e2e4f0] text-[14px] font-bold text-[#6e6868] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 rounded-2xl bg-[#ef4444] text-white text-[14px] font-bold shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95"
              >
                Delete {deleteConfirmation.type === 'medicine' ? 'Medication' : 'Lab Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
