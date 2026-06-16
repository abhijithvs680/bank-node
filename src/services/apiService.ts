import { Patient, VitalSigns, Medication, LabResult, InpatientAdmissionData } from '@/types/patient';
import { authService } from './authService';
import { nanoid } from 'nanoid';

export const isPrescriptionActiveFlag = (activeFlag: unknown): boolean =>
  String(activeFlag ?? '').trim().toLowerCase() === 'true' ||
  String(activeFlag ?? '').trim() === '1';

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface DashboardConfigItem {
  Key: string;
  Value?: string;
  status?: string;
  description?: string;
  URL?: string;
  openType?: 'newtab' | 'samepage';
  withToken?: boolean | string;
}

export interface TokenUsageSnapshot {
  total_tokens: number;
  total_cost_usd: number;
  remaining_balance_usd: number;
  is_near_limit: boolean;
}

export interface PatientsResponse {
  patients: Patient[];
}

export interface NotesResponse {
  visits: {
    id: string;
    staff: string;
    role: string;
    time: string;
    date: string;
    type: string;
    notes: string;
    duration: string;
  }[];
}

export interface AIObservationsResponse {
  observations: {
    id: string;
    type: string;
    priority: string;
    message: string;
    timestamp: string;
    confidence: number;
    recommendations: string[];
  }[];
}

export interface VitalSignsGraphData {
  heartRateData: { time: string; value: number }[];
  bloodPressureData: { time: string; systolic: number; diastolic: number }[];
  oxygenData: { time: string; value: number }[];
  temperatureData: { time: string; value: number }[];
  heartRate?: { time: string; value: number }[];
  bp?: { time: string; systolic: number; diastolic: number }[];
  sp02?: { time: string; value: number }[];
  temperature?: { time: string; value: number }[];
  respRate?: { time: string; value: number }[];
  gcs?: { time: string; value: number }[];
  painLevel?: { time: string; value: number }[];
  bloodGlucose?: { time: string; value: number }[];
}

