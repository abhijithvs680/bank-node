// Types for Doctor Assistant - Clinical Scribe AI

export interface ClinicalData {
  chiefComplaint: string;
  hpiDetails: {
    onset: string;
    location: string;
    duration: string;
    character: string;
    severity: string;
    timing: string;
    modifyingFactors: string;
    associatedSymptoms: string[];
  };
  reviewOfSystems: Record<string, string[]>;
  pastMedicalHistory: string[];
  medications: { name: string; frequency?: string; dosage?: string; duration?: string; instructions?: string; notes?: string }[];
  medicationHistory: string[];
  recommendedMedications: { name: string; dose?: string }[];
  allergies: { allergen: string; reaction?: string }[];
  familyHistory: string[];
  socialHistory: {
    smoking?: string;
    alcohol?: string;
    drugs?: string;
    occupation?: string;
    livingSituation?: string;
  };
  redFlags: string[];
  physicalExam: string[];
  assessment: string;
  plan: string[];
  labHistory: string[];
  recommendedLabs: string[];
  labOrders: { testName: string; description?: string }[] | { items: { test: string; reason?: string }[] };
  purposeOfVisit?: string;
  urgentConcerns?: string;
  symptoms?: string;
  medicalHistory?: string;
  allergy?: string;
  comorbidity?: string;
  familySocialHistory?: string;
  currentMedication?: string;
  customFields: Record<string, string>;
}

export interface TranscriptEntry {
  speaker: 'doctor' | 'patient' | 'unknown';
  text: string;
  timestamp: Date;
}

export interface DataCaptureCategory {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  field: string;
  order?: number;
}

export interface ReportFieldConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface ReportSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface AmbientAssistantSettings {
  categories: DataCaptureCategory[];
  prescriptionReportConfig?: ReportFieldConfig[];
  reportSections?: ReportSectionConfig[];
}

export interface VisitInfo {
  chiefComplaint?: string;
  purposeOfVisit?: string;
  urgentConcerns?: string;
  symptoms?: string;
  duration?: string;
  medicalHistory?: string;
  allergy?: string;
  comorbidity?: string;
  familySocialHistory?: string;
  currentMedication?: string;
  notes?: string;
  customCategories?: Record<string, string>;
}

export const defaultPrescriptionFields: ReportFieldConfig[] = [
  { id: 'name', name: 'Medicine Name', enabled: true, order: 0 },
  { id: 'dosage', name: 'Dosage', enabled: true, order: 1 },
  { id: 'frequency', name: 'Frequency', enabled: true, order: 2 },
  { id: 'route', name: 'Route', enabled: true, order: 3 },
  { id: 'duration', name: 'Duration', enabled: true, order: 4 },
  { id: 'foodTiming', name: 'Food Timing', enabled: true, order: 5 },
  { id: 'instructions', name: 'Instructions', enabled: true, order: 6 }
];

export const defaultReportSections: ReportSectionConfig[] = [
  { id: 'chiefComplaint', name: 'Chief Complaints', enabled: true, order: 0 },
  { id: 'medication', name: 'Active Medications', enabled: true, order: 1 },
  { id: 'consultationNotes', name: 'Consultation Notes (Notes)', enabled: true, order: 2 },
  { id: 'vitals', name: 'Vital Signs', enabled: true, order: 3 },
  { id: 'prescriptions', name: 'Prescription', enabled: true, order: 4 },
  { id: 'labOrders', name: 'Lab', enabled: true, order: 5 },
  { id: 'otherObservations', name: 'Other Notes', enabled: true, order: 6 },
  { id: 'purposeOfVisit', name: 'Purpose of Visit', enabled: true, order: 7 },
  { id: 'urgentConcerns', name: 'Urgent Concern', enabled: true, order: 8 },
  { id: 'symptoms', name: 'Symptoms', enabled: true, order: 9 },
  { id: 'medicalHistory', name: 'Medical History', enabled: true, order: 10 },
  { id: 'allergy', name: 'Allergies', enabled: true, order: 11 },
  { id: 'comorbidity', name: 'Comorbidity', enabled: true, order: 12 },
  { id: 'familySocialHistory', name: 'Social History', enabled: true, order: 13 }
];

export const defaultCategories: DataCaptureCategory[] = [
  { id: '1', name: 'Chief Complaints', description: 'Capture primary reasons for the visit', enabled: true, field: 'chiefComplaint', order: 0 },
  { id: '9', name: 'Active Medications', description: 'Current active medications', enabled: true, field: 'medication', order: 1 },
  { id: '2', name: 'Symptoms', description: 'Detailed descriptions of patient symptoms', enabled: true, field: 'symptoms', order: 2 },
  { id: '3', name: 'Allergies', description: 'Detect any mentioned drug or food allergies', enabled: true, field: 'allergy', order: 3 },
  { id: '4', name: 'Medical & Personal History', description: 'Capture relevant medical history', enabled: true, field: 'medicalHistory', order: 4 },
  { id: '5', name: 'Purpose of Visit', description: 'The specific goal of today\'s consultation', enabled: true, field: 'purposeOfVisit', order: 5 },
  { id: '6', name: 'Urgent Concerns', description: 'High-priority or emergency issues noted', enabled: true, field: 'urgentConcerns', order: 6 },
  { id: '7', name: 'Comorbidity', description: 'Co-existing medical conditions', enabled: true, field: 'comorbidity', order: 7 },
  { id: '8', name: 'Social History', description: 'Family, occupation, and lifestyle factors', enabled: true, field: 'familySocialHistory', order: 8 },
];

export const initialClinicalData: ClinicalData = {
  chiefComplaint: '',
  hpiDetails: {
    onset: '',
    location: '',
    duration: '',
    character: '',
    severity: '',
    timing: '',
    modifyingFactors: '',
    associatedSymptoms: [],
  },
  reviewOfSystems: {},
  pastMedicalHistory: [],
  medications: [],
  medicationHistory: [],
  recommendedMedications: [],
  allergies: [],
  familyHistory: [],
  socialHistory: {},
  redFlags: [],
  physicalExam: [],
  assessment: '',
  plan: [],
  labHistory: [],
  recommendedLabs: [],
  labOrders: [],
  purposeOfVisit: '',
  urgentConcerns: '',
  symptoms: '',
  medicalHistory: '',
  allergy: '',
  comorbidity: '',
  familySocialHistory: '',
  currentMedication: '',
  customFields: {},
};

export interface PreviousPrescriptionItem {
  id?: string;
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

export interface PreviousPrescriptionSet {
  date: string;
  medications: PreviousPrescriptionItem[];
}
