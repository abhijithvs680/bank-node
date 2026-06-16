// Event types for pharmacy AI operations

export interface PharmacySearchEvent {
  searchQuery: string;
  category?: string;
  inStockOnly: boolean;
  results?: Array<{
    id: string | number;
    name: string;
    genericName?: string;
    category?: string;
    stock?: number;
    mrp?: number;
    stockLevel?: number;
    lowStockThreshold?: number;
    inStock?: boolean;
    commonDosages?: string[];
    routes?: string[];
    summary?: string;
    currentStock?: number;
    availableDosages?: string[];
    route?: string;
    storageLocation?: string;
  }>;
  callId?: string;
}

export interface DrugInteractionEvent {
  medicationNames: string[];
  interactions?: Array<{
    medications: string[];
    severity: 'minor' | 'moderate' | 'major' | 'severe';
    description: string;
  }>;
  callId?: string;
}

export interface StockUpdateEvent {
  medicineId: string;
  medicineName: string;
  adjustmentType: 'dispensed' | 'received' | 'expired' | 'adjusted';
  quantity: number;
  reason?: string;
  newStockLevel?: number;
  callId?: string;
}

export interface MedicineInfoEvent {
  medicineName: string;
  genericName?: string;
  category?: string;
  dosages?: string[];
  routes?: string[];
  stock?: number;
  mrp?: number;
  stockLevel?: number;
  inStock?: boolean;
  composition?: string;
  callId?: string;
  // Alternatives array from API
  alternatives?: Array<{
    name: string;
    stock: number;
    mrp: number;
    composition?: string;
  }>;
}

export interface AlternativeMedicationEvent {
  originalMedicine: string;
  reason: string;
  alternatives: Array<{
    name: string;
    genericName: string;
    availability: boolean;
    stockLevel: number;
    reason: string;
  }>;
  callId?: string;
}

export interface DosageCalculationEvent {
  medicineName: string;
  weight?: number;
  age?: number;
  indication: string;
  recommendedDosage: string;
  warnings?: string[];
  callId?: string;
}

export interface LowStockAlertEvent {
  medicines: Array<{
    id: string;
    name: string;
    stockLevel: number;
    lowStockThreshold: number;
    category: string;
    recommendedOrderQty?: number;
  }>;
  category?: string;
  callId?: string;
}

// Union type for all pharmacy AI events
export type PharmacyAIEventData = 
  | PharmacySearchEvent 
  | DrugInteractionEvent 
  | StockUpdateEvent
  | MedicineInfoEvent
  | AlternativeMedicationEvent
  | DosageCalculationEvent
  | LowStockAlertEvent;

// Event names
export type PharmacyAIEventName = 
  | 'ai-pharmacy-search-requested'
  | 'ai-drug-interaction-requested'
  | 'ai-stock-update-requested'
  | 'ai-medicine-info-requested'
  | 'ai-alternative-medication-requested'
  | 'ai-dosage-calculation-requested'
  | 'ai-low-stock-alert-requested';

// State interface
export interface PharmacyAIState {
  searchResults: PharmacySearchEvent | null;
  drugInteractions: DrugInteractionEvent | null;
  stockUpdate: StockUpdateEvent | null;
  medicineInfo: MedicineInfoEvent | null;
  alternatives: AlternativeMedicationEvent | null;
  dosageCalculation: DosageCalculationEvent | null;
  lowStockAlert: LowStockAlertEvent | null;
}