// Stateful offline store
const initialInpatients: Patient[] = [
  {
    consultationId: "6006",
    patientId: "P1001",
    firstName: "Aarav",
    surName: "Sharma",
    dateOfBirth: "1984-05-14",
    age: 42,
    gender: "M",
    phoneNumber: "9876543210",
    bedNumber: "ICU-A3",
    admissionType: "Emergency",
    admissionDateTime: "2026-06-15T08:30:00Z",
    admissionReason: "Acute asthma flare-up with severe respiratory distress",
    primaryDiagnosis: "Acute Asthma Exacerbation",
    secondaryDiagnoses: "Chronic allergic rhinitis",
    allergies: ["Penicillin", "Dust mites"],
    currentMedications: [],
    assignedPhysician: "Dr. Rajesh Koothrappali",
    doctorName: "Dr. Rajesh Koothrappali",
    doctorDepartment: "Pulmonology",
    doctorSpecialization: "Pulmonology",
    doctorEmail: "rajesh@sbsa.com",
    dutyDoctorNetworkName: "Dr. Rajesh Koothrappali",
    dutyDoctorNetworkGdid: "D001",
    primaryConsultantNetworkGdid: "D001",
    dutyNurseNetworkName: "Nurse Clara",
    dutyNurseNetworkGdid: "N001",
    assignedNurse: "Nurse Clara",
    insuranceInfo: { provider: "Aetna", policyNumber: "AET-90921" },
    vitalSigns: {
      heartRate: 98,
      bloodPressureSystolic: 135,
      bloodPressureDiastolic: 85,
      respiratoryRate: 24,
      oxygenSaturation: 92,
      temperature: 98.6,
      glasgowComaScale: 15,
      painLevel: 3,
      consciousnessLevel: "Alert",
      bloodGlucose: 110,
      recordedTime: "2026-06-16T12:00:00Z"
    },
    labResults: [],
    healthStatus: "Critical",
    alerts: ["Oxygen Saturation < 93%"],
    lastUpdated: "2026-06-16T12:00:00Z",
    appointmentId: "A1001",
    scheduledDoctorName: "Dr. Rajesh Koothrappali",
    scheduledDate: "2026-06-15",
    scheduledTime: "08:30",
    appointmentStatus: "Pending",
    consultationType: "Inpatient",
    symptoms: "Shortness of breath, wheezing, tight chest",
    duration: "2 days",
    medicalHistory: "Asthmatic since childhood. Hospitalized once last year.",
    purposeOfVisit: "Severe asthma exacerbation",
    severity: "High",
    urgentConcerns: "Low SpO2 on room air",
    consultationStatus: "Pending",
    createdOn: "2026-06-15T08:30:00Z",
    createdBy: "admin@gmail.com",
    doctorId: "D001",
    allergy: "Penicillin, Dust mites",
    comorbidity: "None",
    chiefComplaint: "Severe wheezing and dyspnea",
    currentMedication: "Albuterol inhaler as needed",
    familySocialHistory: "Father had mild asthma. Non-smoker.",
    notes: "Patient admitted via ER. Oxygen started at 2L/min via nasal cannula. Nebulized with Albuterol and Ipratropium.",
    customCategories: JSON.stringify([
      { name: "Surgical History", field: "SurgicalHistory", value: "None" },
      { name: "Social Habits", field: "SocialHabits", value: "Exercises twice a week" }
    ])
  },
  {
    consultationId: "6007",
    patientId: "P1002",
    firstName: "Meera",
    surName: "Nair",
    dateOfBirth: "1997-09-21",
    age: 29,
    gender: "F",
    phoneNumber: "9876543211",
    bedNumber: "General-B12",
    admissionType: "Planned",
    admissionDateTime: "2026-06-15T10:00:00Z",
    admissionReason: "Post-op appendectomy review and recovery monitoring",
    primaryDiagnosis: "Acute Appendicitis (Post-op)",
    secondaryDiagnoses: "",
    allergies: ["Sulfa drugs"],
    currentMedications: [],
    assignedPhysician: "Dr. Rajesh Koothrappali",
    doctorName: "Dr. Rajesh Koothrappali",
    doctorDepartment: "Surgery",
    doctorSpecialization: "General Surgery",
    doctorEmail: "rajesh@sbsa.com",
    dutyDoctorNetworkName: "Dr. Rajesh Koothrappali",
    dutyDoctorNetworkGdid: "D001",
    primaryConsultantNetworkGdid: "D001",
    dutyNurseNetworkName: "Nurse Clara",
    dutyNurseNetworkGdid: "N001",
    assignedNurse: "Nurse Clara",
    insuranceInfo: { provider: "Cigna", policyNumber: "CIG-44102" },
    vitalSigns: {
      heartRate: 76,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      temperature: 99.1,
      glasgowComaScale: 15,
      painLevel: 4,
      consciousnessLevel: "Alert",
      bloodGlucose: 95,
      recordedTime: "2026-06-16T11:00:00Z"
    },
    labResults: [],
    healthStatus: "Normal",
    alerts: [],
    lastUpdated: "2026-06-16T11:00:00Z",
    appointmentId: "A1002",
    scheduledDoctorName: "Dr. Rajesh Koothrappali",
    scheduledDate: "2026-06-15",
    scheduledTime: "10:00",
    appointmentStatus: "Completed",
    consultationType: "Inpatient",
    symptoms: "Mild localized abdominal soreness, post-surgical fatigue",
    duration: "1 day",
    medicalHistory: "Healthy, no chronic illnesses.",
    purposeOfVisit: "Appendectomy recovery",
    severity: "Medium",
    urgentConcerns: "Pain control",
    consultationStatus: "Completed",
    createdOn: "2026-06-15T10:00:00Z",
    createdBy: "admin@gmail.com",
    doctorId: "D001",
    allergy: "Sulfa drugs",
    comorbidity: "None",
    chiefComplaint: "Post-surgical pain management",
    currentMedication: "Acetaminophen 500mg as needed",
    familySocialHistory: "No significant family history.",
    notes: "Laparoscopic appendectomy performed successfully. Wound dressing is clean. Patient is tolerating oral liquids.",
    customCategories: JSON.stringify([
      { name: "Surgical History", field: "SurgicalHistory", value: "Appendectomy (June 15, 2026)" }
    ])
  },
  {
    consultationId: "6008",
    patientId: "P1003",
    firstName: "Devendra",
    surName: "Patel",
    dateOfBirth: "1959-11-04",
    age: 67,
    gender: "M",
    phoneNumber: "9876543212",
    bedNumber: "Deluxe-102",
    admissionType: "Planned",
    admissionDateTime: "2026-06-14T14:00:00Z",
    admissionReason: "Decompensated Heart Failure and chronic fluid overload",
    primaryDiagnosis: "Congestive Heart Failure",
    secondaryDiagnoses: "Type 2 Diabetes Mellitus, Stage 3 Chronic Kidney Disease",
    allergies: ["Contrast dye"],
    currentMedications: [],
    assignedPhysician: "Dr. Rajesh Koothrappali",
    doctorName: "Dr. Rajesh Koothrappali",
    doctorDepartment: "Cardiology",
    doctorSpecialization: "Cardiology",
    doctorEmail: "rajesh@sbsa.com",
    dutyDoctorNetworkName: "Dr. Rajesh Koothrappali",
    dutyDoctorNetworkGdid: "D001",
    primaryConsultantNetworkGdid: "D001",
    dutyNurseNetworkName: "Nurse Clara",
    dutyNurseNetworkGdid: "N001",
    assignedNurse: "Nurse Clara",
    insuranceInfo: { provider: "Medicare", policyNumber: "MC-77189" },
    vitalSigns: {
      heartRate: 72,
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 70,
      respiratoryRate: 18,
      oxygenSaturation: 95,
      temperature: 98.4,
      glasgowComaScale: 15,
      painLevel: 1,
      consciousnessLevel: "Alert",
      bloodGlucose: 145,
      recordedTime: "2026-06-16T10:00:00Z"
    },
    labResults: [],
    healthStatus: "Normal",
    alerts: [],
    lastUpdated: "2026-06-16T10:00:00Z",
    appointmentId: "A1003",
    scheduledDoctorName: "Dr. Rajesh Koothrappali",
    scheduledDate: "2026-06-14",
    scheduledTime: "14:00",
    appointmentStatus: "Pending",
    consultationType: "Inpatient",
    symptoms: "Bilateral pitting pedal edema, mild orthopnea",
    duration: "3 days",
    medicalHistory: "Ischemic cardiomyopathy since 2018. Coronary artery bypass graft (CABG) in 2019.",
    purposeOfVisit: "Diuresis management",
    severity: "Medium",
    urgentConcerns: "Elevated serum creatinine",
    consultationStatus: "Pending",
    createdOn: "2026-06-14T14:00:00Z",
    createdBy: "admin@gmail.com",
    doctorId: "D001",
    allergy: "Contrast dye",
    comorbidity: "Type 2 Diabetes, Stage 3 CKD",
    chiefComplaint: "Shortness of breath on minimal exertion and swollen ankles",
    currentMedication: "Furosemide 40mg daily, Metformin 500mg BID",
    familySocialHistory: "Retired bank manager. Non-smoker.",
    notes: "IV Furosemide diuresis protocol initiated. Monitoring fluid balance and renal profile closely.",
    customCategories: JSON.stringify([
      { name: "Surgical History", field: "SurgicalHistory", value: "CABG (2019)" }
    ])
  },
  {
    consultationId: "6009",
    patientId: "P1004",
    firstName: "Sarah",
    surName: "Connor",
    dateOfBirth: "1972-11-10",
    age: 53,
    gender: "F",
    phoneNumber: "9876543213",
    bedNumber: "ICU-A1",
    admissionType: "Emergency",
    admissionDateTime: "2026-06-16T02:00:00Z",
    admissionReason: "Sepsis secondary to acute pyelonephritis",
    primaryDiagnosis: "Sepsis",
    secondaryDiagnoses: "Acute Pyelonephritis, Dehydration",
    allergies: ["Ciprofloxacin"],
    currentMedications: [],
    assignedPhysician: "Dr. Rajesh Koothrappali",
    doctorName: "Dr. Rajesh Koothrappali",
    doctorDepartment: "Intensive Care",
    doctorSpecialization: "Critical Care",
    doctorEmail: "rajesh@sbsa.com",
    dutyDoctorNetworkName: "Dr. Rajesh Koothrappali",
    dutyDoctorNetworkGdid: "D001",
    primaryConsultantNetworkGdid: "D001",
    dutyNurseNetworkName: "Nurse Clara",
    dutyNurseNetworkGdid: "N001",
    assignedNurse: "Nurse Clara",
    insuranceInfo: { provider: "UnitedHealthcare", policyNumber: "UH-11029" },
    vitalSigns: {
      heartRate: 112,
      bloodPressureSystolic: 95,
      bloodPressureDiastolic: 55,
      respiratoryRate: 22,
      oxygenSaturation: 94,
      temperature: 102.4,
      glasgowComaScale: 14,
      painLevel: 6,
      consciousnessLevel: "Somnolent",
      bloodGlucose: 160,
      recordedTime: "2026-06-16T13:00:00Z"
    },
    labResults: [],
    healthStatus: "Critical",
    alerts: ["Fever (102.4 F)", "Heart Rate > 110", "MAP < 70"],
    lastUpdated: "2026-06-16T13:00:00Z",
    appointmentId: "A1004",
    scheduledDoctorName: "Dr. Rajesh Koothrappali",
    scheduledDate: "2026-06-16",
    scheduledTime: "02:00",
    appointmentStatus: "Pending",
    consultationType: "Inpatient",
    symptoms: "High fever, flank pain, altered mental status",
    duration: "1 day",
    medicalHistory: "Recurrent UTI, kidney stones.",
    purposeOfVisit: "Sepsis protocol activation",
    severity: "High",
    urgentConcerns: "Hypotension, tachycardic",
    consultationStatus: "Pending",
    createdOn: "2026-06-16T02:00:00Z",
    createdBy: "admin@gmail.com",
    doctorId: "D001",
    allergy: "Ciprofloxacin",
    comorbidity: "Recurrent UTI",
    chiefComplaint: "Fever, chills, severe left flank pain, and confusion",
    currentMedication: "None",
    familySocialHistory: "Social smoker. Physically active.",
    notes: "Sepsis bundle initiated. IV fluids (Normal Saline 30mL/kg) administered. IV Meropenem started. Urine and blood cultures sent.",
    customCategories: JSON.stringify([
      { name: "Surgical History", field: "SurgicalHistory", value: "Lithotripsy (2023)" }
    ])
  }
];

