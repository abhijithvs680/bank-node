// AI Event Types and Interfaces
export interface AIBaseEvent {
  patientName?: string;
  timestamp?: string;
  callId?: string; // Added for AI feedback mechanism
}

export interface AINoteEvent extends AIBaseEvent {
  note: string;
  findingType: string;
}

export interface AIMedicationEvent extends AIBaseEvent {
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedBy: string;
  instructions: string;
  numberOfDays?: string; 
  foodTiming?: string;   
}

export interface AIVitalsEvent extends AIBaseEvent {
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  painLevel?: number;
  bloodGlucose?: number;      
  glasgowComaScale?: number;    
}

export interface AILabEvent extends AIBaseEvent {
  testName: string;
  value: string;
  unit: string;
  normalRange: string;
  status: string;
  orderedBy: string;
}

export interface AIMedicationUpdateEvent extends AIBaseEvent {
  medicationName: string;
  newStatus: string;
  reason: string;
}

export interface AIDischargeEvent extends AIBaseEvent {
  dischargeStatus: string;
  instructions: string;
  followUpPlan: string;
  medications: string;
}

export interface AIClinicalConsultEvent extends AIBaseEvent {
  query: string;
  patientContext?: string;
  response?: string;
}



// Processed AI Data Types for State Management
export interface AINoteData {
  notes: string;
  findingType: string;
}

export interface AIMedicationData {
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribedBy: string;
  instructions: string;
  callId?: string; // For completion tracking after medicine selection
  numberOfDays?: string;
  foodTiming?: string;
}

export interface AIVitalsData {
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  painLevel?: number;
  bloodGlucose?: number;     
  glasgowComaScale?: number;   
}

export interface AILabData {
  testName: string;
  value?: string;
  unit?: string;
  normalRange?: string;
  status?: string;
  orderedBy?: string;
  callId?: string; // For completion tracking after service selection
}

// Combined AI State
export interface AIState {
  noteData: AINoteData | null;
  medicationData: AIMedicationData | null;
  vitalsData: AIVitalsData | null;
  labData: AILabData | null;
  dischargeData: AINoteData | null;
}

// AI Event Registry
export type AIEventName = 
  | 'ai-note-requested'
  | 'ai-medication-requested'
  | 'ai-vitals-requested'
  | 'ai-lab-requested'
  | 'ai-medication-update-requested'
  | 'ai-discharge-note-requested';

export type AIEventData = 
  | AINoteEvent
  | AIMedicationEvent
  | AIVitalsEvent
  | AILabEvent
  | AIMedicationUpdateEvent
  | AIDischargeEvent
  | AIClinicalConsultEvent;