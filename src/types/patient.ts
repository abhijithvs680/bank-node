
export interface Patient {
  consultationId: string;
  patientId?: string;
  firstName: string;
  surName: string;
  dateOfBirth: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  bedNumber: string;
  admissionType: string;
  admissionDateTime: string;
  admissionReason: string;
  primaryDiagnosis: string;
  secondaryDiagnoses: string;
  allergies: string[];
  currentMedications: Medication[];
  assignedPhysician: string;
  assignedNurse: "assignedNurse";
  dutyDoctorNetworkName?: string;
  dutyDoctorNetworkGdid?: string;
  primaryConsultantNetworkGdid?: string;
  dutyNurseNetworkName?: string;
  dutyNurseNetworkGdid?: string;
  insuranceInfo: {
    provider: string;
    policyNumber: string;
  };
  vitalSigns: VitalSigns;
  labResults: LabResult[];
  healthStatus: 'Critical' | 'stable' | 'Normal' | 'improving';
  alerts: Alert[];
  lastUpdated: string;
  // Appointment fields
  appointmentId?: string;
  scheduledDoctorName?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  appointmentStatus?: string;
  consultationType?: string;
  // Consultation fields from doctor's list API
  symptoms?: string;
  duration?: string;
  medicalHistory?: string;
  purposeOfVisit?: string;
  severity?: string;
  urgentConcerns?: string;
   consultationStatus?: string;
  createdOn?: string;
  createdBy?: string;
  doctorId?: string;
  allergy?: string;
  comorbidity?: string;
  chiefComplaint?: string;
  phoneNumber?: string;
  notes?: string;
  // Doctor details from API
  doctorEmail?: string;
  currentMedication?: string;
  familySocialHistory?: string;
  customCategories?: string; // JSON string: Array<{ name: string; field: string; value: string }>
  inpatientAdmission?: InpatientAdmissionData;
  wardType?: string;
  dealName?: string;
  dealId?: string;
  borrower?: string;
  arranger?: string;
  primaryFo?: string;
  primaryTmu?: string;
  jurisdiction?: string;
  currency?: string;
  dealType?: string;
  dealStatus?: string;
  dealCreatedOn?: string;
  dealLastUpdated?: string;
  lenders?: string;
}

export interface InpatientAdmissionData {
  consultationId: string;
  doctorName: string;
  scheduleDate: string;
  scheduleTime?: string;
  admissionType: string;
  wardType: string;
  roomNo: string;
  bedNo: string;
  dutyDoctorId: string;
  dutyDoctorName: string;
  nurseName: string;
  nurseId: string;
  status: string;
  dischargeDateTime: string;
  createdOn: string;
}

export interface VitalSigns {
  consultationId: string;
  timestamp: string;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
  painLevel: number;
  consciousnessLevel: string;
  glasgowComaScale: {
    total: number;
  };
  bloodGlucose?: number;
  centralVenousPressure?: number;
  intracranialPressure?: number;
  urineOutput?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface Medication {
  medicationId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  instructions: string;
  status: 'active' | 'discontinued' | 'on-hold';
  lastGiven?: string;
  lastGivenBy?: string;
  nextDue?: string;
  duration?:string;
  infusionRate?:string;
  Instructions?:string;
  numberOfDays ?:string;
  foodTiming?: 'before-food' | 'after-food' | 'before-bed' | 'with-food';
  activeFlag?: string;
}

export interface LabResult {
  length: number;
  Id: string;
  FileName: string;
  FileFullPath: string;
  Summary: string;
  Findings?: string;
  TestName?: string;
  FileSize: string;
  CreatedAt: string;
  MimeType: string;
  Ai_Summary?: string;
  Ai_Interpretation?: string;
  Vector_UUID?: string;
}

export interface Alert {
  alertId: string;
  type: 'vital' | 'medication' | 'lab' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface MARMedication {
  medicationId: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  type: string;
  prescriber: string;
  status: 'active' | 'completed' | 'discontinued';
  discontinuedReason?: string;
  administrationRecords: MARAdministrationRecord[];
}

export interface MARAdministrationRecord {
  medicationId: string;
  date: Date;
  time: string;
  administeredBy: string;
  status: 'given' | 'held' | 'refused' | 'pending';
  actualDateTime?: string;
}

export interface VisitAttachment {
  FileName: string;
  Modality: string;
  FileID: string;
  CreatedOn: string;
  rowID: string;
  Observations: string;
  Summary: string;
  Medication: string;
  Followups: string;
}

export interface PatientVisit {
  Patient_GDID: number;
  Title: string;
  Name: string;
  Surname: string;
  Network_GDID: number;
  NetworkTitle: string;
  NetworkName: string;
  Findings: string;
  Recommendations: string;
  Medication: string;
  FileID: string;
  AISummary: string;
  AttachmentFlag: string;
  AttachmentsJson: string;
  VisitedOn: string;
  rowID: string;
  attachments?: VisitAttachment[];
}