const initialOutpatients: Patient[] = [
  {
    consultationId: "5001",
    patientId: "P2001",
    firstName: "Aditya",
    surName: "Roy",
    dateOfBirth: "1991-03-04",
    age: 35,
    gender: "M",
    phoneNumber: "9876543220",
    bedNumber: "",
    admissionType: "Outpatient",
    admissionDateTime: "",
    admissionReason: "",
    primaryDiagnosis: "Viral Fever",
    secondaryDiagnoses: "",
    allergies: [],
    currentMedications: [],
    assignedPhysician: "Dr. Rajesh Koothrappali",
    doctorName: "Dr. Rajesh Koothrappali",
    doctorDepartment: "General Medicine",
    doctorSpecialization: "General Medicine",
    doctorEmail: "rajesh@sbsa.com",
    dutyDoctorNetworkName: "Dr. Rajesh Koothrappali",
    dutyDoctorNetworkGdid: "D001",
    primaryConsultantNetworkGdid: "D001",
    dutyNurseNetworkName: "",
    dutyNurseNetworkGdid: "",
    assignedNurse: "",
    insuranceInfo: { provider: "Max Life", policyNumber: "MAX-88201" },
    vitalSigns: {
      heartRate: 88,
      bloodPressureSystolic: 122,
      bloodPressureDiastolic: 78,
      respiratoryRate: 18,
      oxygenSaturation: 97,
      temperature: 101.2,
      glasgowComaScale: 15,
      painLevel: 2,
      consciousnessLevel: "Alert",
      bloodGlucose: 105,
      recordedTime: "2026-06-16T09:30:00Z"
    },
    labResults: [],
    healthStatus: "Normal",
    alerts: ["Fever (101.2 F)"],
    lastUpdated: "2026-06-16T09:30:00Z",
    appointmentId: "A2001",
    scheduledDoctorName: "Dr. Rajesh Koothrappali",
    scheduledDate: "2026-06-16",
    scheduledTime: "10:15",
    appointmentStatus: "Pending",
    consultationType: "Outpatient",
    symptoms: "High fever, chills, mild dry cough",
    duration: "3 days",
    medicalHistory: "No major medical history.",
    purposeOfVisit: "Fever evaluation",
    severity: "Low",
    urgentConcerns: "Fever spikes at night",
    consultationStatus: "Pending",
    createdOn: "2026-06-16T09:30:00Z",
    createdBy: "admin@gmail.com",
    doctorId: "D001",
    allergy: "None",
    comorbidity: "None",
    chiefComplaint: "Persistent fever",
    currentMedication: "Paracetamol 650mg as needed",
    familySocialHistory: "Social drinker. Lives with family.",
    notes: "Patient presents with low-grade viral prodrome. Lungs clear to auscultation.",
    customCategories: JSON.stringify([])
  },
  {
    consultationId: "5002",
    patientId: "P2002",
    firstName: "Ananya",
    surName: "Sen",
    dateOfBirth: "1972-08-20",
    age: 54,
    gender: "F",
    phoneNumber: "9876543221",
    bedNumber: "",
    admissionType: "Outpatient",
    admissionDateTime: "",
    admissionReason: "",
    primaryDiagnosis: "Essential Hypertension",
    secondaryDiagnoses: "Dyslipidemia",
    allergies: [],
    currentMedications: [],
    assignedPhysician: "Dr. Rajesh Koothrappali",
    doctorName: "Dr. Rajesh Koothrappali",
    doctorDepartment: "General Medicine",
    doctorSpecialization: "General Medicine",
    doctorEmail: "rajesh@sbsa.com",
    dutyDoctorNetworkName: "Dr. Rajesh Koothrappali",
    dutyDoctorNetworkGdid: "D001",
    primaryConsultantNetworkGdid: "D001",
    dutyNurseNetworkName: "",
    dutyNurseNetworkGdid: "",
    assignedNurse: "",
    insuranceInfo: { provider: "Star Health", policyNumber: "SH-44910" },
    vitalSigns: {
      heartRate: 72,
      bloodPressureSystolic: 145,
      bloodPressureDiastolic: 92,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      temperature: 98.2,
      glasgowComaScale: 15,
      painLevel: 0,
      consciousnessLevel: "Alert",
      bloodGlucose: 120,
      recordedTime: "2026-06-16T10:00:00Z"
    },
    labResults: [],
    healthStatus: "Normal",
    alerts: ["Elevated BP (145/92)"],
    lastUpdated: "2026-06-16T10:00:00Z",
    appointmentId: "A2002",
    scheduledDoctorName: "Dr. Rajesh Koothrappali",
    scheduledDate: "2026-06-16",
    scheduledTime: "11:00",
    appointmentStatus: "Completed",
    consultationType: "Outpatient",
    symptoms: "Occasional headache, morning stiffness",
    duration: "2 weeks",
    medicalHistory: "Hypertensive for 3 years. Non-compliant with medication.",
    purposeOfVisit: "Routine hypertensive follow-up",
    severity: "Low",
    urgentConcerns: "Poor medication compliance",
    consultationStatus: "Completed",
    createdOn: "2026-06-16T10:00:00Z",
    createdBy: "admin@gmail.com",
    doctorId: "D001",
    allergy: "None",
    comorbidity: "Dyslipidemia",
    chiefComplaint: "Morning headache and routine BP check",
    currentMedication: "Amlodipine 5mg daily (irregular)",
    familySocialHistory: "Mother was hypertensive. Office worker.",
    notes: "Counseled patient on lifestyle changes, low-salt diet, and compliance.",
    customCategories: JSON.stringify([])
  }
];

