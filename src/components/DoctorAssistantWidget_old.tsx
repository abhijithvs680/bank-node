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
  Sparkles,
  Maximize2,
  Minimize2,
  Edit2,
  Plus,
  History as HistoryIcon,
  FlaskConical,
  X,
  Ear,
  Settings as SettingsIcon,
} from "lucide-react";
import doctorsOfficeGif from "../img/doctors-office.gif";
import { AddMedicationModal } from "./AddMedicationModal";
import { AddLabResultModal } from "./AddLabResultModal";
import { AmbientAssistantSettings } from "./AmbientAssistantSettings";
import { PreviousPrescriptionsSidebar } from "./PreviousPrescriptionsSidebar";
import { defaultCategories, AmbientAssistantSettings as SettingsType, PreviousPrescriptionItem } from "@/types/doctorAssistant";
import { apiService } from "@/services/apiService";

interface DoctorAssistantWidgetProps {
  isListening: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  clinicalData: ClinicalData;
  conversationHistory: TranscriptEntry[];
  hasRecordedData: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onToggleMute: () => void;
  onClearData: () => void;
  onUpdateClinicalData: (update: (prev: ClinicalData) => ClinicalData) => void;
  medications?: any[];
  labOrders?: any[];
  assistantSettings: SettingsType;
  onSaveAssistantSettings: (settings: SettingsType) => void;
  doctorId: string;
  admissionId?: string;
}

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
    content += "Current Medications:\n";
    content += data.medications.map(m => `• ${m.name}${m.dose ? ` ${m.dose}` : ''}`).join('\n');
    content += "\n\n";
  }
  if (data.allergies.length > 0) {
    content += "⚠️ Allergies:\n";
    content += data.allergies.map(a => `• ${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}`).join('\n');
  }
  const medChanges = data.plan.filter(p => /medication|prescribe|start|stop|increase|decrease|mg|dose/i.test(p));
  if (medChanges.length > 0) {
    content += "\n\nMedication Changes Discussed:\n";
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

  if (Array.isArray(data.medications) && data.medications.length > 0) {
    text += `MEDICATIONS:\n${data.medications.filter(m => m && m.name).map(m => `  • ${m.name}${m.dose ? ` ${m.dose}` : ""}`).join("\n")}\n\n`;
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

export const DoctorAssistantWidget = ({
  isListening,
  isConnecting,
  isMuted,
  clinicalData,
  conversationHistory,
  hasRecordedData,
  onStartListening,
  onStopListening,
  onToggleMute,
  onUpdateClinicalData,
  onClearData,
  admissionId,
  doctorId,
  medications: dashboardMedications = [],
  labOrders: dashboardLabOrders = [],
  assistantSettings,
  onSaveAssistantSettings,
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
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [isAddMedicationModalOpen, setIsAddMedicationModalOpen] = useState(false);
  const [isAddLabModalOpen, setIsAddLabModalOpen] = useState(false);
  const [consultForm, setConsultForm] = useState({
    purposeOfVisit: '',
    urgentConcerns: '',
    symptoms: '',
    medicalHistory: '',
    allergy: '',
    comorbidity: '',
    familySocialHistory: '',
    diagnosisAndFindings: '',
    prescriptions: [] as { id: number; text: string }[],
    labOrders: [] as { id: number; text: string }[],
    customCategories: {} as Record<string, string>,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviousPrescriptionsOpen, setIsPreviousPrescriptionsOpen] = useState(false);
  const { toast } = useToast();
  const syncedMedsRef = useRef<Set<string>>(new Set());
  const syncedLabsRef = useRef<Set<string>>(new Set());

  // Sync additions from clinicalData to consultForm
  useEffect(() => {
    if (isConsultationView) {
      setConsultForm(prev => ({
        ...prev,
        purposeOfVisit: clinicalData.purposeOfVisit || prev.purposeOfVisit,
        urgentConcerns: clinicalData.urgentConcerns || prev.urgentConcerns,
        symptoms: clinicalData.symptoms || prev.symptoms,
        medicalHistory: clinicalData.medicalHistory || prev.medicalHistory,
        allergy: clinicalData.allergy || prev.allergy,
        comorbidity: clinicalData.comorbidity || prev.comorbidity,
        familySocialHistory: clinicalData.familySocialHistory || prev.familySocialHistory,
      }));

      // 1. Sync Medications from clinicalData (AI detected)
      const aiMedTexts = clinicalData.medications.map(m =>
        `${m.name}${m.dose ? ' • ' + m.dose : ''}`.trim()
      ).filter(text => text !== '');

      // Deduplicate against what's ALREADY in syncedMedsRef
      const newMeds = aiMedTexts.filter(text => !syncedMedsRef.current.has(text));

      if (newMeds.length > 0) {
        setConsultForm(prev => {
          // Double check against existing items in prescriptions to avoid race-condition duplicates
          const uniqueNewMeds = newMeds.filter(text =>
            !prev.prescriptions.some(p => p.text.toLowerCase().trim() === text.toLowerCase().trim())
          );
          if (uniqueNewMeds.length === 0) return prev;

          const newItems = uniqueNewMeds.map((text, i) => ({ id: Date.now() + i, text }));
          return { ...prev, prescriptions: [...prev.prescriptions, ...newItems] };
        });
        newMeds.forEach(t => syncedMedsRef.current.add(t));
      }

      // 2. Sync Labs from clinicalData (AI recommended)
      const aiLabTexts = (clinicalData.recommendedLabs || []).map(l => l.trim()).filter(text => text !== '');

      // Deduplicate against what's ALREADY in syncedLabsRef
      const newLabsSync = aiLabTexts.filter(text => !syncedLabsRef.current.has(text));

      if (newLabsSync.length > 0) {
        setConsultForm(prev => {
          // Double check against existing items in labOrders to avoid race-condition duplicates
          const uniqueNewLabs = newLabsSync.filter(text =>
            !prev.labOrders.some(l => l.text.toLowerCase().trim() === text.toLowerCase().trim())
          );
          if (uniqueNewLabs.length === 0) return prev;

          const newItems = uniqueNewLabs.map((text, i) => ({ id: Date.now() + i + 1000, text }));
          return { ...prev, labOrders: [...prev.labOrders, ...newItems] };
        });
        newLabsSync.forEach(t => syncedLabsRef.current.add(t));
      }
    }
  }, [clinicalData.medications, clinicalData.recommendedLabs, isConsultationView]);

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
      description: "Syncing clinical findings to the patient record...",
    });

    // Auto-minimize after saving
    setIsMinimized(true);
    setIsSaved(true);
    setIsPopupHidden(true);
    setIsConsultationView(false);
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

  const handleImportPreviousPrescriptions = (medications: PreviousPrescriptionItem[]) => {
    const newItems = medications.map((med, i) => {
      const parts = [
        med.name,
        med.dosage,
        med.frequency,
        med.duration
      ].filter(Boolean);

      return {
        id: Date.now() + i + 2000,
        text: parts.join(' • ')
      };
    });

    setConsultForm(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, ...newItems]
    }));

    toast({
      title: "Medications Imported",
      description: `Added ${medications.length} items to the prescription list.`,
    });
  };

  const showQuickActions = hasRecordedData && !isListening && hasContent(clinicalData);
  const isWidgetActive = isListening || hasRecordedData || isConnecting || isInitializing;

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
            <SettingsIcon className="w-4 h-4" />
          </button>

          <div className="mb-2">
            <img src={doctorsOfficeGif} alt="" className="w-20 h-20" style={{ mixBlendMode: 'multiply' }} />
          </div>

          <h3 className="text-[21px] font-semibold text-[#64549f] font-['Inter'] mb-0.5">Ambient Mode</h3>
          <p className="text-[14px] text-[#64549f]/70 font-['Inter'] mb-4 text-center px-4">
            {isWidgetActive ? "Ambient Mode is active" : "Real-time conversation capture & note drafting"}
          </p>

          <div className="flex items-center gap-2">
            {!isWidgetActive ? (
              <button
                onClick={() => {
                  // Show only the minimized pill — no full-screen popup yet
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
                <span className="text-[11px] font-medium uppercase tracking-wider">Active</span>
              </div>
            )}
          </div>

          {isSaved && isWidgetActive && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsViewOnly(true);
                setIsConsultationView(true);
                setIsPopupHidden(false);
                setIsMinimized(false);
                setIsMaximized(true);
              }}
              className="mt-3 h-8 px-4 border-[#64549f]/30 text-[#64549f] hover:bg-[#64549f]/5 rounded-full text-[11px] font-medium transition-all"
            >
              View Recorded Findings
            </Button>
          )}
        </div>
      </Card>

      {/* Floating Popup - Dynamic Island / Dashboard */}
      {isWidgetActive && !isPopupHidden && (
        <div
          className={`fixed z-[100] ${isMinimized
            ? ' top-10 left-1/2 -translate-x-1/2 w-auto'
            : isMaximized
              ? 'top-[1vh] left-[1vw] right-[1vw] bottom-[1vh] w-auto h-auto shadow-[0_0_50px_rgba(0,0,0,0.3)]'
              : 'bottom-6 right-6 w-96 h-[600px] max-h-[85vh]'
            }`}
        >
          <div className={`${isMinimized
            ? `bg-[#1a1b2e] border border-white/10 rounded-full py-1.5 px-2 pr-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${isListening ? 'animate-glow-border' : ''}`
            : 'bg-white/95 backdrop-blur-md border border-[#64549f]/20 rounded-[24px] shadow-2xl overflow-hidden'
            } flex flex-col h-full relative`}>

            {/* Minimized Dynamic Island Content */}
            <div className={`transition-opacity duration-300 ${isMinimized ? 'opacity-100 flex-1' : 'opacity-0 h-0 pointer-events-none'}`}>
              {isMinimized && (
                <div className="flex items-center gap-4 min-w-[320px] justify-between h-[44px]">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isListening ? 'bg-orange-500 animate-[badge-pulse_2s_ease-in-out_infinite]' : 'bg-[#64549f]'}`}>
                      {isMuted
                        ? <MicOff className="w-5 h-5 text-white opacity-60" />
                        : <Mic className={`w-5 h-5 text-white ${isListening ? '' : 'opacity-70'}`} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-[13px] font-semibold tracking-wide">
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Waveform / muted indicator */}
                    {isListening && !isMuted ? (
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
                        <div className={`w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-yellow-400' : 'bg-green-500 animate-pulse'}`} />
                        <span className="text-white/50 text-[10px] font-medium uppercase tracking-tighter">{isMuted ? 'Muted' : 'Active'}</span>
                      </div>
                    )}
                  </div>

                  {/* Mute + Stop only — no expand */}
                  <div className="flex items-center gap-2 pr-1">
                    <button
                      onClick={onToggleMute}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all active:scale-90 ${isMuted ? 'bg-yellow-500/90 hover:bg-yellow-500' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    {isListening && (
                      <button
                        onClick={() => {
                          onStopListening();
                          setIsMinimized(false);
                          setIsMaximized(true);
                          setIsFetchingSummary(true);
                          setIsConsultationView(false); // Hide summary while fetching

                          // Simulate fetching delay
                          setTimeout(() => {
                            // Prepare initial medications (AI detected only)
                            const aiMeds = clinicalData.medications.map(m =>
                              `${m.name}${m.dose ? ' • ' + m.dose : ''}`.trim()
                            ).filter(t => t !== '');

                            const initialPrescriptions = aiMeds.map((text, i) => ({ id: Date.now() + i, text }));

                            // Prepare initial labs (AI recommended only)
                            const aiLabs = (clinicalData.recommendedLabs || []).map(l => l.trim()).filter(t => t !== '');

                            const initialLabOrders = aiLabs.map((text, i) => ({ id: Date.now() + i + 1000, text }));

                            // Initialize sync refs with the items already in the summary to avoid re-adding them
                            initialPrescriptions.forEach(p => syncedMedsRef.current.add(p.text));
                            initialLabOrders.forEach(l => syncedLabsRef.current.add(l.text));

                            setConsultForm({
                              purposeOfVisit: clinicalData.chiefComplaint || clinicalData.purposeOfVisit || '',
                              urgentConcerns: clinicalData.urgentConcerns || (clinicalData.redFlags.length > 0 ? clinicalData.redFlags.join(', ') : ''),
                              symptoms: clinicalData.symptoms || [
                                clinicalData.hpiDetails.onset,
                                clinicalData.hpiDetails.location,
                                clinicalData.hpiDetails.character,
                                ...clinicalData.hpiDetails.associatedSymptoms
                              ].filter(Boolean).join(', '),
                              medicalHistory: clinicalData.medicalHistory || (clinicalData.pastMedicalHistory.length > 0 ? clinicalData.pastMedicalHistory.join(', ') : ''),
                              allergy: clinicalData.allergy || (clinicalData.allergies.length > 0 ? clinicalData.allergies.map(a => `${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}`).join(', ') : ''),
                              comorbidity: clinicalData.comorbidity || '',
                              familySocialHistory: clinicalData.familySocialHistory || (clinicalData.familyHistory.length > 0 ? `Family: ${clinicalData.familyHistory.join(', ')}` : ''),
                              diagnosisAndFindings: clinicalData.assessment || '',
                              prescriptions: initialPrescriptions,
                              labOrders: initialLabOrders,
                              customCategories: { ...clinicalData.customFields },
                            });
                            setIsFetchingSummary(false);
                            setIsConsultationView(true);
                          }, 2000);
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
              {isFetchingSummary || isConsultationView ? (
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
                          Preparing Consultation Summary
                        </p>
                      </div>

                      <div className="mt-12 w-[400px] h-[4px] bg-[#64549f]/10 rounded-full overflow-hidden relative z-10">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1a2256] via-[#64549f] to-[#1a2256] transition-all duration-300 ease-out animate-[shimmer_2s_infinite]"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div className="mt-6 flex items-center gap-3 text-[13px] text-[#6e6868] font-medium opacity-60 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing captured clinical markers...
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Summary Header with Close Button */}
                      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e2e4f0] shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#64549f]/10 flex items-center justify-center">
                            <ClipboardList className="w-4 h-4 text-[#64549f]" />
                          </div>
                          <h3 className="text-[16px] font-bold text-[#1a2256]">Consultation Summary</h3>
                        </div>
                        <button
                          onClick={() => {
                            setIsConsultationView(false);
                            setIsMinimized(false);
                            setIsMaximized(false);
                            setIsFetchingSummary(false);
                            setIsPopupHidden(true);
                            onClearData(); // Clear recorded data to reset the card to "Start Scribing"
                          }}
                          className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Two-column body */}
                      <div className="flex flex-1 overflow-hidden">
                        {/* Left column — dynamic fields from enabled Data Capture Categories */}
                        {(() => {
                          // Map each category field to a form field config
                          const fieldMap: Record<string, { label: string; formKey: keyof typeof consultForm; placeholder: string }> = {
                            chiefComplaint: { label: 'Chief Complaints', formKey: 'purposeOfVisit', placeholder: 'Enter chief complaints...' },
                            symptoms: { label: 'Symptoms', formKey: 'symptoms', placeholder: 'Enter symptoms...' },
                            medicalHistory: { label: 'Medical History', formKey: 'medicalHistory', placeholder: 'Enter medical history...' },
                            allergy: { label: 'Allergies', formKey: 'allergy', placeholder: 'Enter allergies...' },
                            purposeOfVisit: { label: 'Purpose of Visit', formKey: 'purposeOfVisit', placeholder: 'Enter purpose of visit...' },
                            urgentConcerns: { label: 'Urgent Concerns', formKey: 'urgentConcerns', placeholder: 'Enter urgent concerns...' },
                            comorbidity: { label: 'Comorbidity', formKey: 'comorbidity', placeholder: 'Enter comorbidities...' },
                            familySocialHistory: { label: 'Social History', formKey: 'familySocialHistory', placeholder: 'Enter social history...' },
                          };

                          const enabledBuiltIn = assistantSettings.categories
                            .filter(c => c.enabled && fieldMap[c.field])
                            .map(c => ({ ...fieldMap[c.field], id: c.id }));

                          // Custom categories (any enabled category not in the built-in field list)
                          const enabledCustom = assistantSettings.categories
                            .filter(c => c.enabled && !fieldMap[c.field]);

                          if (enabledBuiltIn.length === 0 && enabledCustom.length === 0) return null;

                          return (
                            <div className="w-[340px] flex-shrink-0 flex flex-col gap-5 p-6 overflow-y-auto border-r border-[#e2e4f0] bg-white">
                              {enabledBuiltIn.map(({ id, label, formKey, placeholder }) => (
                                <div key={id}>
                                  <label className="block text-[13px] font-semibold text-[#1a2256] mb-2">{label}</label>
                                  <textarea
                                    className="w-full rounded-xl border border-[#e2e4f0] bg-[#f8f9fd] p-3 text-[13px] text-[#1a2256] resize-none min-h-[90px] focus:outline-none focus:ring-2 focus:ring-[#64549f]/30 transition-all"
                                    placeholder={placeholder}
                                    value={consultForm[formKey] as string}
                                    onChange={e => setConsultForm(f => ({ ...f, [formKey]: e.target.value }))}
                                  />
                                </div>
                              ))}
                              {/* Custom Categories */}
                              {enabledCustom.map((cat) => (
                                <div key={cat.id}>
                                  <label className="block text-[13px] font-semibold text-[#1a2256] mb-1">{cat.name}</label>
                                  <textarea
                                    className="w-full rounded-xl border border-[#e2e4f0] bg-[#f8f9fd] p-3 text-[13px] text-[#1a2256] resize-none min-h-[90px] focus:outline-none focus:ring-2 focus:ring-[#64549f]/30 transition-all"
                                    placeholder={`Enter ${cat.name.toLowerCase()}...`}
                                    value={consultForm.customCategories[cat.field] || ''}
                                    onChange={e => setConsultForm(f => ({
                                      ...f,
                                      customCategories: { ...f.customCategories, [cat.field]: e.target.value }
                                    }))}
                                  />
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Right column */}
                        <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto">
                          {/* Diagnosis and Findings */}
                          <div>
                            <label className="block text-[14px] font-semibold text-[#1a2256] mb-2">Diagnosis and Findings</label>
                            <textarea
                              className="w-full rounded-xl border border-[#e2e4f0] bg-white p-4 text-[13px] text-[#1a2256] resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#64549f]/30 transition-all shadow-sm"
                              placeholder="Enter diagnosis and clinical findings..."
                              value={consultForm.diagnosisAndFindings}
                              onChange={e => setConsultForm(f => ({ ...f, diagnosisAndFindings: e.target.value }))}
                            />
                          </div>

                          {/* Prescription */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-[14px] font-semibold text-[#1a2256]">Prescription</label>
                              <button
                                onClick={() => setIsPreviousPrescriptionsOpen(true)}
                                className="text-[12px] text-[#64549f] font-medium hover:underline flex items-center gap-1"
                              >
                                Select from Previous &rsaquo;
                              </button>
                            </div>
                            <div className="space-y-2">
                              {consultForm.prescriptions.length === 0 && (
                                <p className="text-[12px] text-gray-400 italic py-2">No prescriptions yet</p>
                              )}
                              {consultForm.prescriptions.map((rx, idx) => (
                                <div key={rx.id} className="flex items-center gap-3 bg-white rounded-xl border border-[#e2e4f0] px-4 py-3 shadow-sm group">
                                  <span className="w-6 h-6 rounded-full bg-[#4CAF50] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                                  <input
                                    className="flex-1 text-[13px] text-[#1a2256] bg-transparent border-none outline-none"
                                    value={rx.text}
                                    onChange={e => setConsultForm(f => ({ ...f, prescriptions: f.prescriptions.map((p, i) => i === idx ? { ...p, text: e.target.value } : p) }))}
                                  />
                                  <button onClick={() => setConsultForm(f => ({ ...f, prescriptions: f.prescriptions.filter((_, i) => i !== idx) }))} className="text-red-400 hover:text-red-600 transition-all p-1">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  document.dispatchEvent(new CustomEvent('ai-clinical-field-added', {
                                    detail: { field: 'medications', content: '' }
                                  }));
                                }}
                                className="text-[13px] text-[#64549f] font-medium border border-dashed border-[#64549f]/30 rounded-xl px-4 py-2.5 w-full hover:bg-[#64549f]/5 transition-all"
                              >
                                + Add Medication
                              </button>
                            </div>
                          </div>

                          {/* Lab Orders */}
                          <div>
                            <label className="block text-[14px] font-semibold text-[#1a2256] mb-3">Lab Orders</label>
                            <div className="space-y-2">
                              {consultForm.labOrders.length === 0 && (
                                <p className="text-[12px] text-gray-400 italic py-2">No lab orders yet</p>
                              )}
                              {consultForm.labOrders.map((lab, idx) => (
                                <div key={lab.id} className="flex items-center gap-3 bg-white rounded-xl border border-[#e2e4f0] px-4 py-3 shadow-sm group">
                                  <span className="w-6 h-6 rounded-full bg-[#64549f] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                                  <input
                                    className="flex-1 text-[13px] text-[#1a2256] bg-transparent border-none outline-none"
                                    value={lab.text}
                                    onChange={e => setConsultForm(f => ({ ...f, labOrders: f.labOrders.map((l, i) => i === idx ? { ...l, text: e.target.value } : l) }))}
                                  />
                                  <span className="text-[11px] text-gray-400 mr-2">• Remarks</span>
                                  <button onClick={() => setConsultForm(f => ({ ...f, labOrders: f.labOrders.filter((_, i) => i !== idx) }))} className="text-red-400 hover:text-red-600 transition-all p-1">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  document.dispatchEvent(new CustomEvent('ai-clinical-field-added', {
                                    detail: { field: 'lab', content: '' }
                                  }));
                                }}
                                className="text-[13px] text-[#64549f] font-medium border border-dashed border-[#64549f]/30 rounded-xl px-4 py-2.5 w-full hover:bg-[#64549f]/5 transition-all"
                              >
                                + Add Lab order
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-[#e2e4f0] shadow-[0_-2px_12px_rgba(0,0,0,0.05)]">
                        <button
                          onClick={() => {
                            onClearData();
                            setIsConsultationView(false);
                            setIsMinimized(false);
                            setIsMaximized(false);
                            setIsPopupHidden(false);
                          }}
                          className="text-[13px] font-medium text-red-500 border border-red-200 rounded-full px-5 py-2 hover:bg-red-50 transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete This Recording
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => { toast({ title: 'Draft saved', description: 'Consultation form saved as draft.' }); }}
                            className="text-[13px] font-medium text-[#1a2256] border border-[#e2e4f0] rounded-full px-5 py-2 hover:bg-gray-50 transition-all"
                          >
                            Save draft
                          </button>
                          <button
                            onClick={handleBatchSave}
                            className="text-[13px] font-semibold text-white bg-[#64549f] hover:bg-[#5a4a8f] rounded-full px-6 py-2 shadow-md transition-all active:scale-95"
                          >
                            Complete Consultation
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : !isMinimized && (
                <>
                  {/* Popup Header */}
                  <div className="flex items-center justify-between p-4 border-b border-[#64549f]/10 bg-gradient-to-r from-[#64549f]/5 to-transparent relative">
                    {/* Left: Status */}
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-[#64549f]'}`} />
                      <h4 className="text-[13px] font-semibold text-[#64549f]">
                        {isInitializing ? 'Initializing' : (isListening ? 'Live' : 'Ambient')}
                      </h4>
                    </div>

                    {/* Center: Mute & Delete/Stop */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                      {isListening && (
                        <Button
                          variant={isMuted ? "default" : "outline"}
                          size="sm"
                          onClick={onToggleMute}
                          className="h-8 px-3 rounded-full hover:bg-[#64549f]/10 flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          <span className="text-[11px] font-bold uppercase tracking-wider">Mute</span>
                        </Button>
                      )}

                      {isListening ? (
                        <Button
                          size="sm"
                          onClick={onStopListening}
                          className="h-8 px-3 rounded-full shadow-md bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Stop</span>
                        </Button>
                      ) : (hasRecordedData || clinicalData.chiefComplaint) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onClearData}
                          className="h-8 px-3 rounded-full text-[#64549f] border-[#64549f]/20 hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Delete</span>
                        </Button>
                      )}
                    </div>

                    {/* Right: Window Controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="h-8 w-8 rounded-full hover:bg-[#64549f]/10"
                      >
                        {isMaximized ? (
                          <Minimize2 className="w-3.5 h-3.5 text-[#64549f]" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5 text-[#64549f]" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="h-8 w-8 rounded-full hover:bg-[#64549f]/10"
                      >
                        <ChevronDown className="w-4 h-4 text-[#64549f]" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-0 overflow-hidden flex flex-col flex-1">
                    <ScrollArea className="h-full px-4 py-4">
                      <div className="space-y-4">
                        {/* Initialization Loader */}
                        {isInitializing && (
                          <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                            <div className="w-24 h-24 bg-[#64549f]/10 rounded-full flex items-center justify-center mb-8 relative">
                              <div className="absolute inset-0 bg-[#64549f]/20 rounded-full animate-ping opacity-75" />
                              <Mic className="w-10 h-10 text-[#64549f] animate-pulse" />
                            </div>

                            <h3 className="text-xl font-semibold text-[#1a2256] mb-2 font-['Inter']">Initializing Voice Recording</h3>
                            <p className="text-[#64549f]/70 text-sm mb-12">Setting up microphone and AI transcription engine...</p>

                            <div className="w-full max-w-md space-y-2 text-[#64549f]/70 text-xs font-semibold uppercase tracking-wider">
                              <div className="flex justify-between items-center mb-1">
                                <span>Progress</span>
                                <span className="text-[#64549f]">{initializationProgress}%</span>
                              </div>
                              <div className="h-2.5 w-full bg-[#f0f3f9] rounded-full overflow-hidden relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                                <div
                                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#64549f] via-[#9181db] to-[#64549f] bg-[length:200%_auto] transition-all duration-700 ease-out shadow-[0_0_12px_rgba(100,84,159,0.4)]"
                                  style={{ width: `${initializationProgress}%` }}
                                >
                                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1.25rem_1.25rem] animate-[progress-bg_1s_linear_infinite]" />
                                </div>
                              </div>
                              <div className="text-center mt-3 text-[#64549f]/60 normal-case tracking-normal">
                                Loading AI transcription model...
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Empty states */}
                        {!hasContent(clinicalData) && isListening && !isInitializing && (
                          <div className="text-center py-10">
                            <Activity className="w-10 h-10 mx-auto mb-4 animate-pulse text-[#64549f]/50" />
                            <p className="text-[13px] text-muted-foreground font-medium">Listening for clinical details...</p>
                            <div className="mt-4 flex flex-center gap-1 justify-center">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="w-1.5 h-4 bg-[#64549f]/20 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Clinical Data */}
                        <Accordion
                          type="multiple"
                          className="space-y-2.5"
                          defaultValue={isListening ? ["chief-complaint", "hpi", "red-flags", "assessment", "plan"] : ["chief-complaint", "hpi", "red-flags"]}
                        >
                          {clinicalData.chiefComplaint && (
                            <AccordionItem value="chief-complaint" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                  <ClipboardList className="w-4 h-4 text-[#64549f]" />
                                  Chief Complaint
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'chiefComplaint' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-[#64549f]/20 bg-[#64549f]/5"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-[14px] text-foreground/80 leading-relaxed border-l-2 border-[#64549f]/20 pl-3 flex-1">{clinicalData.chiefComplaint}</p>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('chiefComplaint', clinicalData.chiefComplaint!, 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-[#64549f]" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Symptoms */}
                          {clinicalData.symptoms && (
                            <AccordionItem value="symptoms" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                  <Activity className="w-4 h-4 text-orange-500" />
                                  Symptoms
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'symptoms' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-orange-200 bg-orange-50/10"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-[14px] text-foreground/80 leading-relaxed border-l-2 border-orange-200 pl-3 flex-1">{clinicalData.symptoms}</p>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('symptoms', clinicalData.symptoms!, 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-orange-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Purpose of Visit */}
                          {clinicalData.purposeOfVisit && (
                            <AccordionItem value="purpose" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                                  Purpose of Visit
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'purpose' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-emerald-200 bg-emerald-50/10"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-[14px] text-foreground/80 leading-relaxed border-l-2 border-emerald-200 pl-3 flex-1">{clinicalData.purposeOfVisit}</p>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('purpose', clinicalData.purposeOfVisit!, 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Urgent Concern */}
                          {clinicalData.urgentConcerns && (
                            <AccordionItem value="urgent" className="border border-red-200 bg-red-50/30 rounded-xl px-3">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-bold text-red-600">
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                  Urgent Concern
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'urgent' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-red-300 bg-red-50"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-[14px] text-red-700 leading-relaxed border-l-2 border-red-300 pl-3 flex-1">{clinicalData.urgentConcerns}</p>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('urgent', clinicalData.urgentConcerns!, 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-red-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* HPI Details */}
                          {(clinicalData.hpiDetails.onset || clinicalData.hpiDetails.location ||
                            clinicalData.hpiDetails.duration || clinicalData.hpiDetails.severity ||
                            clinicalData.hpiDetails.character || clinicalData.hpiDetails.timing ||
                            clinicalData.hpiDetails.modifyingFactors || clinicalData.hpiDetails.associatedSymptoms.length > 0) && (
                              <AccordionItem value="hpi" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                                <AccordionTrigger className="hover:no-underline py-3">
                                  <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    HPI Details
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-3 px-1">
                                  <div className="flex justify-between items-start mb-2 pr-2">
                                    {editingField?.startsWith('hpi.') ? (
                                      <div className="flex-1 pl-3 space-y-2">
                                        <Textarea
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="min-h-[80px] text-[14px] rounded-xl border-blue-200 bg-blue-50/30"
                                          placeholder={`Edit ${editingField.split('.')[1]}...`}
                                        />
                                        <div className="flex justify-end gap-2">
                                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <dl className="space-y-2 text-[14px] border-l-2 border-blue-200 pl-3 flex-1">
                                          {clinicalData.hpiDetails.onset && (
                                            <div className="flex gap-2 group relative">
                                              <dt className="font-medium text-muted-foreground w-20">Onset:</dt>
                                              <dd className="flex-1 pr-6 text-[14px]">{clinicalData.hpiDetails.onset}</dd>
                                              {!isViewOnly && (
                                                <Button variant="outline" size="icon" className="h-5 w-5 absolute right-0 top-0 opacity-0 group-hover:opacity-100" onClick={() => handleSectionAction('hpi.onset', clinicalData.hpiDetails.onset, 'edit')}>
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                          {clinicalData.hpiDetails.location && (
                                            <div className="flex gap-2 group relative">
                                              <dt className="font-medium text-muted-foreground w-20">Location:</dt>
                                              <dd className="flex-1 pr-6 text-[14px]">{clinicalData.hpiDetails.location}</dd>
                                              {!isViewOnly && (
                                                <Button variant="outline" size="icon" className="h-5 w-5 absolute right-0 top-0 opacity-0 group-hover:opacity-100" onClick={() => handleSectionAction('hpi.location', clinicalData.hpiDetails.location, 'edit')}>
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                          {clinicalData.hpiDetails.duration && (
                                            <div className="flex gap-2 group relative">
                                              <dt className="font-medium text-muted-foreground w-20">Duration:</dt>
                                              <dd className="flex-1 pr-6 text-[14px]">{clinicalData.hpiDetails.duration}</dd>
                                              {!isViewOnly && (
                                                <Button variant="outline" size="icon" className="h-5 w-5 absolute right-0 top-0 opacity-0 group-hover:opacity-100" onClick={() => handleSectionAction('hpi.duration', clinicalData.hpiDetails.duration, 'edit')}>
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                          {clinicalData.hpiDetails.severity && (
                                            <div className="flex gap-2 group relative">
                                              <dt className="font-medium text-muted-foreground w-20">Severity:</dt>
                                              <dd className="flex-1 pr-6 text-[14px]">{clinicalData.hpiDetails.severity}</dd>
                                              {!isViewOnly && (
                                                <Button variant="outline" size="icon" className="h-5 w-5 absolute right-0 top-0 opacity-0 group-hover:opacity-100" onClick={() => handleSectionAction('hpi.severity', clinicalData.hpiDetails.severity, 'edit')}>
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                          {clinicalData.hpiDetails.character && (
                                            <div className="flex gap-2 group relative">
                                              <dt className="font-medium text-muted-foreground w-20">Character:</dt>
                                              <dd className="flex-1 pr-6 text-[14px]">{clinicalData.hpiDetails.character}</dd>
                                              {!isViewOnly && (
                                                <Button variant="outline" size="icon" className="h-5 w-5 absolute right-0 top-0 opacity-0 group-hover:opacity-100" onClick={() => handleSectionAction('hpi.character', clinicalData.hpiDetails.character, 'edit')}>
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                          {clinicalData.hpiDetails.timing && (
                                            <div className="flex gap-2 group relative">
                                              <dt className="font-medium text-muted-foreground w-20">Timing:</dt>
                                              <dd className="flex-1 pr-6 text-[14px]">{clinicalData.hpiDetails.timing}</dd>
                                              {!isViewOnly && (
                                                <Button variant="outline" size="icon" className="h-5 w-5 absolute right-0 top-0 opacity-0 group-hover:opacity-100" onClick={() => handleSectionAction('hpi.timing', clinicalData.hpiDetails.timing, 'edit')}>
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                          {clinicalData.hpiDetails.modifyingFactors && (
                                            <div className="flex gap-2 group relative">
                                              <dt className="font-medium text-muted-foreground w-20">Modifying:</dt>
                                              <dd className="flex-1 pr-6 text-[14px]">{clinicalData.hpiDetails.modifyingFactors}</dd>
                                              {!isViewOnly && (
                                                <Button variant="outline" size="icon" className="h-5 w-5 absolute right-0 top-0 opacity-0 group-hover:opacity-100" onClick={() => handleSectionAction('hpi.modifyingFactors', clinicalData.hpiDetails.modifyingFactors, 'edit')}>
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                          {clinicalData.hpiDetails.associatedSymptoms.length > 0 && (
                                            <div className="flex gap-2 group relative">
                                              <dt className="font-medium text-muted-foreground w-20">Assoc:</dt>
                                              <dd className="flex-1 pr-6 text-[14px]">{clinicalData.hpiDetails.associatedSymptoms.join(", ")}</dd>
                                              {!isViewOnly && (
                                                <Button variant="outline" size="icon" className="h-5 w-5 absolute right-0 top-0 opacity-0 group-hover:opacity-100" onClick={() => handleSectionAction('hpi.associatedSymptoms', clinicalData.hpiDetails.associatedSymptoms.join(", "), 'edit')}>
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                        </dl>
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          {/* Section edits removed for granular edits */}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}

                          {/* Red Flags */}
                          {clinicalData.redFlags.length > 0 && (
                            <AccordionItem value="red-flags" className="border border-destructive/30 bg-destructive/5 rounded-xl px-3">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] text-destructive font-bold">
                                  <AlertTriangle className="w-4 h-4" />
                                  Red Flags ({clinicalData.redFlags.length})
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'redFlags' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-destructive/20 bg-destructive/5"
                                        placeholder="Red flags separated by commas..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ul className="space-y-1.5 pl-3 border-l-2 border-destructive/20 flex-1">
                                        {clinicalData.redFlags.map((flag, i) => (
                                          <li key={i} className="flex items-start gap-2 text-[14px] text-destructive/90">
                                            <span className="w-1.5 h-1.5 bg-destructive rounded-full mt-1.5 flex-shrink-0" />
                                            {flag}
                                          </li>
                                        ))}
                                      </ul>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('redFlags', clinicalData.redFlags.join(', '), 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-destructive" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Past Medical History */}
                          {clinicalData.pastMedicalHistory.length > 0 && (
                            <AccordionItem value="pmh" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                  <Heart className="w-4 h-4 text-rose-500" />
                                  Past Medical History
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'medicalHistory' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-rose-200 bg-rose-50/30"
                                        placeholder="Medical history items separated by commas..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ul className="space-y-1.5 pl-3 border-l-2 border-rose-200 flex-1">
                                        {clinicalData.pastMedicalHistory.map((pmh, i) => (
                                          <li key={i} className="text-[14px] text-foreground/80 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-rose-500 rounded-full" />
                                            {pmh}
                                          </li>
                                        ))}
                                      </ul>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('medicalHistory', clinicalData.pastMedicalHistory.join(', '), 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-rose-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Comorbidity */}
                          {clinicalData.comorbidity && (
                            <AccordionItem value="comorbidity" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                  Comorbidity
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'comorbidity' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-amber-200 bg-amber-50/10"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-[14px] text-foreground/80 leading-relaxed border-l-2 border-amber-200 pl-3 flex-1">{clinicalData.comorbidity}</p>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('comorbidity', clinicalData.comorbidity!, 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Social History */}
                          {clinicalData.familySocialHistory && (
                            <AccordionItem value="social-history" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                  <Users className="w-4 h-4 text-indigo-500" />
                                  Social History
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'familySocialHistory' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-indigo-200 bg-indigo-50/10"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-[14px] text-foreground/80 leading-relaxed border-l-2 border-indigo-200 pl-3 flex-1">{clinicalData.familySocialHistory}</p>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('familySocialHistory', clinicalData.familySocialHistory!, 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Medication History */}
                          {clinicalData.medicationHistory.length > 0 && (
                            <AccordionItem value="medication-history" className="border border-green-500/20 rounded-xl px-3 bg-green-50/30">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-bold text-green-700">
                                  <HistoryIcon className="w-4 h-4" />
                                  Medication History ({clinicalData.medicationHistory.length})
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'medicationHistory' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-green-200 bg-green-50/30"
                                        placeholder="Previous medications separated by commas..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ul className="space-y-1.5 pl-3 border-l-2 border-green-300 flex-1">
                                        {clinicalData.medicationHistory.map((med, i) => (
                                          <li key={i} className="text-[14px] text-foreground/80 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-green-500 rounded-full" />
                                            {med}
                                          </li>
                                        ))}
                                      </ul>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('medicationHistory', clinicalData.medicationHistory.join(', '), 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-green-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Current Medications */}
                          {clinicalData.medications.length > 0 && (
                            <AccordionItem value="medications" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                  <Pill className="w-4 h-4 text-green-500" />
                                  Medications ({clinicalData.medications.length})
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'medications' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-green-200 bg-green-50/30"
                                        placeholder="Medications (e.g. Metformin 500mg, Lisinopril)..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ul className="space-y-1.5 pl-3 border-l-2 border-green-200 flex-1">
                                        {clinicalData.medications.map((med, i) => (
                                          <li key={i} className="text-[14px] text-foreground/80 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-green-500 rounded-full" />
                                            {med.name}{med.dose && <span className="text-muted-foreground"> ({med.dose})</span>}
                                          </li>
                                        ))}
                                      </ul>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('medications', clinicalData.medications.map(m => `${m.name}${m.dose ? ' ' + m.dose : ''}`).join(', '), 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-green-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Recommended Medication */}
                          {clinicalData.recommendedMedications.length > 0 && (
                            <AccordionItem value="recommended-medications" className="border border-emerald-500/20 rounded-xl px-3 bg-emerald-50/30">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-bold text-emerald-700">
                                  <Sparkles className="w-4 h-4 text-emerald-500" />
                                  Recommended Medication ({clinicalData.recommendedMedications.length})
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'recommendedMedications' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-emerald-200 bg-emerald-50/30"
                                        placeholder="Recommended medications (e.g. Paracetamol 500mg)..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ul className="space-y-1.5 pl-3 border-l-2 border-emerald-300 flex-1">
                                        {clinicalData.recommendedMedications.map((med, i) => (
                                          <li key={i} className="text-[14px] text-foreground/80 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                                            {med.name}{med.dose && <span className="text-muted-foreground"> ({med.dose})</span>}
                                          </li>
                                        ))}
                                      </ul>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('recommendedMedications', clinicalData.recommendedMedications.map(m => `${m.name}${m.dose ? ' ' + m.dose : ''}`).join(', '), 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Allergies */}
                          {clinicalData.allergies.length > 0 && (
                            <AccordionItem value="allergies" className="border border-orange-500/20 rounded-xl px-3 bg-orange-50/30">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-bold text-orange-700">
                                  <AlertTriangle className="w-4 h-4" />
                                  Allergies ({clinicalData.allergies.length})
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'allergy' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-orange-200 bg-orange-50/30"
                                        placeholder="Allergies (e.g. Penicillin rash, Peanuts)..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ul className="space-y-1.5 pl-3 border-l-2 border-orange-300 flex-1">
                                        {clinicalData.allergies.map((allergy, i) => (
                                          <li key={i} className="text-[14px] text-foreground/90">
                                            <span className="font-semibold text-orange-900">{allergy.allergen}</span>
                                            {allergy.reaction && <span className="text-muted-foreground ml-1">({allergy.reaction})</span>}
                                          </li>
                                        ))}
                                      </ul>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('allergy', clinicalData.allergies.map(a => `${a.allergen}${a.reaction ? ' ' + a.reaction : ''}`).join(', '), 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-orange-600" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Physical Exam */}
                          {clinicalData.physicalExam.length > 0 && (
                            <AccordionItem value="physical-exam" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                  <Stethoscope className="w-4 h-4 text-[#64549f]" />
                                  Physical Exam
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'physicalExam' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-[#64549f]/20 bg-[#64549f]/5"
                                        placeholder="Physical exam findings separated by commas..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ul className="space-y-1.5 pl-3 border-l-2 border-[#64549f]/20 flex-1">
                                        {clinicalData.physicalExam.map((exam, i) => (
                                          <li key={i} className="text-[14px] text-foreground/80 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-[#64549f] rounded-full" />
                                            {exam}
                                          </li>
                                        ))}
                                      </ul>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('physicalExam', clinicalData.physicalExam.join(', '), 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-[#64549f]" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Lab History */}
                          {clinicalData.labHistory.length > 0 && (
                            <AccordionItem value="lab-history" className="border border-blue-500/20 rounded-xl px-3 bg-blue-50/30">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-bold text-blue-700">
                                  <FlaskConical className="w-4 h-4 text-blue-500" />
                                  Lab History ({clinicalData.labHistory.length})
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'labHistory' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-blue-200 bg-blue-50/30"
                                        placeholder="Previous lab tests separated by commas..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ul className="space-y-1.5 pl-3 border-l-2 border-blue-300 flex-1">
                                        {clinicalData.labHistory.map((lab, i) => (
                                          <li key={i} className="text-[14px] text-foreground/80 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-blue-500 rounded-full" />
                                            {lab}
                                          </li>
                                        ))}
                                      </ul>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('labHistory', clinicalData.labHistory.join(', '), 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Assessment & Plan */}
                          {clinicalData.assessment && (
                            <AccordionItem value="assessment" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                  <ClipboardList className="w-4 h-4 text-indigo-500" />
                                  Assessment
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'assessment' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-indigo-200 bg-indigo-50/30"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-[14px] text-foreground/80 leading-relaxed border-l-2 border-indigo-200 pl-3 flex-1">{clinicalData.assessment}</p>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('assessment', clinicalData.assessment!, 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {clinicalData.plan.length > 0 && (
                            <AccordionItem value="plan" className="border border-[#64549f]/10 rounded-xl px-3 bg-white">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#1a2256]">
                                  <FileText className="w-4 h-4 text-emerald-500" />
                                  Plan ({clinicalData.plan.length})
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'plan' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-emerald-200 bg-emerald-50/30"
                                        placeholder="Plan items separated by commas..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ul className="space-y-1.5 pl-3 border-l-2 border-emerald-200 flex-1">
                                        {clinicalData.plan.map((item, i) => (
                                          <li key={i} className="text-[14px] text-foreground/80 flex items-start gap-2">
                                            <span className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('plan', clinicalData.plan.join(', '), 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                          {/* Recommended Lab Test */}
                          {clinicalData.recommendedLabs.length > 0 && (
                            <AccordionItem value="recommended-labs" className="border border-cyan-500/20 rounded-xl px-3 bg-cyan-50/30">
                              <AccordionTrigger className="hover:no-underline py-3">
                                <span className="flex items-center gap-2.5 text-[13px] font-bold text-cyan-700">
                                  <FlaskConical className="w-4 h-4 text-cyan-500" />
                                  Recommended Lab Test ({clinicalData.recommendedLabs.length})
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 px-1">
                                <div className="flex justify-between items-start mb-2 pr-2">
                                  {editingField === 'recommendedLabs' ? (
                                    <div className="flex-1 pl-3 space-y-2">
                                      <Textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="min-h-[80px] text-[14px] rounded-xl border-cyan-200 bg-cyan-50/30"
                                        placeholder="Recommended lab tests separated by commas..."
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setEditingField(null)}>Cancel</Button>
                                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleSaveEdit}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ul className="space-y-1.5 pl-3 border-l-2 border-cyan-300 flex-1">
                                        {clinicalData.recommendedLabs.map((lab, i) => (
                                          <li key={i} className="text-[14px] text-foreground/80 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-cyan-500 rounded-full" />
                                            {lab}
                                          </li>
                                        ))}
                                      </ul>
                                      {!isViewOnly && (
                                        <div className="flex gap-1 ml-2 shrink-0">
                                          <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleSectionAction('recommendedLabs', clinicalData.recommendedLabs.join(', '), 'edit')}>
                                            <Edit2 className="w-3.5 h-3.5 text-cyan-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}

                        </Accordion>




                        {/* Transcript Toggle */}
                        {conversationHistory.length > 0 && (
                          <div className="pt-4 border-t border-[#64549f]/10">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowTranscript(!showTranscript)}
                              className="w-full justify-between text-[14px] font-semibold h-8 text-[#64549f] hover:bg-[#64549f]/5"
                            >
                              <span className="flex items-center text-[14px]">
                                <FileText className="w-3.5 h-3.5 mr-2" />
                                {isListening ? 'Live Transcript' : 'Transcript'}
                              </span>
                              <span className="bg-[#64549f]/10 px-1.5 py-0.5 rounded text-[11px]">{conversationHistory.length}</span>
                            </Button>

                            {(showTranscript || isListening) && (
                              <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scroll">
                                {conversationHistory.map((entry, i) => (
                                  <div key={i} className={`p-2.5 rounded-xl border ${entry.speaker === 'doctor' ? 'bg-[#64549f]/5 border-[#64549f]/10' : 'bg-white border-muted/50'}`}>
                                    <span className="font-bold text-[9px] text-[#64549f] uppercase tracking-wider">{entry.speaker}</span>
                                    <p className="mt-1 text-[14px] text-foreground/85 leading-relaxed">{entry.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Popup Footer */}
                    {hasContent(clinicalData) && (
                      <div className="p-4 bg-muted/20 border-t border-[#64549f]/10 flex flex-col gap-2">
                        {!isViewOnly && (
                          <Button
                            variant="outline"
                            onClick={handleBatchSave}
                            className="w-full text-[13px] font-bold h-11 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            Save to Patient Record
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyToClipboard}
                          className="w-full text-[14px] font-semibold h-10 border-[#64549f]/20 text-[#64549f] bg-white hover:bg-[#64549f]/5 rounded-xl shadow-sm"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Clinical Note
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </>
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
    </>
  );
};