class ApiServiceState {
  patients: Map<string, Patient> = new Map();
  vitalsHistory: Map<string, VitalSigns[]> = new Map();
  prescriptions: Map<string, Medication[]> = new Map();
  notes: Map<string, NotesResponse['visits']> = new Map();
  labResults: Map<string, LabResult[]> = new Map();
  ambientHistory: Map<string, any[]> = new Map();
  assistantSettings: Map<string, any> = new Map();

  constructor() {
    // Seed state
    const dealDetailsMap: Record<string, Partial<Patient>> = {
      "6006": {
        dealName: "ORION MANUFACTURING HOLDINGS LIMITED",
        dealId: "#AG261070",
        borrower: "ORION MANUFACTURING HOLDINGS LIMITED",
        arranger: "Agency",
        primaryFo: "Pratheesh K P",
        primaryTmu: "Tmu1",
        jurisdiction: "SA",
        currency: "ZAR",
        dealType: "3rd Party Mandate",
        dealStatus: "Pre Financial Close",
        dealCreatedOn: "15 May 2026 10:02",
        dealLastUpdated: "15 May 2026 10:02",
        lenders: "First Capital Bank, Zenith Industrial Holdings Limited, Orion Industrial Holdings Limited"
      },
      "6007": {
        dealName: "Apex Leverage",
        dealId: "#AG261071",
        borrower: "Apex Retail Group Ltd",
        arranger: "Johnathan Doe",
        primaryFo: "Sarah Jenkins",
        primaryTmu: "Tmu2",
        jurisdiction: "UK",
        currency: "GBP",
        dealType: "Bilateral Facility",
        dealStatus: "Completed",
        dealCreatedOn: "12 May 2026 09:15",
        dealLastUpdated: "16 May 2026 14:30",
        lenders: "Standard Bank of South Africa (SBSA), Barclays"
      },
      "6008": {
        dealName: "Apollo Syndication",
        dealId: "#AG261072",
        borrower: "Apollo Energy Group Holdings",
        arranger: "Michael Chang",
        primaryFo: "Alice Johnson",
        primaryTmu: "Tmu3",
        jurisdiction: "US",
        currency: "USD",
        dealType: "Syndicated Loan",
        dealStatus: "Pre Financial Close",
        dealCreatedOn: "14 May 2026 11:00",
        dealLastUpdated: "15 May 2026 16:45",
        lenders: "Standard Chartered, SBSA, Citibank"
      },
      "6009": {
        dealName: "Project Horizon",
        dealId: "#AG261073",
        borrower: "Horizon Infrastructure Corp",
        arranger: "Jane Smith",
        primaryFo: "Bob Wilson",
        primaryTmu: "Tmu1",
        jurisdiction: "SA",
        currency: "ZAR",
        dealType: "Project Finance",
        dealStatus: "Pre Financial Close",
        dealCreatedOn: "16 May 2026 02:00",
        dealLastUpdated: "16 May 2026 13:00",
        lenders: "Standard Bank of South Africa (SBSA), HSBC"
      },
      "5001": {
        dealName: "Beacon Finance",
        dealId: "#AG261074",
        borrower: "Beacon Properties SA",
        arranger: "Emma Davis",
        primaryFo: "David Lee",
        primaryTmu: "Tmu2",
        jurisdiction: "SA",
        currency: "ZAR",
        dealType: "Acquisition Finance",
        dealStatus: "Pre Financial Close",
        dealCreatedOn: "16 May 2026 09:30",
        dealLastUpdated: "16 May 2026 10:00",
        lenders: "Standard Bank of South Africa (SBSA), Investec"
      },
      "5002": {
        dealName: "Quantum Capital",
        dealId: "#AG261075",
        borrower: "Quantum Holdings Inc",
        arranger: "Sarah Jenkins",
        primaryFo: "Alice Johnson",
        primaryTmu: "Tmu1",
        jurisdiction: "EU",
        currency: "EUR",
        dealType: "Bilateral Facility",
        dealStatus: "Completed",
        dealCreatedOn: "16 May 2026 10:00",
        dealLastUpdated: "16 May 2026 11:30",
        lenders: "Standard Bank of South Africa (SBSA), Deutsche Bank"
      }
    };

    initialInpatients.forEach(p => {
      const deal = dealDetailsMap[p.consultationId];
      if (deal) Object.assign(p, deal);
      this.patients.set(p.consultationId, p);
    });
    initialOutpatients.forEach(p => {
      const deal = dealDetailsMap[p.consultationId];
      if (deal) Object.assign(p, deal);
      this.patients.set(p.consultationId, p);
    });

    // Seed some initial prescriptions
    this.prescriptions.set("6006", [
      {
        id: "pr1",
        name: "Albuterol Inhaler",
        dosage: "90 mcg/actuation",
        frequency: "Every 4 hours as needed",
        duration: "7 days",
        route: "Inhalation",
        startDate: "2026-06-15",
        instructions: "Shake well before use",
        activeFlag: "1"
      },
      {
        id: "pr2",
        name: "Prednisone 40mg",
        dosage: "40mg",
        frequency: "Once daily in the morning",
        duration: "5 days",
        route: "Oral",
        startDate: "2026-06-15",
        instructions: "Take with food",
        activeFlag: "1"
      }
    ]);

    this.prescriptions.set("6008", [
      {
        id: "pr3",
        name: "Furosemide 40mg",
        dosage: "40mg",
        frequency: "Once daily",
        duration: "30 days",
        route: "Oral",
        startDate: "2026-06-14",
        instructions: "Take in the morning",
        activeFlag: "1"
      },
      {
        id: "pr4",
        name: "Metformin 500mg",
        dosage: "500mg",
        frequency: "Twice daily",
        duration: "30 days",
        route: "Oral",
        startDate: "2026-06-14",
        instructions: "Take with food",
        activeFlag: "1"
      }
    ]);

    this.prescriptions.set("6009", [
      {
        id: "pr5",
        name: "IV Meropenem 1g",
        dosage: "1g",
        frequency: "Every 8 hours",
        duration: "7 days",
        route: "Intravenous",
        startDate: "2026-06-16",
        instructions: "Infuse over 30 minutes",
        activeFlag: "1"
      }
    ]);

    // Seed some initial notes
    this.notes.set("6006", [
      {
        id: "n1",
        staff: "Dr. Rajesh Koothrappali",
        role: "Pulmonologist",
        time: "10:00 AM",
        date: "15-06-2026",
        type: "Admission Note",
        notes: "Patient admitted with severe bronchospasm. Responding well to initial bronchodilators.",
        duration: "10 mins"
      }
    ]);

    // Seed initial vital graphs
    initialInpatients.forEach(p => {
      if (p.vitalSigns) {
        this.vitalsHistory.set(p.consultationId, [{ ...p.vitalSigns }]);
      }
    });

    // Seed initial assistant settings
    this.assistantSettings.set("D001", {
      isEnabled: true,
      microphoneDevice: "default",
      categories: [
        { name: "Chief Complaint", field: "chiefComplaint", enabled: true, description: "Main reason for consulting" },
        { name: "Symptoms", field: "symptoms", enabled: true, description: "Physical indicators reported by patient" },
        { name: "Allergies", field: "allergy", enabled: true, description: "Known drug or food allergies" },
        { name: "Medical History", field: "medicalHistory", enabled: true, description: "Past illnesses, surgeries, treatments" },
        { name: "Comorbidities", field: "comorbidity", enabled: true, description: "Secondary conditions" },
        { name: "Surgical History", field: "SurgicalHistory", enabled: true, description: "Past surgical procedures" }
      ]
    });
  }
}

const state = new ApiServiceState();

class ApiService {
  async postForm(tag: string, payload: Record<string, FormDataEntryValue>): Promise<boolean> {
    console.log('[ApiService] Mock postForm:', tag, payload);
    return true;
  }

  async markGiven(consultationId: string, medicationId: string): Promise<void> {
    console.log('[ApiService] Mock markGiven:', consultationId, medicationId);
  }

  // ==================== ADD VITALS API ====================
  async addVitals(data: {
    vitalsId?: string;
    consultationId: string;
    heartRate?: string;
    bloodPressureSystolic?: string;
    bloodPressureDiastolic?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
    temperature?: string;
    glasgowComaScale?: string;
    painLevel?: string;
    consciousnessLevel?: string;
    bloodGlucose?: string;
  }): Promise<boolean> {
    const consultationId = data.consultationId;
    const newVitals: VitalSigns = {
      heartRate: data.heartRate ? parseInt(data.heartRate) : 75,
      bloodPressureSystolic: data.bloodPressureSystolic ? parseInt(data.bloodPressureSystolic) : 120,
      bloodPressureDiastolic: data.bloodPressureDiastolic ? parseInt(data.bloodPressureDiastolic) : 80,
      respiratoryRate: data.respiratoryRate ? parseInt(data.respiratoryRate) : 16,
      oxygenSaturation: data.oxygenSaturation ? parseInt(data.oxygenSaturation) : 98,
      temperature: data.temperature ? parseFloat(data.temperature) : 98.6,
      glasgowComaScale: data.glasgowComaScale ? parseInt(data.glasgowComaScale) : 15,
      painLevel: data.painLevel ? parseInt(data.painLevel) : 0,
      consciousnessLevel: data.consciousnessLevel || "Alert",
      bloodGlucose: data.bloodGlucose ? parseInt(data.bloodGlucose) : 90,
      recordedTime: new Date().toISOString()
    };

    // Update patient's current vitals
    const patient = state.patients.get(consultationId);
    if (patient) {
      patient.vitalSigns = newVitals;
      patient.lastUpdated = new Date().toISOString();
    }

    // Add to vitals history
    if (!state.vitalsHistory.has(consultationId)) {
      state.vitalsHistory.set(consultationId, []);
    }
    state.vitalsHistory.get(consultationId)!.push(newVitals);

    return true;
  }

  // ==================== ADD NOTES API ====================
  async addNotes(data: {
    consultationId: string;
    noteContent: string;
    Type?: string;
    noteId?: string;
    tag?: string;
  }): Promise<boolean> {
    const consultationId = data.consultationId;
    const notesList = state.notes.get(consultationId) || [];

    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (data.noteId) {
      // Edit note
      const idx = notesList.findIndex(n => n.id === data.noteId);
      if (idx !== -1) {
        notesList[idx] = {
          ...notesList[idx],
          notes: data.noteContent,
          type: data.Type || notesList[idx].type,
          time: timeStr,
          date: dateStr
        };
      }
    } else {
      // Add new note
      const newNote = {
        id: `note-${nanoid(5)}`,
        staff: "Dr. Rajesh Koothrappali",
        role: "Attending Physician",
        time: timeStr,
        date: dateStr,
        type: data.Type || "Progress Note",
        notes: data.noteContent,
        duration: "5 mins"
      };
      notesList.push(newNote);
    }

    state.notes.set(consultationId, notesList);

    // Update patient's notes field as a fallback/concatenated summary
    const patient = state.patients.get(consultationId);
    if (patient) {
      patient.notes = notesList.map(n => `[${n.date} ${n.time} - ${n.type}]: ${n.notes}`).join('\n\n');
      patient.lastUpdated = now.toISOString();
    }

    return true;
  }

  // ==================== ADD PRESCRIPTIONS/MEDICATIONS API ====================
  async addPrescription(data: {
    prescriptionId?: string;
    appointmentId?: string;
    patientId?: string;
    doctorId?: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration?: string;
    route?: string;
    mode?: string;
    startDate?: string;
    consultationId: string;
    foodTiming?: string;
    numberOfDays?: string;
    infusionRate?: string;
    instructions?: string;
  }): Promise<boolean> {
    const consultationId = data.consultationId;
    const currentList = state.prescriptions.get(consultationId) || [];

    const newMed: Medication = {
      id: data.prescriptionId || `med-${nanoid(5)}`,
      name: data.medicationName,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration || `${data.numberOfDays || 5} days`,
      route: data.route || "Oral",
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
      instructions: data.instructions || data.foodTiming || "",
      activeFlag: "1"
    };

    if (data.prescriptionId) {
      const idx = currentList.findIndex(m => m.id === data.prescriptionId);
      if (idx !== -1) {
        currentList[idx] = newMed;
      } else {
        currentList.push(newMed);
      }
    } else {
      currentList.push(newMed);
    }

    state.prescriptions.set(consultationId, currentList);
    return true;
  }

  // Delete prescription
  async deletePrescription(prescriptionId: string, consultationId?: string): Promise<boolean> {
    if (!consultationId) return false;
    const currentList = state.prescriptions.get(consultationId) || [];
    const updated = currentList.filter(m => m.id !== prescriptionId);
    state.prescriptions.set(consultationId, updated);
    return true;
  }

  // ==================== UNIFIED CONSULTATION DATA API ====================
  async getConsultationData(options: {
    email?: string;
    consultationId?: string;
    patientType?: 'inpatient' | 'outpatient';
    scheduledDate?: string;
  }): Promise<Patient[]> {
    let list = Array.from(state.patients.values());

    if (options.consultationId) {
      list = list.filter(p => p.consultationId === options.consultationId);
    }
    if (options.patientType) {
      const isIp = options.patientType === 'inpatient';
      list = list.filter(p => isIp ? p.bedNumber !== "" : p.bedNumber === "");
    }

    // Embed current prescriptions, vitals, lab results into each patient
    return list.map(p => {
      const meds = state.prescriptions.get(p.consultationId) || [];
      const labs = state.labResults.get(p.consultationId) || [];
      const history = state.vitalsHistory.get(p.consultationId) || [];
      const latestVitals = history.length > 0 ? history[history.length - 1] : p.vitalSigns;

      return {
        ...p,
        currentMedications: meds,
        labResults: labs,
        vitalSigns: latestVitals
      };
    });
  }

  // Legacy wrapper for getPatients (uses getConsultationData)
  async getPatients(
    email?: string,
    patientType?: 'inpatient' | 'outpatient',
    scheduledDate?: string
  ): Promise<Patient[]> {
    return this.getConsultationData({ email, patientType, scheduledDate });
  }

  // Legacy wrapper for getPatientByConsultationId (uses getConsultationData)
  async getPatientByConsultationId(consultationId?: string, patientType?: 'inpatient' | 'outpatient'): Promise<Patient[]> {
    return this.getConsultationData({ consultationId: consultationId || '6006', patientType });
  }

  // ==================== UPDATE ALLERGIES AND COMORBIDITIES ====================
  async updateAllergiesAndComorbidities(data: {
    consultationId: string;
    allergy: string;
    comorbidity: string;
  }): Promise<boolean> {
    const patient = state.patients.get(data.consultationId);
    if (patient) {
      patient.allergy = data.allergy;
      patient.allergies = data.allergy.split(',').map(s => s.trim()).filter(Boolean);
      patient.comorbidity = data.comorbidity;
      patient.lastUpdated = new Date().toISOString();
    }
    return true;
  }

  // ==================== UPDATE CONSULTATION INFORMATION ====================
  async updateConsultationInformation(data: {
    consultationId: string;
    symptoms: string;
    duration: string;
    medicalHistory: string;
    purposeOfVisit: string;
    urgentConcerns: string;
    chiefComplaint?: string;
    currentMedication?: string;
    familySocialHistory?: string;
    notes?: string;
    allergy?: string;
    comorbidity?: string;
    customCategories?: string; // JSON string
  }): Promise<boolean> {
    const patient = state.patients.get(data.consultationId);
    if (patient) {
      patient.symptoms = data.symptoms;
      patient.duration = data.duration;
      patient.medicalHistory = data.medicalHistory;
      patient.purposeOfVisit = data.purposeOfVisit;
      patient.urgentConcerns = data.urgentConcerns;
      if (data.chiefComplaint !== undefined) patient.chiefComplaint = data.chiefComplaint;
      if (data.currentMedication !== undefined) patient.currentMedication = data.currentMedication;
      if (data.familySocialHistory !== undefined) patient.familySocialHistory = data.familySocialHistory;
      if (data.notes !== undefined) patient.notes = data.notes;
      if (data.allergy !== undefined) {
        patient.allergy = data.allergy;
        patient.allergies = data.allergy.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (data.comorbidity !== undefined) patient.comorbidity = data.comorbidity;
      if (data.customCategories) {
        patient.customCategories = data.customCategories;
      }
      patient.lastUpdated = new Date().toISOString();
    }
    return true;
  }

  // ==================== SAVE AMBIENT HISTORY ====================
  async saveAmbientHistory(data: {
    consultationId: string;
    doctorId: string;
    doctorName?: string;
    uuid: string;
    scheduledTime: string;
    scheduledDate: string;
    value: Record<string, unknown>;
  }): Promise<boolean> {
    if (!state.ambientHistory.has(data.consultationId)) {
      state.ambientHistory.set(data.consultationId, []);
    }
    state.ambientHistory.get(data.consultationId)!.push({
      uuid: data.uuid,
      doctorId: data.doctorId,
      DoctorName: data.doctorName || "",
      ScheduledTime: data.scheduledTime,
      ScheduledDate: data.scheduledDate,
      Value: data.value
    });
    return true;
  }

  // ==================== GET AMBIENT HISTORY ====================
  async getAmbientHistory(consultationId: string): Promise<any | null> {
    const history = state.ambientHistory.get(consultationId);
    if (!history || history.length === 0) return null;
    return history;
  }

  async getAppointments(patientId: string, phoneNumber?: string): Promise<any> {
    return [];
  }

  // ==================== VITAL SIGNS GRAPH DATA ====================
  async getVitalSignsGraphData(consultationId: string): Promise<VitalSignsGraphData> {
    const history = state.vitalsHistory.get(consultationId) || [];

    const heartRateData = history.map((v, i) => ({ time: `12:${i * 10} PM`, value: v.heartRate }));
    const bloodPressureData = history.map((v, i) => ({ time: `12:${i * 10} PM`, systolic: v.bloodPressureSystolic, diastolic: v.bloodPressureDiastolic }));
    const oxygenData = history.map((v, i) => ({ time: `12:${i * 10} PM`, value: v.oxygenSaturation }));
    const temperatureData = history.map((v, i) => ({ time: `12:${i * 10} PM`, value: v.temperature }));
    const respRateData = history.map((v, i) => ({ time: `12:${i * 10} PM`, value: v.respiratoryRate }));
    const gcsData = history.map((v, i) => ({ time: `12:${i * 10} PM`, value: typeof v.glasgowComaScale === 'object' ? v.glasgowComaScale?.total : v.glasgowComaScale }));
    const painLevelData = history.map((v, i) => ({ time: `12:${i * 10} PM`, value: v.painLevel }));
    const bloodGlucoseData = history.map((v, i) => ({ time: `12:${i * 10} PM`, value: v.bloodGlucose }));

    // Fallbacks if no history exists yet
    if (heartRateData.length === 0) {
      heartRateData.push({ time: "12:00 PM", value: 72 });
      bloodPressureData.push({ time: "12:00 PM", systolic: 120, diastolic: 80 });
      oxygenData.push({ time: "12:00 PM", value: 98 });
      temperatureData.push({ time: "12:00 PM", value: 98.6 });
      respRateData.push({ time: "12:00 PM", value: 16 });
      gcsData.push({ time: "12:00 PM", value: 15 });
      painLevelData.push({ time: "12:00 PM", value: 0 });
      bloodGlucoseData.push({ time: "12:00 PM", value: 100 });
    }

    return {
      heartRateData,
      bloodPressureData,
      oxygenData,
      temperatureData,
      heartRate: heartRateData,
      bp: bloodPressureData,
      sp02: oxygenData,
      temperature: temperatureData,
      respRate: respRateData,
      gcs: gcsData,
      painLevel: painLevelData,
      bloodGlucose: bloodGlucoseData
    };
  }

  // ==================== GET NOTES ====================
  async getNotes(consultationId: string): Promise<NotesResponse['visits']> {
    return state.notes.get(consultationId) || [];
  }

  // ==================== LAB RESULTS ====================
  async addLabResult(data: {
    consultationId: string;
    testName: string;
    testCategory: string;
    findings?: string;
    noteContent?: string;
    labResultId?: string;
    status?: string;
  }): Promise<boolean> {
    const consultationId = data.consultationId;
    const currentList = state.labResults.get(consultationId) || [];

    const newResult: LabResult = {
      labResultId: data.labResultId || `lab-${nanoid(5)}`,
      consultationId: data.consultationId,
      testName: data.testName,
      testCategory: data.testCategory,
      findings: data.findings || "Normal findings observed.",
      recordedTime: new Date().toISOString(),
      status: data.status || "Completed"
    };

    if (data.labResultId) {
      const idx = currentList.findIndex(l => l.labResultId === data.labResultId);
      if (idx !== -1) {
        currentList[idx] = newResult;
      } else {
        currentList.push(newResult);
      }
    } else {
      currentList.push(newResult);
    }

    state.labResults.set(consultationId, currentList);
    return true;
  }

  async viewLabResults(consultationId: string): Promise<any[]> {
    return state.labResults.get(consultationId) || [];
  }

  async getCurrentMedicationsByPatient(consultationId?: string): Promise<Record<string, any> | any[]> {
    if (!consultationId) return [];
    return state.prescriptions.get(consultationId) || [];
  }

  async prepareDischargeDocument(consultationId: string): Promise<{ redirect_url: string }> {
    return { redirect_url: "https://example.com/mock-discharge-report.pdf" };
  }

  async completeConsultation(consultationId: string): Promise<boolean> {
    const patient = state.patients.get(consultationId);
    if (patient) {
      patient.consultationStatus = "Completed";
      patient.lastUpdated = new Date().toISOString();
    }
    return true;
  }

  async getPdfCustomBlocks(
    consultationId: string,
    patientType: 'inpatient' | 'outpatient' = 'inpatient'
  ): Promise<any> {
    return {
      Header: "SBSA Medical Center - Discharge Summary",
      Footer: "Thank you for choosing SBSA. For emergencies, contact 911.",
      Color: "#1e3a8a"
    };
  }

  async sendReportToMobile(consultationId: string, pdfBlob: Blob): Promise<boolean> {
    console.log('[ApiService] Mock sending report to mobile:', consultationId, pdfBlob.size);
    return true;
  }

  async getEphemeralKey(): Promise<string> {
    return "mock-ephemeral-key";
  }

  async getGeminiEphemeralKey(): Promise<string> {
    return "mock-gemini-ephemeral-key";
  }

  async getAttachmentsFromVisitHistory(fileid: string): Promise<any> {
    return {
      fileName: "lab_report_cbc.pdf",
      fileType: "pdf",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    };
  }

  // ==================== AI OBSERVATIONS ====================
  async getAIObservations(consultationId: string): Promise<AIObservationsResponse['observations']> {
    return [
      {
        id: "obs1",
        type: "clinical_alert",
        priority: "high",
        message: "SpO2 (92%) is below target threshold (>94%) for asthma exacerbation recovery.",
        timestamp: new Date().toISOString(),
        confidence: 0.94,
        recommendations: ["Increase oxygen cannula to 3L/min", "Re-assess breath sounds"]
      },
      {
        id: "obs2",
        type: "medication_adherence",
        priority: "normal",
        message: "Patient hasn't taken their evening Albuterol nebulization dose yet.",
        timestamp: new Date().toISOString(),
        confidence: 0.88,
        recommendations: ["Administer scheduled nebulizer", "Document given time in MAR"]
      }
    ];
  }

  async switchStaffRole(consultationId: string, type: string, id: string): Promise<any> {
    const patient = state.patients.get(consultationId);
    if (patient) {
      if (type === 'nurse') {
        patient.dutyNurseNetworkName = "Nurse Clara";
        patient.dutyNurseNetworkGdid = id;
      } else {
        patient.dutyDoctorNetworkName = "Dr. Rajesh Koothrappali";
        patient.dutyDoctorNetworkGdid = id;
      }
    }
    return { success: true };
  }

  async getRecentLabResults(consultationId: string): Promise<LabResult[]> {
    return state.labResults.get(consultationId) || [];
  }

  async getVisitHistory(consultationId: string): Promise<any[]> {
    return state.notes.get(consultationId) || [];
  }

  async uploadPatientReports(
    consultationId: string,
    file: File,
    doctorNetworkGdid: string,
    doctorNetworkName: string,
    patientId: string,
    patientName: string
  ): Promise<any> {
    console.log('[ApiService] Mock uploading patient report:', file.name);
    return { success: true };
  }

  async getAIInterpretations(consultationId: string): Promise<string> {
    return "<h3>AI Consultation Summary</h3><p>Based on the documented findings, the patient Aarav Sharma is suffering from an Acute Asthma Exacerbation. LFT and vitals signs remain clinically stable under current supportive care. Monitor oxygen status hourly.</p>";
  }

  async getDashboardConfig(): Promise<DashboardConfigItem[]> {
    return [
      { Key: "ShowVitalsGraph", Value: "true", description: "Toggle vitals visual trends" },
      { Key: "ShowAIObservations", Value: "true", description: "Toggle AI co-pilot insights panel" }
    ];
  }

  async getTokenUsage(): Promise<TokenUsageSnapshot | null> {
    return {
      total_tokens: 15420,
      total_cost_usd: 0.12,
      remaining_balance_usd: 120.50,
      is_near_limit: false
    };
  }

  async updateDashboardConfig(config: DashboardConfigItem[]): Promise<boolean> {
    return true;
  }

  async getAssistantSettings(doctorId?: string): Promise<any> {
    return state.assistantSettings.get(doctorId || "D001");
  }

  async saveDataCaptureCategory(category: any, doctorId?: string): Promise<any> {
    return category;
  }

  async updateAssistantSettings(settings: any, doctorId?: string): Promise<any> {
    const drId = doctorId || "D001";
    state.assistantSettings.set(drId, settings);
    return settings;
  }

  async getPreviousPrescriptions(consultationId: string): Promise<any> {
    return state.prescriptions.get(consultationId) || [];
  }
}

export const apiService = new ApiService();
